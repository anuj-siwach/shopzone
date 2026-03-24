// server/seed/seedProducts.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopzone';

const categories = [
  { name: 'Electronics',    slug: 'electronics',    sortOrder: 1 },
  { name: 'Fashion',        slug: 'fashion',         sortOrder: 2 },
  { name: 'Home & Kitchen', slug: 'home-kitchen',    sortOrder: 3 },
  { name: 'Books',          slug: 'books',           sortOrder: 4 },
  { name: 'Sports',         slug: 'sports',          sortOrder: 5 },
  { name: 'Toys & Games',   slug: 'toys-games',      sortOrder: 6 },
];

const products = [
  // Electronics
  {
    title: 'Samsung Galaxy S24 Ultra 5G (256GB, Titanium Gray)',
    description: 'The ultimate Galaxy experience with 200MP camera, Snapdragon 8 Gen 3, 5000mAh battery, and built-in S Pen.',
    price: 129999, discountPrice: 109999,
    category: 'Electronics', subcategory: 'Smartphones', brand: 'Samsung',
    stock: 50, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80',
    ],
    tags: ['smartphone', '5g', 'android', 'samsung'],
    specs: new Map([['RAM', '12GB'], ['Storage', '256GB'], ['Camera', '200MP'], ['Battery', '5000mAh']]),
  },
  {
    title: 'Apple iPhone 15 (128GB, Black)',
    description: 'Apple iPhone 15 with A16 Bionic chip, 48MP main camera, USB-C connector, Dynamic Island.',
    price: 79900, discountPrice: 74900,
    category: 'Electronics', subcategory: 'Smartphones', brand: 'Apple',
    stock: 75, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80',
    ],
    tags: ['iphone', 'apple', 'ios', 'smartphone'],
    specs: new Map([['RAM', '6GB'], ['Storage', '128GB'], ['Camera', '48MP'], ['Chip', 'A16 Bionic']]),
  },
  {
    title: 'Dell Inspiron 15 Laptop (Intel Core i5, 16GB RAM, 512GB SSD)',
    description: 'Dell Inspiron 15 with Intel Core i5-1335U, 16GB DDR4 RAM, 512GB SSD, 15.6" FHD display, Windows 11.',
    price: 74990, discountPrice: 59990,
    category: 'Electronics', subcategory: 'Laptops', brand: 'Dell',
    stock: 25, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&q=80',
    ],
    tags: ['laptop', 'dell', 'windows', 'intel'],
    specs: new Map([['Processor', 'Intel Core i5'], ['RAM', '16GB'], ['Storage', '512GB SSD'], ['Display', '15.6" FHD']]),
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation with 30-hour battery life, Auto NC Optimizer, Crystal Sound quality.',
    price: 29990, discountPrice: 19990,
    category: 'Electronics', subcategory: 'Audio', brand: 'Sony',
    stock: 60, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&q=80',
    ],
    tags: ['headphones', 'wireless', 'anc', 'sony'],
    specs: new Map([['Battery', '30 hours'], ['Connectivity', 'Bluetooth 5.2'], ['Weight', '250g']]),
  },
  {
    title: 'LG 55" OLED 4K Smart TV',
    description: 'LG OLED C3 55-inch 4K TV with α9 AI Processor, Dolby Vision IQ, webOS Smart TV, HDMI 2.1.',
    price: 189990, discountPrice: 129990,
    category: 'Electronics', subcategory: 'Televisions', brand: 'LG',
    stock: 15, isPrime: false, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=80',
      'https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=500&q=80',
    ],
    tags: ['tv', 'oled', '4k', 'smart-tv', 'lg'],
    specs: new Map([['Display', '55" OLED 4K'], ['Refresh Rate', '120Hz'], ['HDR', 'Dolby Vision']]),
  },
  {
    title: 'Apple AirPods Pro (2nd Gen) with MagSafe Case',
    description: 'AirPods Pro with H2 chip, Adaptive Audio, Personalised Spatial Audio, up to 2× more Active Noise Cancellation.',
    price: 24900, discountPrice: 19900,
    category: 'Electronics', subcategory: 'Audio', brand: 'Apple',
    stock: 80, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1606741965429-02919b2e0b8f?w=500&q=80',
      'https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=500&q=80',
    ],
    tags: ['airpods', 'apple', 'wireless', 'earbuds'],
    specs: new Map([['Battery', '6hrs + 24hrs case'], ['Chip', 'H2'], ['Water Resistance', 'IPX4']]),
  },
  {
    title: 'Canon EOS R50 Mirrorless Camera (Body Only)',
    description: 'Canon EOS R50 with 24.2MP APS-C sensor, Dual Pixel CMOS AF II, 4K video recording, lightweight 375g body.',
    price: 75990, discountPrice: 64990,
    category: 'Electronics', subcategory: 'Cameras', brand: 'Canon',
    stock: 20, isPrime: false, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&q=80',
    ],
    tags: ['camera', 'mirrorless', 'canon', '4k'],
    specs: new Map([['Sensor', '24.2MP APS-C'], ['Video', '4K 30fps'], ['Weight', '375g']]),
  },

  // Fashion
  {
    title: "Levi's Men's 511 Slim Fit Jeans",
    description: "Levi's 511 slim fit jeans in dark indigo wash. Sits below the waist with slim fit through thigh and leg.",
    price: 3999, discountPrice: 2399,
    category: 'Fashion', subcategory: 'Mens Clothing', brand: "Levi's",
    stock: 150, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500&q=80',
    ],
    tags: ['jeans', 'mens', 'levis', 'denim'],
    specs: new Map([['Fit', 'Slim'], ['Material', '99% Cotton'], ['Wash', 'Dark Indigo']]),
  },
  {
    title: 'Nike Air Max 270 Running Shoes (White/Red)',
    description: 'Nike Air Max 270 with the largest heel Air unit yet for all-day comfort. Mesh upper for breathability.',
    price: 11995, discountPrice: 8995,
    category: 'Fashion', subcategory: 'Footwear', brand: 'Nike',
    stock: 100, isPrime: false, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80',
    ],
    tags: ['shoes', 'nike', 'running', 'sports'],
    specs: new Map([['Closure', 'Lace-Up'], ['Material', 'Mesh + Synthetic'], ['Technology', 'Air Max 270']]),
  },
  {
    title: 'Ray-Ban Aviator Classic Sunglasses (Gold/Green)',
    description: 'Iconic Ray-Ban Aviator Classic with 58mm crystal green lenses, light gold metal frame. UV400 protection.',
    price: 9490, discountPrice: 7490,
    category: 'Fashion', subcategory: 'Accessories', brand: 'Ray-Ban',
    stock: 45, isPrime: false, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80',
    ],
    tags: ['sunglasses', 'rayban', 'aviator', 'accessories'],
    specs: new Map([['Lens', 'Crystal Green'], ['Frame', 'Gold Metal'], ['UV Protection', '100%']]),
  },
  {
    title: "Tommy Hilfiger Men's Classic Polo Shirt",
    description: "Tommy Hilfiger's iconic polo shirt in 100% soft pima cotton. Regular fit with ribbed collar and cuffs.",
    price: 3999, discountPrice: 2499,
    category: 'Fashion', subcategory: 'Mens Clothing', brand: 'Tommy Hilfiger',
    stock: 80, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80',
    ],
    tags: ['polo', 'tommy', 'mens', 'tshirt'],
    specs: new Map([['Material', '100% Pima Cotton'], ['Fit', 'Regular']]),
  },

  // Home & Kitchen
  {
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker (8L)',
    description: 'Replaces 7 kitchen appliances: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yoghurt maker, warmer.',
    price: 12999, discountPrice: 8999,
    category: 'Home & Kitchen', subcategory: 'Cooking Appliances', brand: 'Instant Pot',
    stock: 55, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80',
    ],
    tags: ['pressure-cooker', 'instant-pot', 'kitchen', 'cooking'],
    specs: new Map([['Capacity', '8 Litres'], ['Functions', '7-in-1'], ['Power', '1200W']]),
  },
  {
    title: 'Dyson V15 Detect Absolute Cordless Vacuum Cleaner',
    description: 'Dyson V15 Detect with laser dust detection, HEPA filtration, 60-minute runtime, LCD screen.',
    price: 62900, discountPrice: 49900,
    category: 'Home & Kitchen', subcategory: 'Cleaning', brand: 'Dyson',
    stock: 18, isPrime: false, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&q=80',
    ],
    tags: ['vacuum', 'dyson', 'cordless', 'cleaning'],
    specs: new Map([['Suction', '230 AW'], ['Runtime', '60 min'], ['Filter', 'HEPA']]),
  },
  {
    title: 'Philips Air Fryer XXL HD9762 (7.3L)',
    description: 'Philips XXL Air Fryer with RapidAir technology, 7.3L capacity for a whole chicken. 90% less fat.',
    price: 17990, discountPrice: 11990,
    category: 'Home & Kitchen', subcategory: 'Cooking Appliances', brand: 'Philips',
    stock: 40, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80',
    ],
    tags: ['air-fryer', 'philips', 'kitchen', 'healthy-cooking'],
    specs: new Map([['Capacity', '7.3 Litres'], ['Fat Reduction', '90%'], ['Power', '2000W']]),
  },
  {
    title: 'Nespresso Vertuo Next Coffee Machine (Black)',
    description: 'Nespresso Vertuo Next with Centrifusion technology, 5 cup sizes from Espresso to Alto. WiFi connected.',
    price: 17990, discountPrice: 12990,
    category: 'Home & Kitchen', subcategory: 'Coffee', brand: 'Nespresso',
    stock: 30, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80',
      'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&q=80',
    ],
    tags: ['coffee', 'nespresso', 'espresso', 'kitchen'],
    specs: new Map([['Cup Sizes', '5'], ['Water Tank', '1.1L'], ['Connectivity', 'WiFi + Bluetooth']]),
  },

  // Books
  {
    title: 'Atomic Habits by James Clear',
    description: 'The #1 New York Times bestseller. An Easy and Proven Way to Build Good Habits and Break Bad Ones.',
    price: 799, discountPrice: 499,
    category: 'Books', subcategory: 'Self Help', brand: 'Penguin Random House',
    stock: 200, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80',
    ],
    tags: ['book', 'self-help', 'habits', 'productivity'],
    specs: new Map([['Author', 'James Clear'], ['Pages', '320'], ['Language', 'English']]),
  },
  {
    title: 'Rich Dad Poor Dad by Robert Kiyosaki',
    description: 'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!',
    price: 699, discountPrice: 399,
    category: 'Books', subcategory: 'Finance', brand: 'Plata Publishing',
    stock: 180, isPrime: false, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80',
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80',
    ],
    tags: ['book', 'finance', 'money', 'investing'],
    specs: new Map([['Author', 'Robert Kiyosaki'], ['Pages', '336'], ['Language', 'English']]),
  },
  {
    title: 'The Psychology of Money by Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money.',
    price: 599, discountPrice: 349,
    category: 'Books', subcategory: 'Finance', brand: 'Harriman House',
    stock: 150, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500&q=80',
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&q=80',
    ],
    tags: ['book', 'finance', 'psychology', 'money'],
    specs: new Map([['Author', 'Morgan Housel'], ['Pages', '256'], ['Language', 'English']]),
  },
  {
    title: 'Zero to One by Peter Thiel',
    description: 'Notes on Startups, or How to Build the Future. Peter Thiel shares the thinking behind building startups.',
    price: 699, discountPrice: 449,
    category: 'Books', subcategory: 'Business', brand: 'Crown Business',
    stock: 120, isPrime: false, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=500&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80',
    ],
    tags: ['book', 'startup', 'business', 'technology'],
    specs: new Map([['Author', 'Peter Thiel'], ['Pages', '224'], ['Language', 'English']]),
  },

  // Sports
  {
    title: 'Yonex Astrox 99 Pro Badminton Racket',
    description: 'Yonex Astrox 99 Pro with Steel Carbon Nanotube frame, rotational generator system for powerful smashes.',
    price: 19990, discountPrice: 14990,
    category: 'Sports', subcategory: 'Badminton', brand: 'Yonex',
    stock: 35, isPrime: false, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&q=80',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&q=80',
    ],
    tags: ['badminton', 'racket', 'yonex', 'sports'],
    specs: new Map([['Weight', '83g'], ['Balance', 'Head Heavy'], ['Flex', 'Stiff']]),
  },
  {
    title: 'Decathlon Fitness Mat (10mm, Non-Slip)',
    description: 'High-density foam yoga and fitness mat, 183×61cm, 10mm thick. Non-slip surface, includes carrying strap.',
    price: 1999, discountPrice: 1299,
    category: 'Sports', subcategory: 'Fitness', brand: 'Domyos',
    stock: 120, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80',
    ],
    tags: ['yoga', 'mat', 'fitness', 'exercise'],
    specs: new Map([['Dimensions', '183 × 61 cm'], ['Thickness', '10mm'], ['Material', 'NBR Foam']]),
  },
  {
    title: 'Nivia Pro Cricket Batting Gloves (Men, Right Hand)',
    description: 'Nivia Pro cricket batting gloves with premium leather palm, high-density foam protection, mesh back.',
    price: 1299, discountPrice: 899,
    category: 'Sports', subcategory: 'Cricket', brand: 'Nivia',
    stock: 75, isPrime: false, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80',
      'https://images.unsplash.com/photo-1593766788306-28561086694e?w=500&q=80',
    ],
    tags: ['cricket', 'gloves', 'nivia', 'sports'],
    specs: new Map([['Hand', 'Right'], ['Material', 'Leather + Mesh']]),
  },

  // Toys
  {
    title: 'LEGO Technic Formula E Porsche 99X Electric (42137)',
    description: 'Build the Porsche 99X Electric Formula E car with detailed features including battery management system.',
    price: 9999, discountPrice: 7999,
    category: 'Toys & Games', subcategory: 'Building Sets', brand: 'LEGO',
    stock: 30, isPrime: true, isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&q=80',
      'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=500&q=80',
    ],
    tags: ['lego', 'technic', 'building', 'toys'],
    specs: new Map([['Pieces', '1082'], ['Age', '10+']]),
  },
  {
    title: 'Funskool Monopoly Classic Board Game',
    description: 'The classic Monopoly board game with updated tokens. For 2-8 players.',
    price: 1499, discountPrice: 999,
    category: 'Toys & Games', subcategory: 'Board Games', brand: 'Funskool',
    stock: 90, isPrime: false, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=500&q=80',
      'https://images.unsplash.com/photo-1606503153255-59d8b8b82176?w=500&q=80',
    ],
    tags: ['monopoly', 'board-game', 'family', 'fun'],
    specs: new Map([['Players', '2-8'], ['Age', '8+'], ['Duration', '60-180 min']]),
  },
  {
    title: 'Hot Wheels Monster Trucks (Assorted, Pack of 5)',
    description: 'Hot Wheels Monster Trucks with massive wheels for off-road fun. Each truck features die-cast metal body.',
    price: 899, discountPrice: 649,
    category: 'Toys & Games', subcategory: 'Die-Cast Vehicles', brand: 'Hot Wheels',
    stock: 200, isPrime: true, isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
    ],
    tags: ['hotwheels', 'monster-truck', 'toy-car', 'kids'],
    specs: new Map([['Pack', '5 trucks'], ['Material', 'Die-cast Metal'], ['Age', '3+']]),
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } }),
    ]);
    console.log('🗑️  Cleared existing data');

    await Category.insertMany(categories);
    console.log(`✅ Seeded ${categories.length} categories`);

    for (const p of products) {
      const product = new Product(p);
      await product.save();
    }
    console.log(`✅ Seeded ${products.length} products`);

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@shopzone.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Anuj Admin',
        email: process.env.ADMIN_EMAIL || 'admin@shopzone.com',
        passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123456',
        mobile: '7015542002',
        role: 'admin',
        isVerified: true,
      });
      await admin.save();
      console.log(`✅ Admin user created: ${admin.email}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('Admin Email:    admin@shopzone.com');
    console.log('Admin Password: Admin@123456');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
