import { useState, useEffect, useCallback } from "react";
import { TestTube, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/core/api-client";
import { useAuth } from "@/store/auth";
import { formatDate as formatDateKolkata } from "@/lib/format-date";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ComponentDetailsModal, ComponentEditModal } from "@/components/blood-components";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportComponents } from "@/utils/excelExportHelper";
import { checkAccess } from "@/atoms/static";
import ComponentFilterBar from "../components/ComponentFilterBar";
import ComponentsTable from "../components/ComponentsTable";

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
        const components = ['prbc', 'ffp', 'rdp', 'cryo', 'sdp']
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

      const response = await apiClient.get(`/api/v2/component/list`, { params });

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
        <ComponentFilterBar
          filters={state.filters}
          isLoading={state.isLoading}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />

        <ComponentsTable
          state={state}
          canEdit={canEdit}
          formatDate={formatDate}
          onRefresh={() => fetchComponents()}
          onView={handleViewDetails}
          onEdit={handleEditComponent}
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
