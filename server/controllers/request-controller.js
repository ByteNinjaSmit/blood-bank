/*
POST /requests – Create hospital request
GET /requests – List requests (filter by status, hospital, date)
GET /requests/:id – Get request details
POST /requests/:id/match – Match available inventory
PATCH /requests/:id/approve – Approve matched request
PATCH /requests/:id/reject – Reject request
*/

const HospitalRequest = require('../models/hospital-request-model');
const Hospital = require('../models/hospital-model');
const Inventory = require('../models/inventory-model');


module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  matchRequest,
  approveRequest,
  rejectRequest
};