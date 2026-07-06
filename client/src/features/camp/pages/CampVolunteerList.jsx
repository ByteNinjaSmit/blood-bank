import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Phone,
  Mail,
  Droplets,
  RefreshCw,
  Loader2,
  Search,
  X,
  Eye,
  MapPin,
  Activity,
  HeartPulse,
  UserCheck,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { campApi } from '@/features/camp/api';
import CustomModal from '@/components/CustomModal';

const CampVolunteerList = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Camps for filter
  const [camps, setCamps] = useState([]);

  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchCamps = useCallback(async () => {
    try {
      const items = await campApi.list();
      setCamps(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Error fetching camps:", err);
    }
  }, []);

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery.trim(),
        status: statusFilter,
        campId: siteFilter,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        sortBy,
        sortOrder,
      };

      const result = await campApi.voluntaryDonations(params);
      setVolunteers(result?.items || []);
      if (result?.pagination) {
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      toast.error(error?.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, siteFilter, dateRange, sortBy, sortOrder]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const handleFilterChange = (key, value) => {
    if (key === 'search') setSearchQuery(value);
    else if (key === 'status') setStatusFilter(value);
    else if (key === 'siteId') setSiteFilter(value);
    else if (key === 'dateRange') setDateRange(prev => ({ ...prev, ...value }));
    
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSiteFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const toggleSortOrder = () => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  const handleOpenDetails = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsDetailsModalOpen(true);
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'donated': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-sm">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Camp Volunteer List</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Onsite Registration Data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <Card className="mb-4 border-red-100 shadow-sm transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Search Volunteer</label>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors" />
                  <Input
                    placeholder="Name, phone, or blood group..."
                    value={searchQuery}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all shadow-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-36 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                <Select value={statusFilter} onValueChange={(val) => handleFilterChange('status', val)}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="donated">Donated</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Camp Filter */}
              <div className="w-48 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Camp</label>
                <Select value={siteFilter} onValueChange={(val) => handleFilterChange('siteId', val)}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue placeholder="All Camps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Camps</SelectItem>
                    {camps.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
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
                    value={dateRange.startDate}
                    onChange={(e) => handleFilterChange('dateRange', { startDate: e.target.value })}
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
                    value={dateRange.endDate}
                    onChange={(e) => handleFilterChange('dateRange', { endDate: e.target.value })}
                    className="pl-8 h-9 text-[10px] border-gray-200 bg-gray-50/50 shadow-none"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="w-40 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Sort By</label>
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs font-medium border-gray-200 bg-gray-50/50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Registration Date</SelectItem>
                    <SelectItem value="firstName">First Name</SelectItem>
                    <SelectItem value="bloodGroup">Blood Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block">&nbsp;</label>
                <Button onClick={toggleSortOrder} variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5" disabled={loading}>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 pt-4">
                {(searchQuery || statusFilter !== 'all' || siteFilter !== 'all' || dateRange.startDate || dateRange.endDate || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                  <button 
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <Button onClick={fetchVolunteers} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={loading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Registered Volunteers ({totalCount})</div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Volunteer</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Camp</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Blood Group</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Medical Vitals</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reg. Date</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : volunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-wider">No volunteers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  volunteers.map((v) => (
                    <TableRow key={v._id} className="hover:bg-gray-50/80 transition-colors">
                      <TableCell>
                        <div className="text-xs font-bold text-gray-900">{v.firstName} {v.lastName}</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
                          {v.sex} • {v.age} YRS
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                            <Phone className="w-3 h-3 text-gray-400" /> {v.mobile}
                          </div>
                          {v.email && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{v.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-bold text-red-800">{v.siteId?.name || 'Unknown Camp'}</div>
                        <div className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">ID: {v.siteId?.siteId || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold border border-red-100">
                          <Droplets className="w-2.5 h-2.5" />
                          {v.bloodGroup || 'UNK'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] font-bold text-gray-600 space-y-0.5">
                          <div>WT: <span className="text-red-700">{v.weight}kg</span></div>
                          <div>HB: <span className="text-red-700">{v.hb}gm%</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold text-gray-600 leading-tight">
                        {formatDate(v.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(v.status)} className="text-[9px] h-4 uppercase tracking-widest px-2">
                          {v.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                          onClick={() => handleOpenDetails(v)}
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

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/10">
            <div className="flex items-center gap-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                Showing {volunteers.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
              </div>
              
              <div className="flex items-center gap-2 border-l pl-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per Page</span>
                <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(parseInt(val)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-16 h-7 text-[10px] font-bold bg-white">
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
            
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-7 px-2">
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-7 text-[10px] font-bold uppercase">
                  PREV
                </Button>
                
                <div className="flex items-center gap-1 mx-1 text-xs font-bold text-gray-600">
                  {currentPage} / {totalPages}
                </div>
                
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-7 text-[10px] font-bold uppercase">
                  NEXT
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-7 px-2">
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
        {selectedVolunteer && (
          <div className="space-y-6 py-2 px-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-2xl border border-red-100/50">
                  <Droplets className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedVolunteer.firstName} {selectedVolunteer.lastName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-red-600 text-xs px-2 py-0 border-none">{selectedVolunteer.bloodGroup}</Badge>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-gray-200">AGE: {selectedVolunteer.age}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={getStatusVariant(selectedVolunteer.status)} className="h-6 px-3 uppercase text-[10px] tracking-widest shadow-sm">
                  {selectedVolunteer.status || 'pending'}
                </Badge>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">Registered: {formatDate(selectedVolunteer.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Basic & Contact */}
              <div className="space-y-6">
                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <UserCheck className="w-3 h-3" /> Basic Information
                  </h4>
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">Gender</div>
                        <div className="text-sm font-semibold text-gray-700">{selectedVolunteer.sex === 'M' ? 'Male' : 'Female'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">DOB</div>
                        <div className="text-sm font-semibold text-gray-700">{formatDate(selectedVolunteer.dob)}</div>
                      </div>
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
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Phone</p>
                          <p className="text-sm font-semibold text-gray-700">{selectedVolunteer.mobile}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Email</p>
                          <p className="text-sm font-semibold text-gray-700 truncate">{selectedVolunteer.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Address</p>
                          <p className="text-sm font-semibold text-gray-700 leading-relaxed">{selectedVolunteer.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Medical & History */}
              <div className="space-y-6">
                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <HeartPulse className="w-3 h-3" /> Medical Vitals
                  </h4>
                  <div className="bg-red-50/30 rounded-2xl p-4 border border-red-50 grid grid-cols-2 gap-4 shadow-inner">
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Weight</div>
                      <div className="text-sm font-bold text-red-700">{selectedVolunteer.weight} kg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Hemoglobin (HB)</div>
                      <div className="text-sm font-bold text-red-700">{selectedVolunteer.hb} gm%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">BP</div>
                      <div className="text-sm font-bold text-red-700">{selectedVolunteer.bp} mmHg</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Pulse</div>
                      <div className="text-sm font-bold text-red-700">{selectedVolunteer.pulse} /min</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Temp</div>
                      <div className="text-sm font-bold text-red-700">{selectedVolunteer.temp} °C</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">O2 Level</div>
                      <div className="text-sm font-bold text-red-700">{selectedVolunteer.o2Level} %</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    <Stethoscope className="w-3 h-3" /> Exam & History
                  </h4>
                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-4">
                    <div className="grid grid-cols-5 gap-2">
                      {['cvs', 'rs', 'pa', 'cns', 'gis'].map(sys => (
                        <div key={sys} className="text-center">
                          <div className="text-[9px] font-black uppercase text-gray-400 mb-1">{sys}</div>
                          <Badge variant={selectedVolunteer[sys] === 'normal' ? 'outline' : 'destructive'} className="text-[7px] h-3.5 px-1 leading-none border-gray-200">
                             {selectedVolunteer[sys]?.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-500 uppercase">First Time</span>
                        <span className="font-black text-gray-900 uppercase">{selectedVolunteer.isFirstTime}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-500 uppercase">Donations</span>
                        <span className="font-black text-gray-900">{selectedVolunteer.totalDonations}</span>
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

export default CampVolunteerList;
