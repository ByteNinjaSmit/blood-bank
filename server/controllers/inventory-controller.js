/*
GET /inventory – List in-stock components
GET /inventory/near-expiry – Get near-expiry items
POST /inventory/reserve – Reserve stock for request
POST /inventory/issue – Issue reserved stock
POST /inventory/discard – Discard expired/unusable stock
*/

const Inventory = require('../models/inventory-model');
const HospitalRequest = require('../models/hospital-request-model');

// List inventory items with filters
const listInventory = async (req, res, next) => {
  try {
    const { bloodGroup, rh, componentType, status, siteId } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (rh) filter.rh = rh;
    if (componentType) filter.componentType = componentType;
    if (status) filter.status = status;
    if (siteId) filter.siteId = siteId;
    
    const inventory = await Inventory.find(filter)
      .populate('componentId', 'donationId')
      .populate('reservedFor', 'requestId hospitalId')
      .sort({ expiryDate: 1 }); // Sort by expiry date (oldest first)
    
    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// Get near-expiry inventory items
const getNearExpiryInventory = async (req, res, next) => {
  try {
    const { days = 7, siteId } = req.query;
    
    // Calculate date threshold for near expiry (default: 7 days from now)
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + parseInt(days));
    
    const filter = {
      expiryDate: { $lte: expiryThreshold },
      status: 'in-stock' // Only consider in-stock items
    };
    
    if (siteId) filter.siteId = siteId;
    
    const nearExpiryItems = await Inventory.find(filter)
      .populate('componentId', 'donationId')
      .sort({ expiryDate: 1 });
    
    res.status(200).json({
      success: true,
      count: nearExpiryItems.length,
      data: nearExpiryItems
    });
  } catch (error) {
    next(error);
  }
};

// Reserve inventory items for a hospital request
const reserveInventory = async (req, res, next) => {
  try {
    const { requestId, inventoryIds } = req.body;
    
    if (!requestId || !inventoryIds || !Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and inventory IDs array are required'
      });
    }
    
    // Verify request exists
    const request = await HospitalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hospital request not found'
      });
    }
    
    // Verify all inventory items exist and are available
    const inventoryItems = await Inventory.find({
      _id: { $in: inventoryIds },
      status: 'in-stock'
    });
    
    if (inventoryItems.length !== inventoryIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more inventory items not found or not available'
      });
    }
    
    // Update inventory items to reserved status
    await Inventory.updateMany(
      { _id: { $in: inventoryIds } },
      { status: 'reserved', reservedFor: requestId }
    );
    
    // Update request with matched inventory
    const matchedInventory = inventoryIds.map(id => ({
      inventoryId: id,
      reservedAt: new Date()
    }));
    
    request.matchedInventory = matchedInventory;
    request.status = 'matched';
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Inventory items reserved successfully',
      data: {
        request,
        reservedItems: inventoryItems
      }
    });
  } catch (error) {
    next(error);
  }
};

// Issue reserved inventory
const issueInventory = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }
    
    // Verify request exists and is in approved status
    const request = await HospitalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Hospital request not found'
      });
    }
    
    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be issued as it is in ${request.status} status. It must be in 'approved' status.`
      });
    }
    
    // Get inventory items reserved for this request
    const inventoryIds = request.matchedInventory.map(item => item.inventoryId);
    
    // Update inventory items to issued status
    await Inventory.updateMany(
      { _id: { $in: inventoryIds } },
      { status: 'issued' }
    );
    
    // Update request status
    request.status = 'issued';
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Inventory items issued successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// Discard inventory items
const discardInventory = async (req, res, next) => {
  try {
    const { inventoryIds, reason } = req.body;
    
    if (!inventoryIds || !Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Inventory IDs array is required'
      });
    }
    
    // Verify all inventory items exist and are not already discarded
    const inventoryItems = await Inventory.find({
      _id: { $in: inventoryIds },
      status: { $ne: 'discarded' }
    });
    
    if (inventoryItems.length !== inventoryIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more inventory items not found or already discarded'
      });
    }
    
    // Check if any items are reserved and update the corresponding requests
    const reservedItems = inventoryItems.filter(item => 
      item.status === 'reserved' && item.reservedFor
    );
    
    // Get unique request IDs
    const affectedRequestIds = [...new Set(
      reservedItems.map(item => item.reservedFor.toString())
    )];
    
    // Update affected requests
    for (const requestId of affectedRequestIds) {
      const request = await HospitalRequest.findById(requestId);
      if (request) {
        // Remove discarded items from matchedInventory
        const discardedItemIds = reservedItems
          .filter(item => item.reservedFor.toString() === requestId)
          .map(item => item._id.toString());
        
        request.matchedInventory = request.matchedInventory.filter(
          match => !discardedItemIds.includes(match.inventoryId.toString())
        );
        
        // If no matched inventory remains, revert to pending status
        if (request.matchedInventory.length === 0) {
          request.status = 'pending';
        }
        
        await request.save();
      }
    }
    
    // Update inventory items to discarded status
    await Inventory.updateMany(
      { _id: { $in: inventoryIds } },
      { 
        status: 'discarded', 
        reservedFor: null,
        discardReason: reason || 'Not specified'
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Inventory items discarded successfully',
      data: {
        discardedItems: inventoryItems,
        affectedRequests: affectedRequestIds
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listInventory,
  getNearExpiryInventory,
  reserveInventory,
  issueInventory,
  discardInventory
};