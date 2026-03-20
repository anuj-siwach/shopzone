// server/routes/categories.js
const express  = require('express');
const router   = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json(cats);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
