import React from 'react';
import { GitCommitHorizontal, Building2 } from 'lucide-react';
import DonationTimeline from '../../components/DonationTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Drawer-style dialog showing a donation's lifecycle timeline. Rendered only
// when a donation is being tracked (trackId set in the parent hook).
export default function DonationTimelineDrawer({ isCampTab, detail, detailLoading, onClose }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommitHorizontal className="w-4 h-4 text-orange-800" />
            Donation Timeline
            {isCampTab && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3 h-3" /> Camp
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div>
          {detailLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading timeline…</div>
          ) : detail ? (
            <DonationTimeline donation={detail} />
          ) : (
            <div className="py-16 text-center text-gray-400 text-sm">Donation not found.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
