/*
Create Site 
Update Site 
Delete Site 
Get Details Of Site (View)
*/

const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site-controller');
const authMiddleware = require('../middlewares/auth-middleware');

router.route('/new').post(authMiddleware, siteController.createSite);
router.route('/update/:id').put(authMiddleware, siteController.updateSite);
router.route('/delete/:id').delete(authMiddleware, siteController.deleteSite);
router.route('/details/:id').get(authMiddleware, siteController.getSiteDetails);
router.route('/details').get(authMiddleware, siteController.getAllSites);
router.route('/staff-list').get(authMiddleware, siteController.getStaffList);
router.route('/list').get(authMiddleware, siteController.getCampList);
router.route('/camp-donations/:siteId').get(authMiddleware, siteController.campDonationList);
router.route('/camp-donors/:siteId').get(authMiddleware, siteController.campDonorList);
router.route('/voluntary-donations').get(authMiddleware, siteController.getVoluntaryCampDonations);

module.exports = router;
