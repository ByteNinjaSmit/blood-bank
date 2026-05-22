'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Clock,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { content } from '@/lib/content';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const COMPONENT_TYPES = ['RBC', 'FFP', 'Platelet', 'Cryo'] as const;

type BloodGroup = (typeof BLOOD_GROUPS)[number];
type ComponentType = (typeof COMPONENT_TYPES)[number];
type StockGrid = Record<ComponentType, Record<BloodGroup, number>>;

const INITIAL_STOCK: StockGrid = {
  RBC: { 'A+': 12, 'A-': 4, 'B+': 15, 'B-': 3, 'AB+': 8, 'AB-': 2, 'O+': 22, 'O-': 6 },
  FFP: { 'A+': 8, 'A-': 2, 'B+': 10, 'B-': 1, 'AB+': 5, 'AB-': 0, 'O+': 14, 'O-': 3 },
  Platelet: { 'A+': 3, 'A-': 0, 'B+': 5, 'B-': 2, 'AB+': 2, 'AB-': 1, 'O+': 8, 'O-': 2 },
  Cryo: { 'A+': 15, 'A-': 5, 'B+': 18, 'B-': 4, 'AB+': 10, 'AB-': 3, 'O+': 25, 'O-': 8 },
};

const COMPONENT_LABELS: Record<'en' | 'mr', Record<ComponentType, string>> = {
  en: {
    RBC: 'Red Blood Cells',
    FFP: 'Fresh Frozen Plasma',
    Platelet: 'Platelets',
    Cryo: 'Cryoprecipitate',
  },
  mr: {
    RBC: 'तांबड्या रक्तपेशी (RBC)',
    FFP: 'फ्रेश फ्रोजन प्लाझ्मा (FFP)',
    Platelet: 'प्लेटलेट्स (Platelets)',
    Cryo: 'क्रायोप्रेसिपीटेट (Cryo)',
  }
};

function cellDot(n: number) {
  if (n === 0) return 'bg-red-500';
  if (n <= 3) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function cellTextColor(n: number) {
  if (n === 0) return 'text-red-600 font-bold';
  if (n <= 3) return 'text-amber-700 font-semibold';
  return 'text-slate-700 font-medium';
}

interface StockDirectoryProps {
  onLogout: () => void;
}

export default function StockDirectory({ onLogout }: StockDirectoryProps) {
  const { language } = useLanguage();
  const t = content[language].hospitalPortal;

  const [grid, setGrid] = useState<StockGrid>(INITIAL_STOCK);
  const [timestamp, setTimestamp] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTimestamp(new Date().toISOString());
  }, []);

  /* ---- Simulate Stock refresh ---- */
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);

    setTimeout(() => {
      const updatedGrid = { ...grid };
      for (const ct of COMPONENT_TYPES) {
        updatedGrid[ct] = { ...grid[ct] };
        for (const bg of BLOOD_GROUPS) {
          if (Math.random() > 0.6) {
            const current = updatedGrid[ct][bg];
            const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            updatedGrid[ct][bg] = Math.max(0, current + change);
          }
        }
      }
      
      setGrid(updatedGrid);
      setTimestamp(new Date().toISOString());
      setRefreshing(false);
    }, 800);
  };

  /* ---- Calculations ---- */
  const componentTotals: Record<ComponentType, number> = {} as Record<ComponentType, number>;
  const bloodGroupTotals: Record<BloodGroup, number> = {} as Record<BloodGroup, number>;
  let grandTotal = 0;

  for (const ct of COMPONENT_TYPES) {
    componentTotals[ct] = 0;
    for (const bg of BLOOD_GROUPS) {
      componentTotals[ct] += grid[ct][bg];
    }
    grandTotal += componentTotals[ct];
  }

  for (const bg of BLOOD_GROUPS) {
    bloodGroupTotals[bg] = 0;
    for (const ct of COMPONENT_TYPES) {
      bloodGroupTotals[bg] += grid[ct][bg];
    }
  }

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <motion.div
      key="dashboard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 pt-36 md:pt-40 pb-16 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Minimal Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              {t.connectedPortal}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {formattedTime && (
              <span className="flex items-center gap-1 text-slate-400 font-normal">
                <Clock className="w-3.5 h-3.5" />
                {t.updated} {formattedTime}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-[#8B0000] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-[#8B0000] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.signOut}
            </button>
          </div>
        </div>

        {/* Minimalist Dashboard Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          
          {/* Simple Minimalist Grid Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider w-40">
                      {t.bloodComponent}
                    </th>
                    {BLOOD_GROUPS.map((bg) => (
                      <th key={bg} className="px-3 py-4 text-center font-bold text-slate-800 w-20 border-l border-slate-100">
                        {bg}
                      </th>
                    ))}
                    <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase tracking-wider w-24 border-l border-slate-200 bg-slate-50">
                      {t.totals}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPONENT_TYPES.map((ct) => (
                    <tr key={ct} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4.5 font-bold text-slate-800">
                        {COMPONENT_LABELS[language][ct]}
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{ct}</span>
                      </td>
                      {BLOOD_GROUPS.map((bg) => {
                        const count = grid[ct][bg];
                        return (
                          <td key={bg} className="px-3 py-4.5 text-center border-l border-slate-100">
                            <div className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cellDot(count)}`} />
                              <span className={cellTextColor(count)}>{count}</span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-4.5 text-center font-bold text-slate-900 border-l border-slate-200 bg-slate-50/30">
                        {componentTotals[ct]}
                      </td>
                    </tr>
                  ))}

                  {/* Table Totals Row */}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="px-5 py-4 text-slate-500 uppercase tracking-wider">
                      {t.totalAvailable}
                    </td>
                    {BLOOD_GROUPS.map((bg) => (
                      <td key={bg} className="px-3 py-4 text-center border-l border-slate-100 text-slate-900 font-bold">
                        {bloodGroupTotals[bg]}
                      </td>
                    ))}
                    <td className="px-4 py-4 text-center text-sm font-black text-[#8B0000] border-l border-slate-200 bg-slate-100/80">
                      {grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtle Minimalist Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400 px-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-500">{t.legendTitle}</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {t.criticalSupply}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {t.lowSupply}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t.healthySupply}
              </span>
            </div>
            <div className="text-right text-slate-400 font-normal">
              {t.footerNote}
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}
