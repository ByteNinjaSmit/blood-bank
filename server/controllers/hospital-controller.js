/*
POST /hospitals – Add hospital
GET /hospitals – List hospitals
GET /hospitals/:id – Get hospital details
PUT /hospitals/:id – Update hospital info
DELETE /hospitals/:id – Delete hospital
*/

const Hospital = require('../models/hospital-model');
const mongoose = require('mongoose');

// Validation helper functions
const validateEmail = (email) => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
};

// Add a new hospital
const addHospital = async (req, res, next) => {
  try {
    const {
      name,
      address,
      contactPerson,
      phone
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name is required'
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hospital address is required'
      });
    }

    if (!contactPerson || !contactPerson.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Contact person is required'
      });
    }

    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number is required'
      });
    }


    // Check for duplicate phone number
    const existingPhoneHospital = await Hospital.findOne({ phone: phone.trim() });
    if (existingPhoneHospital) {
      return res.status(400).json({
        success: false,
        message: 'Hospital with this phone number already exists'
      });
    }


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
      name: name.trim(),
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    next(error);
  }
};

// List all hospitals with optional filters and pagination
const listHospitals = async (req, res, next) => {
  try {
    const { 
      name, 
      contactPerson, 
      phone,
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (contactPerson) filter.contactPerson = { $regex: contactPerson, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };

    // Pagination
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const skip = (pageNumber - 1) * pageSize;

    // Sorting
    const sortOptions = {};
    const validSortFields = ['name', 'contactPerson', 'phone', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

    // Get total count for pagination
    const totalCount = await Hospital.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);

    const hospitals = await Hospital.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.status(200).json({
      success: true,
      data: hospitals,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        pageSize,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      },
      filters: {
        name,
        contactPerson,
        phone
      },
      sorting: {
        sortBy: sortField,
        sortOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get hospital details by ID
const getHospitalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id);

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

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hospital ID'
      });
    }

    // Remove hospitalId from update data (should not be changed)
    delete updateData.hospitalId;
    delete updateData.createdAt;

    // Validate fields if provided
    if (updateData.name && !updateData.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hospital name cannot be empty'
      });
    }

    if (updateData.address && !updateData.address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Hospital address cannot be empty'
      });
    }

    if (updateData.contactPerson && !updateData.contactPerson.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Contact person cannot be empty'
      });
    }

    if (updateData.phone && !validatePhone(updateData.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number is required'
      });
    }

    if (updateData.email && !validateEmail(updateData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }


    // Check for duplicates (excluding current hospital)
    if (updateData.phone) {
      const existingPhoneHospital = await Hospital.findOne({ 
        phone: updateData.phone.trim(),
        _id: { $ne: id }
      });
      if (existingPhoneHospital) {
        return res.status(400).json({
          success: false,
          message: 'Hospital with this phone number already exists'
        });
      }
    }

    if (updateData.email) {
      const existingEmailHospital = await Hospital.findOne({ 
        email: updateData.email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (existingEmailHospital) {
        return res.status(400).json({
          success: false,
          message: 'Hospital with this email already exists'
        });
      }
    }

    if (updateData.licenseNo) {
      const existingLicenseHospital = await Hospital.findOne({ 
        licenseNo: updateData.licenseNo.trim(),
        _id: { $ne: id }
      });
      if (existingLicenseHospital) {
        return res.status(400).json({
          success: false,
          message: 'Hospital with this license number already exists'
        });
      }
    }

    // Sanitize data
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.address) updateData.address = updateData.address.trim();
    if (updateData.contactPerson) updateData.contactPerson = updateData.contactPerson.trim();
    if (updateData.phone) updateData.phone = updateData.phone.trim();
    if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
    if (updateData.licenseNo) updateData.licenseNo = updateData.licenseNo.trim();
    
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
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    next(error);
  }
};

// Delete hospital
const deleteHospital = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hospital ID'
      });
    }

    const deletedHospital = await Hospital.findByIdAndDelete(id);

    if (!deletedHospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hospital deleted successfully',
      data: deletedHospital
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addHospital,
  listHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital
};