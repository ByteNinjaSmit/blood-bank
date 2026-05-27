import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hospital Services - Sanjivani Blood Bank',
  description: 'Hospital portal for accessing blood bank inventory and services.',
};

export default function HospitalServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
