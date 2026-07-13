import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Package,
  Activity,
  CheckCircle,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Plus,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';
import { useDashboardStats } from '../queries';

export default function ChemicalDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading chemical inventory dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-500">Failed to load statistics.</p>
      </div>
    );
  }

  const lowStockCount = stats?.lowStockItems?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chemical & Reagent Inventory</h1>
            <p className="text-gray-500 text-sm">Chemical inventory overview</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/chemical-inventory/purchase')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white text-sm font-semibold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Purchase
          </button>
          <button
            onClick={() => navigate('/chemical-inventory/usage')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Activity className="w-4 h-4 text-red-700" /> Log Usage
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Chemicals */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">Chemicals</span>
            <div className="p-1.5 bg-gray-50 rounded text-gray-500"><FlaskConical className="w-4 h-4" /></div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-800">{stats?.totalChemicals ?? 0}</div>
            <div className="text-[10px] text-gray-500 font-medium">Master Catalog</div>
          </div>
        </div>

        {/* Available Stock */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">Available</span>
            <div className="p-1.5 bg-green-50 rounded text-green-600"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-green-700">{stats?.availableStock ?? 0}</div>
            <div className="text-[10px] text-green-600 font-medium">Unopened Units</div>
          </div>
        </div>

        {/* In Use Stock */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">In Use</span>
            <div className="p-1.5 bg-orange-50 rounded text-orange-500"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-orange-700">{stats?.inUseStock ?? 0}</div>
            <div className="text-[10px] text-orange-600 font-medium">Currently Opened</div>
          </div>
        </div>

        {/* Consumed this month */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">Consumed</span>
            <div className="p-1.5 bg-blue-50 rounded text-blue-600"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-700">{stats?.consumedThisMonth ?? 0}</div>
            <div className="text-[10px] text-blue-600 font-medium">This Month</div>
          </div>
        </div>

        {/* Expired Stock */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">Expired</span>
            <div className="p-1.5 bg-red-50 rounded text-red-600"><ShieldAlert className="w-4 h-4" /></div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-700">{stats?.expiredStock ?? 0}</div>
            <div className="text-[10px] text-red-600 font-medium">Requires Disposal</div>
          </div>
        </div>

        {/* Near Expiry */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase">Near Expiry</span>
            <div className="p-1.5 bg-yellow-50 rounded text-yellow-600"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-yellow-700">{stats?.nearExpiryStock ?? 0}</div>
            <div className="text-[10px] text-yellow-600 font-medium">Expiry &lt; 90 Days</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left column Alerts/Low Stock, Right column Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Warning & Low Stock Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Low Stock Threshold Alerts ({lowStockCount})
              </h3>
            </div>
            <div className="p-5">
              {lowStockCount === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  🎉 All chemical inventory levels are healthy!
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto scrollbar-none">
                  {stats?.lowStockItems.map((item) => (
                    <div key={item.chemicalId} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <span className="text-xs text-gray-500">Reorder Level: {item.reorderLevel} units</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-100">
                          {item.available} Available
                        </span>
                        <button
                          onClick={() => navigate('/chemical-inventory/purchase', { state: { chemicalId: item.chemicalId } })}
                          className="p-1 hover:bg-gray-100 text-gray-500 hover:text-red-700 rounded transition-colors"
                          title="Purchase new stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-800 to-red-950 p-5 rounded-xl text-white flex flex-col justify-between h-[150px]">
              <div>
                <h4 className="font-bold text-base">Expiry Monitoring Dashboard</h4>
                <p className="text-xs text-red-100 mt-1">Review active, near expiry, and expired chemical stock lots.</p>
              </div>
              <button
                onClick={() => navigate('/chemical-inventory/expiry')}
                className="self-start inline-flex items-center gap-2 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
              >
                Monitor Expirations <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl text-white flex flex-col justify-between h-[150px]">
              <div>
                <h4 className="font-bold text-base">Consumption & Supplier Reports</h4>
                <p className="text-xs text-gray-300 mt-1">Generate monthly registers, usage trend curves, and suppliers billing.</p>
              </div>
              <button
                onClick={() => navigate('/chemical-inventory/reports')}
                className="self-start inline-flex items-center gap-2 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
              >
                Access Reports <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Purchases */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-700" />
              Recent Purchase Lots
            </h3>
          </div>
          <div className="p-5">
            {(!stats?.recentPurchases || stats.recentPurchases.length === 0) ? (
              <div className="text-center py-12 text-sm text-gray-500">
                No recent purchases logged.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentPurchases.map((lot) => (
                  <div key={lot._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-red-100 hover:bg-red-50/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-800">{lot.chemicalId?.name}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Supplier: {lot.supplierId?.name}</span>
                        <span className="text-[10px] text-gray-500">Lot No: {lot.lotNumber}</span>
                      </div>
                      <span className="text-xs font-bold text-red-800">
                        +{lot.qtyPurchased}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100/50 flex justify-between text-[10px] text-gray-400">
                      <span>Date: {new Date(lot.purchaseDate).toLocaleDateString('en-IN')}</span>
                      <span>Total: ₹{lot.totalCost}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
