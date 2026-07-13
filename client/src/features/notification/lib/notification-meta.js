import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export const TOAST_DURATION_MS = 6000;

export const SEVERITY_META = {
  CRITICAL: {
    label: 'Critical',
    icon: AlertOctagon,
    text: 'text-red-600',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    dot: 'bg-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
    toast: 'critical',
  },
  WARNING: {
    label: 'Warning',
    icon: AlertTriangle,
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    toast: 'warning',
  },
  INFORMATION: {
    label: 'Information',
    icon: Info,
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    ring: 'ring-blue-200',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    toast: 'info',
  },
  SUCCESS: {
    label: 'Success',
    icon: CheckCircle2,
    text: 'text-green-600',
    bg: 'bg-green-50',
    ring: 'ring-green-200',
    dot: 'bg-green-600',
    badge: 'bg-green-100 text-green-700 border-green-200',
    toast: 'success',
  },
};

export const MODULE_LABELS = {
  DONOR: 'Donor',
  COLLECTION: 'Blood Collection',
  COMPONENT_SEPARATION: 'Component Separation',
  TTI_TESTING: 'TTI Testing',
  INVENTORY: 'Inventory',
  CROSSMATCH: 'Cross Matching',
  ISSUE_BLOOD: 'Issue Blood',
  APPOINTMENTS: 'Appointments',
  EQUIPMENT: 'Equipment',
  ADMINISTRATION: 'Administration',
  OTHERS: 'Others',
};

export function severityMeta(severity) {
  return SEVERITY_META[severity] ?? SEVERITY_META.INFORMATION;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
  });
}

export function badgeCount(n) {
  if (n > 99) return '99+';
  if (n > 25) return '25+';
  if (n > 9) return '9+';
  return String(n);
}
