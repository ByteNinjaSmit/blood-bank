// useDonor — thin wrapper around TanStack Query hooks in
// `features/donor/queries.js`. Preserves the existing imperative API
// (`fetchDonors`, `createDonor`, ...) so consumers don't need to change
// during the donor cutover. New screens should use the queries
// directly from `@/features/donor/queries`.

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import campService from '@/services/campService';
import donorService from '@/services/donorService';
import apiService from '@/services/api';
import { useAuth } from '@/store/auth';
import {
  donorKeys,
  useCreateDonorMutation,
  useDeleteDonorMutation,
  useDonorListQuery,
  useUpdateDonorMutation,
} from '@/features/donor/queries';

const DEFAULT_FILTERS = { page: 1, pageSize: 100 };

export const useDonor = () => {
  const qc = useQueryClient();
  const { API, authorizationToken } = useAuth();

  // Keep the legacy singleton initialised — searchDonor + forceDeleteDonor
  // still call /api/donor through it. Remove once those paths are
  // migrated to /api/v2.
  useEffect(() => {
    if (API && authorizationToken) {
      apiService.initialize(API, authorizationToken);
    }
  }, [API, authorizationToken]);

  // Two data sources during the cutover:
  //   listQuery     -> new /api/v2/donor (default path)
  //   campDonors    -> legacy campService for site-scoped lists
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [campDonors, setCampDonors] = useState(null); // null = use listQuery
  const [campError, setCampError] = useState(null);
  const [campLoading, setCampLoading] = useState(false);

  const listQuery = useDonorListQuery(filters, {
    enabled: campDonors === null,
  });

  const createMutation = useCreateDonorMutation();
  const updateMutation = useUpdateDonorMutation();
  const deleteMutation = useDeleteDonorMutation();

  const donors = useMemo(() => {
    if (campDonors !== null) return campDonors;
    return listQuery.data?.items ?? [];
  }, [campDonors, listQuery.data]);

  const loading =
    campLoading ||
    listQuery.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const error =
    campError ??
    (listQuery.error?.message ||
      createMutation.error?.message ||
      updateMutation.error?.message ||
      deleteMutation.error?.message ||
      null);

  // Surface the listQuery error once.
  useEffect(() => {
    if (listQuery.error?.message) toast.error(listQuery.error.message);
  }, [listQuery.error]);

  const fetchDonors = async (nextFilters = {}) => {
    setCampDonors(null);
    setFilters({ ...DEFAULT_FILTERS, ...nextFilters });
  };

  const fetchCampDonors = async (siteId) => {
    setCampLoading(true);
    setCampError(null);
    const { data, error: apiError } = await campService.getCampDonors(siteId);
    if (apiError) {
      setCampError(apiError);
      toast.error(apiError);
      setCampDonors([]);
    } else {
      setCampDonors(data?.donors ?? []);
    }
    setCampLoading(false);
  };

  const createDonor = async (donorData) => {
    try {
      const created = await createMutation.mutateAsync(donorData);
      return { success: true, data: created };
    } catch (e) {
      return { success: false, data: null, code: e?.code, message: e?.message };
    }
  };

  const updateDonor = async (id, patch) => {
    try {
      const updated = await updateMutation.mutateAsync({ id, patch });
      return { success: true, data: updated };
    } catch (e) {
      return { success: false, code: e?.code, message: e?.message };
    }
  };

  const deleteDonor = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { success: true };
    } catch (e) {
      return { success: false, code: e?.code, message: e?.message };
    }
  };

  // Legacy paths still on /api/donor — not yet migrated.
  const searchDonor = async (searchCriteria) => {
    const { data, error: apiError } = await donorService.searchDonor(searchCriteria);
    if (apiError) return { success: false, data: null };
    return { success: true, data: data?.donor ?? null };
  };

  const forceDeleteDonor = async (id) => {
    const { error: apiError } = await donorService.forceDeleteDonor(id);
    if (apiError) {
      toast.error(apiError);
      return { success: false };
    }
    qc.invalidateQueries({ queryKey: donorKeys.all });
    toast.success('Donor and related data deleted successfully');
    return { success: true };
  };

  return {
    donors,
    loading,
    error,
    fetchDonors,
    fetchCampDonors,
    createDonor,
    updateDonor,
    deleteDonor,
    searchDonor,
    forceDeleteDonor,
  };
};
