import React from 'react';
import { Droplets } from 'lucide-react';

export default function RequisitionHeader({ onBack }) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Droplets className="w-8 h-8 text-orange-800" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Requisition</h1>
            <p className="text-gray-600 text-sm">Create → Match FIFO → Issue → Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}
