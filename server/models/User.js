// server/models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    String,
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true, match: [/^\d{6}$/, 'Invalid pincode'] },
  country:  { type: String, default: 'India' },
  isDefault:{ type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:         { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  email:        { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
                  match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  passwordHash: { type: String, required: true, select: false },
  mobile:       { type: String, match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'] },
  avatar:       { type: String, default: '' },
  role:         { type: String, enum: ['customer', 'admin', 'seller'], default: 'customer' },
  addresses:    [addressSchema],
  wishlist:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isVerified:   { type: Boolean, default: false },
  emailOTP:     { type: String, select: false },
  otpExpires:   { type: Date, select: false },
  resetToken:   { type: String, select: false },
  resetExpires: { type: Date, select: false },
  isActive:     { type: Boolean, default: true },
  lastLogin:    Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.emailOTP;
  delete obj.otpExpires;
  delete obj.resetToken;
  delete obj.resetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
