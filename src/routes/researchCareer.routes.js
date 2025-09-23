const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/user.middleware');
const researchCareerController = require('../controllers/reserchCareer.controller');

router.use(protect)

router.post('/research-career', researchCareerController.generateRoadmap);
router.post('/suggest-skills', researchCareerController.getSuggestSkills);

module.exports = router