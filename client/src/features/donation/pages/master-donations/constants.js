import { BookOpen, Home, Building2 } from 'lucide-react';

export const DONATION_REGISTERS = [
  { key: 'all', label: 'Master Donation Register (All)' },
  { key: 'inhouse', label: 'Inhouse Donation Register' },
  { key: 'camp', label: 'Camp Donation Register' },
];

export const TABS = [
  { key: 'all',     label: 'Master Donation Register', icon: BookOpen },
  { key: 'inhouse', label: 'Inhouse Donations',        icon: Home },
  { key: 'camp',    label: 'Camp Donations',            icon: Building2 },
];

export const PAGE_SIZE = 20;
