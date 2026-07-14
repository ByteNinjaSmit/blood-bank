import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomModal from '@/components/CustomModal';

// Edit the storage location of a single already-stored bag. The mandatory
// "reason for change" prompt is a separate dialog, handled by the page via
// useEditWithReason — this modal only collects the new location.
export default function StorageEditModal({ open, onClose, bag, onSubmit, submitting }) {
  const [location, setLocation] = useState('SJS [Kopargaon]');
  const [otherLocationName, setOtherLocationName] = useState('');

  useEffect(() => {
    if (open && bag) {
      const current = bag.storageLocation || '';
      const isKnown = current === 'SJS [Kopargaon]' || current === 'Anand [Vaijapur]';
      setLocation(isKnown ? current : (current ? 'Others' : 'SJS [Kopargaon]'));
      setOtherLocationName(isKnown ? '' : current);
    }
  }, [open, bag]);

  const handleSubmit = () => {
    onSubmit({ location, otherLocationName: location === 'Others' ? otherLocationName : undefined });
  };

  return (
    <CustomModal open={open} onCancel={onClose} title="Edit Storage Location" size="sm" hideFooter>
      <div className="space-y-4 text-sm p-1">
        <p className="text-gray-600 text-xs">
          Bag <strong className="font-mono">{bag?.bag?.bagNo || bag?.bagNo || '—'}</strong> — currently at{' '}
          <strong>{bag?.storageLocation || '—'}</strong>
        </p>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            New Storage Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
          >
            <option value="SJS [Kopargaon]">SJS [Kopargaon]</option>
            <option value="Anand [Vaijapur]">Anand [Vaijapur]</option>
            <option value="Others">Others</option>
          </select>
        </div>
        {location === 'Others' && (
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Location Name</label>
            <input
              type="text"
              value={otherLocationName}
              onChange={(e) => setOtherLocationName(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm bg-white shadow-sm focus:ring-1 focus:ring-red-500"
              placeholder="Enter location name"
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button onClick={onClose} variant="outline" className="h-10 px-4">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (location === 'Others' && !otherLocationName.trim())}
            className="bg-red-800 hover:bg-red-900 text-white font-medium h-10 px-5"
          >
            Continue
          </Button>
        </div>
      </div>
    </CustomModal>
  );
}
