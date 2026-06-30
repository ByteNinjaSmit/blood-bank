import React, { useEffect } from "react"
import { useState } from "react"
import { AlertTriangle, Search, Calendar, X, ChevronLeft, ChevronRight, Loader2, Layers, Plus, FileText, Image as ImageIcon } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/store/auth"
import MasterLoader from "@/components/Loader"
import DiscardTable from "./DiscardTable"
import DiscardDetailsModal from "./DiscardDetailsModal"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown"
import { exportProcurementDiscard } from "@/utils/excelExportHelper"
import { toast } from "sonner"

const DISCARD_REASONS = [
  'EXPIRED',
  'TTI_POSITIVE',
  'UNDERWEIGHT',
  'HAEMOLYSED',
  'LIPAEMIC',
  'CLOTTED',
  'BAG_LEAK',
  'COLD_CHAIN_BREACH',
  'CONTAMINATION',
  'QC_FAIL',
  'UNUSED_AFTER_THAW',
  'DONOR_RECALL',
  'LABEL_ERROR',
];

const TESTING_TYPE_LABELS = {
  EMPTY: 'Empty Bag (QC)',
  WB: 'Whole Blood',
  PRBC: 'PRBC',
  FFP: 'FFP',
  PC: 'Platelet Concentrate',
  CRYO: 'Cryoprecipitate',
  OTHER: 'Other',
};

const PHYSICAL_CHECKS = [
  { key: 'sealIntact', label: 'Seal Intact' },
  { key: 'noLeakage', label: 'No Leakage' },
  { key: 'tubeIntegrity', label: 'Tube Integrity' },
  { key: 'needleCondition', label: 'Needle Condition' },
  { key: 'labelPresence', label: 'Label Presence' },
  { key: 'sterilityCheck', label: 'Sterility Check' },
  { key: 'packagingCondition', label: 'Packaging Condition' },
];

