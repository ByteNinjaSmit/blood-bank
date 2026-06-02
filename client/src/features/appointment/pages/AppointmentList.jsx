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
  X,
  Eye,
  MapPin,
  Activity,
  Bell,
  Info,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import appointmentApi from '@/services/appointmentApi';
import CustomModal from '@/components/CustomModal';

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

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleOpenDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Volunteers</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Donation Schedule</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Filters Section */}
        <Card className="mb-4 border-red-100 shadow-sm transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Donor</label>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                  <Input
                    placeholder="Name, phone, or blood group..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* From Date */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                  />
                </div>
              </div>

              {/* To Date */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                {(searchQuery || filters.status !== 'all' || filters.fromDate || filters.toDate) && (
                  <button 
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <Button onClick={fetchAppointments} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={loading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Volunteers ({totalCount})</div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Volunteer</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Donor</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Blood</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Medical Info</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Created</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Source</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading Volunteers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Calendar className="w-12 h-12 stroke-[1.5]" />
                        <div className="max-w-[240px] mx-auto">
                           <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-1">No volunteers found</h3>
                           <p className="text-xs">Adjust your search or wait for new schedules.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow key={appointment._id} className="hover:bg-gray-50/80 transition-colors">
                      <TableCell className="font-mono text-[10px] font-bold text-red-700 bg-red-50/30">
                        {getAppointmentCode(appointment._id)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-bold text-gray-900">{appointment.fullName}</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
                          {appointment.gender} {appointment.age ? `• ${appointment.age} YRS` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {appointment.mobileNo}
                          </div>
                          {appointment.email && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{appointment.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold border border-red-100">
                          <Droplets className="w-2.5 h-2.5" />
                          {appointment.bloodGroup || 'UNK'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {appointment.recentIllness === 'yes' && <Badge className="text-[8px] h-4 bg-red-100 text-red-700 border-red-200">ILLNESS</Badge>}
                          {appointment.surgery === 'yes' && <Badge className="text-[8px] h-4 bg-red-100 text-red-700 border-red-200">SURGERY</Badge>}
                          {appointment.medication === 'yes' && <Badge className="text-[8px] h-4 bg-red-100 text-red-700 border-red-200">MEDS</Badge>}
                          {appointment.lastDonation && (
                            <div className="text-[9px] text-gray-500 leading-tight">
                              LAST: {formatDate(appointment.lastDonation)}
                            </div>
                          )}
                          {!appointment.recentIllness || (appointment.recentIllness === 'no' && !appointment.surgery && !appointment.medication && !appointment.lastDonation) && (
                            <span className="text-emerald-600 font-bold text-[9px]">CLEAN HLTH</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-gray-600">
                        {formatDate(appointment.appointmentDate)}
                      </TableCell>
                      <TableCell className="text-[10px] text-gray-400 leading-tight">
                        {formatDateTime(appointment.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(appointment.status)} className="text-[9px] h-4 leading-none uppercase tracking-widest px-2">
                          {appointment.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                        {appointment.source || 'WEB'}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                          onClick={() => handleOpenDetails(appointment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Refined Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/10">
            <div className="flex items-center gap-4">
              <div className="text-xs font-medium text-gray-500">
                SHOWING {appointments.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} TO {Math.min(currentPage * pageSize, totalCount)} OF {totalCount} RECORDS
              </div>
              
              <div className="flex items-center gap-2 border-l pl-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per Page</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-16 h-7 text-[10px] font-bold bg-white">
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
            
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="h-7 px-2">
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="h-7 text-[10px] font-bold uppercase">
                  PREV
                </Button>
                
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`w-7 h-7 p-0 text-[10px] font-bold ${currentPage === page ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-7 text-[10px] font-bold uppercase">
                  NEXT
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="h-7 px-2">
                  <ChevronsRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomModal
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        title="Volunteer Details"
        size="lg"
        hideFooter
      >
        {selectedAppointment && (
          <div className="space-y-6 py-2 px-1">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-2xl border border-red-100/50">
                  <Droplets className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedAppointment.fullName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-red-600 hover:bg-red-700 text-xs px-2 py-0 border-none">
                      {selectedAppointment.bloodGroup || 'UNKNOWN GROUP'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-gray-200">
                      ID: {getAppointmentCode(selectedAppointment._id)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={getStatusVariant(selectedAppointment.status)} className="h-6 px-3 uppercase text-[10px] tracking-widest shadow-sm">
                  {selectedAppointment.status || 'pending'}
                </Badge>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">
                  Registered: {formatDateTime(selectedAppointment.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Personal & Contact */}
              <div className="space-y-6">
                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <UserCheck className="w-3 h-3" /> Basic Information
                  </h4>
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">Gender</div>
                        <div className="text-sm font-semibold text-gray-700">{selectedAppointment.gender || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">Age</div>
                        <div className="text-sm font-semibold text-gray-700">{selectedAppointment.age ? `${selectedAppointment.age} Years` : '-'}</div>
                      </div>
                      {selectedAppointment.birthDate && (
                        <div className="col-span-2">
                          <div className="text-[10px] text-gray-400 font-bold uppercase">Date of Birth</div>
                          <div className="text-sm font-semibold text-gray-700">{formatDate(selectedAppointment.birthDate)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <Phone className="w-3 h-3" /> Contact Details
                  </h4>
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Phone className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Phone Number</p>
                          <p className="text-sm font-semibold text-gray-700">{selectedAppointment.mobileNo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Email Address</p>
                          <p className="text-sm font-semibold text-gray-700 truncate">{selectedAppointment.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Address</p>
                          <p className="text-sm font-semibold text-gray-700 leading-relaxed">{selectedAppointment.address || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Medical & Schedule */}
              <div className="space-y-6">
                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <Activity className="w-3 h-3" /> Medical History
                  </h4>
                  <div className="bg-red-50/30 rounded-2xl p-4 border border-red-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-1 border-b border-red-100/50">
                        <span className="text-xs font-medium text-gray-600">Recent Illness</span>
                        <Badge variant={selectedAppointment.recentIllness === 'yes' ? 'destructive' : 'secondary'} className="text-[9px] h-4">
                          {selectedAppointment.recentIllness?.toUpperCase() || 'NO'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-red-100/50">
                        <span className="text-xs font-medium text-gray-600">Previous Surgery</span>
                        <Badge variant={selectedAppointment.surgery === 'yes' ? 'destructive' : 'secondary'} className="text-[9px] h-4">
                          {selectedAppointment.surgery?.toUpperCase() || 'NO'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-red-100/50">
                        <span className="text-xs font-medium text-gray-600">On Medication</span>
                        <Badge variant={selectedAppointment.medication === 'yes' ? 'destructive' : 'secondary'} className="text-[9px] h-4">
                          {selectedAppointment.medication?.toUpperCase() || 'NO'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-red-100/50">
                        <span className="text-xs font-medium text-gray-600">Frequency (Y)</span>
                        <span className="text-xs font-bold text-red-700">{selectedAppointment.donationFrequency || '1'} Times</span>
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Last Donation Date</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(selectedAppointment.lastDonation)}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <Bell className="w-3 h-3" /> Schedule & Reminders
                  </h4>
                  <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-50">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">
                          <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Volunteer Date</p>
                          <p className="text-sm font-bold text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-indigo-100/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                            Notifications
                          </span>
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${selectedAppointment.wantReminder ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {selectedAppointment.wantReminder ? 'ENABLED' : 'DISABLED'}
                          </div>
                        </div>
                        {selectedAppointment.wantReminder && (
                          <div className="flex items-center gap-2 text-[11px] text-indigo-600 bg-white/80 p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                            <Info className="w-3.5 h-3.5" />
                            <span>Reminder will be sent <strong>{selectedAppointment.reminderDays || 1} day(s)</strong> before appointment.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default AppointmentList;

