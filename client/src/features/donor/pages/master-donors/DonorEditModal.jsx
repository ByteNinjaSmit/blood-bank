import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DonorForm from '@/features/donor/components/DonorForm';
import { mapDonorToEditForm } from './donorRegister.utils';

export default function DonorEditModal({ isOpen, donor, onSubmit, onClose, loading }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-orange-50 to-white">
        <DialogHeader>
          <DialogTitle>Edit Donor</DialogTitle>
        </DialogHeader>
      {donor && (
        <div className="mb-4 rounded-lg bg-white/70 border border-orange-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Editing donor</p>
            <h3 className="text-lg font-semibold text-slate-900">
              {donor.name?.firstName} {donor.name?.lastName}
            </h3>
            <p className="text-xs text-slate-500">
              ID: <span className="font-mono">{donor.donorId}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
              {donor.bloodGroup} {donor.rh === 'Positive' || donor.rh === 'POSITIVE' ? '+' : donor.rh === 'Negative' || donor.rh === 'NEGATIVE' ? '-' : ''}
            </span>
            {donor.lastDonationDate && (
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                Last donation: {new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}
      <DonorForm
        initialData={mapDonorToEditForm(donor)}
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
      />
      </DialogContent>
    </Dialog>
  );
}
