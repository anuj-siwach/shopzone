// server/routes/admin.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const User     = require('../models/User');
const Category = require('../models/Category');
const { auth, admin } = require('../middleware/auth');
const { uploadBuffer } = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.use(auth, admin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalOrders, totalUsers, revenueAgg, todayOrders, todayRevAgg, lowStock, recentOrders] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Product.find({ stock: { $lt: 10 }, isActive: true }).select('title stock brand').limit(20),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email'),
    ]);

    // Sales last 7 days
    const last7 = await Promise.all(Array.from({ length: 7 }).map(async (_, i) => {
      const d     = new Date(today); d.setDate(d.getDate() - (6 - i));
      const dNext = new Date(d);     dNext.setDate(dNext.getDate() + 1);
      const agg   = await Order.aggregate([
        { $match: { createdAt: { $gte: d, $lt: dNext }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]);
      return { date: d.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: agg[0]?.total || 0, orders: agg[0]?.count || 0 };
    }));

    res.json({
      totalOrders, totalUsers, todayOrders,
      totalRevenue:  revenueAgg[0]?.total || 0,
      todayRevenue:  todayRevAgg[0]?.total || 0,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      recentOrders,
      salesChart: last7,
    });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const filter = {};
    if (search)   filter.$text    = { $search: search };
    if (category) filter.category = category;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// POST /api/admin/products
router.post('/products', upload.array('images', 8), async (req, res) => {
  try {
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(req.files.map(f => uploadBuffer(f.buffer, 'shopzone/products')));
    } else if (req.body.imageUrls) {
      images = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
    }
    const specs = req.body.specs ? JSON.parse(req.body.specs) : {};
    const tags  = req.body.tags  ? req.body.tags.split(',').map(t => t.trim().toLowerCase()) : [];
    const product = await Product.create({ ...req.body, images, specs, tags });
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ msg: err.message }); }
});

// PUT /api/admin/products/:id
router.put('/products/:id', upload.array('images', 8), async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.files && req.files.length > 0) {
      update.images = await Promise.all(req.files.map(f => uploadBuffer(f.buffer, 'shopzone/products')));
    }
    if (req.body.specs) update.specs = JSON.parse(req.body.specs);
    if (req.body.tags)  update.tags  = req.body.tags.split(',').map(t => t.trim().toLowerCase());
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(400).json({ msg: err.message }); }
});

// DELETE /api/admin/products/:id (soft delete)
router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ msg: 'Product deactivated' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('userId','name email').sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  const { status, trackingId, note } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    order.status = status;
    if (trackingId) order.trackingId = trackingId;
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) { res.status(400).json({ msg: err.message }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
