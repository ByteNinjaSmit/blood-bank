import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useDonationList, useDonationDetail, useDeleteDonation } from '@/features/donation/queries';
import { donationApi } from '@/features/donation/api';
import { useAuth } from '@/store/auth';
import { checkAccess } from '@/features/user/pages/utils/access';
import { exportDonationRegister } from '@/features/donation/donationRegisterExport';
import { PAGE_SIZE } from './constants';
import { donationStatus } from './donationRegister.utils';

// Owns all state, data, filtering and actions for the Master Donation
// Register tabs. Keeps the page shell purely presentational.
export function useDonationRegister(activeTab, setActiveTab) {
  const { user } = useAuth();
  const donationAccess = checkAccess(user, ['donation', 'donations', 'donation management']);
  const deleteMutation = useDeleteDonation();

  const [currentPage, setCurrentPage] = useState(1);
  const [trackId, setTrackId] = useState(null);
  const [viewDonationId, setViewDonationId] = useState(null);
  const [searchedDonation, setSearchedDonation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [bagTypeFilter, setBagTypeFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('collectedAt');
  const [order, setOrder] = useState('desc');
  const [excelLoading, setExcelLoading] = useState(false);

  const toggleOrder = () => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));

  const handleExportRegister = async (register, scope) => {
    try {
      setExcelLoading(true);
      const generatedBy = user?.name ? [user.name.first, user.name.last].filter(Boolean).join(' ') : (user?.username || 'System User');
      const filters = {
        search: searchQuery.trim() || undefined,
        bagType: bagTypeFilter || undefined,
        bloodGroup: bloodGroupFilter || undefined,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      };
      await exportDonationRegister(register, scope, filters, generatedBy);
      toast.success('Register exported successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate Excel report');
    } finally {
      setExcelLoading(false);
    }
  };

  // source param: undefined for 'all', otherwise the tab key
  const sourceParam = activeTab === 'all' ? undefined : activeTab;

  // Fetch server-side for inhouse/camp tabs (paginated); fetch all for 'all' tab (client-side filtered)
  const { data, isLoading, isError } = useDonationList(
    activeTab === 'all'
      ? { page: 1, pageSize: 200 }
      : { source: sourceParam, page: 1, pageSize: 200 }
  );

  const { data: detail, isLoading: detailLoading } = useDonationDetail(trackId);
  const { data: viewDetail, isLoading: viewDetailLoading } = useDonationDetail(viewDonationId);

  const allItems = useMemo(() => data?.items ?? [], [data]);

  // If the search term matches no loaded item, try a direct detail lookup so a
  // known bag/donation ID surfaces even when it's outside the loaded page.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchedDonation(null);
      return;
    }

    const exists = allItems.some(
      (d) =>
        (d.donationId || '').toLowerCase() === trimmed.toLowerCase() ||
        (d.bagNo || '').toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setSearchedDonation(null);
      return;
    }

    const fetchSearched = async () => {
      try {
        const res = await donationApi.detail(trimmed);
        setSearchedDonation(res || null);
      } catch {
        setSearchedDonation(null);
      }
    };

    const timer = setTimeout(fetchSearched, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, allItems]);

  const baseItems = [...allItems];
  if (searchedDonation) {
    const alreadyExists = baseItems.some((d) => d.donationId === searchedDonation.donationId);
    if (!alreadyExists) {
      baseItems.unshift(searchedDonation);
    }
  }

  // Client-side filtering
  const filteredItems = baseItems.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bagNoMatch = (d.bagNo || d.donationId || '').toLowerCase().includes(q);
      const donorMatch = (d.donorName || '').toLowerCase().includes(q);
      if (!bagNoMatch && !donorMatch) return false;
    }
    if (bagTypeFilter && d.typeOfBag !== bagTypeFilter) return false;
    if (bloodGroupFilter && d.bloodGroup !== bloodGroupFilter) return false;
    if (statusFilter && donationStatus(d) !== statusFilter) return false;
    if (fromDate && (!d.collectedAt || new Date(d.collectedAt) < new Date(fromDate))) return false;
    if (toDate && (!d.collectedAt || new Date(d.collectedAt) > new Date(`${toDate}T23:59:59`))) return false;
    return true;
  });

  filteredItems.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'collectedAt') {
      cmp = new Date(a.collectedAt || 0) - new Date(b.collectedAt || 0);
    } else if (sortBy === 'bagNo') {
      cmp = (a.bagNo || a.donationId || '').localeCompare(b.bagNo || b.donationId || '');
    } else if (sortBy === 'donorName') {
      cmp = (a.donorName || '').localeCompare(b.donorName || '');
    }
    return order === 'asc' ? cmp : -cmp;
  });

  // Stats
  const totalCount = allItems.length;
  const fitCount = filteredItems.filter((d) => d.isFit === true).length;
  const unfitCount = filteredItems.filter((d) => d.isFit === false).length;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const displayedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setSearchQuery('');
    setBagTypeFilter('');
    setBloodGroupFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setSortBy('collectedAt');
    setOrder('desc');
    setCurrentPage(1);
  };

  const switchTab = (key) => {
    setActiveTab(key);
    setTrackId(null);
    resetFilters();
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
    setTrackId(null);
  };

  const handleDelete = (donation) => {
    if (!donationAccess.canDelete) {
      toast.error('You do not have permission to delete donations.');
      return;
    }
    setDeleteTarget(donation);
    setShowDeleteModal(true);
  };

  // Soft-delete only. The donation moves to Recycle Bin and disappears from
  // this register; it can be recovered from there.
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Donation deleted and moved to Recycle Bin');
    } catch (e) {
      toast.error(e?.message ?? 'Failed to delete donation');
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  return {
    donationAccess,
    // filters
    filters: { searchQuery, bagTypeFilter, bloodGroupFilter, statusFilter, fromDate, toDate, sortBy, order },
    setSearchQuery, setBagTypeFilter, setBloodGroupFilter, setStatusFilter, setFromDate, setToDate, setSortBy,
    toggleOrder, resetFilters, switchTab, handleFilterChange,
    // export
    excelLoading, handleExportRegister,
    // data
    displayedItems, filteredItems, totalCount, fitCount, unfitCount,
    currentPage, setCurrentPage, totalPages, isLoading, isError,
    // timeline + view + delete
    trackId, setTrackId, detail, detailLoading,
    viewDonationId, setViewDonationId, viewDetail, viewDetailLoading,
    showDeleteModal, setShowDeleteModal, deleteTarget, setDeleteTarget,
    handleDelete, handleDeleteConfirm,
  };
}
