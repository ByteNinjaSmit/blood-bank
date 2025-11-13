import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, TestTube, Loader2, Filter, Search, ChevronLeft, ChevronRight, Calendar, Package, AlertTriangle, X, Eye } from "lucide-react";
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

const ComponentsList = () => {
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
      type: "",
      status: "",
      expiryBefore: "",
      search: "",
    },
  });

  // Modal state
  const [modalState, setModalState] = useState({
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
        ...(state.filters.search && { search: state.filters.search }),
      };

      console.log("Fetching components with params:", params);

      const response = await axios.get(`${API}/api/component/list`, {
        params,
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      });

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
  }, [state.pagination.page, state.pagination.limit, state.filters.type, state.filters.status, state.filters.expiryBefore]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Components List</h1>
                <p className="text-gray-600 mt-1">
                  Manage and track all blood components
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">

            <Button 
              onClick={() => navigate("/component/separate")}
              className="bg-red-600 hover:bg-red-700 text-white"
              >
              <TestTube className="w-4 h-4 mr-2" />
              Separate Components
            </Button>
                        <Button 
              onClick={() => navigate("/component/near-expiry")}
              className="bg-red-600 hover:bg-red-700 text-white"
              >
              <TestTube className="w-4 h-4 mr-2" />
              Near Expiry
            </Button>
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
                    placeholder="Search by bag number or component ID..."
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

              {/* Component Type Filter */}
              <Select value={state.filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}>
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

              {/* Expiry Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  placeholder="Expiry Before"
                  value={state.filters.expiryBefore}
                  onChange={(e) => handleFilterChange("expiryBefore", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.values(state.filters).some(filter => filter !== "") && (
                  <span>Filters applied</span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                disabled={!Object.values(state.filters).some(filter => filter !== "")}
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
                <CardTitle>Components ({state.pagination.total})</CardTitle>
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
                  onClick={fetchComponents} 
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
                      Bag Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {state.isLoading ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading components...
                        </div>
                      </td>
                    </tr>
                  ) : state.components.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                        No components found.
                      </td>
                    </tr>
                  ) : (
                    state.components.map((component, idx) => (
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
                          {component.bagNo || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {component.bloodGroup || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {component.site || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(component.createdAt)}
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
                    ))
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

export default ComponentsList;