// Donor API calls. ONLY the new /api/v2/donor endpoints. Old
// /api/donor calls remain in services/donorService.js so the
// non-migrated screens still work during cutover.

import { apiClient, unwrap } from '@/lib/api-client';

const BASE = '/api/v2/donor';

export async function listDonors(filters = {}) {
  const response = await apiClient.get(BASE, { params: filters });
  return unwrap(response); // { items, total, page, pageSize }
}

export async function getDonor(id) {
  const response = await apiClient.get(`${BASE}/${id}`);
  return unwrap(response); // DonorDto
}

export async function createDonor(input) {
  const response = await apiClient.post(BASE, input);
  return unwrap(response);
}

export async function updateDonor(id, patch) {
  const response = await apiClient.put(`${BASE}/${id}`, patch);
  return unwrap(response);
}

export async function deleteDonor(id) {
  await apiClient.delete(`${BASE}/${id}`);
}
