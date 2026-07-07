import React, { useState } from 'react';
import { PlayCircle, AlertTriangle } from 'lucide-react';
import StockUsageTab from '../components/StockUsageTab';
import DamagedStockTab from '../components/DamagedStockTab';

const TABS = [
  { key: 'usage', label: 'Stock Usage', icon: PlayCircle },
  { key: 'damaged', label: 'Damaged Stock', icon: AlertTriangle },
];

export default function StockUsage() {
  const [activeTab, setActiveTab] = useState('usage');

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Usage Logic</h1>
        <p className="text-sm text-gray-500 font-medium">
          {activeTab === 'usage'
            ? 'Start chemical units (Available ➔ In Use) and complete them (In Use ➔ Consumed)'
            : 'Register and manage damaged chemical stock — deleting a record restores its quantity to available stock'}
        </p>
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
