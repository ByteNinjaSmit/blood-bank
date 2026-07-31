import { useState } from 'react';
import { toast } from 'sonner';
import { useDonor, useDonorList } from '@/hooks/useDonor';
import { useAuth } from '@/store/auth';
import useAccess from '@/features/access/useAccess';
import { exportRegisterChoice } from '@/features/donor/donorRegisterExport';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';
import { getEffectiveEligibility } from '@/features/donor/donor-eligibility';
import { PAGE_SIZE } from './constants';

// Owns all state + data + actions for the Master Donor Register tabs
// (all / inhouse / camp). The deferral tab renders its own component and
// does not use this hook. Keeps the page shell purely presentational.
export function useDonorRegister(activeTab) {
  const { user } = useAuth();
  const { updateDonor, deleteDonor } = useDonor();
  // This hook backs the Master Register donor pages specifically — gate it
  // on the donor-list page's own permissions, not a generic module check,
  // so granting Donor access elsewhere doesn't silently unlock this.
  const { can } = useAccess();
  const donorAccess = {
    canView: can('donor', 'view', 'donor-list'),
    canUpdate: can('donor', 'update', 'donor-list'),
    canDelete: can('donor', 'delete', 'donor-list'),
  };

  // ── Filters ──
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [rhFilter, setRhFilter] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [excelLoading, setExcelLoading] = useState(false);

  const toggleOrder = () => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  // Search only hits the API once the user submits (Enter / search button),
  // not on every keystroke — searchQuery is the typed draft, appliedSearch
  // is what actually feeds useDonorList below.
  const submitSearch = () => {
    setAppliedSearch(searchQuery);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setBloodGroupFilter('');
    setRhFilter('');
    setEligibilityFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('createdAt');
    setOrder('desc');
    setPage(1);
  };

  const handleExportRegister = async (register, scope) => {
    try {
      setExcelLoading(true);
      const generatedBy = user?.name ? [user.name.first, user.name.last].filter(Boolean).join(' ') : (user?.username || 'System User');
      const filters = {
        search: appliedSearch || undefined,
        bloodGroup: bloodGroupFilter || undefined,
        rh: rhFilter || undefined,
        eligibilityStatus: eligibilityFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sortBy,
        order,
      };
      await exportRegisterChoice(register, scope, filters, generatedBy);
      toast.success('Register exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  // ── Modals / CRUD ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEditDonor = (donor) => {
    setSelectedDonor(donor);
    setShowEditModal(true);
  };

  const handleUpdateDonor = async (donorData) => {
    setLoading(true);
    const result = await updateDonor(selectedDonor._id, donorData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedDonor(null);
    }
    setLoading(false);
  };

  const handleViewDonor = (donor) => {
    setSelectedDonor(donor);
    setShowDetailsModal(true);
  };

  // Soft-delete only (cascades to the donor's donations/units/etc). The
  // donor moves to Recycle Bin and disappears from this register; it can
  // be recovered from there. Mandatory reason, centralized dialog.
  const { requestDelete, DeleteReasonDialog } = useDeleteWithReason({
    onDelete: (donor, reason) => deleteDonor(donor._id, reason),
    title: 'Delete Donor',
    message: 'This donor and their donation history will be moved to the Recycle Bin, where they can be restored or permanently removed.',
  });

  const handleDelete = (donor) => {
    if (!donorAccess.canDelete) {
      toast.error('You do not have permission to delete donors.');
      return;
    }
    requestDelete(donor);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedDonor(null);
  };
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDonor(null);
  };

  // ── Data ──
  // For 'all' tab we don't filter by source; for others we pass the source.
  const sourceParam = (activeTab === 'all' || activeTab === 'deferral') ? undefined : activeTab;

  const { data, isLoading, isError, refetch, isFetching } = useDonorList({
    source: sourceParam,
    page,
    pageSize: PAGE_SIZE,
    search: appliedSearch || undefined,
    bloodGroup: bloodGroupFilter || undefined,
    rh: rhFilter || undefined,
    eligibilityStatus: eligibilityFilter || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    sortBy,
    order,
  });

  const rawItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Local eligibility filter for inhouse/camp tabs (belt-and-suspenders on top
  // of the backend filter). Uses the effective status so 'recently-donated'
  // (derived: eligible but inside the 90/120-day window) matches correctly.
  const items = (activeTab !== 'all' && eligibilityFilter)
    ? rawItems.filter((d) => getEffectiveEligibility(d) === eligibilityFilter)
    : rawItems;

  const eligible = items.filter((d) => d.eligibilityStatus === 'eligible').length;
  const deferred = items.filter((d) => d.eligibilityStatus === 'deferred' || d.eligibilityStatus === 'temp-deferred').length;

  return {
    donorAccess,
    // filters
    filters: { searchQuery, bloodGroupFilter, rhFilter, eligibilityFilter, fromDate, toDate, sortBy, order },
    setSearchQuery, setBloodGroupFilter, setRhFilter, setEligibilityFilter,
    setFromDate, setToDate, setSortBy, setPage,
    toggleOrder, resetFilters, submitSearch,
    // export
    excelLoading, handleExportRegister,
    // data
    items, total, totalPages, page, isLoading, isError, eligible, deferred, refetch, isFetching,
    // modals + crud
    showEditModal, showDetailsModal, selectedDonor, loading,
    handleEditDonor, handleUpdateDonor, handleViewDonor, handleDelete,
    closeEditModal, closeDetailsModal,
    DeleteReasonDialog,
  };
}
