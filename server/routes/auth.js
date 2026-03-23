// server/routes/auth.js
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { auth } = require('../middleware/auth');

const signToken = (id, role, name) =>
  jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register — NO OTP, instant registration
router.post('/register', async (req, res) => {
  const { name, email, password, mobile } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: 'Name, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  try {
    const emailLower = email.toLowerCase();
    const existing = await User.findOne({ email: emailLower });
    if (existing && existing.isVerified)
      return res.status(409).json({ msg: 'Email already registered. Please login.' });
    if (existing && !existing.isVerified) {
      // Update existing unverified user
      existing.name         = name;
      existing.passwordHash = password;
      existing.mobile       = mobile;
      existing.isVerified   = true;
      await existing.save();
      const token = signToken(existing._id, existing.role, existing.name);
      return res.status(201).json({
        msg: 'Account created successfully!',
        token,
        user: existing.toJSON(),
      });
    }
    // Create new user — verified immediately, no OTP
    const user = new User({
      name,
      email: emailLower,
      passwordHash: password,
      mobile,
      isVerified: true,
    });
    await user.save();
    const token = signToken(user._id, user.role, user.name);
    res.status(201).json({
      msg: 'Account created successfully!',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/verify-otp — kept for compatibility
router.post('/verify-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.isVerified = true;
    await user.save();
    const token = signToken(user._id, user.role, user.name);
    res.json({ msg: 'Verified!', token, user: user.toJSON() });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// POST /api/auth/resend-otp — kept for compatibility
router.post('/resend-otp', async (req, res) => {
  res.json({ msg: 'OTP sent.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: 'Email and password required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ msg: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ msg: 'Account deactivated.' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ msg: 'Invalid email or password' });
    user.lastLogin = new Date();
    await user.save();
    const token = signToken(user._id, user.role, user.name);
    res.json({ token, user: user.toJSON() });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  res.json({ msg: 'If that email exists, a reset link has been sent.' });
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
