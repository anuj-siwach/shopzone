// server/routes/products.js
const express  = require('express');
const router   = express.Router();
const Product  = require('../models/Product');
const { auth, optionalAuth } = require('../middleware/auth');

// GET /api/products — search, filter, sort, paginate
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      q, category, subcategory, brand, minPrice, maxPrice, minRating,
      isPrime, featured, sort = 'createdAt', order = 'desc',
      page = 1, limit = 12,
    } = req.query;

    let filter = { isActive: true };
    if (q)           filter.$text        = { $search: q };
    if (category)    filter.category     = { $regex: new RegExp(`^${category}$`, 'i') };
    if (subcategory) filter.subcategory  = { $regex: new RegExp(`^${subcategory}$`, 'i') };
    if (brand)       filter.brand        = { $regex: new RegExp(brand, 'i') };
    if (isPrime === 'true') filter.isPrime = true;
    if (featured === 'true') filter.isFeatured = true;
    if (minRating)   filter.avgRating    = { $gte: parseFloat(minRating) };
    if (minPrice || maxPrice) {
      filter.discountPrice = {};
      if (minPrice) filter.discountPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.discountPrice.$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      price_asc:   { discountPrice: 1 },
      price_desc:  { discountPrice: -1 },
      rating:      { avgRating: -1 },
      newest:      { createdAt: -1 },
      popular:     { soldCount: -1 },
      relevance:   q ? { score: { $meta: 'textScore' } } : { createdAt: -1 },
    };
    const sortObj  = sortMap[sort] || { [sort]: order === 'asc' ? 1 : -1 };
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(48, Math.max(1, parseInt(limit)));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .select('-ratings'),
      Product.countDocuments(filter),
    ]);

    res.json({
      products, total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/products/featured — featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('-ratings');
    res.json(products);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/products/brands — unique brands per category
router.get('/brands', async (req, res) => {
  try {
    const { category } = req.query;
    const match = { isActive: true };
    if (category) match.category = { $regex: new RegExp(`^${category}$`, 'i') };
    const brands = await Product.distinct('brand', match);
    res.json(brands.sort());
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// GET /api/products/:id — single product with reviews
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { slug: req.params.id }],
      isActive: true,
    }).populate('ratings.userId', 'name avatar');

    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// POST /api/products/:id/review — add review
router.post('/:id/review', auth, async (req, res) => {
  const { rating, title, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ msg: 'Rating and comment are required' });
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    const already = product.ratings.find(r => r.userId.toString() === req.user.id);
    if (already) return res.status(400).json({ msg: 'You have already reviewed this product' });

    product.ratings.push({
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(rating),
      title,
      comment,
    });
    product.updateRating();
    await product.save();
    res.status(201).json({ msg: 'Review added successfully', avgRating: product.avgRating });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

// DELETE /api/products/:id/review — delete own review
router.delete('/:id/review', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    product.ratings = product.ratings.filter(r => r.userId.toString() !== req.user.id);
    product.updateRating();
    await product.save();
    res.json({ msg: 'Review deleted' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
