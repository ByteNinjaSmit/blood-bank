import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiClient } from "@/core/api-client";
import { toast } from "sonner";
import { DISCARD_REASONS } from "./discard-constants";

export default function CreateDiscardModal({ isOpen, onClose, onSuccess, API, token }) {
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
        const response = await apiClient.get(`/api/donation/lookup/${bagNo.trim()}`);
        if (response.data?.success && response.data?.data) {
          const { lotNo, segmentNo: segNo } = response.data.data;
          setBatchNo(lotNo || '');
          setSegmentNo(segNo || '');
        }
      } catch {
        // Fail silently during typing — auto-lookup is best-effort.
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
      const response = await apiClient.post(`/api/discard/create`, {
        bagNo,
        batchNo: batchNo || undefined,
        segmentNo: segmentNo || undefined,
        reason,
        description: description || undefined,
        ttiResults: reason === 'TTI_POSITIVE' ? serology : undefined,
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
