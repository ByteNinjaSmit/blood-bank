import React from 'react';
import { Activity, CheckCircle2, XCircle, Users } from 'lucide-react';

export default function DonorStatsCards({ total, eligible, deferred, showing }) {
  const stats = [
    { label: 'Total Records',   value: total,    icon: Activity,     cls: 'text-gray-700 bg-white border-gray-200' },
    { label: 'Eligible Donors', value: eligible, icon: CheckCircle2, cls: 'text-green-700 bg-green-50 border-green-200' },
    { label: 'Deferred Donors', value: deferred, icon: XCircle,      cls: 'text-red-700 bg-red-50 border-red-200' },
    { label: 'Showing',         value: showing,  icon: Users,        cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const StatIcon = stat.icon;
        return (
          <div key={stat.label} className={`rounded-xl border p-4 flex items-center gap-3 ${stat.cls}`}>
            <StatIcon className="w-5 h-5 flex-shrink-0 opacity-70" />
            <div>
              <p className="text-xs font-medium opacity-70">{stat.label}</p>
              <p className="text-2xl font-bold leading-none mt-0.5">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
