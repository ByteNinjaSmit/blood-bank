import React from 'react';

export default function ApproveIssueStep({ requestDoc, approving, issuing, onApprove, onIssue }) {
  const handleIssueClick = () => {
    if (!requestDoc?._id) return;
    const count = Array.isArray(requestDoc?.matchedInventory) ? requestDoc.matchedInventory.length : 0;
    const ok = window.confirm(`Issue ${count} unit(s) for request ${requestDoc?.requestId}?`);
    if (ok) onIssue();
  };
  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Approve and Issue</h3>
      <div className="flex gap-3">
        <button disabled={!requestDoc?._id || approving} onClick={onApprove} className={`px-4 py-2 rounded-lg ${approving ? 'bg-blue-300' : 'bg-blue-700 hover:bg-blue-800'} text-white`}>
          {approving ? 'Approving…' : 'Approve'}
        </button>
        <button disabled={!requestDoc?._id || issuing} onClick={handleIssueClick} className={`px-4 py-2 rounded-lg ${issuing ? 'bg-green-300' : 'bg-green-700 hover:bg-green-800'} text-white`}>
          {issuing ? 'Issuing…' : 'Issue Units'}
        </button>
      </div>
      {requestDoc && (
        <div className="mt-2 text-sm text-gray-700">Current Status: <strong className="capitalize">{requestDoc.status}</strong></div>
      )}
      {requestDoc?.matchedInventory?.length ? (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Selected Units to Issue</h4>
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
        </div>
      ) : null}
    </div>
  );
}
