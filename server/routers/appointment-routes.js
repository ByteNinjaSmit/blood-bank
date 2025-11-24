const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment-controller");

router.post("/public-booking", appointmentController.createPublicAppointment);

module.exports = router;
