/*
POST /donations – Create new donation record (assign bagNo, segmentNo)
GET /donations – List donations (filter by status, date, blood group)
GET /donations/:id – Get donation details (populate donor, components)
PUT /donations/:id – Update vitals or collection details
PATCH /donations/:id/status – Update donation status
POST /donations/:id/print-label – Generate & print barcode label
*/

const BloodBag = require("../models/bloodbag-model");
const Donor = require("../models/donor-model");
const User = require("../models/user-model");
const Site = require("../models/site-model");
const Component = require('../models/component-model')

const mongoose = require("mongoose");

const newDonation = async (req, res, next) => {
    try {
        const {
            bagNo,
            segmentNo,
            batchNo,
            typeOfBag,
            donor,
            // expiryDate,
            initialVitals: { hb, weightKg, pulse, tempC, bp },
            bloodGroup,
            rh,
            atypicalAntibody,
            // quarantineReason,
            siteId
        } = req.body;

        const userId = req.user?._id;

        if (!mongoose.isValidObjectId(donor)) {
            return res.status(400).json({ message: 'Invalid donor ID' });
        }

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user (createdBy)' });
        }

        const donorExists = await Donor.findById(donor);
        if (!donorExists) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        if (siteId && !mongoose.isValidObjectId(siteId)) {
            return res.status(400).json({ message: 'Invalid site ID' });
        }

        if (siteId) {
            const siteExists = await Site.findById(siteId);
            if (!siteExists) {
                return res.status(404).json({ message: 'Site not found' });
            }
        }

        const existingBag = await BloodBag.findOne({
            $or: [
                { bagNo: bagNo },
                { segmentNo: segmentNo }
            ]
        });

        if (existingBag) {
            return res.status(409).json({
                message: 'Blood bag with this bagNo or segmentNo already exists.'
            });
        }

        // Cross-check donor blood group & Rh
        if (
            donorExists.bloodGroup !== bloodGroup ||
            donorExists.rh !== rh
        ) {
            return res.status(400).json({
                message: `Mismatch: Donor's blood group (${donorExists.bloodGroup} ${donorExists.rh}) does not match entered blood bag group (${bloodGroup} ${rh}).`
            });
        }


        const collectionDate = new Date();

        const bloodBag = new BloodBag({
            bagNo,
            segmentNo,
            batchNo,
            typeOfBag,
            donor,
            collectionDate: Date.now(),
            // expiryDate,
            initialVitals: {
                hb,
                weightKg,
                pulse,
                tempC,
                bp
            },
            bloodGroup,
            rh,
            atypicalAntibody,
            status: 'collected',
            // quarantineReason,
            siteId: siteId || null,
            createdBy: userId,
            updatedBy: userId
        });

        const savedBag = await bloodBag.save();


        await Donor.findByIdAndUpdate(
            donor,
            {
                $push: {
                    donationHistory: {
                        donationId: savedBag._id,
                        bagNo: savedBag.bagNo,
                        date: collectionDate
                    }
                },
                $set: {
                    lastDonationDate: collectionDate,
                    updatedBy: userId
                }
            },
            { new: true }
        );

        if (siteId) {
            await Site.findByIdAndUpdate(siteId, {
                $push: { bagsData: savedBag._id, donorData: donor }
            });
        }

        return res.status(201).json({
            message: 'New blood bag donation recorded successfully.',
            data: savedBag
        });

    } catch (error) {
        console.error('Error in newDonation:', error);
        next(error);
    }
};


// ------------
// GET Donation List
// ------------

const getAllDonations = async (req, res, next) => {
    try {
        const {
            status,
            bloodGroup,
            fromDate,
            toDate,
            page = 1,
            limit = 10,
        } = req.query;

        const filters = {};

        if (status) filters.status = status;
        if (bloodGroup) filters.bloodGroup = bloodGroup;

        if (fromDate && toDate) {
            filters.collectionDate = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            };
        } else if (fromDate) {
            filters.collectionDate = { $gte: new Date(fromDate) };
        } else if (toDate) {
            filters.collectionDate = { $lte: new Date(toDate) };
        }

        const skip = (page - 1) * limit;

        const bloodBags = await BloodBag.find(filters)
            .skip(skip)
            .limit(Number(limit))
            .select("bagNo segmentNo bloodGroup rh status collectionDate donor siteId components")
            .populate("donor", "name.firstName name.lastName bloodGroup rh")
            .populate("siteId", "name address")
            .populate("components", "componentId componentType volumeMl") // Populate component details
            .sort({ collectionDate: -1 });

        const totalBags = await BloodBag.countDocuments(filters);

        return res.status(200).json({
            message: "Blood bags fetched successfully.",
            data: bloodBags,
            pagination: {
                totalBags,
                totalPages: Math.ceil(totalBags / limit),
                currentPage: Number(page),
                pageSize: Number(limit),
            },
        });
    } catch (error) {
        console.error("Error in getAllDonations:", error);
        next(error);
    }
};




module.exports = {
    newDonation,
    getAllDonations
};
