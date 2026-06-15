import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bagProcurementApi } from './api';

// ─── Query Key Factory ────────────────────────────────────────────────────────
export const bagProcurementKeys = {
  vendor:        { list: (f) => ['vendor', 'list', f ?? {}], detail: (id) => ['vendor', 'detail', id] },
  po:            { list: (f) => ['purchase-order', 'list', f ?? {}], detail: (id) => ['purchase-order', 'detail', id] },
  grn:           { list: (f) => ['goods-receipt', 'list', f ?? {}], detail: (id) => ['goods-receipt', 'detail', id] },
  bagStock:      { list: (f) => ['bag-stock', 'list', f ?? {}], detail: (id) => ['bag-stock', 'detail', id], summary: () => ['bag-stock', 'summary'] },
  bagInspection: { list: (f) => ['bag-inspection', 'list', f ?? {}], detail: (id) => ['bag-inspection', 'detail', id] },
  bagIssue:      { list: (f) => ['bag-issue', 'list', f ?? {}], detail: (id) => ['bag-issue', 'detail', id] },
  bagDiscard:    { list: (f) => ['bag-discard', 'list', f ?? {}], detail: (id) => ['bag-discard', 'detail', id] },
};

// ─── Vendor ───────────────────────────────────────────────────────────────────
export function useVendorList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.vendor.list(filters),
    queryFn: () => bagProcurementApi.vendor.list(filters),
    staleTime: 30_000,
  });
}

export function useVendorDetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.vendor.detail(id),
    queryFn: () => bagProcurementApi.vendor.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bagProcurementApi.vendor.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'list'] }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.vendor.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'list'] }),
  });
}

export function useUpdateVendorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => bagProcurementApi.vendor.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'list'] }),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => bagProcurementApi.vendor.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'list'] }),
  });
}

// ─── Purchase Order ───────────────────────────────────────────────────────────
export function usePOList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.po.list(filters),
    queryFn: () => bagProcurementApi.purchaseOrder.list(filters),
    staleTime: 30_000,
  });
}

export function usePODetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.po.detail(id),
    queryFn: () => bagProcurementApi.purchaseOrder.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bagProcurementApi.purchaseOrder.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-order', 'list'] }),
  });
}

export function useUpdatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.purchaseOrder.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-order', 'list'] }),
  });
}



// ─── Goods Receipt ────────────────────────────────────────────────────────────
export function useGRNList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.grn.list(filters),
    queryFn: () => bagProcurementApi.goodsReceipt.list(filters),
    staleTime: 30_000,
  });
}

export function useGRNDetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.grn.detail(id),
    queryFn: () => bagProcurementApi.goodsReceipt.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateGRN() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bagProcurementApi.goodsReceipt.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goods-receipt', 'list'] }),
  });
}

export function useUpdateGRN() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.goodsReceipt.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goods-receipt', 'list'] }),
  });
}

// ─── Bag Stock ────────────────────────────────────────────────────────────────
export function useBagStockList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.bagStock.list(filters),
    queryFn: () => bagProcurementApi.bagStock.list(filters),
    staleTime: 30_000,
  });
}

export function useBagStockSummary() {
  return useQuery({
    queryKey: bagProcurementKeys.bagStock.summary(),
    queryFn: bagProcurementApi.bagStock.summary,
    staleTime: 30_000,
  });
}

export function useBagStockDetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.bagStock.detail(id),
    queryFn: () => bagProcurementApi.bagStock.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useUpdateStockStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => bagProcurementApi.bagStock.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-stock', 'list'] }),
  });
}

// ─── Bag Inspection ───────────────────────────────────────────────────────────
export function useBagInspectionList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.bagInspection.list(filters),
    queryFn: () => bagProcurementApi.bagInspection.list(filters),
    staleTime: 30_000,
  });
}

export function useBagInspectionDetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.bagInspection.detail(id),
    queryFn: () => bagProcurementApi.bagInspection.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateBagInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bagProcurementApi.bagInspection.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-inspection', 'list'] }),
  });
}

export function useUpdateBagInspectionReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.bagInspection.updateReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-inspection', 'list'] }),
  });
}

// ─── Bag Issue ────────────────────────────────────────────────────────────────
export function useBagIssueList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.bagIssue.list(filters),
    queryFn: () => bagProcurementApi.bagIssue.list(filters),
    staleTime: 30_000,
  });
}

export function useBagIssueDetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.bagIssue.detail(id),
    queryFn: () => bagProcurementApi.bagIssue.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useIssueBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bagProcurementApi.bagIssue.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-issue', 'list'] }),
  });
}

export function useMarkBagUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.bagIssue.markUsed(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-issue', 'list'] }),
  });
}

export function useReturnBag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => bagProcurementApi.bagIssue.returnBag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-issue', 'list'] }),
  });
}

export function useMarkBagDamaged() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.bagIssue.markDamaged(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-issue', 'list'] }),
  });
}

// ─── Bag Discard ──────────────────────────────────────────────────────────────
export function useBagDiscardList(filters) {
  return useQuery({
    queryKey: bagProcurementKeys.bagDiscard.list(filters),
    queryFn: () => bagProcurementApi.bagDiscard.list(filters),
    staleTime: 30_000,
  });
}

export function useBagDiscardDetail(id) {
  return useQuery({
    queryKey: bagProcurementKeys.bagDiscard.detail(id),
    queryFn: () => bagProcurementApi.bagDiscard.get(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateBagDiscard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bagProcurementApi.bagDiscard.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-discard', 'list'] }),
  });
}

export function useApproveBagDiscard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bagProcurementApi.bagDiscard.approve(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bag-discard', 'list'] }),
  });
}
