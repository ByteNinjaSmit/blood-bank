// Compatibility shim. New code: import from @/features/donor/queries.
export {
  donorKeys,
  useDonorList as useDonorListQuery,
  useDonorDetail as useDonorQuery,
  useCreateDonor as useCreateDonorMutation,
  useUpdateDonor as useUpdateDonorMutation,
  useDeleteDonor as useDeleteDonorMutation,
} from '@/features/donor/queries';
