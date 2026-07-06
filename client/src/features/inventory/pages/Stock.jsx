import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Boxes, Search, ChevronLeft, ChevronRight, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockSummary } from "@/features/inventory/queries";
import ExportExcelDropdown from "@/components/shared/ExportExcelDropdown";
import { exportStock } from "@/utils/excelExportHelper";

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMPONENT_THEMES = {
  RBC: {
    bgClass: 'bg-red-50/20 border-red-100',
    titleClass: 'text-red-800 border-red-200',
    labelClass: 'bg-red-700 text-white',
    activeBubble: 'border-red-300 bg-red-50 text-red-800',
    activeText: 'text-red-900',
    activeBgLabel: 'text-red-700',
  },
  FFP: {
    bgClass: 'bg-amber-50/20 border-amber-100',
    titleClass: 'text-amber-800 border-amber-200',
    labelClass: 'bg-amber-700 text-white',
    activeBubble: 'border-amber-300 bg-amber-50 text-amber-800',
    activeText: 'text-amber-900',
    activeBgLabel: 'text-amber-700',
  },
  Platelets: {
    bgClass: 'bg-yellow-50/20 border-yellow-100',
    titleClass: 'text-yellow-800 border-yellow-200',
    labelClass: 'bg-yellow-700 text-white',
    activeBubble: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    activeText: 'text-yellow-900',
    activeBgLabel: 'text-yellow-700',
  },
  Cryo: {
    bgClass: 'bg-blue-50/20 border-blue-100',
    titleClass: 'text-blue-800 border-blue-200',
    labelClass: 'bg-blue-700 text-white',
    activeBubble: 'border-blue-300 bg-blue-50 text-blue-800',
    activeText: 'text-blue-900',
    activeBgLabel: 'text-blue-700',
  },
};

