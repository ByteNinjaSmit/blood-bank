import { Loader2, Warehouse, MapPin, ArrowLeftRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/CustomModal";

export default function IssueViewModals({
  viewOpen, closeView, viewItem, status,
  storageViewOpen, setStorageViewOpen, storageViewItem, setStorageViewItem,
  thalViewOpen, setThalViewOpen, thalViewItem, setThalViewItem,
  diseaseLabel, formatDate, formatDateTime,
  bulk,
}) {
  const {
    bulkViewOpen, setBulkViewOpen, bulkViewItem, setBulkViewItem,
    bulkTransferComponentTotals, openCoverLetterPrompt, openTestingCertPrompt, openInvoicePrompt,
    deleteBulkConfirmOpen, setDeleteBulkConfirmOpen, deleteBulkTarget, setDeleteBulkTarget,
    deleteBulkReason, setDeleteBulkReason, deleteBulkSubmitting, handleDeleteBulkTransfer,
  } = bulk;
  return (
    <>
      <CustomModal open={viewOpen} onCancel={closeView} title={status === 'issued' ? 'Issued Component Details' : 'Reserved Component Details'} size="lg" hideFooter>
        {viewItem && (
          <div className="space-y-5 text-sm">
            {/* Donor & Collection Section */}
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3">Donor & Collection Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Donor Name</div>
                  <div className="font-bold text-gray-800">{viewItem?.bag?.donorName || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Donation Date</div>
                  <div className="font-semibold text-gray-850">
                    {formatDate(viewItem?.bag?.donationDate)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Segment No</div>
                  <div className="font-mono text-gray-700">{viewItem?.bag?.segmentNo || viewItem?.segmentNo || '—'}</div>
                </div>
              </div>
            </div>

            {/* Component & Bag Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Component & Bag Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Bag No</div>
                  <div className="font-bold text-gray-800 font-mono">{viewItem?.bag?.bagNo || viewItem?.bagNo || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component Type</div>
                  <div className="font-bold text-gray-800">
                    {viewItem?.component?.componentType || '—'} {viewItem?.component?.volumeMl ? `• ${viewItem.component.volumeMl} mL` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Component ID</div>
                  <div className="font-bold text-gray-800 font-mono">{viewItem?.component?.componentId || viewItem?.unitId || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Group</div>
                  <div className="font-bold text-red-700 text-base">
                    {viewItem?.bag ? `${viewItem.bag.bloodGroup} ${viewItem.bag.rh === 'Positive' ? '+' : viewItem.bag.rh === 'Negative' ? '-' : viewItem.bag.rh}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Expiry Date</div>
                  <div className="font-semibold text-gray-800">
                    {formatDate(viewItem?.component?.expiryDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Requisition & Issuance Section */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Requisition & Issuance Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Current Status</div>
                  <div className="font-bold text-gray-800 uppercase">{viewItem?.status || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Issue / Dispatch Date</div>
                  <div className="font-bold text-gray-800">
                    {formatDateTime(viewItem?.issuedAt)}
                  </div>
                </div>
                {viewItem?.storageLocation ? (
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Storage Location</div>
                    <div className="font-bold text-red-800 flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5" /> {viewItem.storageLocation}
                    </div>
                  </div>
                ) : viewItem?.clinicalIndicationPatient ? (
                  <div className="md:col-span-2">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-1">Clinical Indication / Disease Patient Recipient</div>
                    <div className="bg-white border border-red-100 rounded-lg p-3 text-xs grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-gray-400">Name</div>
                        <div className="font-bold text-gray-800">
                          {viewItem.clinicalIndicationPatient.firstName} {viewItem.clinicalIndicationPatient.middleName} {viewItem.clinicalIndicationPatient.lastName}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Disease</div>
                        <div className="font-bold text-gray-800">{diseaseLabel(viewItem.clinicalIndicationPatient)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Age / Sex</div>
                        <div className="font-bold text-gray-850">
                          {viewItem.clinicalIndicationPatient.age} Yrs / {viewItem.clinicalIndicationPatient.sex}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {viewItem?.hospital?.name && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Hospital / Facility</div>
                        <div className="font-semibold text-gray-800">{viewItem.hospital.name}</div>
                      </div>
                    )}
                    {((viewItem?.request && viewItem.request.patient) || viewItem?.reservedPatientName) && (
                      <div>
                        <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Patient</div>
                        <div className="font-semibold text-gray-800">
                          {viewItem?.request?.patient
                            ? `${viewItem.request.patient.name} (${viewItem.request.patient.age}/${viewItem.request.patient.sex})`
                            : `${viewItem.reservedPatientName} (${viewItem.reservedPatientAge}/${viewItem.reservedPatientSex})`}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {viewItem?.reservedAt && (
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Reserved At</div>
                    <div className="text-gray-700">{formatDateTime(viewItem.reservedAt)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CustomModal>
      {/* ── Storage Transfer (batch) View Modal ───────────── */}
      <CustomModal open={storageViewOpen} onCancel={() => { setStorageViewOpen(false); setStorageViewItem(null); }} title="Storage Batch Details" size="lg" hideFooter>
        {storageViewItem && (() => {
          const t = storageViewItem;
          return (
            <div className="space-y-5 text-sm">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5" /> Batch Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Transfer ID</div>
                    <div className="font-bold text-gray-800 font-mono">{t.transferId}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Storage Location</div>
                    <div className="font-bold text-red-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t.otherLocationName || t.location}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Sent Date</div>
                    <div className="text-gray-700">{formatDate(t.sentDate)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider p-4 pb-0">Blood Bags ({t.items?.length || 0})</h4>
                <div className="overflow-x-auto p-4 pt-3">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase font-semibold">
                        <th className="px-3 py-2">Component</th>
                        <th className="px-3 py-2">Blood Group</th>
                        <th className="px-3 py-2">Bag No</th>
                        <th className="px-3 py-2">Segment No</th>
                        <th className="px-3 py-2">Volume</th>
                        <th className="px-3 py-2">Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(t.items || []).map((it, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2.5 text-gray-700 font-medium">{it.componentType}</td>
                          <td className="px-3 py-2.5 font-bold text-gray-800">{it.bloodGroup}{it.rhFactor === 'NEGATIVE' ? '-' : '+'}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-gray-800">{it.bagNo}</td>
                          <td className="px-3 py-2.5 font-mono text-gray-600">{it.segmentNo || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{it.volumeMl ? `${it.volumeMl} mL` : '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{formatDate(it.expiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* ── Clinical Indication / Disease Requisition View Modal ──────────── */}
      <CustomModal open={thalViewOpen} onCancel={() => { setThalViewOpen(false); setThalViewItem(null); }} title="Clinical Indication / Disease Patient Details" size="lg" hideFooter>
        {thalViewItem && (() => {
          const r = thalViewItem;
          const p = r.patient || {};
          return (
            <div className="space-y-5 text-sm">
              {/* Patient details section */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Patient Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Full Name</div>
                    <div className="font-bold text-gray-800 text-base">{p.name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Indication</div>
                    <div className="font-semibold text-gray-800">{diseaseLabel(p)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Age</div>
                    <div className="font-semibold text-gray-800">{p.age ? `${p.age} years` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Sex</div>
                    <div className="font-semibold text-gray-800">{p.sex || '—'}</div>
                  </div>
                  {p.address && (
                    <div className="md:col-span-2">
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Address</div>
                      <div className="text-gray-700">{p.address}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Requisition + matched bags */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Requisition Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Requisition ID</div>
                    <div className="font-mono font-bold text-gray-800">{r.requestId || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Status</div>
                    <div className="text-gray-700 capitalize">{r.status || '—'}</div>
                  </div>
                  {r.doctorName && (
                    <div>
                      <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Doctor / Clinician</div>
                      <div className="text-gray-700">{r.doctorName}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Hospital</div>
                    <div className="text-gray-700">{r.hospitalId?.name || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Matched Bags</h4>
                {Array.isArray(r.matchedInventory) && r.matchedInventory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 text-xs uppercase">
                          <th className="py-1 pr-4">Bag No</th>
                          <th className="py-1 pr-4">Component</th>
                          <th className="py-1 pr-4">Blood Group</th>
                          <th className="py-1 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.matchedInventory.map((mi) => {
                          const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                          return (
                            <tr key={inv?._id || mi.inventoryId} className="border-t border-gray-100">
                              <td className="py-1.5 pr-4 font-mono">{inv?.bagNo?.bagNo || '—'}</td>
                              <td className="py-1.5 pr-4">{inv?.componentId?.componentType || '—'}</td>
                              <td className="py-1.5 pr-4">{inv?.bagNo?.bloodGroup} {inv?.bagNo?.rh}</td>
                              <td className="py-1.5 pr-4 capitalize">{inv?.status || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No bags matched yet.</p>
                )}
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* ── Delete Bulk Transfer Confirmation ─────────────── */}
      <CustomModal
        open={deleteBulkConfirmOpen}
        onCancel={() => { setDeleteBulkConfirmOpen(false); setDeleteBulkTarget(null); }}
        title="Delete Bulk Transfer"
        size="sm"
        hideFooter
      >
        <div className="space-y-4 text-sm p-1">
          <p className="text-gray-700">
            Delete transfer <strong className="font-mono">{deleteBulkTarget?.transferId}</strong>
            {deleteBulkTarget?.transferType === 'GIVE_LOAN' ? (
              <> — its {deleteBulkTarget?.items?.length || 0} bag(s) will be <strong>returned to stock</strong>.</>
            ) : (
              <> — its {deleteBulkTarget?.items?.length || 0} bag(s) will be removed from the stock listing.</>
            )}
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Reason for Deletion <span className="text-red-600 font-bold">*</span>
            </label>
            <textarea
              rows={3}
              value={deleteBulkReason}
              onChange={(e) => setDeleteBulkReason(e.target.value)}
              placeholder="Describe the reason for deleting this transfer..."
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-150 focus:border-slate-800 transition-all outline-none resize-none"
              disabled={deleteBulkSubmitting}
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button onClick={() => { setDeleteBulkConfirmOpen(false); setDeleteBulkTarget(null); }} variant="outline" className="h-10 px-4">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteBulkTransfer}
              disabled={deleteBulkSubmitting || !deleteBulkReason.trim()}
              className="bg-red-700 hover:bg-red-800 text-white font-medium h-10 px-5"
            >
              {deleteBulkSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* ── Bulk Transfer View Modal ──────────────────────── */}
      <CustomModal open={bulkViewOpen} onCancel={() => { setBulkViewOpen(false); setBulkViewItem(null); }} title="Bulk Transfer Details" size="lg" hideFooter>
        {bulkViewItem && (() => {
          const { byComponent, totalLitres } = bulkTransferComponentTotals(bulkViewItem.items);
          const componentEntries = Object.entries(byComponent);
          return (
          <div className="space-y-5 text-sm">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Transfer ID</div>
                  <div className="font-bold text-gray-800 font-mono">{bulkViewItem.transferId}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Type</div>
                  <div className="font-bold text-red-700">{bulkViewItem.transferType === 'GIVE_LOAN' ? 'Give Loan' : 'Take Loan'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Company Name</div>
                  <div className="font-semibold text-gray-800">{bulkViewItem.bloodBankName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Transfer Date</div>
                  <div className="text-gray-700">{formatDate(bulkViewItem.transferDate)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Blood Bank Address</div>
                  <div className="text-gray-700">{bulkViewItem.bloodBankAddress}</div>
                </div>
                {bulkViewItem.notes && (
                  <div className="md:col-span-2">
                    <div className="text-gray-500 text-xs uppercase font-semibold mb-0.5">Notes</div>
                    <div className="text-gray-700">{bulkViewItem.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider p-4 pb-0">Blood Bags ({bulkViewItem.items?.length || 0})</h4>
              <div className="overflow-x-auto p-4 pt-3">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase font-semibold">
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2">Blood Group</th>
                      <th className="px-3 py-2">Bag No</th>
                      <th className="px-3 py-2">Segment No</th>
                      <th className="px-3 py-2">Volume</th>
                      <th className="px-3 py-2">Collected</th>
                      <th className="px-3 py-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(bulkViewItem.items || []).map((it, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2.5 text-gray-700 font-medium">{it.componentType}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-800">{it.bloodGroup}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-gray-800">{it.bagNo}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-600">{it.segmentNo || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{it.volumeMl ? `${it.volumeMl} mL` : '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{formatDate(it.collectedAt)}</td>
                        <td className="px-3 py-2.5 text-gray-600">{formatDate(it.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Component totals in litres */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-3">Component Totals (Litres)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {componentEntries.length === 0 ? (
                  <div className="col-span-full text-gray-500 text-xs">No volume data recorded for these bags.</div>
                ) : componentEntries.map(([comp, ml]) => (
                  <div key={comp} className="bg-white border border-amber-100 rounded-lg px-3 py-2">
                    <div className="text-gray-500 text-[10px] uppercase font-semibold">{comp}</div>
                    <div className="font-bold text-gray-800">{(ml / 1000).toFixed(2)} L</div>
                  </div>
                ))}
                <div className="bg-white border border-amber-200 rounded-lg px-3 py-2">
                  <div className="text-amber-700 text-[10px] uppercase font-semibold">Total</div>
                  <div className="font-bold text-amber-900">{totalLitres.toFixed(2)} L</div>
                </div>
              </div>
            </div>

            {bulkViewItem.transferType === 'GIVE_LOAN' && (
              <div className="flex justify-end gap-2 pt-2 border-t flex-wrap">
                <Button
                  onClick={openTestingCertPrompt}
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-50 font-medium h-10 px-5 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Testing Certificate
                </Button>
                <Button
                  onClick={openInvoicePrompt}
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-50 font-medium h-10 px-5 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Invoice
                </Button>
                <Button
                  onClick={openCoverLetterPrompt}
                  className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5 shadow-sm flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Cover Letter
                </Button>
              </div>
            )}
          </div>
          );
        })()}
      </CustomModal>
    </>
  );
}
