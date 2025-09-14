const express = require('express');
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/user.middleware');
const router = express.Router();

router.use(protect)

router.post('/create', aiController.create)
router.get('/get', aiController.getAndCleanMessages)

module.exports = router