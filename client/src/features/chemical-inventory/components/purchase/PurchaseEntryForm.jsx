import { Plus, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';

export default function PurchaseEntryForm({
  invoiceForm,
  handleInvoiceChange,
  uploading,
  onImageUpload,
  onImageView,
  onImageDelete,
  items,
  handleItemChange,
  handleAddItem,
  handleRemoveItem,
  chemicals,
  suppliers,
  manufacturers,
  activeMfgIndex,
  setActiveMfgIndex,
  fieldClass,
  tableInputClass,
  subTotalSum,
  totalCgstSum,
  totalSgstSum,
  grandTotalSum,
  onSubmit,
  onFormKeyDown,
  onFormChange,
  onCancel,
  submitting,
}) {
  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} onChange={onFormChange} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Invoice Information */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purchase Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Purchase Date *</label>
            <input required type="date" name="purchaseDate" value={invoiceForm.purchaseDate} onChange={handleInvoiceChange} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Invoice Number *</label>
            <input required name="invoiceNumber" value={invoiceForm.invoiceNumber} onChange={handleInvoiceChange} className={fieldClass} placeholder="e.g. INV-1002" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Supplier *</label>
            <select required name="supplierId" value={invoiceForm.supplierId} onChange={handleInvoiceChange} className={`${fieldClass} bg-white`}>
              <option value="">Select Supplier...</option>
              {(suppliers || []).map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1 md:col-span-3">
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Invoice Image Attachment</label>
            {invoiceForm.invoiceImage ? (
              <div className="inline-flex items-center gap-2 p-2 px-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                <ImageIcon className="w-4 h-4 text-red-800" />
                <button
                  type="button"
                  onClick={() => onImageView(invoiceForm.invoiceImage, 'Invoice Attachment Draft')}
                  className="font-semibold text-red-800 hover:underline"
                >
                  View uploaded invoice draft
                </button>
                <button
                  type="button"
                  onClick={onImageDelete}
                  className="p-1 hover:bg-red-100 rounded text-red-850 text-red-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
                >
                  <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Invoice Image'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Chemical Specification Multi-items table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purchased Items / Chemicals</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white text-xs font-bold rounded hover:bg-red-900 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        <div className="border border-gray-100 rounded-lg w-full overflow-x-auto">
          <table className="w-full divide-y divide-gray-100 text-sm min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[18%]">Item Name *</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[15%]">Manufacturer *</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[11%]">Pack Type</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[10%]">Batch No</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[12%]">Expiry Date *</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[7%] text-center">Qty *</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">Rate (₹) *</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">CGST Amt</th>
                <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">SGST Amt</th>
                <th className="px-1 py-2 text-right text-[11px] font-bold text-gray-500 uppercase w-[12%]">Total Amount</th>
                <th className="px-1 py-2 text-center text-xs font-bold text-gray-500 uppercase w-[4%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((item, idx) => {
                const qty = Number(item.qtyPurchased) || 0;
                const rate = Number(item.costPerUnit) || 0;
                const subtotal = qty * rate;
                const cgstAmt = Number(item.cgstAmount) || 0;
                const sgstAmt = Number(item.sgstAmount) || 0;
                const cgstPercent = subtotal > 0 ? ((cgstAmt / subtotal) * 100).toFixed(1) : '0.0';
                const sgstPercent = subtotal > 0 ? ((sgstAmt / subtotal) * 100).toFixed(1) : '0.0';
                const total = subtotal + cgstAmt + sgstAmt;

                return (
                  <tr key={idx} className="hover:bg-gray-55/30">
                    {/* Item Name */}
                    <td className="px-1 py-1.5">
                      <select
                        required
                        value={item.chemicalId}
                        onChange={(e) => handleItemChange(idx, 'chemicalId', e.target.value)}
                        className={`${tableInputClass} truncate`}
                      >
                        <option value="">Select Chemical...</option>
                        {(chemicals || []).map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Manufacturer */}
                    <td className={`px-1 py-1.5 relative ${activeMfgIndex === idx ? 'z-10' : ''}`}>
                      <input
                        required
                        type="text"
                        value={item.manufacturer}
                        onChange={(e) => {
                          handleItemChange(idx, 'manufacturer', e.target.value);
                          setActiveMfgIndex(idx);
                        }}
                        onFocus={() => setActiveMfgIndex(idx)}
                        onBlur={() => {
                          setTimeout(() => setActiveMfgIndex(-1), 250);
                        }}
                        className={tableInputClass}
                        placeholder="Manufacturer..."
                      />
                      {activeMfgIndex === idx && (manufacturers || []).length > 0 && (
                        <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 mt-1 rounded shadow-lg max-h-32 overflow-y-auto">
                          {(manufacturers || [])
                            .filter((mfg) =>
                              mfg.name.toLowerCase().includes((item.manufacturer || '').toLowerCase())
                            )
                            .map((mfg) => (
                              <button
                                key={mfg._id}
                                type="button"
                                onMouseDown={() => {
                                  handleItemChange(idx, 'manufacturer', mfg.name);
                                  setActiveMfgIndex(-1);
                                }}
                                className="w-full text-left px-2 py-1 text-xs hover:bg-red-50 hover:text-red-900 transition-colors"
                              >
                                {mfg.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </td>

                    {/* Pack Type */}
                    <td className="px-1 py-1.5">
                      <div className="space-y-0.5">
                        <select
                          value={item.packType || 'ML'}
                          onChange={(e) => handleItemChange(idx, 'packType', e.target.value)}
                          className={`${tableInputClass} bg-white`}
                        >
                          <option value="ML">mL (Liquid)</option>
                          <option value="VIALS">Vials</option>
                          <option value="BOX">Box</option>
                          <option value="TUBE">Tube</option>
                        </select>
                        {item.packType === 'ML' ? (
                          <input
                            type="number"
                            min="1"
                            value={item.packSizeMl}
                            onChange={(e) => handleItemChange(idx, 'packSizeMl', e.target.value)}
                            className={tableInputClass}
                            placeholder="Pack mL"
                          />
                        ) : (item.packType === 'VIALS' || item.packType === 'BOX') ? (
                          <input
                            type="number"
                            min="1"
                            value={item.unitsPerPack}
                            onChange={(e) => handleItemChange(idx, 'unitsPerPack', e.target.value)}
                            className={tableInputClass}
                            placeholder="Vials/pack"
                            title="Number of vials in this box (editable)"
                          />
                        ) : null}
                      </div>
                    </td>

                    {/* Batch No */}
                    <td className="px-1 py-1.5">
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                        className={tableInputClass}
                        placeholder="Batch"
                      />
                    </td>

                    {/* Expiry Date */}
                    <td className="px-1 py-1.5">
                      <input
                        required
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                        className={tableInputClass}
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-1 py-1.5">
                      <input
                        required
                        type="number"
                        min="1"
                        value={item.qtyPurchased}
                        onChange={(e) => handleItemChange(idx, 'qtyPurchased', e.target.value)}
                        className={`${tableInputClass} text-center`}
                      />
                    </td>

                    {/* Rate */}
                    <td className="px-1 py-1.5">
                      <input
                        required
                        type="number"
                        min="0"
                        step="any"
                        value={item.costPerUnit}
                        onChange={(e) => handleItemChange(idx, 'costPerUnit', e.target.value)}
                        className={tableInputClass}
                      />
                    </td>

                    {/* CGST Amt & Percentage */}
                    <td className="px-1 py-1.5">
                      <div className="space-y-0.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.cgstAmount}
                          onChange={(e) => handleItemChange(idx, 'cgstAmount', e.target.value)}
                          className={tableInputClass}
                        />
                        <div className="text-[9px] text-gray-500 font-semibold px-0.5 text-center">({cgstPercent}%)</div>
                      </div>
                    </td>

                    {/* SGST Amt & Percentage */}
                    <td className="px-1 py-1.5">
                      <div className="space-y-0.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.sgstAmount}
                          onChange={(e) => handleItemChange(idx, 'sgstAmount', e.target.value)}
                          className={tableInputClass}
                        />
                        <div className="text-[9px] text-gray-500 font-semibold px-0.5 text-center">({sgstPercent}%)</div>
                      </div>
                    </td>

                    {/* Total Amount Display */}
                    <td className="px-1 py-1.5 text-right font-bold text-gray-800 text-xs whitespace-nowrap">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Remove Row Button */}
                    <td className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary and Remarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Remarks</label>
          <textarea rows="4" name="remarks" value={invoiceForm.remarks} onChange={handleInvoiceChange} className={fieldClass} placeholder="Add invoice purchase remarks..." />
        </div>

        <div className="bg-gray-50 rounded-xl p-6 space-y-3 border border-gray-100 shadow-inner flex flex-col justify-center">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Totals Summary</h4>
          <div className="flex justify-between text-sm text-gray-600">
            <span className="font-semibold">Sub Total:</span>
            <span className="font-bold">₹{subTotalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span className="font-semibold">Total CGST:</span>
            <span className="font-bold text-gray-700">₹{totalCgstSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span className="font-semibold">Total SGST:</span>
            <span className="font-bold text-gray-700">₹{totalSgstSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between text-base text-red-950 font-bold">
            <span>Grand Total:</span>
            <span className="text-lg">₹{grandTotalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Form Submission */}
      <div className="pt-6 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 shadow-sm disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Logging Purchase…' : 'Log Purchase Invoice'}
        </button>
      </div>
    </form>
  );
}
