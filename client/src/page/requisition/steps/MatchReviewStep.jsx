import React from 'react';

export default function MatchReviewStep({ requestDoc, matchedResult, matching, onMatch, onReject, shortages }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Match Results (FIFO)</h3>
        <div className="flex gap-3">
          <button disabled={!requestDoc?._id || matching} onClick={onMatch} className={`px-4 py-2 rounded-lg ${matching ? 'bg-orange-300' : 'bg-orange-800 hover:bg-orange-900'} text-white`}>
            {matching ? 'Matching…' : 'Re-run Match'}
          </button>
          <button disabled={!requestDoc?._id} onClick={onReject} className="px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50">
            Reject Request
          </button>
        </div>
      </div>

      {Array.isArray(shortages) && shortages.length > 0 && (
        <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">
          <p className="font-medium">Insufficient stock to fully match this request.</p>
          <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
            {shortages.map((s, idx) => (
              <li key={idx}>
                {s.componentType}: {s.available} of {s.required} available. Please adjust units or inventory.
              </li>
            ))}
          </ul>
        </div>
      )}

      {matchedResult && (
        <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-900">
          <p className="font-medium">Reserved units: {matchedResult?.matchedCount}</p>
          {Array.isArray(matchedResult?.inventoryIds) && matchedResult.inventoryIds.length > 0 && (
            <p className="text-sm mt-1">Inventory IDs: {matchedResult.inventoryIds.join(', ')}</p>
          )}
        </div>
      )}

      {requestDoc && (
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg font-medium">Request Summary</div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="text-gray-600">Request ID:</span> <strong>{requestDoc.requestId}</strong></p>
              <p><span className="text-gray-600">Status:</span> <strong className="capitalize">{requestDoc.status}</strong></p>
            </div>
            <div>
              <p><span className="text-gray-600">Patient:</span> <strong>{requestDoc.patient?.name}</strong> ({requestDoc.patient?.age}/{requestDoc.patient?.sex})</p>
              <p><span className="text-gray-600">Hospital:</span> <strong>{requestDoc.hospitalId?.name || '—'}</strong></p>
            </div>
          </div>
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-2">Reserved Inventory</h4>
            {requestDoc?.matchedInventory?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-2">Inventory ID</th>
                      <th className="p-2">Component</th>
                      <th className="p-2">Bag No</th>
                      <th className="p-2">Blood</th>
                      <th className="p-2">Reserved At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestDoc.matchedInventory.map((mi) => (
                      <tr key={mi.inventoryId} className="border-t">
                        <td className="p-2">{typeof mi.inventoryId === 'object' ? mi.inventoryId?._id : mi.inventoryId}</td>
                        <td className="p-2">{mi?.inventoryId?.componentId?.componentType || '—'}</td>
                        <td className="p-2">{mi?.inventoryId?.bagNo?.bagNo || '—'}</td>
                        <td className="p-2">{mi?.inventoryId?.bagNo ? `${mi.inventoryId.bagNo.bloodGroup} ${mi.inventoryId.bagNo.rh}` : '—'}</td>
                        <td className="p-2">{mi?.reservedAt ? new Date(mi.reservedAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No inventory reserved yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

