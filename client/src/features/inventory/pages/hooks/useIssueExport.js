import { useState } from "react";
import { apiClient } from "@/core/api-client";
import { toast } from "sonner";
import { exportIssues, exportStorageBags, exportClinicalIndicationIssues, exportBulkTransfers } from "@/utils/excelExportHelper";

// Exports a specific register (Issue Stock / Storage / Clinical Indication /
// Bulk Transfer), regardless of which tab is currently active — each register
// re-fetches its own data fresh from its own endpoint.
export function useIssueExport(deps) {
  const [excelLoading, setExcelLoading] = useState(false);

  const handleExportRegister = async (registerKey, scope) => {
    const {
      thalPagination, bulkPagination, pagination,
      status, componentType, search, bloodGroup, expiryFrom, expiryTo, sortBy, order,
    } = deps;
    const exportAll = scope === 'all';
    try {
      setExcelLoading(true);

      if (registerKey === 'storage') {
        // Storage batches aren't split by location tab anymore — always
        // export every bag currently in storage, regardless of scope.
        const res = await apiClient.get(`/api/inventory`, {
          params: { page: 1, limit: exportAll ? 5000 : 500, status: 'issued', storageLocation: 'ALL', sortBy: 'issuedAt', order: 'desc' },
        });
        const dataToExport = Array.isArray(res.data?.data) ? res.data.data : [];
        if (dataToExport.length === 0) return toast.info("No storage records to export");
        await exportStorageBags(dataToExport);
        return;
      }

      if (registerKey === 'disease') {
        const res = await apiClient.get(`/api/inventory`, {
          params: { page: 1, limit: exportAll ? 5000 : thalPagination.limit, status: 'issued', dispatchType: 'CLINICAL_INDICATION', sortBy: 'issuedAt', order: 'desc' },
        });
        const dataToExport = Array.isArray(res.data?.data) ? res.data.data : [];
        if (dataToExport.length === 0) return toast.info("No clinical indication records to export");
        await exportClinicalIndicationIssues(dataToExport);
        return;
      }

      if (registerKey === 'bulkTransfer') {
        const res = await apiClient.get(`/api/v2/bulk-transfer`, {
          params: { page: 1, limit: exportAll ? 5000 : bulkPagination.limit },
        });
        const dataToExport = Array.isArray(res.data?.data) ? res.data.data : [];
        if (dataToExport.length === 0) return toast.info("No bulk transfer records to export");
        await exportBulkTransfers(dataToExport);
        return;
      }

      // 'issue' register (default)
      const res = await apiClient.get(`/api/inventory`, {
        params: {
          page: 1,
          limit: exportAll ? 5000 : pagination.limit,
          status,
          componentType: componentType || undefined,
          search: search || undefined,
          bloodGroup: bloodGroup || undefined,
          expiryFrom: expiryFrom || undefined,
          expiryTo: expiryTo || undefined,
          sortBy,
          order,
        },
      });
      const dataToExport = Array.isArray(res.data?.data) ? res.data.data : [];

      if (dataToExport.length === 0) {
        toast.info("No items to export");
        return;
      }

      await exportIssues(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  return { excelLoading, handleExportRegister };
}
