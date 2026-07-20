import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react';
import {
  useChemicalList,
  useSupplierList,
  useManufacturerList,
  useCreateLot,
  usePurchaseList,
  useUpdatePurchasePayments,
  useUpdatePurchase,
} from '../queries';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import IframePreviewModal from '@/components/shared/IframePreviewModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { exportChemicalPurchase } from '@/utils/excelExportHelper';
import { createFormEnterNavHandlers } from '@/hooks/useFormEnterNav';
import { chemicalInventoryApi } from '../api';
import { uploadFile, deleteFile } from '../components/purchase/upload-helpers';
import PurchaseHistoryTable from '../components/purchase/PurchaseHistoryTable';
import PurchaseEntryForm from '../components/purchase/PurchaseEntryForm';
import InstallmentModal from '../components/purchase/InstallmentModal';

export default function PurchaseEntry() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: chemicals } = useChemicalList();
  const { data: suppliers } = useSupplierList();
  const { data: manufacturers } = useManufacturerList();
  const { data: purchases, isLoading: purchasesLoading, isFetching: purchasesFetching, refetch: refetchPurchases } = usePurchaseList();

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

  // Form image delete (draft invoice attachment)
  const handleFormImageDelete = () => {
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

  const { onKeyDown: handleFormKeyDown, onChange: handleFormEnterNavChange } = createFormEnterNavHandlers();

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
            <button
              type="button"
              onClick={() => refetchPurchases()}
              disabled={purchasesFetching}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${purchasesFetching ? 'animate-spin' : ''}`} />
            </button>
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
        <PurchaseHistoryTable
          purchaseSearch={purchaseSearch}
          setPurchaseSearch={setPurchaseSearch}
          purchaseSupplierFilter={purchaseSupplierFilter}
          setPurchaseSupplierFilter={setPurchaseSupplierFilter}
          purchaseFromDate={purchaseFromDate}
          setPurchaseFromDate={setPurchaseFromDate}
          purchaseToDate={purchaseToDate}
          setPurchaseToDate={setPurchaseToDate}
          suppliers={suppliers}
          purchasesLoading={purchasesLoading}
          filteredPurchases={filteredPurchases}
          purchases={purchases}
          formatDate={formatDate}
          onAddNew={() => setShowForm(true)}
          tableUploadingId={tableUploadingId}
          onTableImageUpload={handleTableImageUpload}
          onTableImageDelete={handleTableImageDelete}
          onPreview={(url, title) => { setPreviewUrl(url); setPreviewTitle(title); }}
          onOpenInstallments={openInstallments}
        />
      ) : (
        <PurchaseEntryForm
          invoiceForm={invoiceForm}
          handleInvoiceChange={handleInvoiceChange}
          uploading={uploading}
          onImageUpload={handleFormImageUpload}
          onImageView={(url, title) => { setPreviewUrl(url); setPreviewTitle(title); }}
          onImageDelete={handleFormImageDelete}
          items={items}
          handleItemChange={handleItemChange}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          chemicals={chemicals}
          suppliers={suppliers}
          manufacturers={manufacturers}
          activeMfgIndex={activeMfgIndex}
          setActiveMfgIndex={setActiveMfgIndex}
          fieldClass={fieldClass}
          tableInputClass={tableInputClass}
          subTotalSum={subTotalSum}
          totalCgstSum={totalCgstSum}
          totalSgstSum={totalSgstSum}
          grandTotalSum={grandTotalSum}
          onSubmit={handleSubmit}
          onFormKeyDown={handleFormKeyDown}
          onFormChange={handleFormEnterNavChange}
          onCancel={() => setShowForm(false)}
          submitting={createLot.isPending}
        />
      )}

      {/* Installment Payments Modal */}
      {showInstallmentModal && selectedPurchase && (
        <InstallmentModal
          selectedPurchase={selectedPurchase}
          tempInstallments={tempInstallments}
          newInst={newInst}
          setNewInst={setNewInst}
          currentPaidAmount={currentPaidAmount}
          formatDate={formatDate}
          fieldClass={fieldClass}
          handleAddInstallment={handleAddInstallment}
          handleRemoveInstallment={handleRemoveInstallment}
          handleSaveInstallments={handleSaveInstallments}
          isSaving={updatePaymentsMutation.isPending}
          onClose={() => setShowInstallmentModal(false)}
        />
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
