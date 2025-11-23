import React from 'react';

export default function CompleteStep({ requestDoc, completing, onComplete }) {
  const canComplete = !!requestDoc?._id && requestDoc.status === 'issued' && !completing;

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-gray-800">Complete Request</h3>
      <p className="text-sm text-gray-700">Mark the requisition as completed after confirmation of receipt/transfusion.</p>
      <div className="flex gap-3">
        <button
          disabled={!canComplete}
          onClick={onComplete}
          className={`px-4 py-2 rounded-lg text-white ${
            canComplete
              ? 'bg-purple-700 hover:bg-purple-800 cursor-pointer'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {completing ? 'Completing…' : 'Complete Request'}
        </button>
      </div>
      {requestDoc && (
        <div className="mt-2 text-sm text-gray-700">Current Status: <strong className="capitalize">{requestDoc.status}</strong></div>
      )}
    </div>
  );
}
