// server/routes/orders.js
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const { sendMail, orderTemplate } = require('../utils/sendMail');
const User = require('../models/User');

const COUPONS = {
  FIRST10:  { type: 'percent', value: 10, minOrder: 0 },
  SAVE500:  { type: 'flat',    value: 500, minOrder: 2000 },
  SHOPZONE: { type: 'percent', value: 15, minOrder: 5000 },
  ANUJ20:   { type: 'percent', value: 20, minOrder: 1000 },
};

// POST /api/orders/validate-coupon
router.post('/validate-coupon', auth, async (req, res) => {
  const { couponCode, subtotal } = req.body;
  const coupon = COUPONS[couponCode?.toUpperCase()];
  if (!coupon) return res.status(400).json({ msg: 'Invalid coupon code' });
  if (subtotal < coupon.minOrder)
    return res.status(400).json({ msg: `Minimum order ₹${coupon.minOrder} required for this coupon` });

  const discount = coupon.type === 'percent'
    ? Math.round(subtotal * coupon.value / 100)
    : coupon.value;
  res.json({ valid: true, discount, couponCode: couponCode.toUpperCase() });
});

// POST /api/orders — place order
router.post('/', auth, async (req, res) => {
  const { cartItems, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!cartItems || cartItems.length === 0)
    return res.status(400).json({ msg: 'Cart is empty' });
  if (!shippingAddress || !paymentMethod)
    return res.status(400).json({ msg: 'Shipping address and payment method are required' });
  try {
    // Server-side price validation
    const ids      = [...new Set(cartItems.map(i => i.productId))];
    const products = await Product.find({ _id: { $in: ids }, isActive: true });

    let itemsWithPrice = [];
    let itemsTotal = 0;

    for (const item of cartItems) {
      const prod = products.find(p => p._id.toString() === item.productId);
      if (!prod)            throw new Error(`Product ${item.productId} not found`);
      if (prod.stock < item.qty) throw new Error(`Insufficient stock for "${prod.title}"`);

      const price = prod.discountPrice || prod.price;
      itemsWithPrice.push({
        productId: item.productId,
        title:     prod.title,
        image:     prod.images[0] || '',
        brand:     prod.brand,
        qty:       item.qty,
        price,
      });
      itemsTotal += price * item.qty;
    }

    // Coupon
    let discount = 0;
    if (couponCode) {
      const coupon = COUPONS[couponCode.toUpperCase()];
      if (coupon && itemsTotal >= coupon.minOrder) {
        discount = coupon.type === 'percent'
          ? Math.round(itemsTotal * coupon.value / 100)
          : coupon.value;
      }
    }

    const deliveryCharge = itemsTotal - discount >= 499 ? 0 : 49;
    const totalAmount    = itemsTotal - discount + deliveryCharge;

    const order = await Order.create({
      userId: req.user.id,
      items: itemsWithPrice,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      itemsTotal,
      discount,
      deliveryCharge,
      totalAmount,
      couponCode: couponCode?.toUpperCase(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      statusHistory: [{ status: 'confirmed', timestamp: new Date() }],
    });

    // Deduct stock atomically
    await Promise.all(cartItems.map(item =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.qty, soldCount: item.qty }
      })
    ));

    // Send confirmation email
    const user = await User.findById(req.user.id);
    await sendMail(user.email, `Order Confirmed — #${order._id}`, orderTemplate(order, user.name));

    res.status(201).json({ order });
  } catch (err) { res.status(400).json({ msg: err.message }); }
});

// GET /api/orders/my — user order history
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Order.countDocuments({ userId: req.user.id });
    res.json({ orders, total });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/orders/:id — single order
router.get('/:id', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user.id };
    const order = await Order.findOne(filter).populate('userId', 'name email');
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    if (!['pending', 'confirmed', 'processing'].includes(order.status))
      return res.status(400).json({ msg: `Cannot cancel order with status "${order.status}"` });

    order.status      = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    await order.save();

    // Restore stock
    await Promise.all(order.items.map(item =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty, soldCount: -item.qty }
      })
    ));

    res.json({ msg: 'Order cancelled successfully', order });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
