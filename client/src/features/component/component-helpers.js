export const STATUS_OPTIONS = [
  { value: "in-stock", label: "In Stock" },
  { value: "reserved", label: "Reserved" },
  { value: "issued", label: "Issued" },
  { value: "discarded", label: "Discarded" },
  { value: "quarantined", label: "Quarantined" },
];

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case "in-stock":
      return "bg-green-50 text-green-700 border-green-200 hover:bg-green-50";
    case "reserved":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50";
    case "issued":
      return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50";
    case "discarded":
      return "bg-red-50 text-red-700 border-red-200 hover:bg-red-50";
    case "quarantined":
      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50";
    case "testing":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50";
    case "collected":
      return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50";
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case "in-stock": return "In Stock";
    case "reserved": return "Reserved";
    case "issued": return "Issued";
    case "discarded": return "Discarded";
    case "quarantined": return "Quarantined";
    case "testing": return "Under Testing";
    case "collected": return "Collected";
    default: return status || "Prepared";
  }
};

export const isNearExpiry = (expiryDate) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
};

export const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return expiry < today;
};

// True if any prepared component on this bag is quarantined (a serology edit
// to Shadeness moves in-stock units to quarantine).
export const isBagQuarantined = (bag) => {
  return ['prbc', 'ffp', 'rdp', 'cryo', 'sdp'].some(
    (type) => bag[type]?.status === 'prepared' && bag[type]?.componentStatus === 'quarantined'
  );
};
