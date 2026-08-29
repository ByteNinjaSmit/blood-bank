import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMPONENT_TYPES } from "@/constants/component-types";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportNearExpiryComponents } from "@/utils/excelExportHelper";
import { ComponentDetailsModal } from "@/components/blood-components";
import { inventoryApi } from "../api";
import NearExpiryTable from "../components/NearExpiryTable";

const BLOOD_GROUPS = ["A", "B", "AB", "O"];
const DAY_WINDOWS = [3, 5, 7, 14, 30];

const InventoryNearExpiry = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [componentType, setComponentType] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [days, setDays] = useState(30);
  const [sort, setSort] = useState("nearest");

  const [excelLoading, setExcelLoading] = useState(false);
  const [viewId, setViewId] = useState(null);

  const buildParams = (page, limit) => ({
    page,
    limit,
    days,
    sort,
    order: "asc",
    componentType: componentType || undefined,
    bloodGroup: bloodGroup || undefined,
  });

  const fetchRows = useCallback(
    async (page = 1, limit = pagination.limit) => {
      setIsLoading(true);
      try {
        const data = await inventoryApi.nearExpiryUnified(buildParams(page, limit));
        setRows(Array.isArray(data?.components) ? data.components : []);
        setPagination((p) => ({
          ...p,
          page,
          limit,
          total: data?.pagination?.total || 0,
          totalPages: data?.pagination?.totalPages || 0,
        }));
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load near-expiry units");
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [componentType, bloodGroup, days, sort, pagination.limit],
  );

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentType, bloodGroup, days, sort]);

  const handleExport = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let data = rows;
      if (exportAll) {
        const res = await inventoryApi.nearExpiryUnified(buildParams(1, 5000));
        data = Array.isArray(res?.components) ? res.components : [];
      }
      if (data.length === 0) {
        toast.info("No near-expiry units to export");
        return;
      }
      await exportNearExpiryComponents(data);
    } catch {
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-yellow-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <AlertTriangle className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Near-Expiry</h1>
              <p className="text-gray-500 text-sm">
                Every in-stock blood unit (all components + whole blood) approaching expiry
              </p>
            </div>
          </div>
          <ExportExcelDropdown onExport={handleExport} isLoading={excelLoading} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-4 border-yellow-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <Filter label="Component">
                <Select value={componentType || "all"} onValueChange={(v) => setComponentType(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    {COMPONENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>

              <Filter label="Blood Group">
                <Select value={bloodGroup || "all"} onValueChange={(v) => setBloodGroup(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Filter>

              <Filter label="Expiring Within">
                <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_WINDOWS.map((d) => <SelectItem key={d} value={d.toString()}>{d} days</SelectItem>)}
                  </SelectContent>
                </Select>
              </Filter>

              <Filter label="Order">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest">Nearest First</SelectItem>
                    <SelectItem value="bagNo">Bag Number</SelectItem>
                  </SelectContent>
                </Select>
              </Filter>
            </div>
          </CardContent>
        </Card>

        <NearExpiryTable
          rows={rows}
          isLoading={isLoading}
          total={pagination.total}
          pagination={pagination}
          onView={setViewId}
          onRefresh={() => fetchRows(pagination.page)}
          onPageChange={(p) => fetchRows(p)}
          onRowsPerPageChange={(v) => fetchRows(1, Number(v))}
        />
      </div>

      <ComponentDetailsModal
        isOpen={!!viewId}
        componentId={viewId}
        onClose={() => setViewId(null)}
      />
    </div>
  );
};

const Filter = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <div>{children}</div>
  </div>
);

export default InventoryNearExpiry;
