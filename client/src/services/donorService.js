// Shim → features/donor/api
import { donorApi } from '@/features/donor/api';

export default {
  createDonor: donorApi.create,
  getDonorById: donorApi.detail,
  listDonors: donorApi.list,
  updateDonor: (id, d) => donorApi.update(id, d),
  deleteDonor: donorApi.remove,
  searchDonor: (q) => donorApi.list({ search: q }),
  forceDeleteDonor: donorApi.remove,
};
