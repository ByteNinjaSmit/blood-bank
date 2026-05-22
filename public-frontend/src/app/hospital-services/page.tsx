'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StockDirectory from './stock-directory';

export default function HospitalServicesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = sessionStorage.getItem('hospital_token');
    if (!token) {
      router.replace('/hospital-services/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('hospital_token');
    router.push('/hospital-services/login');
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading...
      </div>
    );
  }

  return <StockDirectory onLogout={handleLogout} />;
}
