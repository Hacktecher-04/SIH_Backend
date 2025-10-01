const express = require('express');
const aiRoadmapRoutes = require('../controllers/aiRoadmap.controller');
const { protect } = require('../middlewares/user.middleware');
const router = express.Router();

router.use(protect)

router.post('/create', aiRoadmapRoutes.generateRoadmap)
router.get('/get', aiRoadmapRoutes.getAllUserRoadmaps)
router.get('/:id', aiRoadmapRoutes.getSingleRoadmap)
router.post('/data/:roadmapId', aiRoadmapRoutes.generateData)
router.delete('/:id', aiRoadmapRoutes.deleteRoadmap)

module.exports = router;