function DecisionBadge({ decision }) {
  const configs = {
    PASSED: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Test Passed' },
    FAILED: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Test Failed' },
    REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'Rejected' },
    ACCEPTED: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Accepted' },
  };
  const c = configs[decision] || { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: decision };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg}`}>
      {c.text}
    </span>
  );
}

function CreateDiscardModal({ isOpen, onClose, onSuccess, API, token }) {
  const [bagNo, setBagNo] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [segmentNo, setSegmentNo] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [serology, setSerology] = useState({
    HIV: 'NEGATIVE',
    HBSAG: 'NEGATIVE',
    HCV: 'NEGATIVE',
    SYPHILIS: 'NEGATIVE',
    MALARIA: 'NEGATIVE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!bagNo || bagNo.trim().length < 4) return;
    
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await axios.get(`${API}/api/donation/lookup/${bagNo.trim()}`, {
          headers: { Authorization: token },
          withCredentials: true
        });
        if (response.data?.success && response.data?.data) {
          const { lotNo, segmentNo: segNo } = response.data.data;
          setBatchNo(lotNo || '');
          setSegmentNo(segNo || '');
        }
      } catch (err) {
        // Fail silently during typing, logs to debug console
        console.log("Auto-lookup for bagNo failed:", err.message);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [bagNo, API, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bagNo || !reason) {
      toast.error('Bag No and Reason are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/api/discard/create`, {
        bagNo,
        batchNo: batchNo || undefined,
        segmentNo: segmentNo || undefined,
        reason,
        description: description || undefined,
        ttiResults: reason === 'TTI_POSITIVE' ? serology : undefined,
      }, {
        headers: { Authorization: token },
        withCredentials: true
      });
      if (response.data?.success) {
        toast.success(response.data.message || 'Discard recorded successfully');
        setBagNo('');
        setBatchNo('');
        setSegmentNo('');
        setReason('');
        setDescription('');
        setSerology({
          HIV: 'NEGATIVE',
          HBSAG: 'NEGATIVE',
          HCV: 'NEGATIVE',
          SYPHILIS: 'NEGATIVE',
          MALARIA: 'NEGATIVE'
        });
        onSuccess();
        onClose();
      } else {
        toast.error(response.data?.message || 'Failed to record discard');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error occurred while recording discard');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800">
          <h2 className="text-base font-semibold text-white">Create Discard Entry</h2>
          <button onClick={onClose} className="text-red-200 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bag No / Donation ID *</label>
            <input required value={bagNo} onChange={(e) => setBagNo(e.target.value)} className={fieldClass} placeholder="e.g. SN-TB-CUSTOM-0008" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Batch No</label>
              <input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} className={fieldClass} placeholder="e.g. BATCH-01" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Segment No</label>
              <input value={segmentNo} onChange={(e) => setSegmentNo(e.target.value)} className={fieldClass} placeholder="e.g. SEG-99" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Reason *</label>
            <select required value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass}>
              <option value="">Select reason...</option>
              {DISCARD_REASONS.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {reason === 'TTI_POSITIVE' && (
            <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
              <span className="block text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Serology / Testing Results</span>
              
              {[
                { key: 'HIV', label: 'HIV' },
                { key: 'HBSAG', label: 'HBsAg (HBV)' },
                { key: 'HCV', label: 'HCV' },
                { key: 'SYPHILIS', label: 'VDRL (Syphilis)' },
                { key: 'MALARIA', label: 'MP (Malaria)' }
              ].map((test) => (
                <div key={test.key} className="flex items-center justify-between py-1 border-b border-red-50 last:border-0 text-sm">
                  <span className="font-semibold text-slate-700">{test.label}</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSerology(prev => ({ ...prev, [test.key]: 'NEGATIVE' }))}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        serology[test.key] === 'NEGATIVE'
                          ? 'bg-white text-slate-700 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Negative
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerology(prev => ({ ...prev, [test.key]: 'REACTIVE' }))}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        serology[test.key] === 'REACTIVE'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Reactive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Description / Remarks</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${fieldClass} min-h-[80px] resize-y`}
              placeholder="Provide a detailed description or remark for the discard decision..."
            />
          </div>

          <div className="pt-4 border-t flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 disabled:opacity-60">
              {isSubmitting ? 'Saving…' : 'Record Discard'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ViewInspectionModal({ onClose, inspection, onViewReportImage }) {
  if (!inspection) return null;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-red-800 text-white">
            <div>
              <h2 className="text-base font-semibold text-white">Inspection & QC Report Details</h2>
              <p className="text-[10px] text-red-200 font-medium uppercase tracking-wider mt-0.5">
                Batch No: {inspection.batchNumber}
              </p>
            </div>
            <button onClick={onClose} className="text-red-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspection ID</span>
                <span className="text-sm font-semibold text-gray-800 font-mono">
                  {inspection.inspectionId ?? inspection.id?.slice(-8).toUpperCase() ?? inspection._id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">GRN Reference</span>
                <span className="text-sm font-semibold text-gray-800 font-mono">
                  {inspection.grn?.grnNumber ?? inspection.grnId}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Decision</span>
                <span className="mt-1 block">
                  <DecisionBadge decision={inspection.decision} />
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Testing Status</span>
                <span className="text-sm font-semibold text-gray-800">
                  {inspection.testingStatus === 'SENT' ? 'Under Testing' : 'Report Received'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Sent</span>
                <span className="text-sm font-semibold text-gray-800">{fmtDate(inspection.sentDate ?? inspection.createdAt)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Received</span>
                <span className="text-sm font-semibold text-gray-800">{fmtDate(inspection.reportDate)}</span>
              </div>
            </div>

            {/* Test Specifications & Coagulation/Blood Group Details */}
            {inspection.testingStatus === 'REPORT_RECEIVED' && (
              <div>
                <h3 className="text-xs font-bold text-gray-505 text-gray-500 uppercase tracking-wider mb-2">QC Test Results</h3>
                <div className="grid grid-cols-2 gap-4 border border-gray-100 rounded-lg p-4 bg-white">
                  <div>
                    <span className="block text-[10px] text-gray-400">Testing Lab</span>
                    <span className="text-xs font-semibold text-gray-700">{inspection.testingLab || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Testing Type</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {TESTING_TYPE_LABELS[inspection.testingType] ?? inspection.testingType}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Bag & Segment No</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {inspection.bagNo || '—'} / {inspection.segmentNo || '—'}
                    </span>
                  </div>

                  {inspection.testingType === 'EMPTY' ? (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400">Factor VIII</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.factorVIII ?? '—'} Unit/mL</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400">Fibrinogen</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.fibrinogen ?? '—'} mg</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400">Sterility Check / Test Result</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.testResult || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-[10px] text-gray-400">Blood Group</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.bloodGroup || '—'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400">Test Result</span>
                        <span className="text-xs font-semibold text-gray-700">{inspection.testResult || '—'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Document Image section */}
            {inspection.reportImage ? (
              <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-0.5">Laboratory Report Document</span>
                  <span className="text-xs text-gray-600">Attached image of lab report is available.</span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onViewReportImage(inspection.reportImage)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> View Report Document
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Laboratory Report Document</span>
                  <span className="text-xs text-gray-500">No report document image uploaded.</span>
                </div>
              </div>
            )}

            {/* Physical Checks Summary */}
            <div>
              <h3 className="text-xs font-bold text-gray-505 text-gray-500 uppercase tracking-wider mb-2">Initial Physical Checks</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-gray-100 rounded-lg p-4 bg-white text-xs">
                {PHYSICAL_CHECKS.map((chk) => {
                  const passed = inspection.physicalChecks?.[chk.key];
                  return (
                    <div key={chk.key} className="flex justify-between items-center py-0.5">
                      <span className="text-gray-600">{chk.label}</span>
                      <span className={`font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-600">Anticoagulant Volume OK</span>
                  <span className={`font-semibold ${inspection.anticoagulantVolumeOk ? 'text-green-600' : 'text-red-600'}`}>
                    {inspection.anticoagulantVolumeOk ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-gray-600">Tube Patency</span>
                  <span className={`font-semibold ${inspection.tubePatency ? 'text-green-600' : 'text-red-600'}`}>
                    {inspection.tubePatency ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Observation Notes */}
            {inspection.observation && (
              <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-xs text-gray-700">
                <span className="block font-bold text-yellow-800 uppercase tracking-wider text-[10px] mb-0.5">Observation Notes</span>
                {inspection.observation}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function IframePreviewModal({ isOpen, url, title, onClose }) {
  if (!isOpen || !url) return null;
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || !url.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">{title || 'Document Viewer'}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-4 overflow-auto">
          {isImage ? (
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200"
            />
          ) : (
            <iframe
              src={url}
              title={title}
              className="w-full h-full border-0 rounded-lg bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

const ViewDiscarded = () => {
    const { API, authorizationToken } = useAuth();
    const [selectedItem, setSelectedItem] = useState(null)
    const [showBagDetails, setShowBagDetails] = useState(false)
    const [discardedItems, setDiscardedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [paginationData, setPaginationData] = useState();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
      search: "",
      itemType: "all",
      fromDate: "",
      toDate: ""
    });
    const [siteId, setSiteId] = useState("");
    const [sortBy, setSortBy] = useState("discardedAt");
    const [order, setOrder] = useState("desc");
    // const [sites, setSites] = useState([]);
    const [excelLoading, setExcelLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("unit");
    const [batchDiscards, setBatchDiscards] = useState([]);
    const [isBatchLoading, setIsBatchLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [selectedInspection, setSelectedInspection] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    const handleExportExcel = async (exportAll = false) => {
        try {
            setExcelLoading(true);
            let rawData = [];
            if (exportAll) {
                const response = await axios.get(`${API}/api/discard/get-list`, {
                    headers: {
                        Authorization: authorizationToken,
                    },
                    params: {
                        page: 1,
                        limit: 5000,
                        search: filters.search || undefined,
                        itemType: filters.itemType === "all" ? undefined : filters.itemType,
                        fromDate: filters.fromDate || undefined,
                        toDate: filters.toDate || undefined,
                        sortBy,
                        order,
                    },
                    withCredentials: true,
                });
                rawData = response?.data?.data || [];
            } else {
                rawData = discardedItems;
            }

            if (rawData.length === 0) {
                toast.info("No records to export");
                return;
            }

            // Map frontend naming/keys to what excelExportHelper expects
            const mappedData = rawData.map(r => ({
                bagNo: r.bagNo,
                componentId: r.componentId || r.componentNo,
                itemType: r.itemType,
                itemName: r.componentType || r.itemName || "—",
                reason: r.reason,
                discardedAt: r.discardedAt || r.createdAt
            }));

            await exportProcurementDiscard(mappedData);
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate Excel report");
        } finally {
            setExcelLoading(false);
        }
    };

    const getItems = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: rowsPerPage,
                search: filters.search || undefined,
                itemType: filters.itemType === "all" ? undefined : filters.itemType,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
                sortBy,
                order,
            };


            const response = await axios.get(`${API}/api/discard/get-list`, {
                headers: {
                    Authorization: authorizationToken,
                },
                params,
                withCredentials: true,
            });

            if (response.status === 200) {
                setDiscardedItems(response.data.data || []);
                setPaginationData(response.data.pagination);
                setTotalPages(response.data?.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching discarded items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getBatchDiscards = async () => {
        setIsBatchLoading(true);
        try {
            const response = await axios.get(`${API}/api/v2/bag-inspection`, {
                headers: { Authorization: authorizationToken },
                params: { decision: 'REJECTED', pageSize: 200 },
                withCredentials: true
            });
            setBatchDiscards(response.data?.data?.items || response.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch batch discards", e);
        } finally {
            setIsBatchLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'batch') {
            getBatchDiscards();
        }
    }, [activeTab]);



    useEffect(() => {
        const timeoutId = setTimeout(() => {
          getItems();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [currentPage, rowsPerPage, filters, sortBy, order]);

    const handleFilterChange = (key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    };

    const clearFilters = () => {
      setFilters({ search: "", itemType: "all", fromDate: "", toDate: "" });
      setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
      setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (newLimit) => {
      setRowsPerPage(newLimit === "all" ? 5000 : parseInt(newLimit));
      setCurrentPage(1);
    };



    const handleViewDetails = (item) => {
        setSelectedItem(item)
    }


    const closeModal = () => {
        setSelectedItem(null)
        setShowBagDetails(false)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Compact Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">View Discarded Items</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Management Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeTab === 'unit' && (
                            <Button 
                                onClick={() => setShowCreateModal(true)} 
                                className="bg-red-800 hover:bg-red-900 text-white font-semibold text-sm flex items-center gap-1.5 h-9"
                            >
                                <Plus className="w-4 h-4" /> Create Discard
                            </Button>
                        )}
                        <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-0 border-b border-gray-100 -mb-px">
                        {[
                            { key: 'unit', label: 'Blood Unit Discard', icon: AlertTriangle },
                            { key: 'batch', label: 'Batch Discard', icon: Layers },
                        ].map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.key
                                            ? 'border-red-800 text-red-800'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container - Compact Spacing */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeTab === 'unit' ? (
                    <>
                        {/* Compact Filters Section */}
                        <Card className="mb-6 border-red-100 shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Search */}
                                    <div className="flex-1 min-w-[240px] space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Bag Number</label>
                                        <div className="relative group">
                                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                                            <Input
                                                placeholder="Enter Bag Number..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                                className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Item Type */}
                                    <div className="w-36 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Item Type</label>
                                        <Select value={filters.itemType} onValueChange={(val) => handleFilterChange("itemType", val)}>
                                            <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="Bag">Bags</SelectItem>
                                                <SelectItem value="Component">Components</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* From Date */}
                                    <div className="w-36 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                                            <Input
                                                type="date"
                                                value={filters.fromDate}
                                                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                                                className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                                            />
                                        </div>
                                    </div>

                                    {/* To Date */}
                                    <div className="w-36 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                                            <Input
                                                type="date"
                                                value={filters.toDate}
                                                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                                                className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                                        {(filters.search || filters.itemType !== "all" || filters.fromDate || filters.toDate) && (
                                            <button 
                                                onClick={clearFilters}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                                                title="Clear all filters"
                                            >
                                                <X className="w-3 h-3" />
                                                Reset
                                            </button>
                                        )}
                                        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                <div className="text-sm font-semibold text-gray-700">Discarded History ({paginationData?.total || 0})</div>
                                <div className="flex items-center gap-2">
                                    <Select value={order} onValueChange={(val) => setOrder(val)}>
                                        <SelectTrigger className="h-8 text-xs w-32 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="desc">Newest First</SelectItem>
                                            <SelectItem value="asc">Oldest First</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={getItems} variant="outline" size="sm" className="h-8 px-2" disabled={isLoading}>
                                        <Loader2 className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>
                            </div>

                            {/* Table Section */}
                            <div className="overflow-x-auto">
                                <DiscardTable items={discardedItems} isLoading={isLoading} onView={handleViewDetails} />
                            </div>

                            {/* Refined Pagination Footer */}
                            <div className="flex items-center justify-between p-4 border-t bg-gray-50/10">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {((currentPage - 1) * rowsPerPage) + 1} to{" "}
                                        {Math.min(currentPage * rowsPerPage, paginationData?.totalFiltered || 0)} of{" "}
                                        {paginationData?.totalFiltered || 0} results
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Rows per page:</span>
                                        <Select 
                                            value={rowsPerPage === 5000 ? "all" : rowsPerPage.toString()} 
                                            onValueChange={handleRowsPerPageChange}
                                        >
                                            <SelectTrigger className="w-20 h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                                <SelectItem value="all">All</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1 || isLoading}
                                            className="h-8 text-xs"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </Button>
                                        
                                        <div className="flex items-center gap-1">
                                            {(() => {
                                                const pages = [];
                                                let startPage = Math.max(1, currentPage - 2);
                                                let endPage = Math.min(totalPages, currentPage + 2);
                                                
                                                if (endPage - startPage < 4) {
                                                    if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
                                                    else startPage = Math.max(1, endPage - 4);
                                                }
                                                
                                                for (let i = startPage; i <= endPage; i++) {
                                                    if (i > 0 && i <= totalPages) {
                                                        pages.push(
                                                            <Button
                                                                key={i}
                                                                variant={currentPage === i ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => handlePageChange(i)}
                                                                disabled={isLoading}
                                                                className={`w-8 h-8 p-0 text-xs ${currentPage === i ? "bg-red-600 hover:bg-red-700" : ""}`}
                                                            >
                                                                {i}
                                                            </Button>
                                                        );
                                                    }
                                                }
                                                return pages;
                                            })()}
                                        </div>
                                        
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages || isLoading}
                                            className="h-8 text-xs"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Cards (view-only) */}
                            <div className="md:hidden divide-y divide-red-100">
                                {discardedItems.map((item) => (
                                    <div key={item.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-slate-800">{item.bagNo}</div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.itemType === "Donation" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                                                {item.itemType}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <div className="mb-1"><strong>Reason:</strong> {item.reason}</div>
                                            <div><strong>Discarded:</strong> {item.discardedAt}</div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <button
                                                onClick={() => handleViewDetails(item)}
                                                className="flex-1 border border-blue-200 text-blue-600 rounded-md py-2 text-sm hover:bg-blue-50"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div className="text-sm font-semibold text-gray-700">Batch Discards ({batchDiscards.length})</div>
                            <Button onClick={getBatchDiscards} variant="outline" size="sm" className="h-8 px-2" disabled={isBatchLoading}>
                                <Loader2 className={`w-3.5 h-3.5 ${isBatchLoading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-55 border-b">
                                    <tr>
                                        {['Batch No', 'GRN Ref', 'Inspection Date', 'Decision', 'Testing Status', 'Results', 'Actions'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isBatchLoading ? (
                                        <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                                    ) : batchDiscards.length === 0 ? (
                                        <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                                    ) : batchDiscards.map((ins) => (
                                        <tr key={ins.id || ins._id} className="hover:bg-red-50/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono text-gray-700">{ins.batchNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{ins.grn?.grnNumber ?? ins.grnId}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
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
                                                {ins.testingStatus === 'REPORT_RECEIVED' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInspection(ins);
                                                            setShowViewModal(true);
                                                        }}
                                                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                                                    >
                                                        View Report
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <DiscardDetailsModal
                selectedItem={selectedItem}
                showBagDetails={showBagDetails}
                onClose={closeModal}
                onToggleBagDetails={() => setShowBagDetails(!showBagDetails)}
            />

            <CreateDiscardModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={getItems}
                API={API}
                token={authorizationToken}
            />

            {showViewModal && selectedInspection && (
                <ViewInspectionModal
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedInspection(null);
                    }}
                    inspection={selectedInspection}
                    onViewReportImage={(url) => {
                        setPreviewUrl(url);
                        setPreviewTitle(`Lab Report Document: Batch ${selectedInspection.batchNumber}`);
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
    )
}

export default ViewDiscarded;
