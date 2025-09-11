const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, refresh_Token } = require('../middlewares/user.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', protect, userController.getUser);
router.put('/profile', protect, upload.single('profilePicture'), userController.updateUser);
router.delete('/profile', protect, userController.deleteUser);
router.get('/refresh_Token', refresh_Token, userController.refresh_Token)

module.exports = router;