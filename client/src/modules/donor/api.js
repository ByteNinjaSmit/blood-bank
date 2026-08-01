import { donorApi } from '@/features/donor/api';

export const listDonors = (f) => donorApi.list(f);
export const getDonor = (id) => donorApi.detail(id);
export const createDonor = (d) => donorApi.create(d);
export const updateDonor = (id, p) => donorApi.update(id, p);
export const deleteDonor = (id) => donorApi.remove(id);
