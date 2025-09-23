const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/user.middleware');
const researchCareerController = require('../controllers/reserchCareer.controller');

router.use(protect)

router.post('/create', researchCareerController.generateResearchCareer);
router.get('/get', researchCareerController.getResearhCareer);
router.get('/:id', researchCareerController.getResearhCareerId);
router.delete('/:id', researchCareerController.deleteResearchCareer);

module.exports = router 