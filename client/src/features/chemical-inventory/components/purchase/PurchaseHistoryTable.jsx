import { Plus, X, CreditCard, ShoppingBag, CheckCircle2, AlertCircle, Clock, Upload, Image as ImageIcon } from 'lucide-react';

function getStatusBadge(status) {
  switch (status) {
    case 'Fully Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
        </span>
      );
    case 'Partially Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Partially Paid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" /> Pending
        </span>
      );
  }
}

export default function PurchaseHistoryTable({
  purchaseSearch,
  setPurchaseSearch,
  purchaseSupplierFilter,
  setPurchaseSupplierFilter,
  purchaseFromDate,
  setPurchaseFromDate,
  purchaseToDate,
  setPurchaseToDate,
  suppliers,
  purchasesLoading,
  filteredPurchases,
  purchases,
  formatDate,
  onAddNew,
  tableUploadingId,
  onTableImageUpload,
  onTableImageDelete,
  onPreview,
  onOpenInstallments,
}) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search Invoice / Supplier</label>
          <input
            value={purchaseSearch}
            onChange={(e) => setPurchaseSearch(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
          <select
            value={purchaseSupplierFilter}
            onChange={(e) => setPurchaseSupplierFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">All Suppliers</option>
            {(suppliers || []).map((s) => (<option key={s._id ?? s.id} value={s._id ?? s.id}>{s.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Date From</label>
          <input type="date" value={purchaseFromDate} onChange={(e) => setPurchaseFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Date To</label>
          <input type="date" value={purchaseToDate} onChange={(e) => setPurchaseToDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        {(purchaseSearch || purchaseSupplierFilter || purchaseFromDate || purchaseToDate) && (
          <button
            onClick={() => { setPurchaseSearch(''); setPurchaseSupplierFilter(''); setPurchaseFromDate(''); setPurchaseToDate(''); }}
            className="px-3 py-2 text-sm text-red-800 hover:bg-red-50 rounded-lg font-medium"
          >
            Reset
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {purchasesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <div className="w-8 h-8 border-4 border-red-800 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-semibold">Loading purchase history...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex p-4 bg-gray-100 rounded-full text-gray-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">No Purchase Records Found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {(purchases || []).length === 0
                  ? 'Get started by adding your first chemical purchase entry to record stock and track installments.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Purchase Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Purchase Date</th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Number</th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Amount</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice Attachment</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPurchases.map((p) => {
                  const balance = Math.max(0, p.totalAmount - p.paidAmount);
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {formatDate(p.purchaseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-700">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {p.supplierId?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">
                        ₹{p.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                        ₹{p.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">
                        ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(p.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {p.invoiceImage ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onPreview(p.invoiceImage, `Invoice: ${p.invoiceNumber}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> View
                            </button>
                            <button
                              onClick={() => onTableImageDelete(p._id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete invoice image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => onTableImageUpload(e, p._id)}
                              disabled={tableUploadingId === p._id}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                              type="button"
                              disabled={tableUploadingId === p._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
                            >
                              <Upload className="w-3 h-3" /> {tableUploadingId === p._id ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => onOpenInstallments(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Installments
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
