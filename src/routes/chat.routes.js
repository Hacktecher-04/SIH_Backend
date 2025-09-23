const express = require('express');
const chatController = require('../controllers/chat.controller')
const { protect } = require('../middlewares/user.middleware');

const router = express.Router();

router.use(protect)

router.get('/get', chatController.getChat);
router.get('/:id', chatController.getChatId);
router.put('/:id', chatController.updateChat);
router.delete('/:id', chatController.deleteChat);
router.get('/:chatId/messages', chatController.getMessages);

module.exports = router;