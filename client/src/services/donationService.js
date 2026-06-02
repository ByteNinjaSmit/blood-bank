// Shim → features/donation/api
import { donationApi } from '@/features/donation/api';

export default {
  createDonation: donationApi.create,
  getDonationById: donationApi.detail,
  listDonations: donationApi.list,
  updateDonation: (id, d) => donationApi.update?.(id, d),
  deleteDonation: (id) => donationApi.remove?.(id),
};
