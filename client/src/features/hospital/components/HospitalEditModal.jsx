import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CustomModal from '@/components/CustomModal';

export default function HospitalEditModal({
  open,
  selectedHospital,
  editFormData,
  editErrors,
  editSubmitting,
  handleEditInputChange,
  handleEditSave,
  onClose,
}) {
  return (
    <CustomModal
      open={open && !!selectedHospital}
      title={selectedHospital ? `Edit Hospital - ${selectedHospital.name}` : 'Edit Hospital'}
      description="Update the hospital details. Fields marked with * are required."
      onCancel={onClose}
      onConfirm={handleEditSave}
      confirmText={editSubmitting ? 'Saving...' : 'Save Changes'}
      cancelText="Cancel"
      confirmVariant="primary"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Hospital Name *</Label>
            <Input
              id="edit-name"
              name="name"
              value={editFormData.name}
              onChange={handleEditInputChange}
              placeholder="Enter hospital name"
              className={editErrors.name ? 'border-red-500' : ''}
            />
            {editErrors.name && (
              <p className="text-xs text-red-500">{editErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contactPerson">Contact Person *</Label>
            <Input
              id="edit-contactPerson"
              name="contactPerson"
              value={editFormData.contactPerson}
              onChange={handleEditInputChange}
              placeholder="Enter contact person name"
              className={editErrors.contactPerson ? 'border-red-500' : ''}
            />
            {editErrors.contactPerson && (
              <p className="text-xs text-red-500">{editErrors.contactPerson}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone Number *</Label>
            <Input
              id="edit-phone"
              name="phone"
              value={editFormData.phone}
              onChange={handleEditInputChange}
              placeholder="Enter phone number"
              className={editErrors.phone ? 'border-red-500' : ''}
            />
            {editErrors.phone && (
              <p className="text-xs text-red-500">{editErrors.phone}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address">Address *</Label>
          <Textarea
            id="edit-address"
            name="address"
            value={editFormData.address}
            onChange={handleEditInputChange}
            placeholder="Enter complete hospital address"
            rows={3}
            className={editErrors.address ? 'border-red-500' : ''}
          />
          {editErrors.address && (
            <p className="text-xs text-red-500">{editErrors.address}</p>
          )}
        </div>
      </div>
    </CustomModal>
  );
}
