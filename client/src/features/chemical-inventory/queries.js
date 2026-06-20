import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chemicalInventoryApi } from './api';

export const chemicalInventoryKeys = {
  all:          ['chemical-inventory'],
  category:     ()       => [...chemicalInventoryKeys.all, 'category'],
  supplier:     ()       => [...chemicalInventoryKeys.all, 'supplier'],
  manufacturer: ()       => [...chemicalInventoryKeys.all, 'manufacturer'],
  chemical:     ()       => [...chemicalInventoryKeys.all, 'chemical'],
  lot:          (f)      => [...chemicalInventoryKeys.all, 'lot', f ?? {}],
  history:      (f)      => [...chemicalInventoryKeys.all, 'history', f ?? {}],
  purchase:     ()       => [...chemicalInventoryKeys.all, 'purchase'],
  stats:        ()       => [...chemicalInventoryKeys.all, 'stats'],
  reports:      (t, f)   => [...chemicalInventoryKeys.all, 'reports', t, f ?? {}],
};

// Category Hooks
export function useCategoryList() {
  return useQuery({
    queryKey: chemicalInventoryKeys.category(),
    queryFn: chemicalInventoryApi.category.list,
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.category.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.category() }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.category.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.category() }),
  });
}

// Supplier Hooks
export function useSupplierList() {
  return useQuery({
    queryKey: chemicalInventoryKeys.supplier(),
    queryFn: chemicalInventoryApi.supplier.list,
    staleTime: 30_000,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.supplier.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.supplier() }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => chemicalInventoryApi.supplier.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.supplier() }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.supplier.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.supplier() }),
  });
}

// Manufacturer Hooks
export function useManufacturerList() {
  return useQuery({
    queryKey: chemicalInventoryKeys.manufacturer(),
    queryFn: chemicalInventoryApi.manufacturer.list,
    staleTime: 30_000,
  });
}

export function useCreateManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.manufacturer.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.manufacturer() }),
  });
}

export function useDeleteManufacturer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.manufacturer.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.manufacturer() }),
  });
}

// Chemical Hooks
export function useChemicalList() {
  return useQuery({
    queryKey: chemicalInventoryKeys.chemical(),
    queryFn: chemicalInventoryApi.chemical.list,
    staleTime: 30_000,
  });
}

export function useCreateChemical() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.chemical.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.chemical() }),
  });
}

export function useUpdateChemical() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => chemicalInventoryApi.chemical.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.chemical() }),
  });
}

export function useDeleteChemical() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.chemical.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: chemicalInventoryKeys.chemical() }),
  });
}

// Lots Hooks
export function useLotList(filters) {
  return useQuery({
    queryKey: chemicalInventoryKeys.lot(filters),
    queryFn: () => chemicalInventoryApi.lot.list(filters),
    staleTime: 10_000,
  });
}

export function useCreateLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chemicalInventoryApi.lot.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chemical-inventory'] });
    },
  });
}

export function useUpdateUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, quantity }) => chemicalInventoryApi.lot.updateUsage(id, { action, quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chemical-inventory'] });
    },
  });
}

export function usePurchaseList() {
  return useQuery({
    queryKey: chemicalInventoryKeys.purchase(),
    queryFn: chemicalInventoryApi.purchase.list,
    staleTime: 10_000,
  });
}

export function useUpdatePurchasePayments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, installments }) => chemicalInventoryApi.purchase.updatePayments(id, { installments }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chemical-inventory'] });
    },
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => chemicalInventoryApi.purchase.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chemical-inventory'] });
    },
  });
}

// Audit History
export function useHistoryList(filters) {
  return useQuery({
    queryKey: chemicalInventoryKeys.history(filters),
    queryFn: () => chemicalInventoryApi.history.list(filters),
    staleTime: 10_000,
  });
}

// Dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: chemicalInventoryKeys.stats(),
    queryFn: chemicalInventoryApi.stats.get,
    staleTime: 15_000,
  });
}

// Reports
export function useMonthlyReport(filters) {
  return useQuery({
    queryKey: chemicalInventoryKeys.reports('monthly', filters),
    queryFn: () => chemicalInventoryApi.reports.monthly(filters),
    staleTime: 30_000,
  });
}

export function useSupplierReport(filters) {
  return useQuery({
    queryKey: chemicalInventoryKeys.reports('supplier', filters),
    queryFn: () => chemicalInventoryApi.reports.supplier(filters),
    staleTime: 30_000,
  });
}

export function useExpiryReport() {
  return useQuery({
    queryKey: chemicalInventoryKeys.reports('expiry'),
    queryFn: chemicalInventoryApi.reports.expiry,
    staleTime: 30_000,
  });
}

export function useConsumptionReport() {
  return useQuery({
    queryKey: chemicalInventoryKeys.reports('consumption'),
    queryFn: chemicalInventoryApi.reports.consumption,
    staleTime: 30_000,
  });
}
