import { X, Trash2 } from 'lucide-react';

export default function InstallmentModal({
  selectedPurchase,
  tempInstallments,
  newInst,
  setNewInst,
  currentPaidAmount,
  formatDate,
  fieldClass,
  handleAddInstallment,
  handleRemoveInstallment,
  handleSaveInstallments,
  isSaving,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Manage Installment Payments</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
              Invoice: <span className="font-bold text-gray-700">{selectedPurchase.invoiceNumber}</span> | Supplier: <span className="font-bold text-gray-700">{selectedPurchase.supplierId?.name || '—'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Payment Summary Metrics */}
          <div className="grid grid-cols-3 gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-center space-y-0.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Bill</span>
              <div className="text-sm font-bold text-gray-900">₹{selectedPurchase.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="text-center space-y-0.5 border-x border-gray-200">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Paid</span>
              <div className="text-sm font-bold text-emerald-600">₹{currentPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="text-center space-y-0.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Remaining</span>
              <div className="text-sm font-bold text-red-600">₹{Math.max(0, selectedPurchase.totalAmount - currentPaidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Existing Installments List */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Installments ({tempInstallments.length})</h4>
            {tempInstallments.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-xl font-medium">
                No installment payments recorded yet.
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                {tempInstallments.map((inst, index) => (
                  <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-55/30 transition-colors">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-gray-800">
                        ₹{inst.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
                        <span className="font-semibold text-gray-600">{formatDate(inst.paymentDate)}</span>
                        {inst.remarks && <span className="text-gray-400 font-normal">| {inst.remarks}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstallment(index)}
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Installment Form */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Record New Installment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-600 mb-1 uppercase tracking-wide">Amount (₹) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={newInst.amount}
                  onChange={(e) => setNewInst({ ...newInst, amount: e.target.value })}
                  placeholder="0.00"
                  className={`${fieldClass} py-1.5 text-xs`}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-600 mb-1 uppercase tracking-wide">Payment Date *</label>
                <input
                  type="date"
                  value={newInst.paymentDate}
                  onChange={(e) => setNewInst({ ...newInst, paymentDate: e.target.value })}
                  className={`${fieldClass} py-1.5 text-xs`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-600 mb-1 uppercase tracking-wide">Remarks / Payment Method</label>
              <input
                type="text"
                value={newInst.remarks}
                onChange={(e) => setNewInst({ ...newInst, remarks: e.target.value })}
                placeholder="e.g. UPI, Cheque #12345, Cash receipt #..."
                className={`${fieldClass} py-1.5 text-xs`}
              />
            </div>
            <button
              type="button"
              onClick={handleAddInstallment}
              className="w-full py-2 text-xs font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              Add installment to List
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 bg-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveInstallments}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-red-800 rounded-lg hover:bg-red-900 transition-colors shadow-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Payments'}
          </button>
        </div>
      </div>
    </div>
  );
}
