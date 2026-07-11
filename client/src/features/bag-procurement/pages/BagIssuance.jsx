import { useState } from 'react';
import { Syringe, X, Search } from 'lucide-react';
import {
  useBagIssueList,
  useBagIssueDetail,
} from '../queries';
import { useStockSummary } from '@/features/inventory/queries';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportProcurementIssue } from '@/utils/excelExportHelper';

const STATUS_BADGE = {
  ISSUED:   'bg-blue-50 text-blue-700 border-blue-200',
  USED:     'bg-purple-50 text-purple-700 border-purple-200',
  RETURNED: 'bg-green-50 text-green-700 border-green-200',
  DAMAGED:  'bg-red-50 text-red-700 border-red-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMPONENT_THEMES = {
  RBC: {
    bgClass: 'bg-red-50/20 border-red-100',
    titleClass: 'text-red-800 border-red-200',
    labelClass: 'bg-red-700 text-white',
    activeBubble: 'border-red-300 bg-red-50 text-red-800',
    activeText: 'text-red-900',
    activeBgLabel: 'text-red-700',
  },
  FFP: {
    bgClass: 'bg-amber-50/20 border-amber-100',
    titleClass: 'text-amber-800 border-amber-200',
    labelClass: 'bg-amber-700 text-white',
    activeBubble: 'border-amber-300 bg-amber-50 text-amber-800',
    activeText: 'text-amber-900',
    activeBgLabel: 'text-amber-700',
  },
  Platelets: {
    bgClass: 'bg-yellow-50/20 border-yellow-100',
    titleClass: 'text-yellow-800 border-yellow-200',
    labelClass: 'bg-yellow-700 text-white',
    activeBubble: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    activeText: 'text-yellow-900',
    activeBgLabel: 'text-yellow-700',
  },
  Cryo: {
    bgClass: 'bg-blue-50/20 border-blue-100',
    titleClass: 'text-blue-800 border-blue-200',
    labelClass: 'bg-blue-700 text-white',
    activeBubble: 'border-blue-300 bg-blue-50 text-blue-800',
    activeText: 'text-blue-900',
    activeBgLabel: 'text-blue-700',
  },
};

