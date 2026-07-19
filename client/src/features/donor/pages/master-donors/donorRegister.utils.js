// Pure helpers for the Master Donor Register — no React, no side effects.

export function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getStatusColor(status) {
  switch (status) {
    case 'eligible':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'recently-donated':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'deferred':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'temp-deferred':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function getStatusText(status) {
  switch (status) {
    case 'eligible':
      return 'Eligible';
    case 'recently-donated':
      return 'Recently Donated';
    case 'deferred':
      return 'Deferred';
    case 'temp-deferred':
      return 'Temp Deferred';
    default:
      return status || 'N/A';
  }
}

// Maps a donor record into the flat shape DonorForm expects for editing.
export function mapDonorToEditForm(donor) {
  if (!donor) return null;
  return {
    donorId: donor.donorId || '',
    firstName: donor.name?.firstName || '',
    middleName: donor.name?.middleName || '',
    lastName: donor.name?.lastName || '',
    uid: donor.uid || '',
    dob: donor.dob ? new Date(donor.dob).toISOString().split('T')[0] : '',
    sex: donor.sex || '',
    phone: donor.phone || '',
    email: donor.email || '',
    addressLine1: donor.address?.line1 || '',
    addressLine2: donor.address?.line2 || '',
    city: donor.address?.city || '',
    district: donor.address?.district || '',
    state: donor.address?.state || '',
    pincode: donor.address?.pincode || '',
    occupation: donor.occupation || '',
    weightKg: donor.weightKg != null ? String(donor.weightKg) : '',
    bloodGroup: donor.bloodGroup || '',
    rh: donor.rh || '',
    eligibilityStatus: donor.eligibilityStatus || '',
    lastDonationDate: donor.lastDonationDate
      ? new Date(donor.lastDonationDate).toISOString().split('T')[0]
      : '',
  };
}

export function tabEmptyText(activeTab) {
  if (activeTab === 'inhouse') return 'No inhouse donors found.';
  if (activeTab === 'camp') return 'No camp donors found.';
  return 'No donors found in the master register.';
}
