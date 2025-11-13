import React from "react";

const Filters = ({ itemType, setItemType, siteId, setSiteId, order, setOrder, setSortBy, setCurrentPage, onReset }) => {
  return (
    <div className="p-6 border-b border-red-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-slate-800">Discarded Items</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Item Type</label>
          <select
            value={itemType}
            onChange={(e) => { setItemType(e.target.value); setCurrentPage(1); }}
            className="h-10 px-3 border rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="Donation">Donation</option>
            <option value="Component">Component</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Site</label>
          <select
            value={siteId}
            onChange={(e) => { setSiteId(e.target.value); setCurrentPage(1); }}
            className="h-10 px-3 border rounded-md text-sm"
          >
            <option value="">All</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Sort</label>
          <select
            value={order}
            onChange={(e) => { setOrder(e.target.value); setCurrentPage(1); }}
            className="h-10 px-3 border rounded-md text-sm"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { onReset?.(); setCurrentPage(1); }}
            className="h-10 bg-gray-100 border border-gray-300 text-slate-700 rounded-md px-4 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
