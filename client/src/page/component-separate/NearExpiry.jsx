import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Clock, AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, Calendar, Package, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentDetailsModal } from "@/components/blood-components";

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

  // State management following SOLID principles
  const [state, setState] = useState({
    components: [],
    isLoading: false,
    pagination: {
      page: 1,
      limit: 10,
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

      const response = await axios.get(`${API}/api/component/near-expiry`, {
        params,
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });

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
    return new Date(dateString).toLocaleDateString();
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
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-3 text-yellow-800 border border-yellow-200 hover:bg-yellow-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Near-Expiry Components</h1>
                <p className="text-gray-600 mt-1">
                  Monitor and manage blood components approaching their expiry date
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by component ID, bag number..."
                    value={state.filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10 pr-10"
                    disabled={state.isLoading}
                  />
                  {state.filters.search && (
                    <button
                      onClick={() => handleFilterChange("search", "")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={state.isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {state.isLoading && !state.filters.search && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                  )}
                </div>
              </div>

              {/* Days Until Expiry Filter */}
              <Select value={state.filters.days.toString()} onValueChange={(value) => handleFilterChange("days", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Days Until Expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>

              {/* Component Type Filter */}
              <Select value={state.filters.componentType || "all"} onValueChange={(value) => handleFilterChange("componentType", value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Component Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {COMPONENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={state.filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.values(state.filters).some(filter => filter !== "" && filter !== 7) && (
                  <span>Filters applied</span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                disabled={!Object.values(state.filters).some(filter => filter !== "" && filter !== 7)}
              >
                Clear Filters
              </Button>
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
                      Component ID
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
                      Bag Number
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
                      <td colSpan="9" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading near-expiry components...
                        </div>
                      </td>
                    </tr>
                  ) : state.components.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
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
                            {component.componentId}
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
                            {component.bagNo || "-"}
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