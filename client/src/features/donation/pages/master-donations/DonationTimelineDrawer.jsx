import React from 'react';
import { GitCommitHorizontal, Building2, X } from 'lucide-react';
import DonationTimeline from '../../components/DonationTimeline';

// Right-side drawer showing a donation's lifecycle timeline. Rendered only
// when a donation is being tracked (trackId set in the parent hook).
export default function DonationTimelineDrawer({ isCampTab, detail, detailLoading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <GitCommitHorizontal className="w-4 h-4 text-orange-800" />
            <h2 className="font-semibold text-gray-900 text-sm">Donation Timeline</h2>
            {isCampTab && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3 h-3" /> Camp
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {detailLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading timeline…</div>
          ) : detail ? (
            <DonationTimeline donation={detail} />
          ) : (
            <div className="py-16 text-center text-gray-400 text-sm">Donation not found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
