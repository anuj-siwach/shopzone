// server/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title:       { type: String, required: true },
  image:       { type: String },
  brand:       { type: String },
  qty:         { type: Number, required: true, min: 1 },
  price:       { type: Number, required: true },  // Price at time of purchase
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items:  [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone:    { type: String, required: true },
    line1:    { type: String, required: true },
    line2:    String,
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
    country:  { type: String, default: 'India' },
  },
  paymentMethod:   { type: String, enum: ['card', 'upi', 'netbanking', 'cod', 'wallet'], required: true },
  paymentStatus:   { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripePaymentId: String,
  stripeSessionId: String,
  itemsTotal:    { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  deliveryCharge:{ type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  couponCode:    String,
  status: {
    type: String,
    enum: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'confirmed',
    index: true,
  },
  trackingId:        String,
  estimatedDelivery: Date,
  deliveredAt:       Date,
  cancelledAt:       Date,
  cancelReason:      String,
  statusHistory: [{
    status:    String,
    timestamp: { type: Date, default: Date.now },
    note:      String,
  }],
}, { timestamps: true });

// Push status changes to history
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
