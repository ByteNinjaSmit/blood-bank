const express = require("express");
const router = express.Router();
const discardController = require("../controllers/discard-controller");
const authMiddleware = require("../middlewares/auth-middleware"); 

router.route('/get-list').get(authMiddleware,discardController.getList);
router.route('/item/:id').get(authMiddleware,discardController.getSingleDetails);
router.route('/discard-item').post(authMiddleware,discardController.discardItem);


module.exports = router;