import React, { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, Calendar, Package, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate as formatDateKolkata } from "@/lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentDetailsModal } from "@/components/blood-components";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportNearExpiryComponents } from "@/utils/excelExportHelper";

const COMPONENT_TYPES = [
  { value: "RBC", label: "Red Blood Cells" },
  { value: "FFP", label: "Fresh Frozen Plasma" },
  { value: "Platelet", label: "Platelets" },
  { value: "Cryo", label: "Cryoprecipitate" },
];

const STATUS_OPTIONS = [
  { value: "in-stock", label: "In Stock" },
  { value: "reserved", label: "Reserved" },
  { value: "issued", label: "Issued" },
  { value: "discarded", label: "Discarded" },
];

const NearExpiry = () => {
  const { API, authorizationToken } = useAuth();
  const navigate = useNavigate();

  const [excelLoading, setExcelLoading] = useState(false);

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
      days: 7,
      componentType: "",
      status: "",
      search: "",
    },
  });

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    selectedComponentId: null,
  });

  // Single responsibility: Fetch near-expiry components data
  const fetchNearExpiryComponents = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const params = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        days: state.filters.days,
        ...(state.filters.componentType && { componentType: state.filters.componentType }),
        ...(state.filters.status && { status: state.filters.status }),
        ...(state.filters.search && { search: state.filters.search }),
      };

      console.log("Fetching near-expiry components with params:", params);

      const response = await apiClient.get(`/api/v2/component/near-expiry`, { params });

      console.log("Near-expiry components API response:", response.data);

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
      console.error("Error fetching near-expiry components:", error);
      toast.error(error.response?.data?.message || "Failed to load near-expiry components");
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
      fetchNearExpiryComponents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.filters.search]);

  // Effect to fetch data when other dependencies change
  useEffect(() => {
    if (state.filters.search === "") {
      fetchNearExpiryComponents();
    }
  }, [state.pagination.page, state.pagination.limit, state.filters.days, state.filters.componentType, state.filters.status]);

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
        days: 7,
        componentType: "",
        status: "",
        search: "",
      },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = [];
      if (exportAll) {
        const params = {
          page: 1,
          limit: 5000,
          days: state.filters.days,
          ...(state.filters.componentType && { componentType: state.filters.componentType }),
          ...(state.filters.status && { status: state.filters.status }),
          ...(state.filters.search && { search: state.filters.search }),
        };
        const response = await apiClient.get(`/api/v2/component/near-expiry`, { params });
        dataToExport = response.data?.components || [];
      } else {
        dataToExport = state.components;
      }

      if (dataToExport.length === 0) {
        toast.info("No near-expiry components to export");
        return;
      }

      await exportNearExpiryComponents(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
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

  // Single responsibility: Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return formatDateKolkata(dateString);
  };

  // Single responsibility: Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "in-stock": return "default";
      case "reserved": return "secondary";
      case "issued": return "outline";
      case "discarded": return "destructive";
      default: return "outline";
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

  // Single responsibility: Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Single responsibility: Get expiry color
  const getExpiryColor = (days) => {
    if (days <= 1) return "text-red-600 bg-red-100";
    if (days <= 3) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-yellow-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Near-Expiry Components</h1>
                <p className="text-gray-500 text-sm">
                  Monitor and manage blood components approaching their expiry date
                </p>
              </div>
            </div>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Filters Section */}
        <Card className="mb-4 border-yellow-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search - Flexible Width */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Search</label>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 w-3.5 h-3.5 transition-colors" />
                  <Input
                    placeholder="Search ID or bag number..."
                    value={state.filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all shadow-none"
                    disabled={state.isLoading}
                  />
                </div>
              </div>

              {/* Days Filter */}
              <div className="w-32 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Expiry Days</label>
                <Select value={state.filters.days.toString()} onValueChange={(value) => handleFilterChange("days", parseInt(value))}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3" className="text-xs">3 days</SelectItem>
                    <SelectItem value="5" className="text-xs">5 days</SelectItem>
                    <SelectItem value="7" className="text-xs">7 days</SelectItem>
                    <SelectItem value="14" className="text-xs">14 days</SelectItem>
                    <SelectItem value="30" className="text-xs">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Component Type Filter */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                <Select value={state.filters.componentType || "all"} onValueChange={(value) => handleFilterChange("componentType", value === "all" ? "" : value)}>
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

              {/* Status Filter */}
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

              {/* Compact Actions */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                {Object.values(state.filters).some(filter => filter !== "" && filter !== 7) && (
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
                <CardTitle>Near-Expiry Components ({state.pagination.total})</CardTitle>
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
                <Button 
                  onClick={fetchNearExpiryComponents} 
                  variant="outline" 
                  size="sm" 
                  disabled={state.isLoading}
                >
                  {state.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bag Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Left
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {state.isLoading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading near-expiry components...
                        </div>
                      </td>
                    </tr>
                  ) : state.components.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="w-12 h-12 text-yellow-500" />
                          <p className="text-lg font-medium">No near-expiry components found</p>
                          <p className="text-sm">
                            There are no components expiring within {state.filters.days} days that match your filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    state.components.map((component, idx) => {
                      const daysUntilExpiry = getDaysUntilExpiry(component.expiryDate);
                      const expiryColor = getExpiryColor(daysUntilExpiry);
                      
                      return (
                        <tr key={`${component.componentId}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {component.bagNo || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <Badge variant="outline">{component.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {component.volumeMl} mL
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <Badge variant={getStatusBadgeVariant(component.status)}>
                              {component.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              {isExpired(component.expiryDate) && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              {isNearExpiry(component.expiryDate) && !isExpired(component.expiryDate) && (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className={isExpired(component.expiryDate) ? "text-red-600" : ""}>
                                {formatDate(component.expiryDate)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className={`text-xs ${expiryColor} px-2 py-1 rounded-full inline-flex items-center`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {component.bloodGroup || "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(component.id)}
                              className="h-8 w-8 p-0"
                              title="View Component Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
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
                    <SelectTrigger className="w-20">
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
    </div>
  );
};

export default NearExpiry;