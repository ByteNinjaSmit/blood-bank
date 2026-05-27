'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HospitalDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hospital-services');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
      Redirecting to live stock directory...
    </div>
  );
}
