/*
Create Site 
Update Site 
Delete Site 
Get Details Of Site (View)
*/

const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site-controller');
const authMiddleware = require("../middlewares/auth-middleware"); 



router.route('/new').post(authMiddleware,siteController.createSite);
router.route('/update/:id').put(authMiddleware,siteController.updateSite);
router.route('/delete/:id').delete(authMiddleware,siteController.deleteSite);
router.route('/details/:id').get(authMiddleware,siteController.getSiteDetails);
router.route('/details').get(authMiddleware,siteController.getAllSites);
router.route('/staff-list').get(authMiddleware,siteController.getStaffList);



module.exports = router;

