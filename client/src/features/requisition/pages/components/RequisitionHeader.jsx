import React from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function RequisitionHeader({ onBack }) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Requisition</h1>
            <p className="text-gray-500 text-sm">Requisition, crossmatch & issue workflow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
