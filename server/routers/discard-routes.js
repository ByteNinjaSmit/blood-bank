const express = require("express");
const router = express.Router();
const discardController = require("../controllers/discard-controller");
const authMiddleware = require("../middlewares/auth-middleware"); 

router.route('/get-list').get(authMiddleware,discardController.getList);

module.exports = router;