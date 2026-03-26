// server/middleware/passport.js
// Google OAuth 2.0 — install: npm install passport passport-google-oauth20
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const { sendMail, welcomeTemplate } = require('../utils/sendMail');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value },
          ],
        });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar   = user.avatar || profile.photos[0]?.value;
            await user.save();
          }
          return done(null, user);
        }

        // New user via Google
        user = new User({
          name:         profile.displayName,
          email:        profile.emails[0].value,
          googleId:     profile.id,
          avatar:       profile.photos[0]?.value || '',
          passwordHash: Math.random().toString(36).slice(-12) + 'Aa1!',
          isVerified:   true,
          role:         'customer',
        });
        await user.save();

        sendMail(user.email, 'Welcome to ShopZone!', welcomeTemplate(user.name))
          .catch(console.error);

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); }
  catch (err) { done(err, null); }
});

module.exports = passport;
