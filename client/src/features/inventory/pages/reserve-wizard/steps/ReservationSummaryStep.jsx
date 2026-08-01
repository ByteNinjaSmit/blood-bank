import React from 'react';
import { componentColor } from '@/features/requisition/pages/components/component-colors';

// Step 3 of the Reservation wizard — read-only summary + the single, final
// "Reserve Units" action (calls approve(), which performs the real
// BloodUnit RESERVE transition and then navigates to the Reserve list).
// No issue/complete step is ever shown here.
export default function ReservationSummaryStep({ requestDoc, approving, onCreateReservation }) {
  if (!requestDoc) {
    return <div className="p-6 text-sm text-gray-600">No reservation request yet.</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="border rounded-lg">
        <div className="p-3 border-b bg-gray-50 rounded-t-lg font-medium">Reservation Summary</div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-gray-600">Request ID:</span> <strong>{requestDoc.requestId}</strong></p>
            <p><span className="text-gray-600">Status:</span> <strong className="capitalize">{requestDoc.status}</strong></p>
            <p><span className="text-gray-600">Hospital:</span> <strong>{requestDoc.hospitalId?.name || '—'}</strong></p>
          </div>
          <div>
            <p><span className="text-gray-600">Patient:</span> <strong>{requestDoc.patient?.name}</strong> ({requestDoc.patient?.age}/{requestDoc.patient?.sex})</p>
            <p><span className="text-gray-600">Indication:</span> <strong>{requestDoc.patient?.indication || '—'}</strong></p>
          </div>
        </div>

        <div className="p-4 border-t">
          <h4 className="font-semibold mb-3">Matched Bags</h4>
          {(requestDoc.matchedInventory || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-2">Bag No</th>
                    <th className="p-2">Component</th>
                    <th className="p-2">Blood Group</th>
                    <th className="p-2">Crossmatch</th>
                  </tr>
                </thead>
                <tbody>
                  {requestDoc.matchedInventory.map((mi) => {
                    const inv = typeof mi.inventoryId === 'object' ? mi.inventoryId : null;
                    const compType = inv?.componentId?.componentType || mi.componentType || '—';
                    const color = componentColor(compType);
                    return (
                      <tr key={inv?._id || mi.inventoryId} className="border-t">
                        <td className="p-2 font-mono">{inv?.bagNo?.bagNo || '—'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color.header}`}>{compType}</span>
                        </td>
                        <td className="p-2">{inv?.bagNo?.bloodGroup} {inv?.bagNo?.rh}</td>
                        <td className="p-2 capitalize">{mi.crossmatchStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No bags matched.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreateReservation}
          disabled={approving}
          className={`px-6 py-2.5 rounded-lg font-semibold shadow transition ${
            approving ? 'bg-orange-300 text-white cursor-wait' : 'bg-orange-800 hover:bg-orange-900 text-white active:scale-95 cursor-pointer'
          }`}
        >
          {approving ? 'Reserving…' : 'Reserve Units'}
        </button>
      </div>
    </div>
  );
}
