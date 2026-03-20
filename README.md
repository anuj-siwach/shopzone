# ShopZone — E-Commerce Web Application

**Developer:** Anuj  
**Email:** anujsiwach002@gmail.com | **Mobile:** +91 7015542002  
**College:** Pt. Neki Ram Sharma Govt. College, Rohtak  
**Class:** PGDCA | Academic Year 2025–26

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Redux Toolkit + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Images | Cloudinary CDN |
| Payment | Stripe (test mode) |
| Email | NodeMailer + Gmail |
| Hosting | Vercel (FE) + Railway (BE) |

---

## 📁 Project Structure

```
shopzone/
├── server/          ← Node.js + Express backend
│   ├── index.js     ← Entry point
│   ├── models/      ← Mongoose schemas
│   ├── routes/      ← API routes
│   ├── middleware/  ← Auth middleware
│   ├── utils/       ← Email & Cloudinary helpers
│   └── seed/        ← Database seed (30 products)
└── client/          ← React frontend
    └── src/
        ├── App.jsx      ← All pages in one file
        ├── store/       ← Redux slices
        ├── api/         ← Axios instance
        └── index.css    ← All styles
```

---

## ⚙️ Local Setup (Step by Step)

### Step 1 — Clone / Download
```bash
# If using Git:
git clone https://github.com/anuj/shopzone.git
cd shopzone

# Or extract the ZIP you downloaded
```

### Step 2 — Setup Backend
```bash
cd server
npm install
cp .env.example .env
# Open .env and fill in your values (see below)
```

### Step 3 — Configure .env
Open `server/.env` and fill in:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/shopzone
JWT_SECRET=any_random_64_char_string
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
EMAIL_USER=anujsiwach002@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Step 4 — Seed Database (optional but recommended)
```bash
# Inside server/ folder:
node seed/seedProducts.js
# This creates 30 products + admin user
# Admin login: admin@shopzone.com / Admin@123456
```

### Step 5 — Start Backend
```bash
npm run dev
# Server runs on http://localhost:5000
```

### Step 6 — Setup Frontend
```bash
cd ../client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
```

### Step 7 — Start Frontend
```bash
npm run dev
# App runs on http://localhost:3000
```

---

## 🌐 Production Deployment

### Deploy Backend to Railway
1. Go to railway.app → New Project → Deploy from GitHub
2. Set root directory to `/server`
3. Add all .env variables in Railway Settings → Variables
4. Deploy — Railway auto-deploys on push

### Deploy Frontend to Vercel
1. Go to vercel.com → New Project → Import GitHub repo
2. Set root directory to `/client`
3. Build command: `npm run build`
4. Add env variable: `VITE_API_URL=https://your-railway-app.railway.app`
5. Deploy — Vercel auto-deploys on push

### MongoDB Atlas (Free Database)
1. Go to cloud.mongodb.com → Create free cluster
2. Database Access → Add user with password
3. Network Access → Allow 0.0.0.0/0
4. Connect → Drivers → Copy connection string to .env

---

## 🔑 Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopzone.com | Admin@123456 |

---

## ✅ Features

- User registration with email OTP verification
- JWT login with 7-day session
- Password reset via email link
- Product listing with search, filter, sort, pagination
- Product detail page with image gallery + reviews
- Real-time Redux cart with localStorage persistence
- Multi-step checkout (address → payment)
- Coupon codes: FIRST10, SAVE500, SHOPZONE, ANUJ20
- Order history and cancellation
- Admin dashboard: KPIs, sales chart, orders, products, users
- Product CRUD with image upload (Cloudinary)
- Fully responsive (mobile + desktop)

---

## 🎫 Coupon Codes for Testing

| Code | Discount |
|------|---------|
| ANUJ20 | 20% off (min order ₹1000) |
| FIRST10 | 10% off (any order) |
| SAVE500 | ₹500 off (min order ₹2000) |
| SHOPZONE | 15% off (min order ₹5000) |

---

## 📞 Contact

**Anuj** — anujsiwach002@gmail.com — +91 7015542002  
Pt. Neki Ram Sharma Govt. College, Rohtak — PGDCA 2025–26
