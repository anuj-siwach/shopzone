// server/models/Product.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating:   { type: Number, min: 1, max: 5, required: true },
  title:    { type: String, maxlength: 200 },
  comment:  { type: String, required: true, maxlength: 2000 },
  verified: { type: Boolean, default: false },
  helpful:  { type: Number, default: 0 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true, maxlength: 500 },
  slug:         { type: String, unique: true, index: true },
  description:  { type: String, required: true, maxlength: 5000 },
  price:        { type: Number, required: true, min: 0 },
  discountPrice:{ type: Number, min: 0 },
  category:     { type: String, required: true, index: true },
  subcategory:  { type: String, index: true },
  brand:        { type: String, required: true, index: true },
  images:       [{ type: String }],
  stock:        { type: Number, default: 100, min: 0 },
  ratings:      [reviewSchema],
  avgRating:    { type: Number, default: 0, min: 0, max: 5 },
  numReviews:   { type: Number, default: 0 },
  isPrime:      { type: Boolean, default: false },
  tags:         [{ type: String, lowercase: true }],
  specs:        { type: Map, of: String },
  isFeatured:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  soldCount:    { type: Number, default: 0 },
}, { timestamps: true });

// Full-text search index with weights
productSchema.index(
  { title: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { title: 10, brand: 5, tags: 3, description: 1 }, name: 'ProductTextIndex' }
);
productSchema.index({ category: 1, brand: 1, discountPrice: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Auto-generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }
  next();
});

// Recalculate average rating
productSchema.methods.updateRating = function () {
  if (this.ratings.length === 0) {
    this.avgRating = 0;
    this.numReviews = 0;
  } else {
    this.avgRating = parseFloat(
      (this.ratings.reduce((s, r) => s + r.rating, 0) / this.ratings.length).toFixed(1)
    );
    this.numReviews = this.ratings.length;
  }
};

// Virtual: discount percentage
productSchema.virtual('discountPct').get(function () {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round((1 - this.discountPrice / this.price) * 100);
});

module.exports = mongoose.model('Product', productSchema);
