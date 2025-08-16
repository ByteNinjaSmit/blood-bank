/*
POST /components/separate – Separate components from donation
GET /components – List components (filter by type/status/expiry)
GET /components/:id – Get component details
PATCH /components/:id/status – Update status (e.g., reserve/issue/discard)
POST /components/:id/print-label – Generate & print component label
*/

const Component = require('../models/component-model');
const BloodBag = require('../models/bloodbag-model');
const mongoose = require('mongoose');

/**
 * Separate components from a donation (blood bag)
 * @route POST /components/separate
 * @access Private
 */
const separateComponents = async (req, res) => {
  try {
    const { bagNo, components } = req.body;

    // Validate request body
    if (!bagNo || !components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ message: 'Please provide bagNo and components array' });
    }

    // Find the blood bag
    const bloodBag = await BloodBag.findOne({ bagNo });
    if (!bloodBag) {
      return res.status(404).json({ message: 'Blood bag not found' });
    }

    // Check if blood bag has passed testing
    if (bloodBag.status !== 'passed') {
      return res.status(400).json({ 
        message: 'Cannot separate components from a blood bag that has not passed testing' 
      });
    }

    // Create components
    const createdComponents = [];
    for (const component of components) {
      const { componentType, volumeMl, storageLocation } = component;
      
      // Validate component data
      if (!componentType || !volumeMl || !storageLocation) {
        return res.status(400).json({ 
          message: 'Each component must have componentType, volumeMl, and storageLocation' 
        });
      }

      // Calculate expiry date based on component type
      let expiryDate = new Date(bloodBag.collectionDate);
      switch (componentType) {
        case 'RBC':
          expiryDate.setDate(expiryDate.getDate() + 35); // 35 days for RBC
          break;
        case 'FFP':
          expiryDate.setDate(expiryDate.getDate() + 365); // 1 year for FFP
          break;
        case 'Platelet':
          expiryDate.setDate(expiryDate.getDate() + 5); // 5 days for platelets
          break;
        case 'Cryo':
          expiryDate.setDate(expiryDate.getDate() + 365); // 1 year for cryoprecipitate
          break;
        default:
          return res.status(400).json({ message: 'Invalid component type' });
      }

      // Create component ID
      const componentId = `${bloodBag.bagNo}-${componentType}`;

      // Create component
      const newComponent = await Component.create({
        componentId,
        donationId: bloodBag._id,
        componentType,
        volumeMl,
        batchNo: bloodBag.batchNo,
        storageLocation,
        expiryDate,
        status: 'in-stock',
        siteId: bloodBag.siteId,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });

      createdComponents.push(newComponent);

      // Add component to blood bag's components array
      bloodBag.components.push(newComponent._id);
    }

    // Update blood bag status
    bloodBag.status = 'component-separated';
    bloodBag.updatedBy = req.user.id;
    await bloodBag.save();

    res.status(201).json({
      message: 'Components separated successfully',
      components: createdComponents
    });
  } catch (error) {
    console.error('Error separating components:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * List components with filters
 * @route GET /components
 * @access Private
 */
const listComponents = async (req, res) => {
  try {
    const { 
      componentType, 
      status, 
      expiryBefore, 
      expiryAfter,
      siteId,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build filter object
    const filter = {};

    if (componentType) filter.componentType = componentType;
    if (status) filter.status = status;
    if (siteId) filter.siteId = siteId;
    
    // Handle expiry date filtering
    if (expiryBefore || expiryAfter) {
      filter.expiryDate = {};
      if (expiryBefore) filter.expiryDate.$lte = new Date(expiryBefore);
      if (expiryAfter) filter.expiryDate.$gte = new Date(expiryAfter);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const components = await Component.find(filter)
      .populate('donationId', 'bagNo bloodGroup rh')
      .populate('siteId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Component.countDocuments(filter);

    res.status(200).json({
      components,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listing components:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get component details by ID
 * @route GET /components/:id
 * @access Private
 */
const getComponentById = async (req, res) => {
  try {
    const component = await Component.findById(req.params.id)
      .populate('donationId', 'bagNo bloodGroup rh donor')
      .populate({
        path: 'donationId',
        populate: {
          path: 'donor',
          select: 'donorId firstName lastName bloodGroup rh'
        }
      })
      .populate('siteId', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.status(200).json(component);
  } catch (error) {
    console.error('Error getting component:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update component status
 * @route PATCH /components/:id/status
 * @access Private
 */
const updateComponentStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    // Validate status
    if (!status || !['in-stock', 'reserved', 'issued', 'discarded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If status is discarded, reason is required
    if (status === 'discarded' && !reason) {
      return res.status(400).json({ message: 'Reason is required for discarding a component' });
    }

    const component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Update component status
    component.status = status;
    component.updatedBy = req.user.id;
    
    // If component is being discarded, update the blood bag as well
    if (status === 'discarded') {
      // Add discard reason to component (this would require schema update)
      // For now, we'll just log it
      console.log(`Component ${component.componentId} discarded. Reason: ${reason}`);
    }

    await component.save();

    res.status(200).json({
      message: `Component status updated to ${status}`,
      component
    });
  } catch (error) {
    console.error('Error updating component status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Generate and print component label
 * @route POST /components/:id/print-label
 * @access Private
 */
const printComponentLabel = async (req, res) => {
  try {
    const component = await Component.findById(req.params.id)
      .populate('donationId', 'bagNo bloodGroup rh donor collectionDate')
      .populate({
        path: 'donationId',
        populate: {
          path: 'donor',
          select: 'donorId firstName lastName bloodGroup rh'
        }
      })
      .populate('siteId', 'name');

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // In a real implementation, this would generate a PDF or send data to a printer
    // For now, we'll just return the data that would be on the label

    const labelData = {
      componentId: component.componentId,
      componentType: component.componentType,
      volumeMl: component.volumeMl,
      bloodGroup: component.donationId.bloodGroup,
      rh: component.donationId.rh,
      collectionDate: component.donationId.collectionDate,
      expiryDate: component.expiryDate,
      donorId: component.donationId.donor.donorId,
      site: component.siteId.name,
      batchNo: component.batchNo || 'N/A',
      storageLocation: component.storageLocation
    };

    res.status(200).json({
      message: 'Label generated successfully',
      labelData
    });
  } catch (error) {
    console.error('Error generating component label:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  separateComponents,
  listComponents,
  getComponentById,
  updateComponentStatus,
  printComponentLabel
};

