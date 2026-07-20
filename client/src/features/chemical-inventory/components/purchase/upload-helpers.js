import { apiClient, unwrap } from '@/core/api-client';

export const uploadFile = (file, folder) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/api/v2/upload${folder ? `?folder=${folder}` : ''}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(unwrap);
};

export const deleteFile = (url) => {
  return apiClient.delete('/api/v2/upload', {
    params: { url },
  }).then(unwrap);
};
