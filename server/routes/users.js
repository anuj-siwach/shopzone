// server/routes/users.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist','title images discountPrice price avgRating');
    res.json(user);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.put('/profile', auth, async (req, res) => {
  const { name, mobile, avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user.id,
      { $set: { name, mobile, avatar } }, { new: true, runValidators: true });
    res.json(user);
  } catch (err) { res.status(400).json({ msg: err.message }); }
});

router.post('/address', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (req.body.isDefault) user.addresses.forEach(a => { a.isDefault = false; });
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) { res.status(400).json({ msg: err.message }); }
});

router.delete('/address/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const pid  = req.params.productId;
    const idx  = user.wishlist.findIndex(id => id.toString() === pid);
    if (idx === -1) { user.wishlist.push(pid); }
    else            { user.wishlist.splice(idx, 1); }
    await user.save();
    res.json({ wishlist: user.wishlist, added: idx === -1 });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
