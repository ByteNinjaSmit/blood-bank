import React from 'react';

export default function ApproveIssueStep({ requestDoc, approving, issuing, onApprove, onIssue }) {
  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Approve and Issue</h3>
      <div className="flex gap-3">
        <button disabled={!requestDoc?._id || approving} onClick={onApprove} className={`px-4 py-2 rounded-lg ${approving ? 'bg-blue-300' : 'bg-blue-700 hover:bg-blue-800'} text-white`}>
          {approving ? 'Approving…' : 'Approve'}
        </button>
        <button disabled={!requestDoc?._id || issuing} onClick={onIssue} className={`px-4 py-2 rounded-lg ${issuing ? 'bg-green-300' : 'bg-green-700 hover:bg-green-800'} text-white`}>
          {issuing ? 'Issuing…' : 'Issue Units'}
        </button>
      </div>
      {requestDoc && (
        <div className="mt-2 text-sm text-gray-700">Current Status: <strong className="capitalize">{requestDoc.status}</strong></div>
      )}
    </div>
  );
}
