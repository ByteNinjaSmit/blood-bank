import { Label } from '@/components/ui/label';
import { Building2, Phone, MapPin } from 'lucide-react';
import CustomModal from '@/components/CustomModal';

export default function HospitalViewModal({ open, selectedHospital, onClose }) {
  return (
    <CustomModal
      open={open && !!selectedHospital}
      title={selectedHospital ? `Hospital Details - ${selectedHospital.name}` : 'Hospital Details'}
      description="Review the full information for this hospital."
      onCancel={onClose}
      hideFooter
      size="lg"
    >
      {selectedHospital && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">{selectedHospital.hospitalId}</div>
              <div className="text-xl font-semibold text-gray-900">{selectedHospital.name}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Contact Person</Label>
              <div className="text-sm text-gray-900">{selectedHospital.contactPerson}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Phone</Label>
              <div className="flex items-center text-sm text-gray-900">
                <Phone className="w-3 h-3 mr-1" />
                {selectedHospital.phone}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-500">Address</Label>
            <div className="flex items-start text-sm text-gray-900">
              <MapPin className="w-3 h-3 mr-1 mt-0.5" />
              <span>{selectedHospital.address}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {selectedHospital.createdAt ? new Date(selectedHospital.createdAt).toLocaleString() : '-'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedHospital.updatedAt ? new Date(selectedHospital.updatedAt).toLocaleString() : '-'}
            </div>
          </div>
        </div>
      )}
    </CustomModal>
  );
}
