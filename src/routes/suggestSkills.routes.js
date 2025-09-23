const express = require('express');
const suggestSkillsController = require('../controllers/suggestSkills.controller');
const { protect } = require('../middlewares/user.middleware');
 
const router = express.Router();

router.use(protect)

router.post('/create', suggestSkillsController.createSuggestSkills);
router.get('/:id', suggestSkillsController.getSuggestSkills);
router.delete('/:id', suggestSkillsController.deleteSuggestSkills);

module.exports = router;