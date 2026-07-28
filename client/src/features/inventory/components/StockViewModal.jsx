import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StockViewModal({ item, onClose, formatDate }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 normal-case" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-gray-800 mb-4">Blood Bag Details</h3>

        {item?.source === 'LOAN' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
            <p className="font-bold text-blue-800">This blood bag was taken in on loan.</p>
            <p className="text-blue-700 text-xs mt-0.5">
              From <strong>{item?.loanTransfer?.bloodBankName}</strong>
              {item?.loanTransfer?.bloodBankAddress ? `, ${item.loanTransfer.bloodBankAddress}` : ''}
              {' '}· Transfer ID: <strong>{item?.loanTransfer?.transferId}</strong>
              {item?.loanTransfer?.transferDate ? ` · ${formatDate(item.loanTransfer.transferDate)}` : ''}
            </p>
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <div className="text-3xl font-black text-red-800 leading-none">
              {item?.bag?.bloodGroup || '—'}
            </div>
            <div className="text-xs font-bold text-red-700 uppercase tracking-wide">
              Rh {item?.bag?.rh || '—'}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bag Information</p>
            <div className="grid grid-cols-4 gap-x-4 gap-y-2 bg-gray-50 rounded-xl p-3">
              <div>
                <p className="text-[10px] text-gray-500">Bag No</p>
                <p className="font-semibold text-gray-800">{item?.bag?.bagNo || item?.bagNo || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Segment No</p>
                <p className="font-semibold text-gray-800">{item?.bag?.segmentNo || item?.segmentNo || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Batch No</p>
                <p className="font-semibold text-gray-800">{item?.bag?.batchNo || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Bag Type</p>
                <p className="font-semibold text-gray-800">{item?.typeOfBag || '—'}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Component</p>
            <div className="grid grid-cols-5 gap-x-4 gap-y-2 bg-gray-50 rounded-xl p-3">
              <div>
                <p className="text-[10px] text-gray-500">Component Name</p>
                <p className="font-semibold text-gray-800">{item?.component?.componentType || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Volume</p>
                <p className="font-semibold text-gray-800">{item?.component?.volumeMl ? `${item.component.volumeMl} mL` : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Collection Date</p>
                <p className="font-semibold text-gray-800">{formatDate(item?.bag?.donationDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Expiry Date</p>
                <p className="font-semibold text-gray-800">{formatDate(item?.component?.expiryDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Status</p>
                <p className="font-semibold text-gray-800 capitalize">{item?.status || '—'}</p>
              </div>
            </div>
          </div>

          {item?.status === 'in-stock' || item?.status === 'quarantine' ? (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Storage</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-[10px] text-gray-500">Storage Location</p>
                  <p className="font-semibold text-gray-800">{item?.storageLocation || 'Main Fridge'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                {item?.status === 'reserved' ? 'Reservation Details' : 'Issue Details'}
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-[10px] text-gray-500">Destination / Hospital</p>
                  <p className="font-semibold text-gray-800">{item?.hospital?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Patient</p>
                  <p className="font-semibold text-gray-800">
                    {item?.reservedPatientName || '—'}
                    {item?.reservedPatientAge ? ` (${item.reservedPatientAge}Y / ${item.reservedPatientSex || '—'})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Requisition ID</p>
                  <p className="font-semibold text-gray-800">{item?.requisition?.requisitionId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Doctor</p>
                  <p className="font-semibold text-gray-800">{item?.requisition?.doctorName || '—'}</p>
                </div>
                {item?.status === 'reserved' && (
                  <div>
                    <p className="text-[10px] text-gray-500">Reserved Until</p>
                    <p className="font-semibold text-gray-800">{formatDate(item?.reservedUntil)}</p>
                  </div>
                )}
                {item?.status === 'issued' && (
                  <div>
                    <p className="text-[10px] text-gray-500">Issued At</p>
                    <p className="font-semibold text-gray-800">{formatDate(item?.issuedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {item?.source === 'LOAN' ? (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Loan Source</p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-[10px] text-gray-500">Company Name</p>
                  <p className="font-semibold text-gray-800">{item?.loanTransfer?.bloodBankName || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Transfer ID</p>
                  <p className="font-semibold text-gray-800 font-mono">{item?.loanTransfer?.transferId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Transfer Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(item?.loanTransfer?.transferDate)}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-[10px] text-gray-500">Address</p>
                  <p className="font-semibold text-gray-800">{item?.loanTransfer?.bloodBankAddress || '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Donor Information</p>
              <div className="grid grid-cols-5 gap-x-4 gap-y-2 bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-[10px] text-gray-500">Donor Name</p>
                  <p className="font-semibold text-gray-800">{item?.bag?.donorName || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Donor ID</p>
                  <p className="font-semibold text-gray-800">{item?.bag?.donorId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-800">{item?.bag?.donorPhone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Email</p>
                  <p className="font-semibold text-gray-800 truncate">{item?.bag?.donorEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Donation Type</p>
                  <p className="font-semibold text-gray-800 capitalize">{item?.bag?.donationType || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end mt-6">
          <Button variant="outline" onClick={onClose} className="px-5 text-xs font-bold shadow-none">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
