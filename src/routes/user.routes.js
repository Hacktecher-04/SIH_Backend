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

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    userController.googleAuthCallback
);


// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: [ 'user:email' ] }));

// router.get(
//     '/github/callback',
//     passport.authenticate('github', { failureRedirect: '/login' }),
//     userController.githubAuthCallback
// );

router.get('/github/callback', async (req, res, next) => {
  try {
    console.log('GitHub callback hit with code:', req.query.code);

    passport.authenticate('github', (err, user, info) => {
      if (err) {
        console.error('Passport error:', err);
        return res.status(500).json({ error: 'Passport error', details: err.message });
      }
      if (!user) {
        console.error('No user returned:', info);
        return res.status(401).json({ error: 'Authentication failed', info });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Login error', details: err.message });
        }
        return res.redirect(process.env.FRONTEND_URL + '/dashboard');
      });
    })(req, res, next);

  } catch (e) {
    console.error('Outer error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;