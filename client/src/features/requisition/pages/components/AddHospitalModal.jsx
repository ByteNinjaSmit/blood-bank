import React from 'react';
import Modal from '@/components/shared/Modal';

export default function AddHospitalModal({ isOpen, onClose, form, onChange, saving, onSave }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Hospital" size="default">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Hospital name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Contact Person</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            value={form.contactPerson}
            onChange={(e) => onChange({ contactPerson: e.target.value })}
            placeholder="Contact person"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Phone</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="Phone number"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Address</label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            value={form.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Full address"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded text-white ${saving ? 'bg-orange-300' : 'bg-orange-800 hover:bg-orange-900'}`}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Hospital'}
        </button>
      </div>
    </Modal>
  );
}
