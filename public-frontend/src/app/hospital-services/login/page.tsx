'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HospitalLogin from '../hospital-login';

export default function HospitalLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear existing token so visiting /hospital-services/login always presents a fresh login form
    sessionStorage.removeItem('hospital_token');
  }, []);

  const handleLoginSuccess = (token: string, name: string) => {
    sessionStorage.setItem('hospital_token', token);
    router.push('/hospital-services');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading...
      </div>
    );
  }

  return <HospitalLogin onLoginSuccess={handleLoginSuccess} />;
}
