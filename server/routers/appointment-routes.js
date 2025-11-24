const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment-controller");
const authMiddleware = require("../middlewares/auth-middleware");

// Public endpoint used by public-frontend for booking
router.post("/public-booking", appointmentController.createPublicAppointment);

// Authenticated endpoint for internal system (dashboard)
router.get("/", authMiddleware, appointmentController.listAppointments);

module.exports = router;
