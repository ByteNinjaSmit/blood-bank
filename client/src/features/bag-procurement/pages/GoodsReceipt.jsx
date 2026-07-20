import { useState } from 'react';
import { PackageCheck, Plus, X, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import {
  useGRNList,
  useUpdateGRN,
  useVendorList,
  usePOList,
} from '../queries';
import { bagProcurementApi } from '../api';
import { toast } from 'sonner';
import ExportExcelDropdown from '@/components/shared/ExportExcelDropdown';
import IframePreviewModal from '@/components/shared/IframePreviewModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { exportProcurementGRN } from '@/utils/excelExportHelper';
import GRNDrawer from '../components/goods-receipt/GRNDrawer';
import ViewGRNModal from '../components/goods-receipt/ViewGRNModal';

const uploadFile = bagProcurementApi.upload.file;
const deleteFile = bagProcurementApi.upload.remove;

export default function GoodsReceipt() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editGrn, setEditGrn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { data, isLoading, refetch, isFetching } = useGRNList({
    status: statusFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const { data: poData } = usePOList({});
  const { data: vendorData } = useVendorList({});

  const [viewGrn, setViewGrn] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);

  const mapGRNForExport = (items, posList, vendorsList) => {
    return items.map(g => {
      const po = posList.find(p => (p._id ?? p.id) === g.poId);
      const vendorName = g.vendorName ?? vendorsList.find(v => (v._id ?? v.id) === po?.vendorId)?.name ?? '—';
      const receivedQty = (g.batchLines ?? []).reduce((sum, b) => sum + (b.quantityReceived || 0), 0);
      return {
        grnNumber: g.grnNumber,
        invoiceNo: g.invoiceNo,
        receivedDate: g.receivedDate || g.createdAt,
        poNumber: po?.poNumber || '—',
        vendorName: vendorName,
        receivedQty: receivedQty,
        status: g.status,
        batchLines: g.batchLines ?? [],
      };
    });
  };

  const handleExportExcel = async (_exportAll = false) => {
    try {
      setExcelLoading(true);
      const dataToExport = mapGRNForExport(grns, pos, vendors);

      if (dataToExport.length === 0) {
        toast.info("No goods receipt notes to export");
        return;
      }

      await exportProcurementGRN(dataToExport);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  // Table row upload state
  const updateGRNMutation = useUpdateGRN();
  const [tableUploadingId, setTableUploadingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  const grns = data?.items ?? data?.goodsReceipts ?? (Array.isArray(data) ? data : []);
  const pos = poData?.items ?? poData?.purchaseOrders ?? (Array.isArray(poData) ? poData : []);
  const vendors = vendorData?.items ?? vendorData?.vendors ?? (Array.isArray(vendorData) ? vendorData : []);

  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Table row image upload
  const handleTableImageUpload = async (e, grnId) => {
    const file = e.target.files[0];
    if (!file) return;
    setTableUploadingId(grnId);
    try {
      const res = await uploadFile(file, 'bagorderinvoice');
      await updateGRNMutation.mutateAsync({
        id: grnId,
        data: { invoiceImage: res.url },
      });
      toast.success('Invoice uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setTableUploadingId(null);
    }
  };

  // Table row delete image
  const handleTableImageDelete = async (grnId) => {
    const grn = grns.find(g => (g._id ?? g.id) === grnId);
    if (!grn || !grn.invoiceImage) return;

    setConfirmDelete({
      isOpen: true,
      title: 'Delete Invoice Image?',
      message: `Are you sure you want to delete the invoice image for GRN No: ${grn.invoiceNo}? This action is permanent and cannot be undone.`,
      onConfirm: async () => {
        try {
          try {
            await deleteFile(grn.invoiceImage);
          } catch (err) {
            console.error('S3 delete failed:', err);
          }
          await updateGRNMutation.mutateAsync({
            id: grnId,
            data: { invoiceImage: null },
          });
          toast.success('Invoice image deleted successfully');
        } catch (err) {
          toast.error(err.message || 'Failed to delete invoice image');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <PackageCheck className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Goods Receipt (GRN)</h1>
              <p className="text-gray-500 text-sm">Inward Stock Register</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
            <button onClick={() => { setEditGrn(null); setShowDrawer(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-white text-sm font-semibold rounded-lg hover:bg-orange-900 shadow-sm">
              <Plus className="w-4 h-4" /> Create GRN
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Received From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Received To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          {(statusFilter || fromDate || toDate) && (
            <button onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); }}
              className="px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 rounded-lg font-medium">
              Reset
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Invoice No', 'Vendor', 'Received Date', 'Quantities (Boxes)', 'Invoice Document', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">Loading...</td></tr>
                ) : grns.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                ) : grns.map((g) => {
                  const doubleBags = (g.batchLines ?? []).filter(b => b.bagType === 'DOUBLE').reduce((sum, b) => sum + b.quantityReceived, 0);
                  const tripleBags = (g.batchLines ?? []).filter(b => b.bagType === 'TRIPLE').reduce((sum, b) => sum + b.quantityReceived, 0);
                  const dbBoxes = Number((doubleBags / 45).toFixed(2));
                  const tbBoxes = Number((tripleBags / 45).toFixed(2));

                  return (
                    <tr key={g._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{g.invoiceNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{g.vendorName ?? vendors.find(v => (v._id ?? v.id) === g.purchaseOrder?.vendorId)?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(g.receivedDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[9px] bg-orange-50 text-orange-700 px-1 py-0.2 rounded border border-orange-200 min-w-[20px] text-center">DB</span>
                            <span className="font-medium text-gray-800 font-mono">{dbBoxes} Box{dbBoxes !== 1 ? 'es' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[9px] bg-red-55 text-red-700 px-1 py-0.2 rounded border border-red-200 bg-red-50 min-w-[20px] text-center">TB</span>
                            <span className="font-medium text-gray-800 font-mono">{tbBoxes} Box{tbBoxes !== 1 ? 'es' : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {g.invoiceImage ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setPreviewUrl(g.invoiceImage);
                                setPreviewTitle(`Invoice: ${g.invoiceNo}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-850 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-orange-700 shrink-0" /> View
                            </button>
                            <button
                              onClick={() => handleTableImageDelete(g._id ?? g.id)}
                              className="p-1 text-gray-400 hover:text-red-655 hover:bg-red-50 rounded transition-colors"
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
                              onChange={(e) => handleTableImageUpload(e, g._id ?? g.id)}
                              disabled={tableUploadingId === (g._id ?? g.id)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                              type="button"
                              disabled={tableUploadingId === (g._id ?? g.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
                            >
                              <Upload className="w-3 h-3 text-gray-400" /> {tableUploadingId === (g._id ?? g.id) ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setViewGrn(g); setShowViewModal(true); }}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors">
                            View
                          </button>
                          <button onClick={() => { setEditGrn(g); setShowDrawer(true); }}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDrawer && <GRNDrawer onClose={() => { setShowDrawer(false); setEditGrn(null); }} pos={pos} vendors={vendors} grnToEdit={editGrn} />}
      {showViewModal && (
        <ViewGRNModal
          onClose={() => { setShowViewModal(false); setViewGrn(null); }}
          grn={viewGrn}
          vendors={vendors}
          pos={pos}
          onViewInvoice={(url, title) => {
            setPreviewUrl(url);
            setPreviewTitle(title);
          }}
        />
      )}
      <IframePreviewModal
        isOpen={!!previewUrl}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewUrl('')}
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
