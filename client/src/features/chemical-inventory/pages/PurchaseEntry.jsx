import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import {
  useChemicalList,
  useSupplierList,
  useManufacturerList,
  useCreateLot,
} from '../queries';
import { toast } from 'sonner';

export default function PurchaseEntry() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: chemicals } = useChemicalList();
  const { data: suppliers } = useSupplierList();
  const { data: manufacturers } = useManufacturerList();

  const createLot = useCreateLot();

  const [invoiceForm, setInvoiceForm] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    supplierId: '',
    remarks: '',
  });

  const [items, setItems] = useState([
    {
      chemicalId: '',
      manufacturer: '',
      packSizeMl: '',
      batchNumber: '',
      expiryDate: '',
      qtyPurchased: '',
      costPerUnit: '',
      cgstAmount: '',
      sgstAmount: '',
    },
  ]);

  const [activeMfgIndex, setActiveMfgIndex] = useState(-1);

  // Pre-fill first item chemicalId if navigated from Dashboard alert
  useEffect(() => {
    if (location.state?.chemicalId) {
      setItems((prev) => {
        const copy = [...prev];
        copy[0] = { ...copy[0], chemicalId: location.state.chemicalId };
        return copy;
      });
    }
  }, [location.state]);

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoiceForm((f) => ({ ...f, [name]: value }));
  };

  const handleItemChange = (idx, name, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [name]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        chemicalId: '',
        manufacturer: '',
        packSizeMl: '',
        batchNumber: '',
        expiryDate: '',
        qtyPurchased: '',
        costPerUnit: '',
        cgstAmount: '',
        sgstAmount: '',
      },
    ]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!invoiceForm.invoiceNumber.trim() || !invoiceForm.supplierId) {
      toast.error('Please fill in all invoice details');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        !item.chemicalId ||
        !item.manufacturer.trim() ||
        !item.expiryDate ||
        item.qtyPurchased === '' ||
        item.costPerUnit === ''
      ) {
        toast.error(`Please fill in all required fields for Item #${i + 1}`);
        return;
      }
    }

    const payload = {
      purchaseDate: new Date(invoiceForm.purchaseDate),
      invoiceNumber: invoiceForm.invoiceNumber.trim(),
      supplierId: invoiceForm.supplierId,
      remarks: invoiceForm.remarks.trim(),
      items: items.map((item) => {
        const qty = Number(item.qtyPurchased) || 0;
        const rate = Number(item.costPerUnit) || 0;
        const subtotal = qty * rate;
        const cgstAmt = Number(item.cgstAmount) || 0;
        const sgstAmt = Number(item.sgstAmount) || 0;
        const cgstPercent = subtotal > 0 ? (cgstAmt / subtotal) * 100 : 0;
        const sgstPercent = subtotal > 0 ? (sgstAmt / subtotal) * 100 : 0;

        return {
          chemicalId: item.chemicalId,
          manufacturer: item.manufacturer.trim(),
          batchNumber: item.batchNumber ? item.batchNumber.trim() : undefined,
          expiryDate: new Date(item.expiryDate),
          qtyPurchased: qty,
          costPerUnit: rate,
          totalCost: subtotal,
          packSizeMl: item.packSizeMl ? Number(item.packSizeMl) : null,
          cgstAmount: cgstAmt,
          sgstAmount: sgstAmt,
          cgstPercent,
          sgstPercent,
          totalAmount: subtotal + cgstAmt + sgstAmt,
        };
      }),
    };

    createLot.mutateAsync(payload).then(() => {
      toast.success('Stock purchase recorded and lots added successfully!');
      navigate('/chemical-inventory/dashboard');
    }).catch((err) => {
      toast.error(err.message || 'Failed to record purchase entry');
    });
  };

  // Grand Total Summaries
  const subTotalSum = items.reduce((acc, item) => acc + (Number(item.qtyPurchased) || 0) * (Number(item.costPerUnit) || 0), 0);
  const totalCgstSum = items.reduce((acc, item) => acc + (Number(item.cgstAmount) || 0), 0);
  const totalSgstSum = items.reduce((acc, item) => acc + (Number(item.sgstAmount) || 0), 0);
  const grandTotalSum = subTotalSum + totalCgstSum + totalSgstSum;

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
  const tableInputClass = 'w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white';

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/chemical-inventory/dashboard')}
          className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Stock Entry</h1>
          <p className="text-sm text-gray-500 font-semibold font-medium">Log new chemical purchases and build stock records</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
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

          <div className="border border-gray-100 rounded-lg w-full">
            <table className="w-full divide-y divide-gray-100 text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[18%] rounded-tl-lg">Item Name *</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[15%]">Manufacturer *</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">Pack in mL</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[10%]">Batch No</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[12%]">Expiry Date *</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[7%] text-center">Qty *</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">Rate (₹) *</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">CGST Amt</th>
                  <th className="px-1 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[9%]">SGST Amt</th>
                  <th className="px-1 py-2 text-right text-[11px] font-bold text-gray-500 uppercase w-[12%]">Total Amount</th>
                  <th className="px-1 py-2 text-center text-xs font-bold text-gray-500 uppercase w-[4%] rounded-tr-lg"></th>
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
                    <tr key={idx} className="hover:bg-gray-50/50">
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

                      {/* Pack in mL */}
                      <td className="px-1 py-1.5">
                        <input
                          type="number"
                          min="1"
                          value={item.packSizeMl}
                          onChange={(e) => handleItemChange(idx, 'packSizeMl', e.target.value)}
                          className={tableInputClass}
                          placeholder="Pack mL"
                        />
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
            onClick={() => navigate('/chemical-inventory/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createLot.isPending}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-800 rounded-lg hover:bg-red-900 shadow-sm disabled:opacity-60 transition-colors"
          >
            {createLot.isPending ? 'Logging Purchase…' : 'Log Purchase Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
