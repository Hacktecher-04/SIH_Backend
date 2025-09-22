const express = require('express');
const passport = require('passport');
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
router.post('/createOtp', userController.createOtp);
router.post('/verifyOtp', userController.verifyOtp);
router.post('/resendOtp', userController.resendOtp);
router.post('/resetPassword', protect, userController.resetPassword);
router.post('/newPassword', protect, userController.newPassword);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    userController.googleAuthCallback
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
    '/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    userController.githubAuthCallback
);

module.exports = router;