/*
Create Site 
Update Site 
Delete Site 
Get Details Of Site (View)
*/

const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site-controller');


router.route('/new').post(siteController.createSite);
router.route('/update/:id').put(siteController.updateSite);
router.route('/delete/:id').delete(siteController.deleteSite);
router.route('/details/:id').get(siteController.getSiteDetails);
router.route('/details').get(siteController.getAllSites);




module.exports = router;

