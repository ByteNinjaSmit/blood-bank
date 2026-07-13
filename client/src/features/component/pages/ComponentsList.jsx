import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, TestTube, Loader2, Filter, Search, ChevronLeft, ChevronRight, Calendar, Package, AlertTriangle, X, Eye, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { formatDate as formatDateKolkata } from "@/lib/format-date";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentDetailsModal, ComponentEditModal } from "@/components/blood-components";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportComponents } from "@/utils/excelExportHelper";
import { checkAccess } from "@/atoms/static";
import { COMPONENT_TYPES } from "@/constants/component-types";

const STATUS_OPTIONS = [
  { value: "in-stock", label: "In Stock" },
  { value: "reserved", label: "Reserved" },
  { value: "issued", label: "Issued" },
  { value: "discarded", label: "Discarded" },
  { value: "quarantined", label: "Quarantined" },
];

const ComponentsList = () => {
  const { API, authorizationToken, user } = useAuth();
  const navigate = useNavigate();
  const canEdit = checkAccess(user, "Component", "update");

  const [excelLoading, setExcelLoading] = useState(false);

  // One row per BAG (not per component) — each bag's prepared components
  // are collected into a single `components` array so the export can list
  // them on stacked lines under one serial number/row, instead of
  // repeating the bag-level details (blood group, site, RPM, time,
  // serology) once per component.
  const flattenComponents = (bags) => {
    return bags
      .map(bag => {
        const components = ['prbc', 'ffp', 'rdp', 'sdp', 'cryo']
          .map(type => {
            const comp = bag[type];
            if (!comp || comp.status !== 'prepared') return null;
            return {
              type: type.toUpperCase(),
              volumeMl: comp.volumeMl ?? '—',
              expiryDate: comp.expiryDate,
              status: comp.componentStatus || comp.status || 'prepared',
              storageLocation: comp.storageLocation || 'Main Fridge',
            };
          })
          .filter(Boolean);

        return {
          bagNo: bag.bagNo,
          segmentNo: bag.segmentNo || '—',
          bloodGroup: bag.bloodGroup || (bag.bag ? `${bag.bag.bloodGroup} ${bag.bag.rh || ''}` : '—'),
          site: bag.site || '—',
          createdAt: bag.createdAt,
          rpmFirstSpin: bag.rpmFirstSpin,
          rpmSecondSpin: bag.rpmSecondSpin,
          collectionTime: bag.collectionTime,
          separationTime: bag.separationTime,
          serologyTests: bag.serologyTests,
          components,
        };
      })
      .filter(bag => bag.components.length > 0);
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = [];
      if (exportAll) {
        // Fetch all components without pagination limit (up to 5000)
        const params = {
          page: 1,
          limit: 5000,
          ...(state.filters.type && { type: state.filters.type }),
          ...(state.filters.status && { status: state.filters.status }),
          ...(state.filters.expiryBefore && { expiryBefore: state.filters.expiryBefore }),
          ...(state.filters.fromDate && { fromDate: state.filters.fromDate }),
          ...(state.filters.toDate && { toDate: state.filters.toDate }),
          ...(state.filters.search && { search: state.filters.search }),
          order: state.filters.order,
        };
        const response = await apiClient.get(`/api/v2/component/list`, { params });
        if (response.data?.components) {
          dataToExport = flattenComponents(response.data.components);
        }
      } else {
        dataToExport = flattenComponents(state.components);
      }
      
      if (dataToExport.length === 0) {
        toast.info("No components to export");
        return;
      }
      
      await exportComponents(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  // State management following SOLID principles
  const [state, setState] = useState({
    components: [],
    isLoading: false,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    },
    filters: {
      type: "",
      status: "",
      expiryBefore: "",
      fromDate: "",
      toDate: "",
      search: "",
      order: "desc",
    },
  });

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    selectedComponentId: null,
  });

  // Edit modal state
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    selectedComponentId: null,
  });

  // Single responsibility: Fetch components data
  const fetchComponents = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const params = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        ...(state.filters.type && { type: state.filters.type }),
        ...(state.filters.status && { status: state.filters.status }),
        ...(state.filters.expiryBefore && { expiryBefore: state.filters.expiryBefore }),
        ...(state.filters.fromDate && { fromDate: state.filters.fromDate }),
        ...(state.filters.toDate && { toDate: state.filters.toDate }),
        ...(state.filters.search && { search: state.filters.search }),
        order: state.filters.order,
      };

      console.log("Fetching components with params:", params);

      const response = await apiClient.get(`/api/v2/component/list`, { params });

      console.log("Components API response:", response.data);

      if (response.data?.components) {
        setState(prev => ({
          ...prev,
          components: response.data.components,
          pagination: {
            ...prev.pagination,
            total: response.data.pagination?.total || 0,
            totalPages: response.data.pagination?.totalPages || 0,
          },
        }));
      } else {
        setState(prev => ({
          ...prev,
          components: [],
          pagination: {
            ...prev.pagination,
            total: 0,
            totalPages: 0,
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      toast.error(error.response?.data?.message || "Failed to load components");
      setState(prev => ({
        ...prev,
        components: [],
        pagination: {
          ...prev.pagination,
          total: 0,
          totalPages: 0,
        },
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [API, authorizationToken, state.pagination.page, state.pagination.limit, state.filters]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchComponents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.filters.search]);

  // Effect to fetch data when other dependencies change
  useEffect(() => {
    if (state.filters.search === "") {
      fetchComponents();
    }
  }, [state.pagination.page, state.pagination.limit, state.filters.type, state.filters.status, state.filters.expiryBefore, state.filters.fromDate, state.filters.toDate, state.filters.order]);

  // Single responsibility: Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterType]: value },
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }));
  };

  // Single responsibility: Handle pagination
  const handlePageChange = (newPage) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: newPage },
    }));
  };

  // Single responsibility: Handle rows per page change
  const handleRowsPerPageChange = (newLimit) => {
    setState(prev => ({
      ...prev,
      pagination: { 
        ...prev.pagination, 
        limit: parseInt(newLimit), 
        page: 1 
      },
    }));
  };

  // Single responsibility: Clear all filters
  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        type: "",
        status: "",
        expiryBefore: "",
        fromDate: "",
        toDate: "",
        search: "",
        order: "desc",
      },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  // Single responsibility: Open component details modal
  const handleViewDetails = (componentId) => {
    setModalState({
      isOpen: true,
      selectedComponentId: componentId,
    });
  };

  // Single responsibility: Close component details modal
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      selectedComponentId: null,
    });
  };

  // Single responsibility: Open component edit modal
  const handleEditComponent = (componentId) => {
    setEditModalState({
      isOpen: true,
      selectedComponentId: componentId,
    });
  };

  // Single responsibility: Close component edit modal
  const handleCloseEditModal = () => {
    setEditModalState({
      isOpen: false,
      selectedComponentId: null,
    });
  };

  // Single responsibility: Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return formatDateKolkata(dateString);
  };

  // Single responsibility: Get status badge class for custom tailwind styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "in-stock":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-50";
      case "reserved":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
      case "issued":
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50";
      case "discarded":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-50";
      case "quarantined":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
      case "testing":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50";
      case "collected":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50";
    }
  };

  // Single responsibility: Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case "in-stock": return "In Stock";
      case "reserved": return "Reserved";
      case "issued": return "Issued";
      case "discarded": return "Discarded";
      case "quarantined": return "Quarantined";
      case "testing": return "Under Testing";
      case "collected": return "Collected";
      default: return status || "Prepared";
    }
  };

  // Single responsibility: Check if component is near expiry
  const isNearExpiry = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  // Single responsibility: Check if component is expired
  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  // Single responsibility: Check if any prepared component on this bag is quarantined
  // (edited to Shadeness on the serology report moves in-stock units to quarantine).
  const isBagQuarantined = (bag) => {
    return ['prbc', 'ffp', 'rdp', 'sdp', 'cryo'].some(
      (type) => bag[type]?.status === 'prepared' && bag[type]?.componentStatus === 'quarantined'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <Package className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Components Inventory</h1>
                <p className="text-gray-500 text-sm">
                  Management Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
                <Button 
                    onClick={() => navigate("/component/separate")}
                    variant="outline"
                    size="sm"
                    className="h-9 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                >
                    <TestTube className="w-3.5 h-3.5 mr-1.5 text-red-500" />
                    Separate
                </Button>
                <Button 
                    onClick={() => navigate("/component/near-expiry")}
                    variant="outline"
                    size="sm"
                    className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Near Expiry
                </Button>
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Filters Card */}
        {/* Compact Filters Section */}
        <Card className="mb-4 border-red-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search - Flexible Width */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Search</label>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                  <Input
                    placeholder="Bag No, ID, or blood group..."
                    value={state.filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                    disabled={state.isLoading}
                  />
                </div>
              </div>

              {/* Type Dropdown */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                <Select value={state.filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {COMPONENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-xs">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Dropdown */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Status</label>
                <Select value={state.filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-xs">
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expiry Field */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Expiry Before</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <Input
                    type="date"
                    value={state.filters.expiryBefore}
                    onChange={(e) => handleFilterChange("expiryBefore", e.target.value)}
                    className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                  />
                </div>
              </div>

              {/* From Date */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <Input
                    type="date"
                    value={state.filters.fromDate}
                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                    className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                  />
                </div>
              </div>

              {/* To Date */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <Input
                    type="date"
                    value={state.filters.toDate}
                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                    className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                  />
                </div>
              </div>

              {/* Compact Actions */}
              {/* Sort Order */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Sort Order</label>
                <Select value={state.filters.order} onValueChange={(value) => handleFilterChange("order", value)}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                {Object.entries(state.filters).some(([k, v]) => k === "order" ? v !== "desc" : v !== "") && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                    Reset
                  </button>
                )}
                <div className="flex items-center gap-1">
                   {state.isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Components Grouped by Blood Bag ({state.pagination.total})</CardTitle>
                {state.filters.search && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{state.filters.search}"
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">
                  Page {state.pagination.page} of {state.pagination.totalPages}
                </div>
                <button
                  type="button"
                  onClick={() => fetchComponents()}
                  disabled={state.isLoading}
                  title="Refresh"
                  aria-label="Refresh"
                  className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Bag Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Segment No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Packed Red Blood Cells (PRBC)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fresh Frozen Plasma (FFP)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Random Donor Platelets (RDP)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Single Donor Platelets (SDP)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cryoprecipitate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Edited
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {state.isLoading ? (
                    <tr>
                      <td colSpan="12" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading components inventory...
                        </div>
                      </td>
                    </tr>
                  ) : state.components.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                        No blood bag groups found.
                      </td>
                    </tr>
                  ) : (
                    state.components.map((bag, idx) => (
                      <tr
                        key={`${bag.bagNo}-${idx}`}
                        className={`transition-colors ${
                          isBagQuarantined(bag) ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {bag.bagNo}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">
                          {bag.segmentNo || "-"}
                        </td>
                        {/* PRBC column */}
                        <td className="px-4 py-3 text-sm">
                          {bag.prbc?.status === "prepared" ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${getStatusBadgeClass(bag.prbc.componentStatus)}`}>
                                {getStatusLabel(bag.prbc.componentStatus)}
                              </Badge>
                              <span className="font-semibold text-gray-900 text-xs mt-0.5">{bag.prbc.volumeMl} mL</span>
                              <span className="text-[9px] text-gray-500">{bag.prbc.storageLocation || "Main Fridge"}</span>
                              {isExpired(bag.prbc.expiryDate) && (
                                <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Expired
                                </span>
                              )}
                              {isNearExpiry(bag.prbc.expiryDate) && !isExpired(bag.prbc.expiryDate) && (
                                <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="w-fit text-[9px] font-medium text-gray-400 border-gray-200 bg-gray-50/50 uppercase tracking-wider">
                              Unprepared
                            </Badge>
                          )}
                        </td>
                        {/* FFP column */}
                        <td className="px-4 py-3 text-sm">
                          {bag.ffp?.status === "prepared" ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${getStatusBadgeClass(bag.ffp.componentStatus)}`}>
                                {getStatusLabel(bag.ffp.componentStatus)}
                              </Badge>
                              <span className="font-semibold text-gray-900 text-xs mt-0.5">{bag.ffp.volumeMl} mL</span>
                              <span className="text-[9px] text-gray-500">{bag.ffp.storageLocation || "Main Fridge"}</span>
                              {isExpired(bag.ffp.expiryDate) && (
                                <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Expired
                                </span>
                              )}
                              {isNearExpiry(bag.ffp.expiryDate) && !isExpired(bag.ffp.expiryDate) && (
                                <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="w-fit text-[9px] font-medium text-gray-400 border-gray-200 bg-gray-50/50 uppercase tracking-wider">
                              Unprepared
                            </Badge>
                          )}
                        </td>
                        {/* RDP column */}
                        <td className="px-4 py-3 text-sm">
                          {bag.rdp?.status === "prepared" ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${getStatusBadgeClass(bag.rdp.componentStatus)}`}>
                                {getStatusLabel(bag.rdp.componentStatus)}
                              </Badge>
                              <span className="font-semibold text-gray-900 text-xs mt-0.5">{bag.rdp.volumeMl} mL</span>
                              <span className="text-[9px] text-gray-500">{bag.rdp.storageLocation || "Main Fridge"}</span>
                              {isExpired(bag.rdp.expiryDate) && (
                                <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Expired
                                </span>
                              )}
                              {isNearExpiry(bag.rdp.expiryDate) && !isExpired(bag.rdp.expiryDate) && (
                                <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="w-fit text-[9px] font-medium text-gray-400 border-gray-200 bg-gray-50/50 uppercase tracking-wider">
                              Unprepared
                            </Badge>
                          )}
                        </td>
                        {/* SDP column */}
                        <td className="px-4 py-3 text-sm">
                          {bag.sdp?.status === "prepared" ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${getStatusBadgeClass(bag.sdp.componentStatus)}`}>
                                {getStatusLabel(bag.sdp.componentStatus)}
                              </Badge>
                              <span className="font-semibold text-gray-900 text-xs mt-0.5">{bag.sdp.volumeMl} mL</span>
                              <span className="text-[9px] text-gray-500">{bag.sdp.storageLocation || "Main Fridge"}</span>
                              {isExpired(bag.sdp.expiryDate) && (
                                <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Expired
                                </span>
                              )}
                              {isNearExpiry(bag.sdp.expiryDate) && !isExpired(bag.sdp.expiryDate) && (
                                <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="w-fit text-[9px] font-medium text-gray-400 border-gray-200 bg-gray-50/50 uppercase tracking-wider">
                              Unprepared
                            </Badge>
                          )}
                        </td>
                        {/* Cryo column */}
                        <td className="px-4 py-3 text-sm">
                          {bag.cryo?.status === "prepared" ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${getStatusBadgeClass(bag.cryo.componentStatus)}`}>
                                {getStatusLabel(bag.cryo.componentStatus)}
                              </Badge>
                              <span className="font-semibold text-gray-900 text-xs mt-0.5">{bag.cryo.volumeMl} mL</span>
                              <span className="text-[9px] text-gray-500">{bag.cryo.storageLocation || "Main Fridge"}</span>
                              {isExpired(bag.cryo.expiryDate) && (
                                <span className="text-[9px] text-red-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Expired
                                </span>
                              )}
                              {isNearExpiry(bag.cryo.expiryDate) && !isExpired(bag.cryo.expiryDate) && (
                                <span className="text-[9px] text-yellow-600 flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Near Expiry
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="w-fit text-[9px] font-medium text-gray-400 border-gray-200 bg-gray-50/50 uppercase tracking-wider">
                              Unprepared
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                          {bag.bloodGroup || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {bag.site || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(bag.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {bag.lastEditedAt ? (
                            <span title={bag.editReason || ""}>
                              Edited on {formatDate(bag.lastEditedAt)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(bag.id)}
                              className="h-8 w-8 p-0 border-red-100 text-red-700 hover:bg-red-50"
                              title="View Group Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEdit && bag.canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditComponent(bag.id)}
                                className="h-8 w-8 p-0 border-blue-100 text-blue-700 hover:bg-blue-50"
                                title="Edit Components"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 bg-gray-50/10 p-4 border-t rounded-b-xl">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {((state.pagination.page - 1) * state.pagination.limit) + 1} to{" "}
                  {Math.min(state.pagination.page * state.pagination.limit, state.pagination.total)} of{" "}
                  {state.pagination.total} results
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <Select 
                    value={state.pagination.limit.toString()} 
                    onValueChange={handleRowsPerPageChange}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {state.pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(state.pagination.page - 1)}
                    disabled={state.pagination.page === 1 || state.isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = state.pagination.totalPages;
                      const currentPage = state.pagination.page;
                      const pages = [];
                      
                      // Calculate start and end page numbers
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, currentPage + 2);
                      
                      // Adjust if we're near the beginning or end
                      if (endPage - startPage < 4) {
                        if (startPage === 1) {
                          endPage = Math.min(totalPages, startPage + 4);
                        } else {
                          startPage = Math.max(1, endPage - 4);
                        }
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(i)}
                            disabled={state.isLoading}
                            className="w-8 h-8 p-0"
                          >
                            {i}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(state.pagination.page + 1)}
                    disabled={state.pagination.page === state.pagination.totalPages || state.isLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component Details Modal */}
      <ComponentDetailsModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        componentId={modalState.selectedComponentId}
      />

      {/* Component Edit Modal */}
      <ComponentEditModal
        isOpen={editModalState.isOpen}
        onClose={handleCloseEditModal}
        componentId={editModalState.selectedComponentId}
        onSaved={fetchComponents}
      />
    </div>
  );
};

export default ComponentsList;