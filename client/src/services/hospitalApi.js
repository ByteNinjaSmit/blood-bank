// Shim → features/hospital/api
import { hospitalApi } from '@/features/hospital/api';

export default {
  initialize: () => {}, // no-op shim for compatibility
  getHospitals: hospitalApi.list,
  getHospitalById: hospitalApi.detail,
  createHospital: hospitalApi.create,
  updateHospital: (id, d) => hospitalApi.update(id, d),
  deleteHospital: hospitalApi.remove,
};
