const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user.model');

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

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                } else {
                    user = await User.create({
                        googleId: profile.id,
                        fullName: {
                            firstName: profile.name.givenName,
                            lastName: profile.name.familyName,
                        },
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        profilePicture: profile.photos[0].value,
                        role: 'user', // Default role
                    });
                    return done(null, user);
                }
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
            return done(null, user);
        } else {
            user = await User.create({
                githubId: profile.id,
                fullName: {
                    firstName: profile.displayName || profile.username,
                    lastName: '',
                },
                username: profile.username,
                email: profile.emails ? profile.emails[0].value : `${profile.username}@github.com`,
                profilePicture: profile.photos[0].value,
                role: 'user', // Default role
            });
            console.log(user);
            return done(null, user);
        }
    } catch (err) {
        return done(err, null);
    }
  }
));