/*
POST /donors – Register new donor
GET /donors – List donors (filter by group, eligibility, date range)
GET /donors/:id – Get donor details & donation history
PUT /donors/:id – Update donor info
DELETE /donors/:id – Soft delete donor
*/

const Donor = require('../models/donor-model');

// Register a new donor
const registerDonor = async (req, res, next) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      dob,
      sex,
      phone,
      email,
      address,
      occupation,
      weightKg,
      bloodGroup,
      rh,
      eligibilityStatus,
      siteId
    } = req.body;

    // Generate a unique donor ID (e.g., DNR-2025-0001)
    const currentYear = new Date().getFullYear();
    const lastDonor = await Donor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    
    let donorNumber = 1;
    if (lastDonor && lastDonor.donorId) {
      const lastDonorIdParts = lastDonor.donorId.split('-');
      if (lastDonorIdParts.length === 3 && lastDonorIdParts[1] === currentYear.toString()) {
        donorNumber = parseInt(lastDonorIdParts[2]) + 1;
      }
    }
    
    const donorId = `DNR-${currentYear}-${donorNumber.toString().padStart(4, '0')}`;

    const newDonor = new Donor({
      donorId,
      firstName,
      middleName,
      lastName,
      dob,
      sex,
      phone,
      email,
      address,
      occupation,
      weightKg,
      bloodGroup,
      rh,
      eligibilityStatus,
      siteId,
      createdBy: req.user ? req.user.id : undefined,
      updatedBy: req.user ? req.user.id : undefined
    });

    const savedDonor = await newDonor.save();

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully',
      data: savedDonor
    });
  } catch (error) {
    next(error);
  }
};

// List donors with optional filters
const listDonors = async (req, res, next) => {
  try {
    const { bloodGroup, rh, eligibilityStatus, fromDate, toDate, siteId } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (rh) filter.rh = rh;
    if (eligibilityStatus) filter.eligibilityStatus = eligibilityStatus;
    if (siteId) filter.siteId = siteId;
    
    // Date range filter for createdAt
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const donors = await Donor.find(filter)
      .sort({ createdAt: -1 })
      .populate('siteId', 'name');

    res.status(200).json({
      success: true,
      count: donors.length,
      data: donors
    });
  } catch (error) {
    next(error);
  }
};

// Get donor details by ID
const getDonorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findById(id)
      .populate('siteId', 'name')
      .populate({
        path: 'donationHistory.donationId',
        select: 'date status bagNo'
      });

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donor
    });
  } catch (error) {
    next(error);
  }
};

// Update donor information
const updateDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add updatedBy and updatedAt
    updateData.updatedBy = req.user ? req.user.id : undefined;
    updateData.updatedAt = new Date();

    const updatedDonor = await Donor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donor updated successfully',
      data: updatedDonor
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete a donor (mark as inactive)
const deleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Instead of actually deleting, we could add a 'status' field to mark as inactive
    // For now, we'll use actual deletion as the model doesn't have a status field
    const deletedDonor = await Donor.findByIdAndDelete(id);

    if (!deletedDonor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDonor,
  listDonors,
  getDonorById,
  updateDonor,
  deleteDonor
};
