import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Filter,
  Phone,
  Mail,
  Droplets,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import appointmentApi from '@/services/appointmentApi';

const AppointmentList = () => {
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('appointmentDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [filters, setFilters] = useState({
    status: 'all',
    fromDate: '',
    toDate: '',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      appointmentApi.initialize(authorizationToken);

      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (searchQuery) params.search = searchQuery.trim();

      const result = await appointmentApi.getAppointments(params);

      if (!result.success) {
        toast.error(result.error || 'Failed to load appointments');
      } else {
        const payload = result.data || {};
        const items = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        const pagination = payload.pagination || {};

        setAppointments(items);
        setTotalPages(pagination.totalPages || 0);
        setTotalCount(pagination.totalCount || items.length || 0);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [authorizationToken, currentPage, pageSize, sortBy, sortOrder, filters, searchQuery]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAppointments();
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      fromDate: '',
      toDate: '',
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(parseInt(size, 10));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }
    }

    return pages;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const getAppointmentCode = (id) => {
    if (!id) return '-';
    const suffix = String(id).slice(-6).toUpperCase();
    return `APPT-${suffix}`;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600">View and manage public blood donation appointments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter appointments by status, date and donor information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search by name, phone, email or blood group</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Appointment Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
              </div>
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
              <Button
                variant="outline"
                onClick={fetchAppointments}
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="pageSize">Rows per page:</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20" id="pageSize">
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

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Appointments ({totalCount})</CardTitle>
              <CardDescription>
                {totalCount > 0
                  ? `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} appointments`
                  : 'No appointments found'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading appointments...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500 mb-4">
                {filters.status !== 'all' || filters.fromDate || filters.toDate || searchQuery
                  ? 'Try adjusting your filters or search criteria'
                  : 'Public appointments will appear here once donors schedule them from the public site.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Appointment</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Blood</TableHead>
                      <TableHead>Medical Info</TableHead>
                      <TableHead>Appointment Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment._id}>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {getAppointmentCode(appointment._id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{appointment.fullName}</div>
                          <div className="text-xs text-gray-500">
                            {appointment.gender} {appointment.age ? `• ${appointment.age} yrs` : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {appointment.mobileNo}
                            </div>
                            {appointment.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="w-3 h-3" />
                                {appointment.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Droplets className="w-3 h-3" />
                            {appointment.bloodGroup || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-[11px] leading-tight">
                            {appointment.recentIllness === 'yes' && <span className="text-red-500 font-medium">⚠ Illness</span>}
                            {appointment.surgery === 'yes' && <span className="text-red-500 font-medium">⚠ Surgery</span>}
                            {appointment.medication === 'yes' && <span className="text-red-500 font-medium">⚠ Medication</span>}
                            {appointment.lastDonation && <span className="text-blue-600">Last: {formatDate(appointment.lastDonation)}</span>}
                            {(!appointment.recentIllness || appointment.recentIllness === 'no') && 
                             (!appointment.surgery || appointment.surgery === 'no') && 
                             (!appointment.medication || appointment.medication === 'no') && 
                             !appointment.lastDonation && <span className="text-gray-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                        <TableCell>{formatDateTime(appointment.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(appointment.status)} className="capitalize">
                            {appointment.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {appointment.source || 'public-frontend'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentList;

