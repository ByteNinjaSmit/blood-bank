import { useState, useEffect, useCallback } from "react";
import { Clock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate as formatDateKolkata } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { ComponentDetailsModal } from "@/components/blood-components";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportNearExpiryComponents } from "@/utils/excelExportHelper";
import { COMPONENT_TYPES } from "@/constants/component-types";
import SearchBox from "@/components/shared/SearchBox";
import NearExpiryTable from "../components/NearExpiryTable";

const STATUS_OPTIONS = [
  { value: "in-stock", label: "In Stock" },
  { value: "reserved", label: "Reserved" },
  { value: "issued", label: "Issued" },
  { value: "discarded", label: "Discarded" },
];

const NearExpiry = () => {
  const { API } = useAuth();

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

  // Draft search text bound to the SearchBox; only committed into
  // state.filters.search (the actual fetch dependency) on explicit submit.
  const [searchInput, setSearchInput] = useState("");

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

      const response = await apiClient.get(`/api/v2/component/near-expiry`, { params });

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
  }, [state.pagination.page, state.pagination.limit, state.filters]);

  // Fetch data whenever pagination or any applied filter (including the
  // explicitly-submitted search) changes. Search no longer triggers a
  // fetch on keystroke — only on SearchBox submit (Enter/button), which
  // commits searchInput into state.filters.search.
  useEffect(() => {
    fetchNearExpiryComponents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination.page, state.pagination.limit, state.filters.days, state.filters.componentType, state.filters.status, state.filters.search]);

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
    setSearchInput("");
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-yellow-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <Clock className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
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
                <SearchBox
                  placeholder="Search ID or bag number..."
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={() => handleFilterChange("search", searchInput)}
                  disabled={state.isLoading}
                  inputClassName="border-gray-200 bg-gray-50/50 focus:bg-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all shadow-none"
                />
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

        <NearExpiryTable
          state={state}
          formatDate={formatDate}
          onRefresh={() => fetchNearExpiryComponents()}
          onView={handleViewDetails}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
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