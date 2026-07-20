import { useState } from 'react';
import { ClipboardCheck, Plus, RefreshCw } from 'lucide-react';
import { useBagInspectionList, useGRNList } from '../queries';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import IframePreviewModal from '@/components/shared/IframePreviewModal';
import { exportProcurementInspection } from '@/utils/excelExportHelper';
import DecisionBadge from '../components/inspection/DecisionBadge';
import InspectionDrawer from '../components/inspection/InspectionDrawer';
import UpdateReportDrawer from '../components/inspection/UpdateReportDrawer';
import ViewInspectionModal from '../components/inspection/ViewInspectionModal';
import { TESTING_TYPE_LABELS } from '../components/inspection/inspection-constants';

export default function BagInspection() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReportDrawer, setShowReportDrawer] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [drawerMode, setDrawerMode] = useState('update'); // 'update' or 'edit'

  // Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);

  const mapInspectionForExport = (items) => {
    return items.map(ins => ({
      inspectionId: ins.inspectionId || ins._id,
      batchNo: ins.batchNumber,
      poNumber: ins.grn?.poNumber || ins.poNumber || '—',
      bagNo: ins.bagNo,
      segmentNo: ins.segmentNo,
      bloodGroup: ins.bloodGroup,
      sampleSize: ins.sampleSize,
      testingType: ins.testingType,
      testingLab: ins.testingLab === 'Other' ? (ins.customTestingLab || 'Other') : ins.testingLab,
      inspectionDate: ins.inspectionDate || ins.createdAt,
      inspectorName: ins.inspectedBy?.name || ins.inspectorName || '—',
      status: ins.decision || ins.status || '—',
      physicalChecks: ins.physicalChecks || {},
    }));
  };

  const handleExportExcel = async (_exportAll = false) => {
    try {
      setExcelLoading(true);
      const dataToExport = mapInspectionForExport(inspections);

      if (dataToExport.length === 0) {
        toast.info("No inspections to export");
        return;
      }

      await exportProcurementInspection(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  const [decisionFilter, setDecisionFilter] = useState('');
  const [batchNumberFilter, setBatchNumberFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data, isLoading, refetch, isFetching } = useBagInspectionList({
    decision: decisionFilter || undefined,
    batchNumber: batchNumberFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const { data: grnData } = useGRNList({});

  const inspections = data?.items ?? data?.bagInspections ?? (Array.isArray(data) ? data : []);
  const grns = grnData?.items ?? grnData?.goodsReceipts ?? (Array.isArray(grnData) ? grnData : []);

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <ClipboardCheck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bag Quality Inspection</h1>
              <p className="text-gray-500 text-sm">Incoming Batch QC</p>
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
            <button onClick={() => setShowDrawer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
              <Plus className="w-4 h-4" /> New Inspection
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Batch No</label>
            <input value={batchNumberFilter} onChange={(e) => setBatchNumberFilter(e.target.value)} placeholder="Search batch..."
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Decision</label>
            <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Decisions</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="QUARANTINE">Quarantine</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Inspection From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Inspection To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {(decisionFilter || batchNumberFilter || fromDate || toDate) && (
            <button onClick={() => { setDecisionFilter(''); setBatchNumberFilter(''); setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium">
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Batch No', 'Inspection Date', 'Decision', 'Testing Status', 'Results', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : inspections.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : inspections.map((ins) => (
                  <tr key={ins._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(ins.inspectionDate ?? ins.createdAt)}</td>
                    <td className="px-4 py-3"><DecisionBadge decision={ins.decision} /></td>
                    <td className="px-4 py-3">
                      {ins.testingType ? (
                        ins.testingStatus === 'SENT' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                            Under Testing ({TESTING_TYPE_LABELS[ins.testingType] ?? ins.testingType})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            Report Received
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                      {ins.testingStatus === 'REPORT_RECEIVED' ? (
                        <div className="space-y-0.5">
                          <div><span className="font-semibold text-gray-500">Lab:</span> {ins.testingLab}</div>
                          <div><span className="font-semibold text-gray-500">Bag/Seg:</span> {ins.bagNo || '—'} / {ins.segmentNo || '—'}</div>
                          {ins.testingType === 'EMPTY' ? (
                            <div>
                              <span className="font-semibold text-gray-500">Factor VIII:</span> {ins.factorVIII ?? '—'} Unit/mL,
                              <span className="font-semibold text-gray-500 ml-1">Fibrinogen:</span> {ins.fibrinogen ?? '—'} mg
                            </div>
                          ) : (
                            <div><span className="font-semibold text-gray-500">BG / Result:</span> {ins.bloodGroup || '—'} / {ins.testResult || '—'}</div>
                          )}
                        </div>
                      ) : ins.testingStatus === 'SENT' ? (
                        <span className="text-gray-400">Sent to: {ins.testingLab}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        {ins.testingStatus === 'SENT' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setDrawerMode('update');
                                setShowReportDrawer(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                            >
                              Update Report
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setDrawerMode('edit');
                                setShowReportDrawer(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Edit Report
                            </button>
                          </>
                        )}
                        {ins.testingStatus === 'REPORT_RECEIVED' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setShowViewModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              View Report
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInspection(ins);
                                setDrawerMode('edit');
                                setShowReportDrawer(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Edit Report
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <InspectionDrawer onClose={() => setShowDrawer(false)} grns={grns} />}
      {showReportDrawer && selectedInspection && (
        <UpdateReportDrawer
          onClose={() => {
            setShowReportDrawer(false);
            setSelectedInspection(null);
          }}
          inspection={selectedInspection}
          mode={drawerMode}
        />
      )}
      {showViewModal && selectedInspection && (
        <ViewInspectionModal
          onClose={() => {
            setShowViewModal(false);
            setSelectedInspection(null);
          }}
          inspection={inspections.find(ins => (ins._id ?? ins.id) === (selectedInspection?._id ?? selectedInspection?.id)) || selectedInspection}
          onViewReportImage={(url) => {
            setPreviewUrl(url);
            setPreviewTitle(`Lab Report Document: Batch ${selectedInspection.batchNumber}`);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setDrawerMode('edit');
            setShowReportDrawer(true);
          }}
        />
      )}
      <IframePreviewModal
        isOpen={!!previewUrl}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewUrl('')}
      />
    </div>
  );
}
