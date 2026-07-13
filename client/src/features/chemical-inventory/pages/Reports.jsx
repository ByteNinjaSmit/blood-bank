import React, { useState } from 'react';
import { useSupplierList, useMonthlyReport, useSupplierReport, useExpiryReport, useConsumptionReport } from '../queries';
import { BarChart3, Calendar, FileText, ShoppingBag, Download, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly');

  // Filter States
  const [monthlyFilter, setMonthlyFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  
  const [supplierFilter, setSupplierFilter] = useState({
    supplierId: '',
    startDate: '',
    endDate: '',
  });

  const { data: suppliers } = useSupplierList();

  // Queries
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyReport(
    activeTab === 'monthly' ? monthlyFilter : null
  );
  const { data: supplierData, isLoading: loadingSupplier } = useSupplierReport(
    activeTab === 'supplier' ? supplierFilter : null
  );
  const { data: expiryData, isLoading: loadingExpiry } = useExpiryReport();
  const { data: consumptionData, isLoading: loadingConsumption } = useConsumptionReport();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (data, filename = 'report.csv') => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'object' ? value?.name || '' : `"${value}"`
      ).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 print:bg-white print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
            <p className="text-gray-500 text-sm">Chemical inventory reports</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 gap-6 print:hidden">
        {[
          { id: 'monthly', label: 'Monthly Stock Report', icon: <Calendar className="w-4 h-4" /> },
          { id: 'supplier', label: 'Supplier Purchases', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'expiry', label: 'Expiry Reports', icon: <FileText className="w-4 h-4" /> },
          { id: 'consumption', label: 'Consumption Trends', icon: <BarChart3 className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 flex items-center gap-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-red-800 text-red-800'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Monthly Stock Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center justify-between print:hidden">
            <div className="flex gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Month</label>
                <select
                  value={monthlyFilter.month}
                  onChange={(e) => setMonthlyFilter({ ...monthlyFilter, month: Number(e.target.value) })}
                  className="border border-gray-200 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Year</label>
                <select
                  value={monthlyFilter.year}
                  onChange={(e) => setMonthlyFilter({ ...monthlyFilter, year: Number(e.target.value) })}
                  className="border border-gray-200 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => handleExportCSV(monthlyData, `MonthlyStockRegister_${monthlyFilter.month}_${monthlyFilter.year}.csv`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white text-xs font-bold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-sm">
                Chemical Monthly Stock Register — {new Date(0, monthlyFilter.month - 1).toLocaleString('default', { month: 'long' })} {monthlyFilter.year}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    {['Chemical Name', 'Unit Type', 'Opening Stock', 'Purchased', 'Opened (to In Use)', 'Consumed (Completed)', 'Expired', 'In Use (Remaining)', 'Closing Available', 'Closing Total'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingMonthly ? (
                    <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">Generating monthly stock report...</td></tr>
                  ) : (!monthlyData || monthlyData.length === 0) ? (
                    <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">No records found.</td></tr>
                  ) : monthlyData.map((item, idx) => {
                    const closingAvailable = item.closingStock - item.inUse;
                    return (
                      <tr key={idx} className="hover:bg-red-50/5 transition-colors">
                        <td className="px-5 py-3 text-sm font-bold text-gray-900">{item.chemicalName}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{item.unitType}</td>
                        <td className="px-5 py-3 text-sm text-gray-700 font-medium">{item.openingStock}</td>
                        <td className="px-5 py-3 text-sm text-green-700 font-bold">+{item.purchased}</td>
                        <td className="px-5 py-3 text-sm text-orange-700">-{item.opened}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">-{item.consumed}</td>
                        <td className="px-5 py-3 text-sm text-red-600">-{item.expired}</td>
                        <td className="px-5 py-3 text-sm text-orange-800 font-bold">{item.inUse}</td>
                        <td className="px-5 py-3 text-sm text-green-700 font-bold">{closingAvailable}</td>
                        <td className="px-5 py-3 text-sm font-bold text-gray-900">{item.closingStock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Purchases Report */}
      {activeTab === 'supplier' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center justify-between print:hidden">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Supplier</label>
                <select
                  value={supplierFilter.supplierId}
                  onChange={(e) => setSupplierFilter({ ...supplierFilter, supplierId: e.target.value })}
                  className="border border-gray-200 rounded px-2.5 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 w-52"
                >
                  <option value="">All Suppliers</option>
                  {(suppliers || []).map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={supplierFilter.startDate}
                  onChange={(e) => setSupplierFilter({ ...supplierFilter, startDate: e.target.value })}
                  className="border border-gray-200 rounded px-2.5 py-0.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">End Date</label>
                <input
                  type="date"
                  value={supplierFilter.endDate}
                  onChange={(e) => setSupplierFilter({ ...supplierFilter, endDate: e.target.value })}
                  className="border border-gray-200 rounded px-2.5 py-0.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
            <button
              onClick={() => handleExportCSV(supplierData, 'SupplierPurchaseReport.csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white text-xs font-bold rounded-lg hover:bg-red-900 shadow-sm transition-colors align-self-end"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-sm">Supplier Purchases Audit</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    {['Purchase Date', 'Invoice No', 'Chemical / Item', 'Supplier', 'Manufacturer', 'Lot No', 'Batch No', 'Qty', 'Unit Cost', 'Total Cost'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingSupplier ? (
                    <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">Loading purchases...</td></tr>
                  ) : (!supplierData || supplierData.length === 0) ? (
                    <tr><td colSpan={10} className="py-12 text-center text-sm text-gray-500">No purchases matching search parameters.</td></tr>
                  ) : supplierData.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-red-50/5 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-700 font-medium">{new Date(lot.purchaseDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 text-sm text-gray-900">{lot.invoiceNumber}</td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-900">{lot.chemicalId?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{lot.supplierId?.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{lot.manufacturerId?.name}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-700">{lot.lotNumber}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-700">{lot.batchNumber}</td>
                      <td className="px-5 py-3 text-sm text-gray-900 font-bold">{lot.qtyPurchased} {lot.chemicalId?.unitType}s</td>
                      <td className="px-5 py-3 text-sm text-gray-600">₹{lot.costPerUnit}</td>
                      <td className="px-5 py-3 text-sm font-bold text-red-950">₹{lot.totalCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Report */}
      {activeTab === 'expiry' && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => handleExportCSV(expiryData, 'InventoryExpiryReport.csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white text-xs font-bold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-sm">Expired and Near-Expiry Lot Summaries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    {['Chemical / Reagent', 'Lot Number', 'Batch Number', 'Expiry Date', 'Available Qty', 'In Use Qty', 'Days Remaining', 'Severity Status'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingExpiry ? (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">Generating expiry report...</td></tr>
                  ) : (!expiryData || expiryData.length === 0) ? (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-500">No expired or near-expiry stock.</td></tr>
                  ) : expiryData.map((lot, idx) => {
                    const today = new Date();
                    const expiry = new Date(lot.expiryDate);
                    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    const isExpired = diffDays <= 0;

                    let statusText = 'Active';
                    let badgeColor = 'bg-green-50 text-green-700 border-green-200';
                    if (isExpired) {
                      statusText = 'Expired';
                      badgeColor = 'bg-red-50 text-red-700 border-red-200';
                    } else if (diffDays <= 30) {
                      statusText = 'Near Expiry (30 Days)';
                      badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                    } else if (diffDays <= 90) {
                      statusText = 'Near Expiry (90 Days)';
                      badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    }

                    return (
                      <tr key={idx} className="hover:bg-red-50/5 transition-colors">
                        <td className="px-5 py-3 text-sm font-bold text-gray-900">{lot.chemicalId?.name}</td>
                        <td className="px-5 py-3 text-sm font-mono text-gray-600">{lot.lotNumber}</td>
                        <td className="px-5 py-3 text-sm font-mono text-gray-600">{lot.batchNumber}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {new Date(lot.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-900 font-semibold">{lot.qtyAvailable}</td>
                        <td className="px-5 py-3 text-sm text-orange-700 font-semibold">{lot.qtyInUse}</td>
                        <td className="px-5 py-3 text-sm text-gray-700 font-medium">
                          {isExpired ? `Expired ${Math.abs(diffDays)} days ago` : `${diffDays} days left`}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Consumption Report */}
      {activeTab === 'consumption' && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => handleExportCSV(consumptionData, 'ChemicalConsumptionTrends.csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white text-xs font-bold rounded-lg hover:bg-red-900 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-sm">Monthly Consumption Trends (Last 6 Months)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    {['Chemical Name', 'Month / Year', 'Quantity Consumed'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingConsumption ? (
                    <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-500">Analyzing usage patterns...</td></tr>
                  ) : (!consumptionData || consumptionData.length === 0) ? (
                    <tr><td colSpan={3} className="py-12 text-center text-sm text-gray-500">No consumption logged in the last 6 months.</td></tr>
                  ) : consumptionData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-red-50/5 transition-colors">
                      <td className="px-5 py-3 text-sm font-bold text-gray-900">{item.chemicalName}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 flex items-center gap-1.5">
                        {new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-sm text-red-700 font-bold">{item.totalConsumed} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
