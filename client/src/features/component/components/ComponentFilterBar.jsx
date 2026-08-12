import { Calendar, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { COMPONENT_TYPES } from "@/constants/component-types";
import SearchBox from "@/components/shared/SearchBox";
import { STATUS_OPTIONS } from "../component-helpers";

export default function ComponentFilterBar({ filters, isLoading, onFilterChange, onSearchSubmit, onClear, camps = [] }) {
  return (
    <Card className="mb-4 border-red-50 shadow-sm">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search - Flexible Width */}
          <div className="flex-1 min-w-[240px] space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Search</label>
            <SearchBox
              placeholder="Bag No, ID, or blood group..."
              value={filters.search}
              onChange={(val) => onFilterChange("search", val)}
              onSearch={onSearchSubmit}
              disabled={isLoading}
              inputClassName="border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
            />
          </div>

          {/* Type Dropdown */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
            <Select value={filters.type || "all"} onValueChange={(value) => onFilterChange("type", value === "all" ? "" : value)}>
              <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {COMPONENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Dropdown */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Status</label>
            <Select value={filters.status || "all"} onValueChange={(value) => onFilterChange("status", value === "all" ? "" : value)}>
              <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="text-xs">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site Dropdown */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Site</label>
            <Select value={filters.site || "all"} onValueChange={(value) => onFilterChange("site", value === "all" ? "" : value)}>
              <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                <SelectItem value="inhouse">Inhouse</SelectItem>
                <SelectItem value="camp">Camp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Camp Dropdown — only meaningful once Site=Camp is selected */}
          {filters.site === "camp" && (
            <div className="w-44 space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Camp</label>
              <Select value={filters.campId || "all"} onValueChange={(value) => onFilterChange("campId", value === "all" ? "" : value)}>
                <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                  <SelectValue placeholder="All Camps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Camps</SelectItem>
                  {camps.map((camp) => (
                    <SelectItem key={camp._id || camp.id} value={camp._id || camp.id} className="text-xs">
                      {camp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Expiry Field */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Expiry Before</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <Input
                type="date"
                value={filters.expiryBefore}
                onChange={(e) => onFilterChange("expiryBefore", e.target.value)}
                className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
              />
            </div>
          </div>

          {/* From Date */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => onFilterChange("fromDate", e.target.value)}
                className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
              />
            </div>
          </div>

          {/* To Date */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => onFilterChange("toDate", e.target.value)}
                className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
              />
            </div>
          </div>

          {/* Sort Order */}
          <div className="w-36 space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Sort Order</label>
            <Select value={filters.order} onValueChange={(value) => onFilterChange("order", value)}>
              <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
                <SelectItem value="bagAsc">Ascending Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            {Object.entries(filters).some(([k, v]) => k === "order" ? v !== "desc" : v !== "") && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
            <div className="flex items-center gap-1">
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
