import { Home, Building2, BookOpen, AlertOctagon } from 'lucide-react';

export const TABS = [
  { key: 'all',      label: 'Master Donor Register',    icon: BookOpen },
  { key: 'inhouse',  label: 'Inhouse Donors',            icon: Home },
  { key: 'camp',     label: 'Camp Donors',               icon: Building2 },
  { key: 'deferral', label: 'Donor Deferral Register',   icon: AlertOctagon },
];

export const PAGE_SIZE = 20;
