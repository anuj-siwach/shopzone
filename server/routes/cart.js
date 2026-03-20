// server/routes/cart.js
const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// POST /api/cart/sync — validate cart items against DB prices
router.post('/sync', auth, async (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) return res.json({ items: [], total: 0 });
  try {
    const ids = items.map(i => i.id);
    const products = await Product.find({ _id: { $in: ids }, isActive: true }).select('title price discountPrice images brand stock');
    const synced = items.map(item => {
      const p = products.find(p => p._id.toString() === item.id);
      if (!p) return null;
      return { id: p._id, title: p.title, price: p.discountPrice || p.price, image: p.images[0], brand: p.brand, qty: item.qty, stock: p.stock };
    }).filter(Boolean);
    const total = synced.reduce((s, i) => s + i.price * i.qty, 0);
    res.json({ items: synced, total });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
