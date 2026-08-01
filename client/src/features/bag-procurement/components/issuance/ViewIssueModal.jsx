import { useBagIssueDetail } from '../../queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ViewIssueModal({ id, onClose }) {
  const { data: issue, isLoading } = useBagIssueDetail(id);

  const handleOpenChange = (open) => { if (!open) onClose(); };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Loading bag issuance details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-4 border-orange-850 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading bag details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!issue) {
    return (
      <Dialog open onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Bag issuance details error</DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-red-500 font-medium">Failed to load bag issue details.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const donor = typeof issue.donorId === 'object' ? issue.donorId : null;
  const donation = typeof issue.donationId === 'object' ? issue.donationId : null;

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-orange-800 to-orange-900">
          <DialogTitle className="text-base font-bold text-white">Bag Issuance Information</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bag Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-1">Bag & Collection Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="text-gray-500 font-medium">Bag Serial No:</span> <span className="font-mono text-gray-900 font-semibold">{issue.bagSerialNumber}</span></div>
              <div><span className="text-gray-500 font-medium">Bag Type:</span> <span className="text-gray-800 font-semibold">{issue.bagType}</span></div>
              <div><span className="text-gray-500 font-medium">Batch No:</span> <span className="font-mono text-gray-800 font-semibold">{issue.batchNumber}</span></div>
              <div><span className="text-gray-500 font-medium">Collection Room:</span> <span className="text-gray-800">{issue.collectionRoom || '—'}</span></div>
              <div><span className="text-gray-500 font-medium">Issue Date:</span> <span className="text-gray-800">{new Date(issue.issueDate).toLocaleString('en-IN')}</span></div>
              <div><span className="text-gray-500 font-medium">Current Status:</span> <span className="capitalize text-gray-800 font-bold">{issue.status}</span></div>
              {issue.notes && <div className="col-span-2"><span className="text-gray-500 font-medium">Notes:</span> <span className="text-gray-800 italic">{issue.notes}</span></div>}
            </div>
          </div>

          {/* Donor Details */}
          {donor ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wider border-b pb-1">
                Donor Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-orange-50/20 border border-orange-100 rounded-xl p-4">
                <div>
                  <span className="text-gray-500 font-medium">Name:</span>{' '}
                  <span className="text-gray-900 font-bold">
                    {[donor.name?.firstName, donor.name?.middleName, donor.name?.lastName].filter(Boolean).join(' ')}
                  </span>
                </div>
                <div><span className="text-gray-500 font-medium">Blood Group:</span> <span className="text-red-700 font-bold">{donor.bloodGroup} {donor.rh}</span></div>
                <div><span className="text-gray-500 font-medium">Phone:</span> <span className="text-gray-800">{donor.phone || '—'}</span></div>
                <div><span className="text-gray-500 font-medium">Email:</span> <span className="text-gray-800">{donor.email || '—'}</span></div>
                <div><span className="text-gray-500 font-medium">Sex / DOB:</span> <span className="text-gray-800">{donor.sex || '—'} / {donor.dob ? new Date(donor.dob).toLocaleDateString('en-IN') : '—'}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 font-medium bg-gray-50 border rounded-xl p-3 text-center">
              No donor linked. This bag has not been used for a donation yet.
            </div>
          )}

          {/* Donation Details */}
          {donation ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider border-b pb-1">
                Donation Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-purple-50/20 border border-purple-100 rounded-xl p-4">
                <div><span className="text-gray-500 font-medium">Donation ID:</span> <span className="font-mono text-gray-900 font-semibold">{donation.donationId}</span></div>
                <div><span className="text-gray-500 font-medium">Donation Type:</span> <span className="text-gray-800 font-semibold">{donation.donationType?.replace('_', ' ')}</span></div>
                <div><span className="text-gray-500 font-medium">Segment No:</span> <span className="font-mono text-gray-950 font-bold text-purple-800">{donation.segmentNo || '—'}</span></div>
                <div><span className="text-gray-500 font-medium">Collection Date:</span> <span className="text-gray-800">{donation.collectedAt ? new Date(donation.collectedAt).toLocaleString('en-IN') : '—'}</span></div>
                <div><span className="text-gray-500 font-medium">Bag Type used:</span> <span className="text-gray-800">{donation.typeOfBag || '—'}</span></div>
                {donation.medicalExam && (
                  <div className="col-span-2 pt-2 border-t border-purple-100/55 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-500 font-medium block">Haemoglobin</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.hbGdl ? `${donation.medicalExam.hbGdl} g/dL` : '—'}</span></div>
                    <div><span className="text-gray-500 font-medium block">Weight</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.weightKg ? `${donation.medicalExam.weightKg} kg` : '—'}</span></div>
                    <div><span className="text-gray-500 font-medium block">Pulse</span> <span className="text-gray-800 font-semibold">{donation.medicalExam.pulseBpm ? `${donation.medicalExam.pulseBpm} bpm` : '—'}</span></div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Requisition & Delivery Details */}
          {issue.requisitions && issue.requisitions.filter(r => r.requisitionId).length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b pb-1">
                Requisition & Delivery Details
              </h3>
              <div className="space-y-4">
                {issue.requisitions
                  .filter(r => r.requisitionId)
                  .map((req) => (
                    <div key={req.unitId} className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {req.unitId.split('-').slice(-2).join(' ')} ({req.componentType})
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          Blood Group: <span className="text-red-700 font-bold">{req.aboGroup} {req.rhFactor}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div><span className="text-gray-500 font-medium">Requisition No:</span> <span className="font-mono text-gray-900 font-semibold">{req.requisitionId}</span></div>
                        <div><span className="text-gray-500 font-medium">Status:</span> <span className="capitalize text-blue-850 font-bold">{req.requisitionStatus}</span></div>
                        <div><span className="text-gray-500 font-medium">Hospital:</span> <span className="text-gray-800 font-semibold">{req.hospitalName}</span></div>
                        <div><span className="text-gray-500 font-medium">Patient:</span> <span className="text-gray-800 font-semibold">{req.patientName}</span></div>
                        <div><span className="text-gray-500 font-medium">Clinician:</span> <span className="text-gray-800">{req.clinicianName}</span></div>
                        <div><span className="text-gray-500 font-medium">Required At:</span> <span className="text-gray-800">{req.requiredAt ? new Date(req.requiredAt).toLocaleString('en-IN') : '—'}</span></div>
                      </div>

                      {req.issue ? (
                        <div className="mt-2 pt-2 border-t border-dashed border-blue-100 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700 bg-blue-50/10 rounded-lg p-2">
                          <div className="col-span-2 font-bold text-blue-800 text-[10px] uppercase tracking-wider">Delivery Pass Details</div>
                          <div><span className="text-gray-500 font-medium">Issued At:</span> <span className="text-gray-800">{new Date(req.issue.issuedAt).toLocaleString('en-IN')}</span></div>
                          <div className="col-span-2"><span className="text-gray-500 font-medium">Collected By:</span> <span className="text-gray-800 font-semibold">{req.issue.collectedByName || '—'}</span></div>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-700 bg-amber-50/50 border border-amber-100 rounded-lg p-2 text-center font-medium">
                          Component is matched/reserved but not issued from the blood bank yet.
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-colors">
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
