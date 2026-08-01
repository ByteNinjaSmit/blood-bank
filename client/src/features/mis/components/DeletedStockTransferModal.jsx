import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package } from 'lucide-react';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Both BulkTransfer and StorageTransfer items carry the same fields
// (component, blood group, bag no, segment, volume, expiry), so one
// table shape covers a deleted record from either module.
function bagsFromRecord(record) {
  return (record?.items || []).map((it) => ({
    bagNo: it.bagNo,
    componentType: it.componentType,
    bloodGroup: it.rhFactor ? `${it.bloodGroup}${it.rhFactor === 'NEGATIVE' ? '-' : '+'}` : it.bloodGroup,
    segmentNo: it.segmentNo,
    volumeMl: it.volumeMl,
    expiresAt: it.expiresAt,
  }));
}

export default function DeletedStockTransferModal({ record, module, onClose }) {
  const bags = bagsFromRecord(record);
  const isBulkTransfer = module === 'bulk-transfer';

  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deleted Stock Transfer</DialogTitle>
        </DialogHeader>
      {!record ? null : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div>
              <span className="text-gray-400 uppercase tracking-wide font-semibold">Transfer ID</span>
              <div className="text-gray-800 font-medium font-mono">{record.transferId}</div>
            </div>
            <div>
              <span className="text-gray-400 uppercase tracking-wide font-semibold">Deleted On</span>
              <div className="text-gray-800 font-medium">
                {record.deletedAt ? new Date(record.deletedAt).toLocaleString('en-IN') : '—'}
              </div>
            </div>
            {isBulkTransfer ? (
              <>
                <div>
                  <span className="text-gray-400 uppercase tracking-wide font-semibold">Type</span>
                  <div className="text-gray-800">{record.transferType === 'GIVE_LOAN' ? 'Give Loan' : 'Take Loan'}</div>
                </div>
                <div>
                  <span className="text-gray-400 uppercase tracking-wide font-semibold">Blood Bank</span>
                  <div className="text-gray-800">{record.bloodBankName}</div>
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <span className="text-gray-400 uppercase tracking-wide font-semibold">Storage Location</span>
                <div className="text-gray-800">{record.otherLocationName || record.location}</div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Bags In This Transfer ({bags.length})
            </h3>
            {bags.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No bag-level detail was recorded for this transfer.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Bag No</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Component</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Blood Group</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Segment</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Volume</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500 uppercase">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bags.map((b, idx) => (
                      <tr key={`${b.bagNo}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-700">{b.bagNo || '—'}</td>
                        <td className="px-3 py-2 text-gray-700">{b.componentType || '—'}</td>
                        <td className="px-3 py-2 font-semibold text-gray-800">{b.bloodGroup || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{b.segmentNo || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{b.volumeMl ? `${b.volumeMl} mL` : '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{formatDate(b.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      </DialogContent>
    </Dialog>
  );
}
