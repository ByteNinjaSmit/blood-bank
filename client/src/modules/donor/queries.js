// Re-export from canonical location. Import from @/features/donor/queries directly in new code.
export {
  donorKeys,
  useDonorList as useDonorListQuery,
  useDonorDetail as useDonorQuery,
  useCreateDonor as useCreateDonorMutation,
  useUpdateDonor as useUpdateDonorMutation,
  useDeleteDonor as useDeleteDonorMutation,
} from '@/features/donor/queries';
