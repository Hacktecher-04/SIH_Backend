const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user.model');

// Helper to generate username
const generateUsername = (displayName) => {
  const baseName = (displayName || 'user')
    .split(/\s+/)
    .filter(Boolean)
    .join('_')
    .toLowerCase();

  const uniqueSuffix = Date.now();
  return `${baseName}_${uniqueSuffix}`;
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// GOOGLE
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // check by googleId first
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // check by email
        const email = profile.emails?.[0]?.value;
        if (email) {
          let existing = await User.findOne({ email });
          if (existing) {
            // link googleId to existing account
            existing.googleId = profile.id;
            await existing.save();
            return done(null, existing);
          }
        }

        // create new user
        const username = generateUsername(profile.displayName);
        user = await User.create({
          googleId: profile.id,
          fullName: {
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
          },
          username,
          email: email || `${username}@googleuser.com`,
          profilePicture: profile.photos?.[0]?.value || '',
          role: 'user',
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// GITHUB
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // check by githubId first
        let user = await User.findOne({ githubId: profile.id });
        if (user) return done(null, user);

        // handle email safely
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : `${profile.username || 'user'}@github.com`;

        // check existing by email
        let existing = await User.findOne({ email });
        if (existing) {
          existing.githubId = profile.id;
          await existing.save();
          return done(null, existing);
        }

        // create new user
        const username = generateUsername(
          profile.displayName || profile.username
        );
        user = await User.create({
          githubId: profile.id,
          fullName: {
            firstName: profile.displayName || profile.username || '',
            lastName: '',
          },
          username,
          email,
          profilePicture: profile.photos?.[0]?.value || '',
          role: 'user',
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
