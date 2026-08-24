import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { compareBagNo } from '@/lib/natural-sort';

// Shown every time "Issue Report" is clicked — lets the operator pick which
// matched components to include in the printed report. Components that
// haven't been issued yet cannot be selected; the operator must issue them
// first (from the Issue action) before they can appear on a report.
export default function RequisitionReportSelectModal({ open, doc, onClose, onConfirm }) {
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (!open || !doc) return;
    // Pre-select every already-issued component by default.
    const initial = {};
    (doc.matchedInventory || []).forEach((mi) => {
      const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
      const id = inv?._id || mi.inventoryId;
      if (inv?.status === 'ISSUED') initial[id] = true;
    });
    setSelected(initial);
  }, [open, doc]);

  const units = useMemo(() => {
    const list = [...(doc?.matchedInventory || [])];
    list.sort((a, b) => {
      const invA = typeof a.inventoryId === 'object' ? a.inventoryId : null;
      const invB = typeof b.inventoryId === 'object' ? b.inventoryId : null;
      return compareBagNo(invA?.bagNo?.bagNo, invB?.bagNo?.bagNo);
    });
    return list;
  }, [doc]);
  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Components to Include in Issue Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {units.length === 0 ? (
            <div className="text-gray-600">No matched components on this requisition.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3 w-10"></th>
                    <th className="p-3">Bag No</th>
                    <th className="p-3">Component</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {units.map((mi, idx) => {
                    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                    const id = inv?._id || mi.inventoryId || idx;
                    const bagNo = inv?.bagNo?.bagNo || '—';
                    const compType = inv?.componentId?.componentType || '—';
                    const bloodGroup = inv?.bagNo?.bloodGroup ? `${inv.bagNo.bloodGroup} ${inv.bagNo.rh === 'Positive' ? '+' : inv.bagNo.rh === 'Negative' ? '-' : ''}` : '—';
                    const isIssued = inv?.status === 'ISSUED';

                    return (
                      <tr key={id} className={isIssued ? 'hover:bg-gray-50/50' : 'opacity-60'}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            disabled={!isIssued}
                            checked={!!selected[id]}
                            onChange={() => setSelected((m) => ({ ...m, [id]: !m[id] }))}
                          />
                        </td>
                        <td className="p-3 font-mono text-xs font-bold text-gray-800">{bagNo}</td>
                        <td className="p-3 font-semibold text-gray-700">{compType}</td>
                        <td className="p-3 font-bold text-gray-800">{bloodGroup}</td>
                        <td className="p-3 text-right">
                          {isIssued ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 border border-green-200 text-green-700">
                              Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-50 border border-gray-200 text-gray-600" title="Issue this component before it can be included in the report">
                              Not Issued — issue first
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => onConfirm(selectedIds)}
              className={`px-4 py-2 font-semibold rounded-xl text-xs shadow-sm transition-all ${
                selectedIds.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
              }`}
            >
              Continue to Preview
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
