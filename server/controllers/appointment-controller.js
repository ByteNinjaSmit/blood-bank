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
      address,
      appointmentDate,
    } = req.body;

    if (!fullName || !gender || !mobileNo || !bloodGroup || !birthDate || !address || !appointmentDate) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    if (!/^\d{10}$/.test(mobileNo)) {
      return res.status(400).json({ message: "Invalid mobile number. It must be a 10-digit number." });
    }

    if (email) {
      email = email.toLowerCase().trim();
    }

    const birthDateObj = new Date(birthDate);
    const appointmentDateObj = new Date(appointmentDate);

    if (isNaN(birthDateObj) || isNaN(appointmentDateObj)) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDateObj < today) {
      return res.status(400).json({ message: "Appointment date cannot be in the past." });
    }

    const appointment = new Appointment({
      fullName,
      gender,
      mobileNo,
      email,
      bloodGroup,
      birthDate: birthDateObj,
      address,
      appointmentDate: appointmentDateObj,
      source: "public-frontend",
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

module.exports = {
  createPublicAppointment,
};
