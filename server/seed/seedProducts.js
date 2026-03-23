// server/seed/seedProducts.js
// Run: node seed/seedProducts.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopzone';

const categories = [
  { name: 'Electronics',    slug: 'electronics',  sortOrder: 1 },
  { name: 'Fashion',        slug: 'fashion',       sortOrder: 2 },
  { name: 'Home & Kitchen', slug: 'home-kitchen',  sortOrder: 3 },
  { name: 'Books',          slug: 'books',         sortOrder: 4 },
  { name: 'Sports',         slug: 'sports',        sortOrder: 5 },
  { name: 'Toys & Games',   slug: 'toys-games',    sortOrder: 6 },
];

const products = [

  // ── ELECTRONICS ─────────────────────────────────────────────
  {
    title: 'Samsung Galaxy S24 Ultra 5G (256GB, Titanium Gray)',
    description: 'The ultimate Galaxy with 200MP camera, Snapdragon 8 Gen 3, 5000mAh battery, and built-in S Pen.',
    price: 129999, discountPrice: 109999, category: 'Electronics', brand: 'Samsung',
    stock: 50, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80'],
    tags: ['smartphone','5g','samsung'],
    specs: new Map([['RAM','12GB'],['Storage','256GB'],['Camera','200MP'],['Battery','5000mAh']])
  },
  {
    title: 'Apple iPhone 15 (128GB, Black)',
    description: 'Apple iPhone 15 with A16 Bionic chip, 48MP main camera, USB-C connector and Dynamic Island.',
    price: 79900, discountPrice: 74900, category: 'Electronics', brand: 'Apple',
    stock: 75, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80'],
    tags: ['iphone','apple','ios'],
    specs: new Map([['RAM','6GB'],['Storage','128GB'],['Camera','48MP'],['Chip','A16 Bionic']])
  },
  {
    title: 'OnePlus 12 5G (256GB, Flowy Emerald)',
    description: 'Snapdragon 8 Gen 3, 50MP Hasselblad triple camera, 100W SUPERVOOC fast charging, 5400mAh battery.',
    price: 64999, discountPrice: 59999, category: 'Electronics', brand: 'OnePlus',
    stock: 40, isPrime: false, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=500&q=80'],
    tags: ['oneplus','android','5g'],
    specs: new Map([['RAM','16GB'],['Storage','256GB'],['Battery','5400mAh'],['Charging','100W']])
  },
  {
    title: 'Dell Inspiron 15 Laptop (i5, 16GB RAM, 512GB SSD)',
    description: 'Intel Core i5-1335U, 16GB DDR4 RAM, 512GB SSD, 15.6" FHD display, Windows 11 Home.',
    price: 74990, discountPrice: 59990, category: 'Electronics', brand: 'Dell',
    stock: 25, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80'],
    tags: ['laptop','dell','windows','intel'],
    specs: new Map([['Processor','Intel i5-1335U'],['RAM','16GB'],['Storage','512GB SSD'],['Display','15.6" FHD']])
  },
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation, 30-hour battery, Auto NC Optimizer, Crystal Sound quality.',
    price: 29990, discountPrice: 19990, category: 'Electronics', brand: 'Sony',
    stock: 60, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
    tags: ['headphones','wireless','anc','sony'],
    specs: new Map([['Battery','30 hours'],['Connectivity','Bluetooth 5.2'],['Weight','250g']])
  },
  {
    title: 'LG 55" OLED 4K Smart TV (55C3PSA)',
    description: 'LG OLED C3 with α9 AI Processor, Dolby Vision IQ, webOS, HDMI 2.1. Perfect for movies and gaming.',
    price: 189990, discountPrice: 129990, category: 'Electronics', brand: 'LG',
    stock: 15, isPrime: false, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80'],
    tags: ['tv','oled','4k','smart-tv'],
    specs: new Map([['Display','55" OLED 4K'],['Refresh Rate','120Hz'],['HDR','Dolby Vision']])
  },
  {
    title: 'Apple AirPods Pro 2nd Gen with MagSafe Case',
    description: 'H2 chip, Adaptive Audio, Personalised Spatial Audio, up to 2x more Active Noise Cancellation.',
    price: 24900, discountPrice: 19900, category: 'Electronics', brand: 'Apple',
    stock: 80, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&q=80'],
    tags: ['airpods','apple','wireless','earbuds'],
    specs: new Map([['Battery','6hrs + 24hrs case'],['Chip','H2'],['Water Resistance','IPX4']])
  },
  {
    title: 'Canon EOS R50 Mirrorless Camera (Body Only)',
    description: '24.2MP APS-C sensor, Dual Pixel CMOS AF II, 4K video, lightweight 375g body. Perfect for beginners.',
    price: 75990, discountPrice: 64990, category: 'Electronics', brand: 'Canon',
    stock: 20, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&q=80'],
    tags: ['camera','mirrorless','canon','4k'],
    specs: new Map([['Sensor','24.2MP APS-C'],['Video','4K 30fps'],['Weight','375g']])
  },
  {
    title: 'iPad Air 5th Gen (256GB, Wi-Fi, Space Gray)',
    description: 'Apple M1 chip, 10.9-inch Liquid Retina display, 12MP front camera with Center Stage, Touch ID.',
    price: 74900, discountPrice: 69900, category: 'Electronics', brand: 'Apple',
    stock: 35, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80'],
    tags: ['ipad','apple','tablet'],
    specs: new Map([['Chip','M1'],['Display','10.9" Liquid Retina'],['Storage','256GB'],['Camera','12MP']])
  },
  {
    title: 'Logitech MX Master 3S Wireless Mouse',
    description: '8000 DPI MagSpeed scroll, quiet clicks, ergonomic design, works on any surface including glass.',
    price: 9995, discountPrice: 7495, category: 'Electronics', brand: 'Logitech',
    stock: 90, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80'],
    tags: ['mouse','wireless','logitech','productivity'],
    specs: new Map([['DPI','200-8000'],['Battery','70 days'],['Connectivity','Bluetooth + USB'],['Buttons','7']])
  },
  {
    title: 'Samsung 27" Curved Gaming Monitor (165Hz, 1ms)',
    description: '27-inch Full HD curved display, 165Hz refresh rate, 1ms response time, AMD FreeSync, VA panel.',
    price: 24990, discountPrice: 17990, category: 'Electronics', brand: 'Samsung',
    stock: 30, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80'],
    tags: ['monitor','gaming','samsung','curved'],
    specs: new Map([['Size','27 inch'],['Refresh Rate','165Hz'],['Response Time','1ms'],['Panel','VA']])
  },
  {
    title: 'JBL Flip 6 Portable Bluetooth Speaker',
    description: 'JBL Pro Sound with 2 JBL drivers, powerful bass radiator, IP67 waterproof and dustproof, 12hr battery.',
    price: 11999, discountPrice: 7999, category: 'Electronics', brand: 'JBL',
    stock: 65, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80'],
    tags: ['speaker','bluetooth','jbl','portable'],
    specs: new Map([['Battery','12 hours'],['Water Resistance','IP67'],['Connectivity','Bluetooth 5.1']])
  },

  // ── FASHION ─────────────────────────────────────────────────
  {
    title: "Levi's Men's 511 Slim Fit Jeans (Dark Indigo)",
    description: "Levi's 511 slim fit, sits below waist, slim through thigh and leg. 99% cotton stretch denim.",
    price: 3999, discountPrice: 2399, category: 'Fashion', brand: "Levi's",
    stock: 150, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80'],
    tags: ['jeans','mens','levis','denim'],
    specs: new Map([['Fit','Slim'],['Material','99% Cotton'],['Wash','Dark Indigo']])
  },
  {
    title: 'Nike Air Max 270 Running Shoes (White/Red)',
    description: 'Largest heel Air unit for all-day comfort. Mesh upper for breathability, foam midsole for cushioning.',
    price: 11995, discountPrice: 8995, category: 'Fashion', brand: 'Nike',
    stock: 100, isPrime: false, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'],
    tags: ['shoes','nike','running','sports'],
    specs: new Map([['Closure','Lace-Up'],['Material','Mesh + Synthetic'],['Technology','Air Max']])
  },
  {
    title: 'Ray-Ban Aviator Classic Sunglasses (Gold/Green)',
    description: 'Iconic Ray-Ban Aviator with 58mm crystal green lenses, light gold frame. 100% UV protection.',
    price: 9490, discountPrice: 7490, category: 'Fashion', brand: 'Ray-Ban',
    stock: 45, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80'],
    tags: ['sunglasses','rayban','aviator'],
    specs: new Map([['Lens','G-15 Crystal Green'],['Frame','Gold Metal'],['UV Protection','100%']])
  },
  {
    title: "Tommy Hilfiger Men's Classic Polo Shirt (Navy)",
    description: "Iconic Tommy polo in 100% soft pima cotton. Regular fit, ribbed collar, signature flag emblem.",
    price: 3999, discountPrice: 2499, category: 'Fashion', brand: 'Tommy Hilfiger',
    stock: 80, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&q=80'],
    tags: ['polo','tommy','mens'],
    specs: new Map([['Material','100% Pima Cotton'],['Fit','Regular']])
  },
  {
    title: "Women's Floral Kurti with Palazzo Set",
    description: "Beautiful printed cotton kurti with matching palazzo pants. Perfect for festive occasions and daily wear.",
    price: 1999, discountPrice: 999, category: 'Fashion', brand: 'Biba',
    stock: 120, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80'],
    tags: ['kurti','women','ethnic','palazzo'],
    specs: new Map([['Material','Cotton'],['Occasion','Casual / Festive'],['Care','Machine Wash']])
  },
  {
    title: 'Adidas Ultraboost 23 Running Shoes (Black)',
    description: 'BOOST midsole for incredible energy return, Primeknit+ upper, Continental rubber outsole for grip.',
    price: 17999, discountPrice: 12999, category: 'Fashion', brand: 'Adidas',
    stock: 55, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80'],
    tags: ['shoes','adidas','running','ultraboost'],
    specs: new Map([['Technology','BOOST Midsole'],['Upper','Primeknit+'],['Outsole','Continental Rubber']])
  },
  {
    title: "Fossil Men's Leather Chronograph Watch (Brown)",
    description: "Classic Fossil chronograph with genuine leather strap, stainless steel case, water resistant 50m.",
    price: 12995, discountPrice: 8995, category: 'Fashion', brand: 'Fossil',
    stock: 35, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80'],
    tags: ['watch','fossil','mens','leather'],
    specs: new Map([['Case','Stainless Steel'],['Strap','Genuine Leather'],['Water Resistance','50m'],['Movement','Quartz']])
  },

  // ── HOME & KITCHEN ───────────────────────────────────────────
  {
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker (8L)',
    description: 'Replaces 7 kitchen appliances: pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, warmer.',
    price: 12999, discountPrice: 8999, category: 'Home & Kitchen', brand: 'Instant Pot',
    stock: 55, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&q=80'],
    tags: ['pressure-cooker','instant-pot','kitchen'],
    specs: new Map([['Capacity','8 Litres'],['Functions','7-in-1'],['Power','1200W']])
  },
  {
    title: 'Dyson V15 Detect Absolute Cordless Vacuum Cleaner',
    description: 'Laser dust detection, HEPA filtration, 60-minute runtime, LCD particle count screen, 11 accessories.',
    price: 62900, discountPrice: 49900, category: 'Home & Kitchen', brand: 'Dyson',
    stock: 18, isPrime: false, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80'],
    tags: ['vacuum','dyson','cordless'],
    specs: new Map([['Suction','230 AW'],['Runtime','60 min'],['Filter','HEPA'],['Weight','3.1 kg']])
  },
  {
    title: 'Philips Air Fryer XXL (7.3L, Digital Touchscreen)',
    description: 'RapidAir technology, 7.3L capacity, 90% less fat than frying. Digital touch screen with 7 presets.',
    price: 17990, discountPrice: 11990, category: 'Home & Kitchen', brand: 'Philips',
    stock: 40, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1648472027936-5c38ee9a3b44?w=500&q=80'],
    tags: ['air-fryer','philips','kitchen'],
    specs: new Map([['Capacity','7.3 Litres'],['Fat Reduction','90%'],['Power','2000W']])
  },
  {
    title: 'Nespresso Vertuo Next Coffee Machine (Black)',
    description: 'Centrifusion technology, 5 cup sizes from Espresso to Alto, WiFi connected, recycling programme.',
    price: 17990, discountPrice: 12990, category: 'Home & Kitchen', brand: 'Nespresso',
    stock: 30, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80'],
    tags: ['coffee','nespresso','espresso'],
    specs: new Map([['Cup Sizes','5'],['Water Tank','1.1L'],['Connectivity','WiFi + Bluetooth']])
  },
  {
    title: 'IKEA KALLAX Shelving Unit (White, 2x4)',
    description: 'Versatile shelving unit with 8 compartments. Can be used as room divider, sideboard or TV unit.',
    price: 7990, discountPrice: 5990, category: 'Home & Kitchen', brand: 'IKEA',
    stock: 25, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80'],
    tags: ['furniture','ikea','shelving','storage'],
    specs: new Map([['Dimensions','77x147cm'],['Material','Particleboard'],['Max Load','13 kg per compartment']])
  },
  {
    title: 'Milton Thermosteel Flask 1000ml (Blue)',
    description: 'Double wall stainless steel vacuum insulated flask. Keeps hot 24hrs, cold 48hrs. 100% leak proof.',
    price: 1299, discountPrice: 699, category: 'Home & Kitchen', brand: 'Milton',
    stock: 200, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80'],
    tags: ['flask','thermos','milton','water-bottle'],
    specs: new Map([['Capacity','1000ml'],['Material','Stainless Steel 304'],['Hot','24 hours'],['Cold','48 hours']])
  },
  {
    title: 'Prestige Induction Cooktop 2000W (Black)',
    description: 'Prestige PIC 6.0 V3 induction cooktop with 7 pre-set menu, touch panel, overheat protection.',
    price: 3999, discountPrice: 2499, category: 'Home & Kitchen', brand: 'Prestige',
    stock: 70, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80'],
    tags: ['induction','cooktop','prestige','kitchen'],
    specs: new Map([['Power','2000W'],['Presets','7'],['Panel','Touch'],['Safety','Overheat Protection']])
  },

  // ── BOOKS ───────────────────────────────────────────────────
  {
    title: 'Atomic Habits by James Clear',
    description: '#1 NYT bestseller. Easy and proven way to build good habits and break bad ones. 10M+ copies sold.',
    price: 799, discountPrice: 499, category: 'Books', brand: 'Penguin',
    stock: 200, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80'],
    tags: ['book','self-help','habits','productivity'],
    specs: new Map([['Author','James Clear'],['Pages','320'],['Language','English']])
  },
  {
    title: 'Rich Dad Poor Dad by Robert Kiyosaki',
    description: 'What the rich teach their kids about money. #1 personal finance book of all time.',
    price: 699, discountPrice: 399, category: 'Books', brand: 'Plata Publishing',
    stock: 180, isPrime: false, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500&q=80'],
    tags: ['book','finance','money','investing'],
    specs: new Map([['Author','Robert Kiyosaki'],['Pages','336'],['Language','English']])
  },
  {
    title: 'The Psychology of Money by Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness. 19 short stories about how people think about money.',
    price: 599, discountPrice: 349, category: 'Books', brand: 'Harriman House',
    stock: 150, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500&q=80'],
    tags: ['book','finance','psychology','money'],
    specs: new Map([['Author','Morgan Housel'],['Pages','256'],['Language','English']])
  },
  {
    title: 'Zero to One by Peter Thiel',
    description: 'Notes on startups, or how to build the future. Peter Thiel shares thinking behind building something new.',
    price: 699, discountPrice: 449, category: 'Books', brand: 'Crown Business',
    stock: 120, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80'],
    tags: ['book','startup','business'],
    specs: new Map([['Author','Peter Thiel'],['Pages','224'],['Language','English']])
  },
  {
    title: 'The Alchemist by Paulo Coelho',
    description: 'A fable about following your dream. One of the best-selling books in history with 150M+ copies sold.',
    price: 499, discountPrice: 299, category: 'Books', brand: 'HarperCollins',
    stock: 250, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&q=80'],
    tags: ['book','fiction','novel','bestseller'],
    specs: new Map([['Author','Paulo Coelho'],['Pages','208'],['Language','English']])
  },
  {
    title: 'Wings of Fire by APJ Abdul Kalam',
    description: 'Autobiography of Dr APJ Abdul Kalam, former President of India and missile scientist. Inspiring for every Indian.',
    price: 299, discountPrice: 199, category: 'Books', brand: 'Universities Press',
    stock: 300, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80'],
    tags: ['book','biography','kalam','india'],
    specs: new Map([['Author','APJ Abdul Kalam'],['Pages','196'],['Language','English']])
  },

  // ── SPORTS ──────────────────────────────────────────────────
  {
    title: 'Yonex Arcsaber 11 Pro Badminton Racket',
    description: 'Professional grade carbon graphite racket, isometric head for larger sweet spot, 3U weight, 88g.',
    price: 12990, discountPrice: 9990, category: 'Sports', brand: 'Yonex',
    stock: 30, isPrime: false, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&q=80'],
    tags: ['badminton','racket','yonex','sports'],
    specs: new Map([['Weight','88g (3U)'],['Material','Carbon Graphite'],['Balance','Head Heavy']])
  },
  {
    title: 'Nivia Football Size 5 (Storm 2.0)',
    description: 'Nivia Storm 2.0 size 5 football with 32-panel design, PVC material, butyl bladder for air retention.',
    price: 999, discountPrice: 599, category: 'Sports', brand: 'Nivia',
    stock: 100, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&q=80'],
    tags: ['football','sports','nivia','soccer'],
    specs: new Map([['Size','5'],['Material','PVC'],['Panels','32'],['Bladder','Butyl']])
  },
  {
    title: 'Boldfit Adjustable Dumbbell Set (10kg pair)',
    description: 'Home gym dumbbell set with adjustable weight 2kg to 10kg per dumbbell. Rubber coated, anti-roll design.',
    price: 3999, discountPrice: 2499, category: 'Sports', brand: 'Boldfit',
    stock: 45, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80'],
    tags: ['dumbbell','gym','fitness','weights'],
    specs: new Map([['Weight Range','2-10 kg'],['Material','Rubber Coated Iron'],['Count','2 Dumbbells']])
  },
  {
    title: 'Cosco Cricket Bat Kashmir Willow (Full Size)',
    description: 'Cosco Kashmir willow full-size cricket bat, English grip, 5 grains willow, ideal for leather and tennis ball.',
    price: 2499, discountPrice: 1499, category: 'Sports', brand: 'Cosco',
    stock: 60, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80'],
    tags: ['cricket','bat','cosco','sports'],
    specs: new Map([['Material','Kashmir Willow'],['Size','Full (SH)'],['Grip','English Cotton'],['Grains','5']])
  },
  {
    title: 'Decathlon Quechua Backpack 20L (Blue)',
    description: 'Lightweight 20L hiking backpack with rain cover, padded back, multiple compartments, hip belt.',
    price: 1999, discountPrice: 1299, category: 'Sports', brand: 'Decathlon',
    stock: 80, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80'],
    tags: ['backpack','hiking','decathlon','outdoor'],
    specs: new Map([['Capacity','20 Litres'],['Weight','400g'],['Rain Cover','Included'],['Back','Padded']])
  },
  {
    title: 'Lifelong Yoga Mat 6mm (Purple, Non-Slip)',
    description: 'High density foam yoga mat with non-slip texture, moisture resistant surface, includes carry strap.',
    price: 999, discountPrice: 599, category: 'Sports', brand: 'Lifelong',
    stock: 120, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1601925228049-59d63f5c25e1?w=500&q=80'],
    tags: ['yoga','mat','fitness','exercise'],
    specs: new Map([['Thickness','6mm'],['Material','TPE Foam'],['Dimensions','183x61cm'],['Non-Slip','Yes']])
  },

  // ── TOYS & GAMES ────────────────────────────────────────────
  {
    title: 'LEGO Technic Land Rover Defender (2573 Pieces)',
    description: 'LEGO Technic 42110 Land Rover Defender with working suspension, 4-speed gearbox and diff lock. 2573 pieces.',
    price: 24999, discountPrice: 19999, category: 'Toys & Games', brand: 'LEGO',
    stock: 20, isPrime: true, isFeatured: true,
    images: ['https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500&q=80'],
    tags: ['lego','technic','toys','building'],
    specs: new Map([['Pieces','2573'],['Age','11+'],['Dimensions','42x22x20cm']])
  },
  {
    title: 'Funskool Monopoly Classic Board Game',
    description: 'Classic Monopoly board game for 2-8 players. Includes board, 8 tokens, 28 title deed cards, money, dice.',
    price: 1299, discountPrice: 799, category: 'Toys & Games', brand: 'Funskool',
    stock: 80, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1611891487122-207579d67d91?w=500&q=80'],
    tags: ['monopoly','board-game','family','funskool'],
    specs: new Map([['Players','2-8'],['Age','8+'],['Duration','60-180 min']])
  },
  {
    title: 'Hot Wheels 20-Car Gift Pack (Assorted)',
    description: '20 die-cast Hot Wheels cars in 1:64 scale. Assorted designs and colors, perfect collectible gift set.',
    price: 1299, discountPrice: 849, category: 'Toys & Games', brand: 'Hot Wheels',
    stock: 60, isPrime: false, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=500&q=80'],
    tags: ['hotwheels','cars','toys','diecast'],
    specs: new Map([['Scale','1:64'],['Count','20 cars'],['Age','3+'],['Material','Die-cast Metal']])
  },
  {
    title: 'Rubik\'s Cube 3x3 Original (Speed Cube)',
    description: 'Original Rubik\'s 3x3 cube with smooth mechanism, vibrant colors, develops problem solving skills.',
    price: 499, discountPrice: 349, category: 'Toys & Games', brand: "Rubik's",
    stock: 150, isPrime: true, isFeatured: false,
    images: ['https://images.unsplash.com/photo-1591991564021-0f9d3e51b0cf?w=500&q=80'],
    tags: ['rubiks','puzzle','cube','brain-game'],
    specs: new Map([['Size','3x3x3'],['Age','8+'],['Material','ABS Plastic']])
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear old data
    await Product.deleteMany({});
    await Category.deleteMany({});
    await User.deleteOne({ email: 'admin@shopzone.com' });
    console.log('Cleared existing data');

    // Insert categories
    await Category.insertMany(categories);
    console.log('Seeded 6 categories');

    // Insert all products
    await Product.insertMany(products.map(p => ({
      ...p,
      avgRating: (Math.random() * 2 + 3).toFixed(1),
      numReviews: Math.floor(Math.random() * 500) + 10,
      isActive: true,
    })));
    console.log(`Seeded ${products.length} products`);

    // Create admin user
    const admin = new User({
      name: 'Anuj Admin',
      email: 'admin@shopzone.com',
      passwordHash: 'Admin@123456',
      role: 'admin',
      isVerified: true,
      mobile: '7015542002',
    });
    await admin.save();
    console.log('Admin user created: admin@shopzone.com');

    console.log('\nDatabase seeded successfully!');
    console.log('Admin Email:    admin@shopzone.com');
    console.log('Admin Password: Admin@123456');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
