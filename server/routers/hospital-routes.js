/*
POST   /hospitals                → Add hospital
GET    /hospitals                → List hospitals
GET    /hospitals/:id            → Get hospital details
PUT    /hospitals/:id            → Update hospital info
 */

const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospital-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');

// Routes for hospital management
router.route('/')
  .post(authMiddleware, hospitalController.addHospital)
  .get(authMiddleware, hospitalController.listHospitals);

router.route('/:id')
  .get(authMiddleware, hospitalController.getHospitalById)
  .put(authMiddleware, hospitalController.updateHospital);

module.exports = router;