function ComponentStockLines({ stockSummary }) {
  const initialStock = () => ({ 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 });
  const stocks = {
    RBC: initialStock(),
    FFP: initialStock(),
    Platelets: initialStock(),
    Cryo: initialStock(),
  };

  if (stockSummary && Array.isArray(stockSummary)) {
    stockSummary.forEach((s) => {
      let type = s.componentType;
      if (type === 'PRBC' || type === 'RBC') type = 'RBC';
      else if (type === 'FFP') type = 'FFP';
      else if (type === 'PLATELET_CONCENTRATE' || type === 'Platelet' || type === 'PLATELET') type = 'Platelets';
      else if (type === 'CRYOPRECIPITATE' || type === 'Cryo' || type === 'CRYO') type = 'Cryo';
      else return;
      
      const rh = s.rhFactor === 'POSITIVE' || s.rhFactor === 'Positive' ? '+' : s.rhFactor === 'NEGATIVE' || s.rhFactor === 'Negative' ? '-' : '';
      const key = `${s.aboGroup}${rh}`;
      if (stocks[type] && stocks[type][key] !== undefined) {
        stocks[type][key] += s.count;
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 overflow-hidden">
      <h2 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 text-red-800">
        Blood Component Stock Summary
      </h2>
      
      <div className="overflow-x-auto overflow-y-hidden pb-2">
        <div className="min-w-[680px]">
          {/* Header Row */}
          <div className="flex items-center gap-4 mb-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-[120px] text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Component</div>
            <div className="flex-1 flex items-center justify-between">
              {BLOOD_GROUPS.map((bg, idx) => (
                <div key={bg} className="flex items-center justify-center flex-1">
                  {idx > 0 && <div className="h-4 w-[1px] bg-gray-300 mr-4" />}
                  <span className="text-xs font-extrabold text-gray-700 w-12 text-center uppercase tracking-wider">
                    {bg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {Object.keys(stocks).map((type) => {
              const theme = COMPONENT_THEMES[type];
              const data = stocks[type];
              return (
                <div key={type} className={`flex items-center gap-4 p-3 rounded-xl border ${theme.bgClass}`}>
                  {/* Left Label */}
                  <div className="w-[120px] flex items-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${theme.labelClass} shadow-sm text-center w-full`}>
                      {type}
                    </span>
                  </div>

                  {/* Stock Columns */}
                  <div className="flex-1 flex items-center justify-between">
                    {BLOOD_GROUPS.map((bg, idx) => {
                      const count = data[bg] ?? 0;
                      const hasStock = count > 0;
                      return (
                        <div key={bg} className="flex items-center justify-center flex-1">
                          {idx > 0 && <div className="h-8 w-[1px] bg-gray-200 mr-4" />}
                          <div className={`flex items-center justify-center w-12 h-10 rounded-full border transition-all duration-200 ${
                            hasStock 
                              ? `${theme.activeBubble} shadow-sm font-black` 
                              : 'border-gray-200 bg-gray-50/30 text-gray-400 font-medium'
                          }`}>
                            <span className="text-xs">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const CODE39_PATTERNS = {
  '0': 'n n n w w n w n n',
  '1': 'w n n w n n n n w',
  '2': 'n n w w n n n n w',
  '3': 'w n w w n n n n n',
  '4': 'n n n w w n n n w',
  '5': 'w n n w w n n n n',
  '6': 'n n w w w n n n n',
  '7': 'n n n w n n w n w',
  '8': 'w n n w n n w n n',
  '9': 'n n w w n n w n n',
  'A': 'w n n n n w n n w',
  'B': 'n n w n n w n n w',
  'C': 'w n w n n w n n n',
  'D': 'n n n n w w n n w',
  'E': 'w n n n w w n n n',
  'F': 'n n w n w w n n n',
  'G': 'n n n n n w w n w',
  'H': 'w n n n n w w n n',
  'I': 'n n w n n w w n n',
  'J': 'n n n n w w w n n',
  'K': 'w n n n n n n w w',
  'L': 'n n w n n n n w w',
  'M': 'w n w n n n n w n',
  'N': 'n n n n w n n w w',
  'O': 'w n n n w n n w n',
  'P': 'n n w n w n n w n',
  'Q': 'n n n n n n w w w',
  'R': 'w n n n n n w w n',
  'S': 'n n w n n n w w n',
  'T': 'n n n n w n w w n',
  'U': 'w w n n n n n n w',
  'V': 'n w w n n n n n w',
  'W': 'w w w n n n n n n',
  'X': 'n w n n w n n n w',
  'Y': 'w w n n w n n n n',
  'Z': 'n w w n w n n n n',
  '-': 'n w n n n n w n w',
  '.': 'w w n n n n w n n',
  ' ': 'n w w n n n w n n',
  '*': 'n w n n w n w n n',
  '$': 'n w n w n w n n n',
  '/': 'n w n w n n n w n',
  '+': 'n w n n n w n w n',
  '%': 'n n n w n w n w n'
};

const Code39Barcode = ({ value, width = 1.0, height = 30, className = "" }) => {
  if (!value) return null;
  const uppercaseValue = `*${value.toString().toUpperCase()}*`;
  
  const narrowWidth = width;
  const wideWidth = width * 3.0;
  
  let currentX = 0;
  const rects = [];
  
  for (let i = 0; i < uppercaseValue.length; i++) {
    const char = uppercaseValue[i];
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) continue;
    
    const elements = pattern.split(' ');
    elements.forEach((size, index) => {
      const isBar = index % 2 === 0;
      const elementWidth = size === 'w' ? wideWidth : narrowWidth;
      
      if (isBar) {
        rects.push(
          <rect
            key={`${i}-${index}`}
            x={currentX}
            y={0}
            width={elementWidth}
            height={height}
            fill="black"
          />
        );
      }
      currentX += elementWidth;
    });
    
    currentX += narrowWidth;
  }
  
  return (
    <svg width={currentX} height={height} viewBox={`0 0 ${currentX} ${height}`} className={`max-w-full ${className}`}>
      {rects}
    </svg>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const Stock = () => {
  const { API, authorizationToken } = useAuth();
  const { data: stockSummaryData } = useStockSummary();

  const [isLoading, setIsLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [selectedPrintItem, setSelectedPrintItem] = useState(null);

  // filters
  const [componentType, setComponentType] = useState("");
  const [status, setStatus] = useState("in-stock");
  const [siteId, setSiteId] = useState("");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchRows = async (page = 1, limit = pagination.limit) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/api/inventory`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
        params: {
          page,
          limit,
          status,
          componentType: componentType || undefined,
          siteId: siteId || undefined,
          search: search || undefined,
          sortBy,
          order,
        },
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setPagination((p) => ({ ...p, ...(res.data?.pagination || {}) }));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch inventory");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async (exportAll = false) => {
    try {
      setExcelLoading(true);
      let dataToExport = rows;
      if (exportAll) {
        toast.info("Fetching complete stock list for export...");
        const res = await axios.get(`${API}/api/inventory`, {
          headers: { Authorization: authorizationToken },
          withCredentials: true,
          params: {
            page: 1,
            limit: 5000,
            status,
            componentType: componentType || undefined,
            siteId: siteId || undefined,
            search: search || undefined,
            sortBy,
            order,
          },
        });
        dataToExport = Array.isArray(res.data?.data) ? res.data.data : [];
      }
      await exportStock(dataToExport);
    } catch (e) {
      toast.error("Failed to generate Excel report");
    } finally {
      setExcelLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, componentType, siteId, search, order, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 uppercase tracking-tight">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Inventory Stock</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Management Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ComponentStockLines stockSummary={stockSummaryData} />
        {/* Compact Filters Section */}
        <Card className="mb-4 border-red-100 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Bag Number</label>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                  <Input
                    placeholder="Enter Bag Number..."
                    value={search}
                    onChange={(e) => {setSearch(e.target.value); setPagination(p=>({...p,page:1}));}}
                    className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Component Type */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Component Type</label>
                <Select value={componentType || "all"} onValueChange={(val) => {setComponentType(val === "all" ? "" : val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Components" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    <SelectItem value="RBC">RBC</SelectItem>
                    <SelectItem value="FFP">FFP</SelectItem>
                    <SelectItem value="Platelet">Platelet</SelectItem>
                    <SelectItem value="Cryo">Cryo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Filter Status</label>
                <Select value={status} onValueChange={(val) => {setStatus(val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sort Order</label>
                <Select value={order} onValueChange={(val) => {setOrder(val); setPagination(p=>({...p,page:1}));}}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                {(search || componentType || status !== "in-stock") && (
                  <button 
                    onClick={() => {setSearch(""); setComponentType(""); setStatus("in-stock"); setPagination(p=>({...p,page:1}));}}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <Button onClick={()=>fetchRows(pagination.page)} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                </Button>
                <ExportExcelDropdown onExport={handleExportExcel} isLoading={excelLoading} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="text-sm font-semibold text-gray-700">Inventory Records ({pagination.total || 0})</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading stock...
                        </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                    <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500 font-medium">
                        No inventory items found matching the selection.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r?.bag?.bagNo || r.bagNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.componentType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.bag?.bloodGroup} {r?.bag?.rh}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {r?.bag?.donationDate ? (() => {
                          const d = new Date(r.bag.donationDate);
                          if (isNaN(d.getTime())) return '-';
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r?.component?.volumeMl} mL</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {r?.component?.expiryDate ? (() => {
                          const d = new Date(r.component.expiryDate);
                          if (isNaN(d.getTime())) return '-';
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                r.status === "in-stock"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : r.status === "reserved"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-gray-50 text-gray-700 border-gray-100"
                            }`}
                        >
                            {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button
                          onClick={() => setSelectedPrintItem(r)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold text-red-800 hover:text-white hover:bg-red-800 border-red-200"
                        >
                          Print Label
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Refined Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/10">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <Select 
                  value={pagination.limit.toString()} 
                  onValueChange={(val) => {
                    const newLimit = Number(val);
                    setPagination(p => ({ ...p, limit: newLimit, page: 1 }));
                    fetchRows(1, newLimit);
                  }}
                >
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const page = Math.max(1, pagination.page - 1);
                    setPagination(p => ({ ...p, page }));
                    fetchRows(page);
                  }}
                  disabled={pagination.page === 1 || isLoading}
                  className="h-8 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  PREV
                </Button>
                
                <div className="flex items-center gap-1">
                    {(() => {
                        const pages = [];
                        let startPage = Math.max(1, pagination.page - 2);
                        let endPage = Math.min(pagination.totalPages, pagination.page + 2);
                        
                        if (endPage - startPage < 4) {
                            if (startPage === 1) endPage = Math.min(pagination.totalPages, startPage + 4);
                            else startPage = Math.max(1, endPage - 4);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                            if (i > 0 && i <= pagination.totalPages) {
                                pages.push(
                                    <Button
                                        key={i}
                                        variant={pagination.page === i ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setPagination(p => ({ ...p, page: i }));
                                            fetchRows(i);
                                        }}
                                        disabled={isLoading}
                                        className={`w-8 h-8 p-0 text-xs font-bold ${pagination.page === i ? "bg-red-600 hover:bg-red-700" : ""}`}
                                    >
                                        {i}
                                    </Button>
                                );
                            }
                        }
                        return pages;
                    })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const page = Math.min(pagination.totalPages, pagination.page + 1);
                    setPagination(p => ({ ...p, page }));
                    fetchRows(page);
                  }}
                  disabled={pagination.page === pagination.totalPages || isLoading}
                  className="h-8 text-xs font-bold"
                >
                  NEXT
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {selectedPrintItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs no-print select-none">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl relative flex flex-col items-center">
            <button 
              onClick={() => setSelectedPrintItem(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              Blood Bag Label Print Preview
            </h3>

            {/* Printable Label Area of Size 13cm x 12cm */}
            <div 
              className="printable-label-area border border-black bg-white flex flex-col text-black font-sans relative overflow-hidden shrink-0 select-none"
              style={{ 
                width: '13cm', 
                height: '12cm', 
                boxSizing: 'border-box', 
                padding: '0.2cm',
                border: '1.5px solid black',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* CSS Print Styles to Isolate the Label during Printing */}
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  .printable-label-area, .printable-label-area * {
                    visibility: visible !important;
                  }
                  .printable-label-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 13cm !important;
                    height: 12cm !important;
                    margin: 0 !important;
                    padding: 0.2cm !important;
                    border: 1.5px solid black !important;
                    box-shadow: none !important;
                    box-sizing: border-box !important;
                  }
                  @page {
                    size: auto !important;
                    margin: 0 !important;
                  }
                }
              `}} />

              {/* Blood Bank Header matching the image */}
              <div className="w-full flex flex-col items-center justify-center border-b border-black pb-1 mb-1 bg-white shrink-0 text-center relative select-none" style={{ height: '2.4cm' }}>
                <span className="text-[7px] font-bold tracking-wide text-black uppercase">Sai Healthcare Foundation Charitable Trusts</span>
                <div className="flex flex-col items-center justify-center w-[90%] mx-auto my-0.5">
                  <h3 className="text-[24px] font-black text-black leading-none tracking-tight uppercase" style={{ wordSpacing: '2px' }}>
                    SANJIVANI BLOOD CENTRE
                  </h3>
                  <div className="w-full flex justify-between text-[7px] font-black tracking-tight text-black uppercase mt-0.5 px-0.5">
                    <span>(F.D.A. Lic. No. N-KD 15)</span>
                    <span>(SBTC Reg. No. - 0031)</span>
                  </div>
                </div>
                <span className="text-[7.5px] font-black leading-none text-black uppercase mt-0.5">
                  110-2-B, 'Nishigandha', Vivekanandnagar, Near S. G. Vidyalaya,
                </span>
                <span className="text-[7.5px] font-black mt-1 leading-none text-black uppercase">
                  Kopargaon - 423 601, Dist. Ahmednagar. (M.S.) <span style={{ filter: 'grayscale(100%) contrast(100%) brightness(0)' }}>☎︎</span> - (02423) 222237
                </span>
              </div>

              {/* Middle Section (divided into Blood Group, Component details, and QR code/Dates) */}
              <div className="flex w-full border-b border-black pb-1.5 shrink-0" style={{ height: '4.1cm' }}>
                {/* Left Side: Huge Blood Group Display */}
                <div className="w-[3.0cm] flex flex-col items-center justify-center border-r border-black pr-1 select-none shrink-0 text-center">
                  <span 
                    className="font-black leading-none text-black tracking-tighter" 
                    style={{ 
                      fontFamily: 'sans-serif', 
                      fontSize: (selectedPrintItem?.bag?.bloodGroup || 'N/A') === 'AB' ? '72px' : '84px' 
                    }}
                  >
                    {selectedPrintItem?.bag?.bloodGroup || 'N/A'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-tighter -mt-1 text-black whitespace-nowrap">
                    Rh(D) {selectedPrintItem?.bag?.rh || 'N/A'}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-black mt-1 whitespace-nowrap">
                    {(selectedPrintItem?.bag?.donationType || 'VOLUNTARY').toLowerCase() === 'replacement' ? 'Replacement Donor' : 'Voluntary Donor'}
                  </span>
                </div>

                {/* Center: Component Name, Volume, Test Results, and both separation specifications */}
                <div className="flex-1 px-2 flex flex-col justify-center select-none text-left">
                  <h4 className="text-[15.5px] font-black leading-tight text-black uppercase">
                    {selectedPrintItem?.component?.componentType === 'RBC' ? 'Packed Red Blood Cells I.P' : 
                     selectedPrintItem?.component?.componentType === 'FFP' ? 'Fresh Frozen Plasma' : 
                     selectedPrintItem?.component?.componentType === 'Platelet' ? 'Platelet Concentrate' : 
                     selectedPrintItem?.component?.componentType === 'Cryo' ? 'Cryoprecipitate' : 'Blood Component'}
                  </h4>
                  <p className="text-[10px] font-extrabold text-black mt-0.5">({selectedPrintItem?.component?.volumeMl} ml)</p>
                  
                  <div className="text-[7.2px] leading-tight font-black mt-1 space-y-0.5 text-black uppercase tracking-tight">
                    <p>HIV I & II antibodies / HBs Ag / HCV: Non Reactive.</p>
                    <p>VDRL / Malarial Parasite / Atypical Antibodies: Not Detected.</p>
                  </div>

                  <div className="border-t border-black my-1"></div>

                  <div className="text-[5.8px] leading-tight font-bold text-black uppercase tracking-tight space-y-1">
                    <p>Separated from 450 ml / 350 ml of human blood + 63 / 49 ml. of CPDA, anticoagulant</p>
                    <div className="border-t border-black my-0.5 opacity-60"></div>
                    <p>350 ml of blood (Volume 250 ± 20 ml.) Semi Packed Red Cells are stored after transferming 100 ml. of SAGM-2 Solution (Volume 350 ± 20 ml.)</p>
                  </div>
                </div>

                {/* Right Side: QR Code Scan Area & Dates below it */}
                <div className="w-[3.0cm] flex flex-col items-center justify-center border-l border-black pl-1 shrink-0 select-none">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=BagNo:${selectedPrintItem?.bag?.bagNo || selectedPrintItem?.bagNo || 'N/A'};Group:${selectedPrintItem?.bag?.bloodGroup || 'N/A'}${selectedPrintItem?.bag?.rh === 'Positive' ? 'Pos' : 'Neg'};Expiry:${formatDate(selectedPrintItem?.component?.expiryDate)}`}
                    alt="QR Code"
                    className="w-[2.0cm] h-[2.0cm]"
                  />
                  <span className="text-[6.5px] font-black text-center mt-0.5 uppercase tracking-tighter text-black leading-none">Scan For More Details</span>
                  
                  <div className="flex flex-col text-[7.5px] font-black tracking-tighter text-black mt-1.5 text-center leading-tight">
                    <span>Collection: {formatDate(selectedPrintItem?.bag?.donationDate)}</span>
                    <span>Expiry: {formatDate(selectedPrintItem?.component?.expiryDate)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section (divided into instructions and barcodes) */}
              <div className="flex flex-1 w-full pt-1.5 overflow-hidden">
                {/* Left Column: Instructions (widen to w-[7.5cm] to shift border towards barcodes) */}
                <div className="w-[7.5cm] pr-1.5 border-r border-black flex flex-col justify-between shrink-0 select-none">
                  <div>
                    <h5 className="text-[9px] font-black uppercase tracking-wider mb-1.5 text-black underline">Instructions for Use & Storage</h5>
                    <ol className="list-decimal pl-2.5 text-[6.8px] leading-tight font-bold space-y-1 text-black">
                      <li>Keep continuously at +2°C to +6°C until administration.</li>
                      <li>Do not dispense without prescription.</li>
                      <li>Double check recipient's identity and cross-check the blood group of the unit and recipient before administration.</li>
                      <li>Compatibility testing is essential before use (Report enclosed with bag).</li>
                      <li>Shake the bag gently before use. Bring the unit to room temperature without warming the bag.</li>
                      <li>Do not use if there is any visible evidence of haemolysis, clotting or discoloration in the bag.</li>
                      <li>Do not add any other medication to the blood. Do not vent. Administration must be through a disposable, sterile set with filter.</li>
                      <li>Caution: HIV, HBsAg & HCV transmission may not be ruled out despite careful donor screening due to the Window Period.</li>
                      <li>Inform the Blood Bank immediately in case of any transfusion reaction.</li>
                      <li>Unit once issued will not be taken back.</li>
                    </ol>
                  </div>
                </div>

                {/* Right Column: Barcodes */}
                <div className="flex-1 pl-2 flex flex-col justify-center items-center select-none py-1">
                  <div className="w-full flex flex-col items-center justify-center space-y-5 flex-1">
                    {/* Bag No Barcode */}
                    <div className="w-full flex flex-col items-center">
                      <Code39Barcode value={selectedPrintItem?.bag?.bagNo || selectedPrintItem?.bagNo || 'N/A'} width={2.0} height={48} className="h-[48px]" />
                      <span className="text-[13px] font-black tracking-widest mt-1 uppercase text-black">
                        {selectedPrintItem?.bag?.bagNo || selectedPrintItem?.bagNo || 'N/A'}
                      </span>
                    </div>

                    {/* Segment No Barcode */}
                    <div className="w-full flex flex-col items-center">
                      <Code39Barcode value={selectedPrintItem?.bag?.segmentNo || selectedPrintItem?.segmentNo || 'N/A'} width={1.6} height={48} className="h-[48px]" />
                      <span className="text-[9.5px] font-black tracking-widest mt-1 uppercase text-black">
                        Segment No: {selectedPrintItem?.bag?.segmentNo || selectedPrintItem?.segmentNo || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-6 w-full justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedPrintItem(null)}
                className="px-5 text-xs font-bold shadow-none"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => window.print()}
                className="px-6 text-xs font-bold bg-red-800 hover:bg-red-900 text-white shadow-sm flex items-center gap-1.5"
              >
                Print Label
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