function ComponentStockLines({ stockSummary }) {
  const initialStock = () => ({ 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 });
  const stocks = {
    RBC: initialStock(),
    FFP: initialStock(),
    Platelets: initialStock(),
    Cryo: initialStock(),
  };

  if (stockSummary && Array.isArray(stockSummary)) {
    stockSummary.forEach((s) => {
      let type = s.componentType;
      if (type === 'PRBC' || type === 'RBC') type = 'RBC';
      else if (type === 'FFP') type = 'FFP';
      else if (type === 'PLATELET_CONCENTRATE' || type === 'Platelet' || type === 'PLATELET') type = 'Platelets';
      else if (type === 'CRYOPRECIPITATE' || type === 'Cryo' || type === 'CRYO') type = 'Cryo';
      else return;
      
      const rh = s.rhFactor === 'POSITIVE' || s.rhFactor === 'Positive' ? '+' : s.rhFactor === 'NEGATIVE' || s.rhFactor === 'Negative' ? '-' : '';
      const key = `${s.aboGroup}${rh}`;
      if (stocks[type] && stocks[type][key] !== undefined) {
        stocks[type][key] += s.count;
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 overflow-hidden">
      <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 text-red-800">
        Blood Component Stock Summary
      </h2>
      
      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="min-w-[680px]">
          {/* Header Row */}
          <div className="flex items-center gap-4 mb-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-[120px] text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Component</div>
            <div className="flex-1 flex items-center justify-between">
              {BLOOD_GROUPS.map((bg, idx) => (
                <div key={bg} className="flex items-center justify-center flex-1">
                  {idx > 0 && <div className="h-4 w-[1px] bg-gray-300 mr-4" />}
                  <span className="text-xs font-extrabold text-gray-700 w-12 text-center uppercase tracking-wider">
                    {bg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {Object.keys(stocks).map((type) => {
              const theme = COMPONENT_THEMES[type];
              const data = stocks[type];
              return (
                <div key={type} className={`flex items-center gap-4 p-3 rounded-xl border ${theme.bgClass}`}>
                  {/* Left Label */}
                  <div className="w-[120px] flex items-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${theme.labelClass} shadow-sm text-center w-full`}>
                      {type}
                    </span>
                  </div>

                  {/* Stock Columns */}
                  <div className="flex-1 flex items-center justify-between">
                    {BLOOD_GROUPS.map((bg, idx) => {
                      const count = data[bg] ?? 0;
                      const hasStock = count > 0;
                      return (
                        <div key={bg} className="flex items-center justify-center flex-1">
                          {idx > 0 && <div className="h-8 w-[1px] bg-gray-200 mr-4" />}
                          <div className={`flex items-center justify-center w-12 h-10 rounded-full border transition-all duration-200 ${
                            hasStock 
                              ? `${theme.activeBubble} shadow-sm font-black` 
                              : 'border-gray-200 bg-gray-50/30 text-gray-400 font-medium'
                          }`}>
                            <span className="text-xs">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BagIssuance() {
  const [viewingIssueId, setViewingIssueId] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'today', 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useBagIssueList({
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

  const handleExportExcel = async (exportAll = false) => {
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
            <div className="p-2.5 bg-gradient-to-br from-orange-700 to-orange-900 rounded-xl shadow-sm">
              <Syringe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bag Issuance for Collection</h1>
              <p className="text-gray-500 text-sm">Blood Collection Ops</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Bag No, Segment, Batch..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-250 rounded-lg text-sm focus:ring-2 focus:ring-orange-800/20 focus:border-orange-800 outline-none transition-all border-gray-200"
                />
              </div>
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

function ViewIssueModal({ id, onClose }) {
  const { data: issue, isLoading } = useBagIssueDetail(id);

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-4 border-orange-850 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading bag details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 text-center">
            <p className="text-red-500 font-medium">Failed to load bag issue details.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  const donor = typeof issue.donorId === 'object' ? issue.donorId : null;
  const donation = typeof issue.donationId === 'object' ? issue.donationId : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-800 to-orange-900">
            <h2 className="text-base font-bold text-white">Bag Issuance Information</h2>
            <button onClick={onClose} className="text-orange-250 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Bag Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-1">Bag & Collection Details</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><span className="text-gray-500 font-medium">Bag Serial No:</span> <span className="font-mono text-gray-900 font-semibold">{issue.bagSerialNumber}</span></div>
                <div><span className="text-gray-500 font-medium">Bag Type:</span> <span className="text-gray-800 font-semibold">{issue.bagType}</span></div>
                <div><span className="text-gray-500 font-medium">Batch No:</span> <span className="font-mono text-gray-800 font-semibold">{issue.batchNumber}</span></div>
                <div><span className="text-gray-500 font-medium">Collection Room:</span> <span className="text-gray-800">{issue.collectionRoom || '—'}</span></div>
                <div><span className="text-gray-500 font-medium">Issue Date:</span> <span className="text-gray-800">{new Date(issue.issueDate).toLocaleString('en-IN')}</span></div>
                <div><span className="text-gray-500 font-medium">Current Status:</span> <span className="capitalize text-gray-800 font-bold">{issue.status}</span></div>
                {issue.notes && <div className="col-span-2"><span className="text-gray-500 font-medium">Notes:</span> <span className="text-gray-800 italic">{issue.notes}</span></div>}
              </div>
            </div>

            {/* Donor Details */}
            {donor ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider border-b pb-1">
                  Donor Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-orange-50/20 border border-orange-100 rounded-xl p-4">
                  <div>
                    <span className="text-gray-500 font-medium">Name:</span>{' '}
                    <span className="text-gray-900 font-bold">
                      {[donor.name?.firstName, donor.name?.middleName, donor.name?.lastName].filter(Boolean).join(' ')}
                    </span>
                  </div>
                  <div><span className="text-gray-500 font-medium">Blood Group:</span> <span className="text-red-700 font-bold">{donor.bloodGroup} {donor.rh}</span></div>
                  <div><span className="text-gray-500 font-medium">Phone:</span> <span className="text-gray-800">{donor.phone || '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Email:</span> <span className="text-gray-800">{donor.email || '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Sex / DOB:</span> <span className="text-gray-800">{donor.sex || '—'} / {donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN') : '—'}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-medium bg-gray-50 border rounded-xl p-3 text-center">
                No donor linked. This bag has not been used for a donation yet.
              </div>
            )}

            {/* Donation Details */}
            {donation ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider border-b pb-1">
                  Donation Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-purple-50/20 border border-purple-100 rounded-xl p-4">
                  <div><span className="text-gray-500 font-medium">Donation ID:</span> <span className="font-mono text-gray-900 font-semibold">{donation.donationId}</span></div>
                  <div><span className="text-gray-500 font-medium">Donation Type:</span> <span className="text-gray-800 font-semibold">{donation.donationType?.replace('_', ' ')}</span></div>
                  <div><span className="text-gray-500 font-medium">Segment No:</span> <span className="font-mono text-gray-950 font-bold text-purple-800">{donation.segmentNo || '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Collection Date:</span> <span className="text-gray-800">{donation.collectedAt ? new Date(donation.collectedAt).toLocaleString('en-IN') : '—'}</span></div>
                  <div><span className="text-gray-500 font-medium">Bag Type used:</span> <span className="text-gray-800">{donation.typeOfBag || '—'}</span></div>
                  {donation.medicalExam && (
                    <div className="col-span-2 pt-2 border-t border-purple-100/55 grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-500 font-medium block">Haemoglobin</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.hbGdl ? `${donation.medicalExam.hbGdl} g/dL` : '—'}</span></div>
                      <div><span className="text-gray-500 font-medium block">Weight</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.weightKg ? `${donation.medicalExam.weightKg} kg` : '—'}</span></div>
                      <div><span className="text-gray-500 font-medium block">Pulse</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.pulseBpm ? `${donation.medicalExam.pulseBpm} bpm` : '—'}</span></div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Requisition & Delivery Details */}
            {issue.requisitions && issue.requisitions.filter(r => r.requisitionId).length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b pb-1">
                  Requisition & Delivery Details
                </h3>
                <div className="space-y-4">
                  {issue.requisitions
                    .filter(r => r.requisitionId)
                    .map((req) => (
                      <div key={req.unitId} className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                          <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            {req.unitId.split('-').slice(-2).join(' ')} ({req.componentType})
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            Blood Group: <span className="text-red-700 font-bold">{req.aboGroup} {req.rhFactor}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div><span className="text-gray-500 font-medium">Requisition No:</span> <span className="font-mono text-gray-900 font-semibold">{req.requisitionId}</span></div>
                          <div><span className="text-gray-500 font-medium">Status:</span> <span className="capitalize text-blue-850 font-bold">{req.requisitionStatus}</span></div>
                          <div><span className="text-gray-500 font-medium">Hospital:</span> <span className="text-gray-800 font-semibold">{req.hospitalName}</span></div>
                          <div><span className="text-gray-500 font-medium">Patient:</span> <span className="text-gray-800 font-semibold">{req.patientName}</span></div>
                          <div><span className="text-gray-500 font-medium">Clinician:</span> <span className="text-gray-800">{req.clinicianName}</span></div>
                          <div><span className="text-gray-500 font-medium">Required At:</span> <span className="text-gray-800">{req.requiredAt ? new Date(req.requiredAt).toLocaleString('en-IN') : '—'}</span></div>
                        </div>

                        {req.issue ? (
                          <div className="mt-2 pt-2 border-t border-dashed border-blue-100 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700 bg-blue-50/10 rounded-lg p-2">
                            <div className="col-span-2 font-bold text-blue-800 text-[10px] uppercase tracking-wider">Delivery Pass Details</div>
                            <div><span className="text-gray-500 font-medium">Issued At:</span> <span className="text-gray-800">{new Date(req.issue.issuedAt).toLocaleString('en-IN')}</span></div>
                            <div className="col-span-2"><span className="text-gray-500 font-medium">Collected By:</span> <span className="text-gray-800 font-semibold">{req.issue.collectedByName || '—'}</span></div>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg p-2 text-center font-medium">
                            Component is matched/reserved but not issued from the blood bank yet.
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
