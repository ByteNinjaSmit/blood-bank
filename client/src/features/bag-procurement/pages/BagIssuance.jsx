import { useState } from 'react';
import { Syringe, RefreshCw } from 'lucide-react';
import { useBagIssueList } from '../queries';
import { useStockSummary } from '@/features/inventory/queries';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import ComponentStockLines from '@/components/shared/ComponentStockLines';
import SearchBox from '@/components/shared/SearchBox';
import { exportProcurementIssue } from '@/utils/excelExportHelper';
import ViewIssueModal from '../components/issuance/ViewIssueModal';

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

export default function BagIssuance() {
  const [viewingIssueId, setViewingIssueId] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'today', 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, error, refetch, isFetching } = useBagIssueList({
    pageSize: 500,
    fromDate: dateFilterType === 'custom' && fromDate ? fromDate : undefined,
    toDate: dateFilterType === 'custom' && toDate ? toDate : undefined,
  });
  const { data: stockSummaryData } = useStockSummary();

  const issues = data?.items ?? data?.bagIssues ?? (Array.isArray(data) ? data : []);

  // Filter logic
  const filteredIssues = issues.filter((iss) => {
    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bagNo = (iss.bagSerialNumber || iss.bagSerialNo || '').toLowerCase();
      const segmentNo = (iss.segmentNo || '').toLowerCase();
      const batchNo = (iss.batchNumber || iss.batchNo || '').toLowerCase();
      const bloodGroup = (iss.bloodGroup || '').toLowerCase();

      const match = bagNo.includes(q) || segmentNo.includes(q) || batchNo.includes(q) || bloodGroup.includes(q);
      if (!match) return false;
    }

    // 2. Date Filter
    if (dateFilterType === 'today') {
      const todayStr = new Date().toDateString();
      const issDateStr = iss.issueDate || iss.createdAt ? new Date(iss.issueDate || iss.createdAt).toDateString() : '';
      if (todayStr !== issDateStr) return false;
    } else if (dateFilterType === 'custom') {
      const issTime = iss.issueDate || iss.createdAt ? new Date(iss.issueDate || iss.createdAt).getTime() : 0;
      if (fromDate) {
        const startOfDay = new Date(fromDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (issTime < startOfDay.getTime()) return false;
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (issTime > endOfDay.getTime()) return false;
      }
    }

    return true;
  });

  const mapIssuanceForExport = (items) => {
    return items.map(iss => {
      const donor = typeof iss.donorId === 'object' && iss.donorId ? iss.donorId : null;
      const donation = typeof iss.donationId === 'object' && iss.donationId ? iss.donationId : null;
      const donorName = donor
        ? [donor.name?.firstName, donor.name?.middleName, donor.name?.lastName].filter(Boolean).join(' ')
        : '';
      return {
        bagNo: iss.bagSerialNumber ?? iss.bagSerialNo ?? '—',
        segmentNo: iss.segmentNo ?? '—',
        bagType: iss.bagType || '—',
        bloodGroup: iss.bloodGroup ?? '—',
        batchNo: iss.batchNumber ?? iss.batchNo ?? '—',
        collectionRoom: iss.collectionRoom || '—',
        issueDate: iss.issueDate || iss.createdAt,
        status: iss.status === 'DAMAGED' ? 'DISCARDED' : (iss.status || 'ISSUED'),
        donorName: donorName || '—',
        donorBloodGroup: donor ? `${donor.bloodGroup ?? ''} ${donor.rh ?? ''}`.trim() || '—' : '—',
        donorPhone: donor?.phone || '—',
        donationId: donation?.donationId || '—',
        notes: iss.notes || '—',
      };
    });
  };

  const handleExportExcel = async (_exportAll = false) => {
    try {
      setExcelLoading(true);
      const dataToExport = mapIssuanceForExport(filteredIssues);

      if (dataToExport.length === 0) {
        toast.info("No issuances to export");
        return;
      }

      await exportProcurementIssue(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  const stats = {
    total:    filteredIssues.length,
    inUse:    filteredIssues.filter((i) => i.status === 'ISSUED').length,
    returned: filteredIssues.filter((i) => i.status === 'RETURNED').length,
    damaged:  filteredIssues.filter((i) => i.status === 'DAMAGED').length,
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Syringe className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bag Issuance for Collection</h1>
              <p className="text-gray-500 text-sm">Blood Collection Ops</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <ComponentStockLines stockSummary={stockSummaryData} />

        {/* Search and Date Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Search Bag Info
              </label>
              <SearchBox
                value={searchInput}
                onChange={setSearchInput}
                onSearch={() => setSearchQuery(searchInput)}
                placeholder="Search Bag No, Segment, Batch..."
                inputClassName="rounded-lg border-gray-200 focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800"
              />
            </div>

            <div className="w-full md:w-48">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Date Filter
              </label>
              <select
                value={dateFilterType}
                onChange={(e) => {
                  setDateFilterType(e.target.value);
                  if (e.target.value !== 'custom') {
                    setFromDate('');
                    setToDate('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 outline-none transition-all"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {dateFilterType === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="w-full sm:w-40">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 bg-white"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 bg-white"
                  />
                </div>
              </div>
            )}

            {(searchQuery || dateFilterType !== 'all' || fromDate || toDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchInput('');
                  setDateFilterType('all');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-4 py-2 border border-gray-205 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors shrink-0 w-full md:w-auto border-gray-200 bg-white shadow-2xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <StatCard label="Total Issued" value={stats.total}    color="text-gray-900" />
          <StatCard label="Total Discarded" value={stats.damaged}  color="text-red-700" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Bag No', 'Segment No', 'Batch No', 'Bag Type', 'Issue Date', 'Blood Group', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : isError ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-red-600">
                    Failed to load bag issuances{error?.message ? `: ${error.message}` : '.'}
                  </td></tr>
                ) : filteredIssues.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : filteredIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900">
                      {iss.bagSerialNumber ?? iss.bagSerialNo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-purple-850 font-semibold">{iss.segmentNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{iss.batchNumber ?? iss.batchNo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{iss.bagType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(iss.issueDate ?? iss.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-bold">{iss.bloodGroup ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => setViewingIssueId(iss.id)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors shadow-2xs bg-white">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewingIssueId && <ViewIssueModal id={viewingIssueId} onClose={() => setViewingIssueId(null)} />}
    </div>
  );
}
