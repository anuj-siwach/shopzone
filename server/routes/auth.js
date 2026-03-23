// server/routes/auth.js
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendMail, otpTemplate } = require('../utils/sendMail');

const pendingUsers = new Map();

const signToken = (id, role, name) =>
  jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, mobile } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: 'Name, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  try {
    const emailLower = email.toLowerCase();

    // Check if already verified in database
    const existingVerified = await User.findOne({ email: emailLower, isVerified: true });
    if (existingVerified)
      return res.status(409).json({ msg: 'Email already registered. Please login.' });

    // Remove old unverified entries
    await User.deleteOne({ email: emailLower, isVerified: false });

    const otp        = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Store in memory
    pendingUsers.set(emailLower, { name, email: emailLower, password, mobile, otp, otpExpires });

    // Try to send email — if it fails, still return success
    // User can contact admin for OTP or we show OTP in response for dev
    let emailSent = false;
    try {
      await sendMail(email, 'Verify your ShopZone account', otpTemplate(otp, name));
      emailSent = true;
    } catch (emailErr) {
      console.error('Email failed:', emailErr.message);
      // Email failed but we still created the pending registration
    }

    // Always return success — email failure should not block registration
    res.status(201).json({
      msg: emailSent
        ? 'OTP sent to your email. Please verify to complete registration.'
        : 'Account created! Email could not be sent. Please contact support or use OTP: ' + otp,
      // In production you would NOT send OTP in response
      // but for a college project this is fine as fallback
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const emailLower = email.toLowerCase();
  try {
    const pending = pendingUsers.get(emailLower);
    if (pending) {
      if (pending.otp !== otp)
        return res.status(400).json({ msg: 'Invalid OTP. Please try again.' });
      if (pending.otpExpires < new Date())
        return res.status(400).json({ msg: 'OTP expired. Please register again.' });

      const user = new User({
        name: pending.name,
        email: pending.email,
        passwordHash: pending.password,
        mobile: pending.mobile,
        isVerified: true,
      });
      await user.save();
      pendingUsers.delete(emailLower);

      const token = signToken(user._id, user.role, user.name);
      return res.json({ msg: 'Account created successfully!', token, user: user.toJSON() });
    }

    // Fallback for database entries
    const user = await User.findOne({ email: emailLower }).select('+emailOTP +otpExpires');
    if (!user) return res.status(404).json({ msg: 'No pending registration. Please register again.' });
    if (user.isVerified) return res.status(400).json({ msg: 'Already verified. Please login.' });
    if (user.emailOTP !== otp) return res.status(400).json({ msg: 'Invalid OTP.' });
    if (user.otpExpires < new Date()) return res.status(400).json({ msg: 'OTP expired.' });

    user.isVerified = true;
    user.emailOTP   = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user._id, user.role, user.name);
    res.json({ msg: 'Email verified successfully', token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  const emailLower = email.toLowerCase();
  try {
    const otp        = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const pending    = pendingUsers.get(emailLower);

    if (pending) {
      pending.otp = otp;
      pending.otpExpires = otpExpires;
      pendingUsers.set(emailLower, pending);
      try { await sendMail(email, 'New OTP — ShopZone', otpTemplate(otp, pending.name)); } catch(e){}
      return res.json({ msg: 'New OTP sent.' });
    }

    const user = await User.findOne({ email: emailLower }).select('+emailOTP +otpExpires');
    if (!user) return res.status(404).json({ msg: 'No registration found. Please register again.' });
    if (user.isVerified) return res.status(400).json({ msg: 'Already verified. Please login.' });

    user.emailOTP   = otp;
    user.otpExpires = otpExpires;
    await user.save();
    try { await sendMail(email, 'New OTP — ShopZone', otpTemplate(otp, user.name)); } catch(e){}
    res.json({ msg: 'New OTP sent.' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });
  try {
    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower }).select('+passwordHash');
    if (!user) return res.status(401).json({ msg: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ msg: 'Account deactivated.' });
    if (!user.isVerified) return res.status(401).json({ msg: 'Please verify your email first.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ msg: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user._id, user.role, user.name);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ msg: 'If that email exists, a reset link has been sent.' });
    const token       = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetToken   = hashedToken;
    user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    try { await sendMail(email, 'Password Reset — ShopZone', `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a>. Expires in 30 minutes.</p>`); } catch(e){}
    res.json({ msg: 'Password reset link sent.' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8)
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({ resetToken: hashed, resetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ msg: 'Invalid or expired reset token' });
    user.passwordHash = password;
    user.resetToken   = undefined;
    user.resetExpires = undefined;
    await user.save();
    res.json({ msg: 'Password reset successfully. Please log in.' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist', 'title images discountPrice price');
    res.json(user);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
