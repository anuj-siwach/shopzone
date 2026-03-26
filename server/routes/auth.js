// server/routes/auth.js
// Includes: Register+OTP, Login, Forgot/Reset Password, Google OAuth

const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const User     = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendMail, otpTemplate, passwordResetTemplate } = require('../utils/sendMail');

const signToken = (id, role, name) =>
  jwt.sign({ id, role, name }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ── POST /api/auth/register ──────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, mobile } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: 'Name, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ msg: 'Email already registered' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const user = new User({
      name, email, passwordHash: password, mobile,
      emailOTP:   otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });
    await user.save();

    // Send OTP via Brevo
    await sendMail(email, 'Verify your ShopZone account — OTP', otpTemplate(otp, name));
    res.status(201).json({ msg: 'OTP sent to your email', userId: user._id });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+emailOTP +otpExpires');
    if (!user)           return res.status(404).json({ msg: 'User not found' });
    if (user.emailOTP !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
    if (user.otpExpires < new Date()) return res.status(400).json({ msg: 'OTP expired. Request a new one.' });

    user.isVerified = true;
    user.emailOTP   = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user._id, user.role, user.name);
    res.json({ msg: 'Email verified!', token, user: user.toJSON() });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── POST /api/auth/resend-otp ────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+emailOTP +otpExpires');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.isVerified) return res.status(400).json({ msg: 'Email already verified' });

    const otp = crypto.randomInt(100000, 999999).toString();
    user.emailOTP   = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendMail(email, 'New OTP — ShopZone', otpTemplate(otp, user.name));
    res.json({ msg: 'New OTP sent to your email' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: 'Email and password required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash');
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ msg: 'Account deactivated. Contact support.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ msg: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id, user.role, user.name);
    res.json({ token, user: user.toJSON() });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── POST /api/auth/forgot-password ───────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ msg: 'If that email exists, a reset link has been sent.' });

    const token       = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetToken   = hashedToken;
    user.resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendMail(
      email,
      'Password Reset — ShopZone',
      passwordResetTemplate(user.name, resetUrl)
    );
    res.json({ msg: 'Password reset link sent to your email.' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── POST /api/auth/reset-password/:token ─────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8)
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({
      resetToken:   hashed,
      resetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ msg: 'Invalid or expired reset token' });

    user.passwordHash = password;
    user.resetToken   = undefined;
    user.resetExpires = undefined;
    await user.save();
    res.json({ msg: 'Password reset successfully. Please log in.' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('wishlist', 'title images discountPrice price');
    res.json(user);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// GOOGLE OAUTH ROUTES
// ════════════════════════════════════════════════════════════════

// ── GET /api/auth/google — redirect to Google consent screen ─────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ── GET /api/auth/google/callback — Google redirects here ────────
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    // Create JWT for the Google-authenticated user
    const token = signToken(req.user._id, req.user.role, req.user.name);
    // Redirect to frontend with token in URL (frontend reads and stores it)
    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?token=${token}&name=${encodeURIComponent(req.user.name)}`
    );
  }
);

module.exports = router;
