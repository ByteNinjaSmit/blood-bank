import React, { useState } from 'react';
import { PlayCircle, AlertTriangle, Package } from 'lucide-react';
import StockUsageTab from '../components/StockUsageTab';
import DamagedStockTab from '../components/DamagedStockTab';

const TABS = [
  { key: 'usage', label: 'Stock Usage', icon: PlayCircle },
  { key: 'damaged', label: 'Damaged Stock', icon: AlertTriangle },
];

export default function StockUsage() {
  const [activeTab, setActiveTab] = useState('usage');

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
          <Package className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Usage Logic</h1>
          <p className="text-gray-500 text-sm">
            {activeTab === 'usage'
              ? 'Start chemical units (Available ➔ In Use) and complete them (In Use ➔ Consumed)'
              : 'Register and manage damaged chemical stock — deleting a record restores its quantity to available stock'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 -mb-px">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-red-800 text-red-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'usage' ? <StockUsageTab /> : <DamagedStockTab />}
    </div>
  );
}
