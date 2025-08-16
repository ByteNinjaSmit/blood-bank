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

// Create a new hospital request
const createRequest = async (req, res, next) => {
  try {
    const { hospitalId, patient, requestedComponents, siteId } = req.body;
    
    // Validate hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    // Generate unique request ID
    const date = new Date();
    const year = date.getFullYear();
    
    // Get count of requests for this year to generate sequential ID
    const requestCount = await HospitalRequest.countDocuments({
      requestId: { $regex: `HREQ-${year}` }
    });
    
    // Format: HREQ-YYYY-001
    const requestId = `HREQ-${year}-${(requestCount + 1).toString().padStart(3, '0')}`;
    
    const newRequest = new HospitalRequest({
      requestId,
      hospitalId,
      patient,
      requestedComponents,
      siteId,
      status: 'pending'
    });
    
    await newRequest.save();
    
    res.status(201).json({
      success: true,
      message: 'Hospital request created successfully',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

// List hospital requests with filters
const listRequests = async (req, res, next) => {
  try {
    const { status, hospitalId, startDate, endDate, siteId } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (status) filter.status = status;
    if (hospitalId) filter.hospitalId = hospitalId;
    if (siteId) filter.siteId = siteId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const requests = await HospitalRequest.find(filter)
      .populate('hospitalId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// Get request details by ID
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const request = await HospitalRequest.findById(id)
      .populate('hospitalId')
      .populate('matchedInventory.inventoryId');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Hospital request not found' });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// Match request with available inventory
const matchRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inventoryIds } = req.body;
    
    const request = await HospitalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Hospital request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Request cannot be matched as it is already in ${request.status} status` 
      });
    }
    
    // Validate inventory items exist and are available
    const inventoryItems = await Inventory.find({
      _id: { $in: inventoryIds },
      status: 'available'
    });
    
    if (inventoryItems.length !== inventoryIds.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'One or more inventory items not found or not available' 
      });
    }
    
    // Update request with matched inventory
    const matchedInventory = inventoryIds.map(id => ({
      inventoryId: id,
      reservedAt: new Date()
    }));
    
    request.matchedInventory = matchedInventory;
    request.status = 'matched';
    await request.save();
    
    // Mark inventory items as reserved
    await Inventory.updateMany(
      { _id: { $in: inventoryIds } },
      { status: 'reserved', reservedFor: request._id }
    );
    
    res.status(200).json({
      success: true,
      message: 'Request matched with inventory successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// Approve matched request
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const request = await HospitalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Hospital request not found' });
    }
    
    if (request.status !== 'matched') {
      return res.status(400).json({ 
        success: false, 
        message: `Request cannot be approved as it is in ${request.status} status` 
      });
    }
    
    request.status = 'approved';
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Request approved successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// Reject request
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const request = await HospitalRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Hospital request not found' });
    }
    
    // If request was matched, release the reserved inventory
    if (request.status === 'matched') {
      const inventoryIds = request.matchedInventory.map(item => item.inventoryId);
      
      await Inventory.updateMany(
        { _id: { $in: inventoryIds } },
        { status: 'available', reservedFor: null }
      );
    }
    
    request.status = 'rejected';
    request.rejectionReason = reason;
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Request rejected successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  matchRequest,
  approveRequest,
  rejectRequest
};