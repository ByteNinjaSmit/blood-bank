import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Eye,
  Edit,
  Trash2,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import hospitalApi from '@/services/hospitalApi';
import { useEditWithReason } from '@/hooks/useEditWithReason';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';
import HospitalFilterBar from '../components/HospitalFilterBar';
import HospitalViewModal from '../components/HospitalViewModal';
import HospitalEditModal from '../components/HospitalEditModal';

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
      <HospitalFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
        pageSize={pageSize}
        handlePageSizeChange={handlePageSizeChange}
      />

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
                              {hospital.address && hospital.address.length > 50
                                ? `${hospital.address.substring(0, 50)}...`
                                : hospital.address || '—'
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

      <HospitalViewModal
        open={viewModalOpen}
        selectedHospital={selectedHospital}
        onClose={handleCloseModals}
      />

      <HospitalEditModal
        open={editModalOpen}
        selectedHospital={selectedHospital}
        editFormData={editFormData}
        editErrors={editErrors}
        editSubmitting={editSubmitting}
        handleEditInputChange={handleEditInputChange}
        handleEditSave={handleEditSave}
        onClose={handleCloseModals}
      />

      {DeleteReasonDialog}
      {EditReasonDialog}
    </div>
  );
};

export default ListHospital;
