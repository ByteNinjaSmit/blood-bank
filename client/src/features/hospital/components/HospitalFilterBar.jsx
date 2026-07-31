import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';

export default function HospitalFilterBar({
  searchQuery,
  setSearchQuery,
  handleSearch,
  filters,
  handleFilterChange,
  handleClearFilters,
  pageSize,
  handlePageSizeChange,
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters & Search
        </CardTitle>
        <CardDescription>
          Use the filters below to find specific hospitals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by Name</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter hospital name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contact Person Filter */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              placeholder="Filter by contact person..."
              value={filters.contactPerson}
              onChange={(e) => handleFilterChange('contactPerson', e.target.value)}
            />
          </div>

          {/* Phone Filter */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Filter by phone..."
              value={filters.phone}
              onChange={(e) => handleFilterChange('phone', e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <Select
              value={filters.isActive === '' ? 'all' : filters.isActive}
              onValueChange={(val) => handleFilterChange('isActive', val === 'all' ? '' : val)}
            >
              <SelectTrigger id="isActive">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Created From */}
          <div className="space-y-2">
            <Label htmlFor="from">Created From</Label>
            <Input
              id="from"
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
            />
          </div>

          {/* Created To */}
          <div className="space-y-2">
            <Label htmlFor="to">Created To</Label>
            <Input
              id="to"
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />
          </div>

        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              size="sm"
            >
              Clear Filters
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="pageSize">Rows per page:</Label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
