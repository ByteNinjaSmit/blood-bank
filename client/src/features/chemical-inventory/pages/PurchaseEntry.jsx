import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, X, CreditCard, Calendar, ShoppingBag, FileText, CheckCircle2, AlertCircle, Clock, Upload, Image as ImageIcon, AlertTriangle, ShoppingCart } from 'lucide-react';
import {
  useChemicalList,
  useSupplierList,
  useManufacturerList,
  useCreateLot,
  usePurchaseList,
  useUpdatePurchasePayments,
  useUpdatePurchase,
} from '../queries';
import { apiClient, unwrap } from '@/core/api-client';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import { exportChemicalPurchase } from '@/utils/excelExportHelper';
import { chemicalInventoryApi } from '../api';

const uploadFile = (file, folder) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/api/v2/upload${folder ? `?folder=${folder}` : ''}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(unwrap);
};

const deleteFile = (url) => {
  return apiClient.delete('/api/v2/upload', {
    params: { url },
  }).then(unwrap);
};

function IframePreviewModal({ isOpen, url, title, onClose }) {
  if (!isOpen || !url) return null;
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url) || !url.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm transition-opacity">
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
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-205"
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

function ConfirmDeleteModal({ isOpen, title, message, onConfirm, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">{title || 'Delete Confirmation'}</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{message || 'Are you sure you want to delete this?'}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseEntry() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: chemicals } = useChemicalList();
  const { data: suppliers } = useSupplierList();
  const { data: manufacturers } = useManufacturerList();
  const { data: purchases, isLoading: purchasesLoading } = usePurchaseList();

  const createLot = useCreateLot();
  const updatePaymentsMutation = useUpdatePurchasePayments();
  const updatePurchaseMutation = useUpdatePurchase();

  const [showForm, setShowForm] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  // Installments state inside modal
  const [tempInstallments, setTempInstallments] = useState([]);
  const [newInst, setNewInst] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], remarks: '' });

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [tableUploadingId, setTableUploadingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  // Iframe Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Invoice Form state
  const [invoiceForm, setInvoiceForm] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    supplierId: '',
    remarks: '',
    invoiceImage: '',
  });

  const [items, setItems] = useState([
    {
      chemicalId: '',
      manufacturer: '',
      packSizeMl: '',
      packType: 'ML',
      unitsPerPack: 96,
      batchNumber: '',
      expiryDate: '',
      qtyPurchased: '',
      costPerUnit: '',
      cgstAmount: '',
      sgstAmount: '',
    },
  ]);

  const [excelLoading, setExcelLoading] = useState(false);

  // Purchase history filters
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState('');
  const [purchaseFromDate, setPurchaseFromDate] = useState('');
  const [purchaseToDate, setPurchaseToDate] = useState('');

  const filteredPurchases = (purchases || []).filter((p) => {
    if (purchaseSearch.trim()) {
      const q = purchaseSearch.trim().toLowerCase();
      const invoiceMatch = (p.invoiceNumber || '').toLowerCase().includes(q);
      const supplierMatch = (p.supplierId?.name || '').toLowerCase().includes(q);
      if (!invoiceMatch && !supplierMatch) return false;
    }
    if (purchaseSupplierFilter && (p.supplierId?._id ?? p.supplierId?.id ?? p.supplierId) !== purchaseSupplierFilter) return false;
    if (purchaseFromDate && new Date(p.purchaseDate) < new Date(purchaseFromDate)) return false;
    if (purchaseToDate && new Date(p.purchaseDate) > new Date(`${purchaseToDate}T23:59:59`)) return false;
    return true;
  });

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let rawPurchases = [];
      if (exportAll) {
        rawPurchases = await chemicalInventoryApi.purchase.list();
        rawPurchases = rawPurchases?.items || rawPurchases || [];
      } else {
        rawPurchases = purchases || [];
      }

      if (rawPurchases.length === 0) {
        toast.info("No purchases to export");
        return;
      }

      // Map to invoice-level records with nested items (expanded to
      // multi-line-under-single-serial inside the export helper).
      const dataToExport = rawPurchases.map((p) => ({
        invoiceNumber: p.invoiceNumber || '—',
        purchaseDate: p.purchaseDate,
        supplierName: p.supplierId?.name || '—',
        totalAmount: p.totalAmount || 0,
        paidAmount: p.paidAmount || 0,
        balance: Math.max(0, (p.totalAmount || 0) - (p.paidAmount || 0)),
        paymentStatus: p.paymentStatus || '—',
        items: (p.items || []).map((item) => ({
          chemicalName: item.chemicalId?.name || '—',
          manufacturer: item.manufacturer || '—',
          packType: item.packType || '—',
          batchNumber: item.batchNumber || '—',
          expiryDate: item.expiryDate,
          quantity: item.qtyPurchased || 0,
          unitPrice: item.costPerUnit || 0,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,
          itemTotal: item.totalAmount || 0,
        })),
      }));

      await exportChemicalPurchase(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  const [activeMfgIndex, setActiveMfgIndex] = useState(-1);

  // Pre-fill and toggle form if navigated from Dashboard with alert
  useEffect(() => {
    if (location.state?.chemicalId) {
      setItems((prev) => {
        const copy = [...prev];
        copy[0] = { ...copy[0], chemicalId: location.state.chemicalId };
        return copy;
      });
      setShowForm(true);
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
        packType: 'ML',
        unitsPerPack: 96,
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

  // Form image upload
  const handleFormImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, 'chemicalorderinvoice');
      setInvoiceForm((prev) => ({ ...prev, invoiceImage: res.url }));
      toast.success('Invoice uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Table row image upload
  const handleTableImageUpload = async (e, purchaseId) => {
    const file = e.target.files[0];
    if (!file) return;
    setTableUploadingId(purchaseId);
    try {
      const res = await uploadFile(file, 'chemicalorderinvoice');
      await updatePurchaseMutation.mutateAsync({
        id: purchaseId,
        data: { invoiceImage: res.url },
      });
      toast.success('Invoice updated successfully');
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setTableUploadingId(null);
    }
  };

  // Table row delete image
  const handleTableImageDelete = async (purchaseId) => {
    const purchase = purchases?.find((p) => (p._id ?? p.id) === purchaseId);
    if (!purchase || !purchase.invoiceImage) return;

    setConfirmDelete({
      isOpen: true,
      title: 'Delete Invoice Image?',
      message: `Are you sure you want to delete the invoice image for purchase invoice: ${purchase.invoiceNumber}? This action is permanent and cannot be undone.`,
      onConfirm: async () => {
        try {
          try {
            await deleteFile(purchase.invoiceImage);
          } catch (err) {
            console.error('S3 delete failed:', err);
          }
          await updatePurchaseMutation.mutateAsync({
            id: purchaseId,
            data: { invoiceImage: null },
          });
          toast.success('Invoice image deleted successfully');
        } catch (err) {
          toast.error(err.message || 'Failed to delete invoice image');
        }
      }
    });
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
      invoiceImage: invoiceForm.invoiceImage || undefined,
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
          packType: item.packType || 'ML',
          unitsPerPack: item.packType === 'VIALS' || item.packType === 'BOX' ? Number(item.unitsPerPack) || 96 : null,
          cgstAmount: cgstAmt,
          sgstAmount: sgstAmt,
          cgstPercent,
          sgstPercent,
          totalAmount: subtotal + cgstAmt + sgstAmt,
        };
      }),
    };

    createLot.mutateAsync(payload).then(() => {
      toast.success('Stock purchase recorded successfully!');
      // Reset form state
      setInvoiceForm({
        purchaseDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        supplierId: '',
        remarks: '',
        invoiceImage: '',
      });
      setItems([
        {
          chemicalId: '',
          manufacturer: '',
          packSizeMl: '',
          packType: 'ML',
          unitsPerPack: 96,
          batchNumber: '',
          expiryDate: '',
          qtyPurchased: '',
          costPerUnit: '',
          cgstAmount: '',
          sgstAmount: '',
        },
      ]);
      setShowForm(false);
    }).catch((err) => {
      toast.error(err.message || 'Failed to record purchase entry');
    });
  };

  // Open installment modal
  const openInstallments = (purchase) => {
    setSelectedPurchase(purchase);
    setTempInstallments(purchase.installments || []);
    setNewInst({ amount: '', paymentDate: new Date().toISOString().split('T')[0], remarks: '' });
    setShowInstallmentModal(true);
  };

  const handleAddInstallment = () => {
    if (!newInst.amount || Number(newInst.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!newInst.paymentDate) {
      toast.error('Please enter payment date');
      return;
    }
    setTempInstallments((prev) => [
      ...prev,
      {
        amount: Number(newInst.amount),
        paymentDate: newInst.paymentDate,
        remarks: newInst.remarks.trim(),
      },
    ]);
    setNewInst({ amount: '', paymentDate: new Date().toISOString().split('T')[0], remarks: '' });
  };

  const handleRemoveInstallment = (idx) => {
    setTempInstallments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveInstallments = () => {
    if (!selectedPurchase) return;

    updatePaymentsMutation.mutateAsync({
      id: selectedPurchase._id,
      installments: tempInstallments,
    }).then(() => {
      toast.success('Installment payments updated successfully!');
      setShowInstallmentModal(false);
    }).catch((err) => {
      toast.error(err.message || 'Failed to update installments');
    });
  };

  // Grand Total Summaries for new entry form
  const subTotalSum = items.reduce((acc, item) => acc + (Number(item.qtyPurchased) || 0) * (Number(item.costPerUnit) || 0), 0);
  const totalCgstSum = items.reduce((acc, item) => acc + (Number(item.cgstAmount) || 0), 0);
  const totalSgstSum = items.reduce((acc, item) => acc + (Number(item.sgstAmount) || 0), 0);
  const grandTotalSum = subTotalSum + totalCgstSum + totalSgstSum;

  const currentPaidAmount = tempInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const fieldClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
  const tableInputClass = 'w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
              } else {
                navigate('/chemical-inventory/dashboard');
              }
            }}
            className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <ShoppingCart className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {showForm ? 'Purchase Stock Entry' : 'Chemical Purchase History'}
            </h1>
            <p className="text-gray-500 text-sm">
              {showForm
                ? 'Log new chemical purchases and build stock records'
                : 'Track chemical purchase invoices, total costs, and payment installments'}
            </p>
          </div>
        </div>

        {!showForm && (
          <div className="flex items-center gap-2">
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Purchase Entry
            </button>
          </div>
        )}
      </div>

      {!showForm ? (
        /* Purchase List View */
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
                onClick={() => setShowForm(true)}
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
                                onClick={() => {
                                  setPreviewUrl(p.invoiceImage);
                                  setPreviewTitle(`Invoice: ${p.invoiceNumber}`);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                              >
                                <ImageIcon className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={() => handleTableImageDelete(p._id)}
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
                                onChange={(e) => handleTableImageUpload(e, p._id)}
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
                            onClick={() => openInstallments(p)}
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
      ) : (
        /* Purchase Stock Entry Form View */
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
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Invoice Image Attachment</label>
                {invoiceForm.invoiceImage ? (
                  <div className="inline-flex items-center gap-2 p-2 px-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <ImageIcon className="w-4 h-4 text-red-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(invoiceForm.invoiceImage);
                        setPreviewTitle('Invoice Attachment Draft');
                      }}
                      className="font-semibold text-red-800 hover:underline"
                    >
                      View uploaded invoice draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDelete({
                          isOpen: true,
                          title: 'Delete Invoice Image?',
                          message: 'Are you sure you want to delete this invoice image? This will permanently remove the invoice attachment from storage.',
                          onConfirm: async () => {
                            try {
                              await deleteFile(invoiceForm.invoiceImage);
                              toast.success('Invoice image deleted from S3');
                            } catch (err) {
                              console.error('S3 delete failed:', err);
                              toast.error('Failed to delete invoice image from S3');
                            }
                            setInvoiceForm((prev) => ({ ...prev, invoiceImage: '' }));
                          }
                        });
                      }}
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
                      onChange={handleFormImageUpload}
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
              onClick={() => setShowForm(false)}
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
      )}

      {/* Installment Payments Modal */}
      {showInstallmentModal && selectedPurchase && (
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
                onClick={() => setShowInstallmentModal(false)}
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
                onClick={() => setShowInstallmentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 bg-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveInstallments}
                disabled={updatePaymentsMutation.isPending}
                className="px-5 py-2 text-xs font-bold text-white bg-red-800 rounded-lg hover:bg-red-900 transition-colors shadow-sm disabled:opacity-60"
              >
                {updatePaymentsMutation.isPending ? 'Saving...' : 'Save Payments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Central Iframe Viewer Modal */}
      <IframePreviewModal
        isOpen={Boolean(previewUrl)}
        url={previewUrl}
        title={previewTitle}
        onClose={() => {
          setPreviewUrl('');
          setPreviewTitle('');
        }}
      />
      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onClose={() => setConfirmDelete({ isOpen: false, onConfirm: null, title: '', message: '' })}
      />
    </div>
  );
}
