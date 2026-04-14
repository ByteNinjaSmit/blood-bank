const Appointment = require("../models/appointment-model");

const createPublicAppointment = async (req, res, next) => {
  try {
    let {
      fullName,
      gender,
      mobileNo,
      email,
      bloodGroup,
      birthDate,
      age,
      address,
      appointmentDate,
      recentIllness,
      surgery,
      medication,
      lastDonation,
      donationFrequency,
      wantReminder,
      reminderDays,
    } = req.body;

    if (!mobileNo) {
      return res.status(400).json({ message: "Mobile number is required." });
    }

    if (!/^\d{10}$/.test(mobileNo)) {
      return res.status(400).json({ message: "Invalid mobile number. It must be a 10-digit number." });
    }

    if (email) {
      email = email.toLowerCase().trim();
    }

    const birthDateObj = birthDate ? new Date(birthDate) : null;
    if (birthDateObj && isNaN(birthDateObj)) {
      return res.status(400).json({ message: "Invalid birth date format." });
    }

    const appointmentDateObj = appointmentDate ? new Date(appointmentDate) : null;
    if (appointmentDateObj && isNaN(appointmentDateObj)) {
      return res.status(400).json({ message: "Invalid appointment date format." });
    }

    if (appointmentDateObj) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDateObj < today) {
        return res.status(400).json({ message: "Appointment date cannot be in the past." });
      }
    }

    const appointment = new Appointment({
      fullName,
      gender,
      mobileNo,
      email,
      bloodGroup,
      birthDate: birthDateObj || undefined,
      age: parseInt(age) || undefined,
      address,
      appointmentDate: appointmentDateObj || undefined,
      recentIllness,
      surgery,
      medication,
      lastDonation: lastDonation ? new Date(lastDonation) : undefined,
      donationFrequency,
      wantReminder: wantReminder === true || wantReminder === "true",
      reminderDays: parseInt(reminderDays) || 0,
      source: "public-frontend-nextjs",
    });

    await appointment.save();

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointmentId: appointment._id,
    });
  } catch (error) {
    next(error);
  }
};

// Authenticated list endpoint for internal system (dashboard)
// Supports filters, search and pagination
const listAppointments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "appointmentDate",
      sortOrder = "desc",
      status,
      fromDate,
      toDate,
      search,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.appointmentDate = {};
      if (fromDate) {
        const from = new Date(fromDate);
        if (!isNaN(from)) {
          filter.appointmentDate.$gte = from;
        }
      }
      if (toDate) {
        const to = new Date(toDate);
        if (!isNaN(to)) {
          // include full day
          to.setHours(23, 59, 59, 999);
          filter.appointmentDate.$lte = to;
        }
      }
      if (Object.keys(filter.appointmentDate).length === 0) {
        delete filter.appointmentDate;
      }
    }

    if (search) {
      const raw = String(search).trim();
      if (raw) {
        const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(esc, "i");
        filter.$or = [
          { fullName: rx },
          { mobileNo: rx },
          { email: rx },
          { bloodGroup: rx },
        ];
      }
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const validSortFields = ["appointmentDate", "createdAt", "fullName", "status"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "appointmentDate";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const totalCount = await Appointment.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize) || 0;

    const appointments = await Appointment.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        pageSize,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
      filters: {
        status: status || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        search: search || null,
      },
      sorting: {
        sortBy: sortField,
        sortOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPublicAppointment,
  listAppointments,
};
