/*
POST /hospitals – Add hospital
GET /hospitals – List hospitals
GET /hospitals/:id – Get hospital details
PUT /hospitals/:id – Update hospital info
*/

const Hospital = require('../models/hospital-model');

// Add a new hospital
const addHospital = async (req, res, next) => {
  try {
    const {
      name,
      address,
      contactPerson,
      phone,
      email,
      licenseNo,
      siteId
    } = req.body;

    // Generate a unique hospital ID (e.g., HSP-2025-0001)
    const currentYear = new Date().getFullYear();
    const lastHospital = await Hospital.findOne({}, {}, { sort: { 'createdAt': -1 } });
    
    let hospitalNumber = 1;
    if (lastHospital && lastHospital.hospitalId) {
      const lastHospitalIdParts = lastHospital.hospitalId.split('-');
      if (lastHospitalIdParts.length === 3 && lastHospitalIdParts[1] === currentYear.toString()) {
        hospitalNumber = parseInt(lastHospitalIdParts[2]) + 1;
      }
    }
    
    const hospitalId = `HSP-${currentYear}-${hospitalNumber.toString().padStart(4, '0')}`;

    const newHospital = new Hospital({
      hospitalId,
      name,
      address,
      contactPerson,
      phone,
      email,
      licenseNo,
      siteId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedHospital = await newHospital.save();

    res.status(201).json({
      success: true,
      message: 'Hospital added successfully',
      data: savedHospital
    });
  } catch (error) {
    next(error);
  }
};

// List all hospitals with optional filters
const listHospitals = async (req, res, next) => {
  try {
    const { name, siteId } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (name) filter.name = { $regex: name, $options: 'i' }; // Case-insensitive name search
    if (siteId) filter.siteId = siteId;

    const hospitals = await Hospital.find(filter)
      .sort({ name: 1 })
      .populate('siteId', 'name');

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (error) {
    next(error);
  }
};

// Get hospital details by ID
const getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id)
      .populate('siteId', 'name');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    next(error);
  }
};

// Update hospital information
const updateHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add updatedAt
    updateData.updatedAt = new Date();

    const updatedHospital = await Hospital.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedHospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hospital updated successfully',
      data: updatedHospital
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addHospital,
  listHospitals,
  getHospitalById,
  updateHospital
};