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
  TableRow 
} from '@/components/ui/table';
import {
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
  Download,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import hospitalApi from '@/services/hospitalApi';
import { Textarea } from '@/components/ui/textarea';
import CustomModal from '@/components/CustomModal';
import { useEditWithReason } from '@/hooks/useEditWithReason';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';

const ListHospital = () => {
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    phone: ''
  });
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    isActive: '',
    from: '',
    to: ''
  });

  const [searchQuery, setSearchQuery] = useState('');


  // Fetch hospitals with filters and pagination
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      // Initialize API service with auth token
      hospitalApi.initialize(authorizationToken);

      // Prepare parameters for API call
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value.trim())
        )
      };

      // Fetch hospitals using Axios API service
      const result = await hospitalApi.getHospitals(params);

      if (!result.success) {
        toast.error(result.error || 'Failed to load hospitals');
      } else {
        setHospitals(result.data?.data || []);
        setTotalPages(result.data?.pagination?.totalPages || 0);
        setTotalCount(result.data?.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [authorizationToken, currentPage, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      name: searchQuery
    }));
    setCurrentPage(1);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      name: '',
      contactPerson: '',
      phone: '',
      isActive: '',
      from: '',
      to: ''
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(parseInt(size));
    setCurrentPage(1);
  };

  // Handle delete — mandatory reason, cascades to this hospital's
  // requisitions (issued ones are preserved and marked affected).
  const { requestDelete, DeleteReasonDialog } = useDeleteWithReason({
    onDelete: async (hospital, reason) => {
      hospitalApi.initialize(authorizationToken);
      const result = await hospitalApi.deleteHospital(hospital._id, reason);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete hospital');
        throw new Error(result.error || 'Failed to delete hospital');
      }
      toast.success('Hospital deleted successfully');
      fetchHospitals();
    },
    title: 'Delete Hospital',
    message: 'This hospital and its pending requisitions will be moved to the Recycle Bin. Requisitions already issued are preserved and marked affected, not deleted.',
  });
  const handleDeleteClick = (hospital) => requestDelete(hospital);

  const handleViewClick = (hospital) => {
    setSelectedHospital(hospital);
    setViewModalOpen(true);
  };

  const handleEditClick = (hospital) => {
    setSelectedHospital(hospital);
    setEditFormData({
      name: hospital.name || '',
      address: hospital.address || '',
      contactPerson: hospital.contactPerson || '',
      phone: hospital.phone || ''
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.name.trim()) {
      newErrors.name = 'Hospital name is required';
    }

    if (!editFormData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!editFormData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!editFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]{10,15}$/.test(editFormData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { wrappedSave: wrappedSaveHospital, EditReasonDialog } = useEditWithReason({
    onSave: async (data, editReason) => {
      setEditSubmitting(true);
      try {
        hospitalApi.initialize(authorizationToken);
        const result = await hospitalApi.updateHospital(selectedHospital._id, data, editReason);
        if (!result.success) {
          toast.error(result.error || 'Failed to update hospital');
          return;
        }
        toast.success('Hospital updated successfully!');
        setEditModalOpen(false);
        setSelectedHospital(null);
        fetchHospitals();
      } catch (error) {
        console.error('Error updating hospital:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        setEditSubmitting(false);
      }
    },
    title: 'Confirm Hospital Changes',
  });

  const handleEditSave = async () => {
    if (!selectedHospital || !validateEditForm()) {
      if (!selectedHospital) {
        toast.error('No hospital selected');
      } else {
        toast.error('Please fix the errors in the form');
      }
      return;
    }
    wrappedSaveHospital(editFormData);
  };

  const handleCloseModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedHospital(null);
    setEditErrors({});
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <SortAsc className="w-4 h-4 inline ml-1" /> : 
      <SortDesc className="w-4 h-4 inline ml-1" />;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <Building2 className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
              <p className="text-gray-500 text-sm">Hospital & consignee registry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchHospitals()}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh"
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button
              onClick={() => navigate('/hospital/add')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Hospital
            </Button>
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

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Hospitals ({totalCount})</CardTitle>
              <CardDescription>
                {totalCount > 0 
                  ? `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} hospitals`
                  : 'No hospitals found'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading hospitals...</span>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
              <p className="text-gray-500 mb-4">
                {Object.values(filters).some(v => v) 
                  ? 'Try adjusting your filters or search criteria'
                  : 'Get started by adding your first hospital'
                }
              </p>
              <Button onClick={() => navigate('/hospital/add')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('hospitalId')}
                      >
                        Hospital ID <SortIcon field="hospitalId" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        Name <SortIcon field="name" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('contactPerson')}
                      >
                        Contact Person <SortIcon field="contactPerson" />
                      </TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('createdAt')}
                      >
                        Created <SortIcon field="createdAt" />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospitals.map((hospital) => (
                      <TableRow key={hospital._id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{hospital.hospitalId}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{hospital.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {hospital.address.length > 50 
                                ? `${hospital.address.substring(0, 50)}...` 
                                : hospital.address
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{hospital.contactPerson}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1" />
                            {hospital.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(hospital.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClick(hospital)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(hospital)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(hospital)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
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
                        variant={currentPage === page ? "default" : "outline"}
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

      <CustomModal
        open={viewModalOpen && !!selectedHospital}
        title={selectedHospital ? `Hospital Details - ${selectedHospital.name}` : 'Hospital Details'}
        description="Review the full information for this hospital."
        onCancel={handleCloseModals}
        hideFooter
        size="lg"
      >
        {selectedHospital && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">{selectedHospital.hospitalId}</div>
                <div className="text-xl font-semibold text-gray-900">{selectedHospital.name}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-500">Contact Person</Label>
                <div className="text-sm text-gray-900">{selectedHospital.contactPerson}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-500">Phone</Label>
                <div className="flex items-center text-sm text-gray-900">
                  <Phone className="w-3 h-3 mr-1" />
                  {selectedHospital.phone}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-500">Address</Label>
              <div className="flex items-start text-sm text-gray-900">
                <MapPin className="w-3 h-3 mr-1 mt-0.5" />
                <span>{selectedHospital.address}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {selectedHospital.createdAt ? new Date(selectedHospital.createdAt).toLocaleString() : '-'}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {selectedHospital.updatedAt ? new Date(selectedHospital.updatedAt).toLocaleString() : '-'}
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal
        open={editModalOpen && !!selectedHospital}
        title={selectedHospital ? `Edit Hospital - ${selectedHospital.name}` : 'Edit Hospital'}
        description="Update the hospital details. Fields marked with * are required."
        onCancel={handleCloseModals}
        onConfirm={handleEditSave}
        confirmText={editSubmitting ? 'Saving...' : 'Save Changes'}
        cancelText="Cancel"
        confirmVariant="primary"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Hospital Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="Enter hospital name"
                className={editErrors.name ? 'border-red-500' : ''}
              />
              {editErrors.name && (
                <p className="text-xs text-red-500">{editErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactPerson">Contact Person *</Label>
              <Input
                id="edit-contactPerson"
                name="contactPerson"
                value={editFormData.contactPerson}
                onChange={handleEditInputChange}
                placeholder="Enter contact person name"
                className={editErrors.contactPerson ? 'border-red-500' : ''}
              />
              {editErrors.contactPerson && (
                <p className="text-xs text-red-500">{editErrors.contactPerson}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={editFormData.phone}
                onChange={handleEditInputChange}
                placeholder="Enter phone number"
                className={editErrors.phone ? 'border-red-500' : ''}
              />
              {editErrors.phone && (
                <p className="text-xs text-red-500">{editErrors.phone}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address *</Label>
            <Textarea
              id="edit-address"
              name="address"
              value={editFormData.address}
              onChange={handleEditInputChange}
              placeholder="Enter complete hospital address"
              rows={3}
              className={editErrors.address ? 'border-red-500' : ''}
            />
            {editErrors.address && (
              <p className="text-xs text-red-500">{editErrors.address}</p>
            )}
          </div>
        </div>
      </CustomModal>

      {DeleteReasonDialog}
      {EditReasonDialog}
    </div>
  );
};

export default ListHospital;
