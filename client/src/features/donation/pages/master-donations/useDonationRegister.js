import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useDonationList, useDonationDetail, useDeleteDonation } from '@/features/donation/queries';
import { donationApi } from '@/features/donation/api';
import { useAuth } from '@/store/auth';
import useAccess from '@/features/access/useAccess';
import { exportDonationRegister } from '@/features/donation/donationRegisterExport';
import { useDeleteWithReason } from '@/hooks/useDeleteWithReason';
import { compareBagNo } from '@/lib/natural-sort';
import { PAGE_SIZE } from './constants';
import { donationStatus } from './donationRegister.utils';
import { useDonationEdit } from './useDonationEdit';

// Owns all state, data, filtering and actions for the Master Donation
// Register tabs. Keeps the page shell purely presentational.
export function useDonationRegister(activeTab, setActiveTab) {
  const { user } = useAuth();
  const { can } = useAccess();
  const donationAccess = {
    canDelete: can('donor', 'delete', 'donation-list'),
    canEdit: can('donor', 'update', 'donation-list'),
  };
  const deleteMutation = useDeleteDonation();
  const donationEdit = useDonationEdit();

  const [currentPage, setCurrentPage] = useState(1);
  const [trackId, setTrackId] = useState(null);
  const [viewDonationId, setViewDonationId] = useState(null);
  const [searchedDonation, setSearchedDonation] = useState(null);

  // Filter states
  // `searchInput` is the draft value bound to the search box; `searchQuery`
  // is the applied value that actually drives filtering — only committed
  // from `runSearchLookup` (Enter / search button), never on keystroke.
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [bagTypeFilter, setBagTypeFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ttiRetestFilter, setTtiRetestFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('bagNo');
  const [order, setOrder] = useState('asc');
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
  const { data, isLoading, isError, refetch, isFetching } = useDonationList(
    activeTab === 'all'
      ? { page: 1, pageSize: 200 }
      : { source: sourceParam, page: 1, pageSize: 200 }
  );

  const { data: detail, isLoading: detailLoading } = useDonationDetail(trackId);
  const { data: viewDetail, isLoading: viewDetailLoading } = useDonationDetail(viewDonationId);

  const allItems = useMemo(() => data?.items ?? [], [data]);

  // Reset the fallback lookup result whenever the search box is cleared or
  // the term now matches something already loaded — this is just cleanup,
  // not a network call, so it's safe to run on every keystroke.
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
    }
  }, [searchQuery, allItems]);

  // Fallback network lookup: if the search term matches no loaded item, try
  // a direct detail lookup so a known bag/donation ID surfaces even when
  // it's outside the loaded page. Fires only on explicit search submit
  // (Enter/button) — never on a timer.
  const runSearchLookup = async () => {
    const trimmed = searchInput.trim();
    setSearchQuery(searchInput);
    setCurrentPage(1);
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

    try {
      const res = await donationApi.detail(trimmed);
      setSearchedDonation(res || null);
    } catch {
      setSearchedDonation(null);
    }
  };

  const baseItems = [...allItems];
  if (searchedDonation) {
    const alreadyExists = baseItems.some((d) => d.donationId === searchedDonation.donationId);
    if (!alreadyExists) {
      baseItems.unshift(searchedDonation);
    }
  }

  // Client-side filtering — matches donation ID, bag no, segment no, batch
  // no, donor ID, phone, or donor name against the search term.
  const filteredItems = baseItems.filter((d) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = [
        d.donationId, d.bagNo, d.segmentNo, d.lotNo,
        d.donorPublicId, d.phone, d.donorName,
      ].some((field) => (field || '').toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (bagTypeFilter && d.typeOfBag !== bagTypeFilter) return false;
    if (bloodGroupFilter && d.bloodGroup !== bloodGroupFilter) return false;
    if (statusFilter && donationStatus(d) !== statusFilter) return false;
    if (ttiRetestFilter && !d.ttiRetestedAt) return false;
    if (fromDate && (!d.collectedAt || new Date(d.collectedAt) < new Date(fromDate))) return false;
    if (toDate && (!d.collectedAt || new Date(d.collectedAt) > new Date(`${toDate}T23:59:59`))) return false;
    return true;
  });

  filteredItems.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'collectedAt') {
      cmp = new Date(a.collectedAt || 0) - new Date(b.collectedAt || 0);
    } else if (sortBy === 'bagNo') {
      cmp = compareBagNo(a.bagNo || a.donationId || '', b.bagNo || b.donationId || '');
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
    setSearchInput('');
    setSearchQuery('');
    setBagTypeFilter('');
    setBloodGroupFilter('');
    setStatusFilter('');
    setTtiRetestFilter(false);
    setFromDate('');
    setToDate('');
    setSortBy('bagNo');
    setOrder('asc');
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

  // Soft-delete only (cascades to derived blood units — unused ones are
  // discarded, already-issued ones are preserved and marked affected).
  // The donation moves to Recycle Bin and disappears from this register.
  const { requestDelete, DeleteReasonDialog } = useDeleteWithReason({
    onDelete: async (donation, reason) => {
      await deleteMutation.mutateAsync({ id: donation.id, reason });
      toast.success('Donation deleted and moved to Recycle Bin');
    },
    title: 'Delete Donation',
    message: 'This donation and any unused blood units derived from it will be moved to the Recycle Bin. Units already issued are preserved and marked affected, not deleted.',
  });

  const handleDelete = (donation) => {
    if (!donationAccess.canDelete) {
      toast.error('You do not have permission to delete donations.');
      return;
    }
    requestDelete(donation);
  };

  return {
    donationAccess,
    // filters
    filters: { searchInput, searchQuery, bagTypeFilter, bloodGroupFilter, statusFilter, ttiRetestFilter, fromDate, toDate, sortBy, order },
    setSearchInput, setSearchQuery, setBagTypeFilter, setBloodGroupFilter, setStatusFilter, setTtiRetestFilter, setFromDate, setToDate, setSortBy,
    toggleOrder, resetFilters, switchTab, handleFilterChange, runSearchLookup,
    // export
    excelLoading, handleExportRegister,
    // data
    displayedItems, filteredItems, totalCount, fitCount, unfitCount,
    currentPage, setCurrentPage, totalPages, isLoading, isError, refetch, isFetching,
    // timeline + view + delete
    trackId, setTrackId, detail, detailLoading,
    viewDonationId, setViewDonationId, viewDetail, viewDetailLoading,
    ...donationEdit,
    handleDelete,
    DeleteReasonDialog,
  };
}
