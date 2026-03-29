// client/src/App.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, logout, selectUser, selectIsAdmin } from './store/userSlice';
import { selectCount, addItem, removeItem, updateQty, clearCart, selectCart, selectTotal } from './store/cartSlice';
import api from './api/axios';

// ──────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ──────────────────────────────────────────────────────────────
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
const stars = r => { let s = ''; for(let i=1;i<=5;i++) s += i<=Math.floor(r)?'★':(i-.5<=r?'★':'☆'); return s; };


// ──────────────────────────────────────────────────────────────
// DARK / LIGHT THEME HOOK
// ──────────────────────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('sz_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('sz_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

// ──────────────────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState('');
  const show = useCallback(m => { setMsg(m); setTimeout(() => setMsg(''), 2800); }, []);
  return [msg, show];
}
function Toast({ msg }) {
  return <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>;
}

// ──────────────────────────────────────────────────────────────
// STAR RATING COMPONENT
// ──────────────────────────────────────────────────────────────
function StarRating({ value, count }) {
  return (
    <span>
      <span className="stars">{stars(value)}</span>
      {count != null && <span className="rev-cnt">({Number(count).toLocaleString()})</span>}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// PRODUCT CARD
// ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, onNavigate }) {
  const { _id, title, brand, price, discountPrice, images, avgRating, numReviews, isPrime, stock } = product;
  const finalPrice = discountPrice || price;
  const disc = discountPrice ? Math.round((1 - discountPrice / price) * 100) : 0;
  const img  = images?.[0] || `https://placehold.co/400x400/f5f5f0/888?text=${encodeURIComponent(brand||'Product')}`;

  return (
    <div className="p-card" onClick={() => onNavigate('product', _id)}>
      <div className="p-card-img-wrap">
        {disc > 0 && <span className="badge-disc">-{disc}%</span>}
        {isPrime && <span className="badge-prime">prime</span>}
        <img src={img} alt={title} className="p-img" onError={e => { e.target.src = `https://placehold.co/400x400/f5f5f0/888?text=Product`; }} />
        <div className="p-overlay">
          <button className="" onClick={e => { e.stopPropagation(); onNavigate('product', _id); }}>Quick View</button>
        </div>
      </div>
      <div className="p-info">
        <div className="p-brand">{brand}</div>
        <div className="p-name">{title}</div>
        <StarRating value={avgRating} count={numReviews} />
        <div className="price-row">
          <span className="price">{fmt(finalPrice)}</span>
          {disc > 0 && <><span className="orig">{fmt(price)}</span><span className="disc-pct">-{disc}%</span></>}
        </div>
        {stock > 0 && stock < 10 ? <div className="stock-low">Only {stock} left!</div> : stock > 0 ? <div className="stock-ok">✓ In Stock</div> : null}
        <button className="atc-btn" disabled={stock === 0} onClick={e => { e.stopPropagation(); onAddToCart(product); }}>
          {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CART SIDEBAR
// ──────────────────────────────────────────────────────────────
function CartSidebar({ open, onClose, onCheckout }) {
  const dispatch = useDispatch();
  const items    = useSelector(selectCart);
  const total    = useSelector(selectTotal);

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-sidebar ${open ? 'open' : ''}`}>
        <div className="cart-hdr">
          <h3>🛒 Shopping Cart</h3>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-body">
          {items.length === 0
            ? <div className="empty-cart">🛒<br />Your cart is empty.<br />Start shopping!</div>
            : items.map(item => (
              <div key={item.id} className="cart-item">
                <img className="cart-item-img" src={item.image || `https://placehold.co/64x64/eee/333?text=P`} alt={item.title} onError={e=>e.target.src='https://placehold.co/64x64/eee/333?text=P'} />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.title?.slice(0, 55)}{item.title?.length > 55 ? '…' : ''}</div>
                  <div className="cart-item-price">{fmt(item.price)}</div>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty - 1 }))}>−</button>
                    <span>{item.qty}</span>
                    <button className="qty-btn" onClick={() => dispatch(updateQty({ id: item.id, qty: item.qty + 1 }))}>+</button>
                    <button className="qty-del" onClick={() => dispatch(removeItem(item.id))}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        {items.length > 0 && (
          <div className="cart-ftr">
            <div className="cart-total"><span>Subtotal ({items.reduce((n,i)=>n+i.qty,0)} items):</span><span>{fmt(total)}</span></div>
            <button className="checkout-btn" onClick={() => { onClose(); onCheckout(); }}>Proceed to Checkout</button>
          </div>
        )}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// NAVBAR — Addina style with dark/light toggle
// ──────────────────────────────────────────────────────────────
function Navbar({ onNavigate, onCartOpen, onSearch, cartCount, theme, onThemeToggle }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [q, setQ] = useState('');

  return (
    <>
      <div className="announce-bar">
        <span>✨ Use code <strong>ANUJ20</strong> for 20% off</span>
        <span className="announce-sep"> | </span>
        <span>🚚 Free shipping above ₹499</span>
        <span className="announce-sep"> | </span>
        <span>🔒 Secure Payments</span>
      </div>
      <nav className="navbar-top">
        <div className="logo" onClick={() => onNavigate('home')}>SHOP<span>ZONE</span></div>
        <div className="search-bar">
          <select defaultValue="All"><option>All</option><option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option><option>Books</option><option>Sports</option></select>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch(q)} placeholder="Search products, brands…" />
          <button onClick={() => onSearch(q)}>🔍</button>
        </div>
        <div className="nav-actions">
          {user
            ? <button className="nav-btn" onClick={() => onNavigate('profile')}><small>Hello, {user.name?.split(' ')[0]}</small><strong>Account</strong></button>
            : <button className="nav-btn" onClick={() => onNavigate('login')}><small>Hello, Sign in</small><strong>Account ▾</strong></button>
          }
          <button className="nav-btn" onClick={() => onNavigate('orders')}><small>Returns</small><strong>& Orders</strong></button>
          {user?.role === 'admin' && <button className="nav-btn" onClick={() => onNavigate('admin')} style={{color:'var(--gold)'}}>Admin</button>}
          {user && <button className="nav-btn" onClick={() => dispatch(logout())}>Logout</button>}
          <button className="nav-btn cart-btn" onClick={onCartOpen}>
            🛒<span className="cart-badge">{cartCount}</span><strong>Cart</strong>
          </button>
          <div className="theme-toggle-wrap">
            <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <button className="theme-toggle" onClick={onThemeToggle} title="Toggle dark/light mode" />
          </div>
        </div>
      </nav>
      <div className="navbar-sub">
        {['All','Electronics','Fashion','Home & Kitchen','Books','Sports','Toys & Games','Beauty','Deals 🔥'].map(item => (
          <button key={item} className="sub-item" onClick={() => {
            if (item === 'All') onNavigate('home');
            else if (!item.includes('🔥')) onNavigate('listing', { category: item });
          }}>{item}</button>
        ))}
      </div>
    </>
  );
}
// ──────────────────────────────────────────────────────────────
// HERO SLIDER — Addina Style
// ──────────────────────────────────────────────────────────────
function Hero({ onNavigate }) {
  const [idx, setIdx] = useState(0);
  const slides = [
    {
      cls: 's0',
      eyebrow: 'New Collection 2025',
      title: <>Discover <em>Premium</em><br/>Electronics &<br/>Gadgets</>,
      sub: 'Latest phones, laptops & smart devices — up to 40% off top brands.',
      cta: 'Shop Electronics', cta2: 'New Arrivals',
      cat: 'Electronics',
    },
    {
      cls: 's1',
      eyebrow: 'Curated Fashion',
      title: <>Style That<br/><em>Speaks</em><br/>Volumes</>,
      sub: 'Trending styles from Levi's, Nike, Adidas and more at unbeatable prices.',
      cta: 'Explore Fashion', cta2: 'View Lookbook',
      cat: 'Fashion',
    },
    {
      cls: 's2',
      eyebrow: 'Best Sellers',
      title: <>Transform Your<br/><em>Home</em> &<br/>Kitchen</>,
      sub: 'Premium home essentials curated for modern living. Free delivery above ₹999.',
      cta: 'Shop Home', cta2: 'See Deals',
      cat: 'Home & Kitchen',
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, []);
  const go = d => setIdx(i => (i + d + slides.length) % slides.length);

  return (
    <div className="hero">
      <div className="hero-slides" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide ${s.cls}`}>
            <div className="hero-content">
              <div className="hero-eyebrow">{s.eyebrow}</div>
              <h1 className="hero-title">{s.title}</h1>
              <p className="hero-sub">{s.sub}</p>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <button className="hero-cta" onClick={() => onNavigate('listing', { category: s.cat })}>{s.cta} →</button>
                <button className="hero-cta-2" onClick={() => onNavigate('listing', { category: s.cat })}>{s.cta2}</button>
              </div>
            </div>
            {i === 0 && <div className="hero-badge"><span>FREE</span><span>Shipping</span></div>}
          </div>
        ))}
      </div>
      <button className="hero-arrow arrow-left" onClick={() => go(-1)}>❮</button>
      <button className="hero-arrow arrow-right" onClick={() => go(1)}>❯</button>
      <div className="hero-dots">
        {slides.map((_, i) => <button key={i} className={`hero-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />)}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HOME PAGE
// ──────────────────────────────────────────────────────────────
function HomePage({ onNavigate, onAddToCart }) {
  const [sections, setSections] = useState({ electronics: [], fashion: [], home: [], books: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [e, f, h, b] = await Promise.all([
          api.get('/api/products?category=Electronics&limit=6&featured=true'),
          api.get('/api/products?category=Fashion&limit=6'),
          api.get('/api/products?category=Home+%26+Kitchen&limit=6'),
          api.get('/api/products?category=Books&limit=4'),
        ]);
        setSections({ electronics: e.data.products, fashion: f.data.products, home: h.data.products, books: b.data.products });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const dealItems = [
    { emoji: '📱', label: 'Smartphones', off: 'Up to 40% off', cat: 'Electronics' },
    { emoji: '💻', label: 'Laptops', off: 'Up to 35% off', cat: 'Electronics' },
    { emoji: '👗', label: 'Fashion', off: 'Min 50% off', cat: 'Fashion' },
    { emoji: '🏠', label: 'Home', off: 'Up to 60% off', cat: 'Home' },
    { emoji: '📚', label: 'Books', off: 'Up to 45% off', cat: 'Books' },
    { emoji: '🎮', label: 'Gaming', off: 'Up to 25% off', cat: 'Electronics' },
    { emoji: '💄', label: 'Beauty', off: 'Up to 55% off', cat: 'Fashion' },
    { emoji: '🏋️', label: 'Sports', off: 'Up to 30% off', cat: 'Sports' },
  ];

  if (loading) return <div className="spinner" />;

  const Section = ({ title, key2, cat }) => sections[key2]?.length > 0 && (
    <div className="section">
      <div className="section-hdr">
        <h2>{title}</h2>
        <button className="see-all" onClick={() => onNavigate('listing', { category: cat })}>See all »</button>
      </div>
      <div className="product-grid">
        {sections[key2].map(p => <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onNavigate={onNavigate} />)}
      </div>
    </div>
  );

  return (
    <div>
      <Hero onNavigate={onNavigate} />

      {/* Category grid */}
      <section className="home-section-tinted">
        <div className="container">
          <div className="section-hdr">
            <p className="section-eyebrow">Browse</p>
            <h2>Shop by Category</h2>
          </div>
          <div className="category-strip">
            {[{name:'Electronics',icon:'📱'},{name:'Fashion',icon:'👗'},{name:'Home & Kitchen',icon:'🛋️'},{name:'Books',icon:'📚'},{name:'Sports',icon:'⚽'},{name:'Beauty',icon:'✨'}].map(c => (
              <div key={c.name} className="cat-pill" onClick={() => onNavigate('listing',{category:c.name})}>
                <div className="cat-pill-icon">{c.icon}</div>
                <div className="cat-pill-name">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Electronics */}
      {sections.electronics?.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-hdr">
              <p className="section-eyebrow">Tech & Gadgets</p>
              <h2>Electronics</h2>
            </div>
            <div className="product-grid">
              {sections.electronics.slice(0,4).map(p=><ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onNavigate={onNavigate}/>)}
            </div>
            <div style={{textAlign:'center',marginTop:36}}>
              <button className="see-all" onClick={()=>onNavigate('listing',{category:'Electronics'})}>View All Electronics →</button>
            </div>
          </div>
        </section>
      )}

      {/* Fashion */}
      {sections.fashion?.length > 0 && (
        <section className="home-section-tinted">
          <div className="container">
            <div className="section-hdr">
              <p className="section-eyebrow">Style & Trends</p>
              <h2>Fashion</h2>
            </div>
            <div className="product-grid">
              {sections.fashion.slice(0,4).map(p=><ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onNavigate={onNavigate}/>)}
            </div>
            <div style={{textAlign:'center',marginTop:36}}>
              <button className="see-all" onClick={()=>onNavigate('listing',{category:'Fashion'})}>View All Fashion →</button>
            </div>
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="home-section-dark">
        <div className="why-grid">
          <div className="why-card"><div className="why-icon">🎁</div><h3>Premium Quality</h3><p>Every product carefully curated and quality-checked before reaching you.</p></div>
          <div className="why-card"><div className="why-icon">🚚</div><h3>Fast Delivery</h3><p>Swift and reliable delivery across India with real-time order tracking.</p></div>
          <div className="why-card"><div className="why-icon">🔒</div><h3>Secure Payments</h3><p>100% safe and encrypted transactions with multiple payment options.</p></div>
          <div className="why-card"><div className="why-icon">💬</div><h3>24/7 Support</h3><p>Our team is always here to help with any questions or concerns.</p></div>
        </div>
      </section>

      {/* Home & Books */}
      {sections.home?.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-hdr">
              <p className="section-eyebrow">For Your Home</p>
              <h2>Home & Kitchen</h2>
            </div>
            <div className="product-grid">
              {sections.home.slice(0,4).map(p=><ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onNavigate={onNavigate}/>)}
            </div>
            <div style={{textAlign:'center',marginTop:36}}>
              <button className="see-all" onClick={()=>onNavigate('listing',{category:'Home & Kitchen'})}>View All Home →</button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="cta-banner">
        <p className="section-eyebrow">Limited Time Offer</p>
        <h2>Get 20% Off Your First Order</h2>
        <p>Sign up and use code <strong>ANUJ20</strong> at checkout</p>
        <button className="btn-primary" style={{marginTop:8}} onClick={()=>onNavigate('register')}>Create Free Account →</button>
      </section>

      {/* Books */}
      {sections.books?.length > 0 && (
        <section className="home-section-tinted">
          <div className="container">
            <div className="section-hdr">
              <p className="section-eyebrow">Knowledge & Growth</p>
              <h2>Books</h2>
            </div>
            <div className="product-grid">
              {sections.books.slice(0,4).map(p=><ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onNavigate={onNavigate}/>)}
            </div>
            <div style={{textAlign:'center',marginTop:36}}>
              <button className="see-all" onClick={()=>onNavigate('listing',{category:'Books'})}>View All Books →</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PRODUCT LISTING PAGE
// ──────────────────────────────────────────────────────────────
function ListingPage({ params, onNavigate, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [sort, setSort]         = useState('createdAt');
  const [filters, setFilters]   = useState({ minPrice: '', maxPrice: '', minRating: '', brand: '' });

  const category = params?.category || '';
  const q        = params?.q || '';

  useEffect(() => { setPage(1); }, [category, q]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ page, limit: 12, sort });
        if (category) p.set('category', category);
        if (q)        p.set('q', q);
        if (filters.minPrice)  p.set('minPrice', filters.minPrice);
        if (filters.maxPrice)  p.set('maxPrice', filters.maxPrice);
        if (filters.minRating) p.set('minRating', filters.minRating);
        if (filters.brand)     p.set('brand', filters.brand);
        const { data } = await api.get(`/api/products?${p}`);
        setProducts(data.products);
        setTotal(data.total);
      } catch {}
      setLoading(false);
    };
    load();
  }, [category, q, page, sort, filters]);

  const pages = Math.ceil(total / 12);

  return (
    <div className="container page-content">
      <div className="breadcrumb">
        <a onClick={() => onNavigate('home')}>Home</a><span>›</span>
        {category && <span>{category}</span>}
        {q && <span>Search: "{q}"</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Filters */}
        <div className="section" style={{ padding: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Filters</h3>
          {[['Min Price (₹)', 'minPrice', 'number'], ['Max Price (₹)', 'maxPrice', 'number'], ['Min Rating', 'minRating', 'number'], ['Brand', 'brand', 'text']].map(([label, key, type]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input type={type} value={filters[key]} onChange={e => setFilters(f => ({...f, [key]: e.target.value}))} placeholder={type === 'number' ? '0' : 'e.g. Samsung'} />
            </div>
          ))}
          <button className="btn-primary" onClick={() => setPage(1)}>Apply</button>
          <button className="btn-secondary" onClick={() => { setFilters({ minPrice:'', maxPrice:'', minRating:'', brand:'' }); setPage(1); }}>Clear</button>
        </div>

        {/* Results */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, color: '#555' }}>
              {loading ? 'Loading…' : `1–${Math.min(page*12, total)} of ${total.toLocaleString()} results`}
              {q && <> for <b>"{q}"</b></>}
            </div>
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}>
              <option value="createdAt">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
          {loading ? <div className="spinner" /> : (
            products.length === 0
              ? <div style={{ textAlign:'center', padding: 60, color: '#888' }}>No products found.<br /><button className="see-all" onClick={() => onNavigate('home')}>Back to Home</button></div>
              : <div className="product-grid">
                  {products.map(p => <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onNavigate={onNavigate} />)}
                </div>
          )}
          {pages > 1 && !loading && (
            <div className="pagination">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
              {Array.from({length: Math.min(pages,7)}, (_,i) => {
                const pg = page <= 4 ? i+1 : page-3+i;
                if (pg < 1 || pg > pages) return null;
                return <button key={pg} className={`pg-btn ${pg === page ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>;
              })}
              <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p+1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PRODUCT DETAIL PAGE
// ──────────────────────────────────────────────────────────────
function ProductDetailPage({ productId, onNavigate, onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState(0);
  const [qty, setQty]         = useState(1);
  const [reviewForm, setRF]   = useState({ rating: 5, title: '', comment: '' });
  const [reviewMsg, setRM]    = useState('');
  const user = useSelector(selectUser);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const { data } = await api.get(`/api/products/${productId}`); setProduct(data); }
      catch {}
      setLoading(false);
    };
    load();
  }, [productId]);

  if (loading) return <div className="spinner" />;
  if (!product) return <div className="container page-content" style={{textAlign:'center',padding:60}}>Product not found.<br/><button className="see-all" onClick={() => onNavigate('home')}>Go Home</button></div>;

  const { title, brand, price, discountPrice, images, avgRating, numReviews, stock, description, specs, ratings = [] } = product;
  const finalPrice = discountPrice || price;
  const disc = discountPrice ? Math.round((1 - discountPrice / price) * 100) : 0;
  const imgs = images?.length ? images : [`https://placehold.co/400x400/EAEDED/333?text=${encodeURIComponent(brand)}`];

  const submitReview = async e => {
    e.preventDefault();
    if (!user) return onNavigate('login');
    try {
      await api.post(`/api/products/${product._id}/review`, reviewForm);
      setRM('Review submitted!');
      const { data } = await api.get(`/api/products/${productId}`);
      setProduct(data);
    } catch (err) { setRM(err.response?.data?.msg || 'Error'); }
  };

  return (
    <div className="container page-content">
      <div className="breadcrumb">
        <a onClick={() => onNavigate('home')}>Home</a><span>›</span>
        <a onClick={() => onNavigate('listing', { category: product.category })}>{product.category}</a><span>›</span>
        <span>{title?.slice(0, 40)}…</span>
      </div>
      <div className="detail-grid">
        {/* Images */}
        <div className="detail-imgs">
          <img className="main-img" src={imgs[mainImg]} alt={title} onError={e=>e.target.src='https://placehold.co/400x400/eee/333?text=Product'} />
          <div className="thumb-strip">
            {imgs.map((img, i) => (
              <img key={i} className={`thumb ${i === mainImg ? 'active' : ''}`} src={img} alt={i} onClick={() => setMainImg(i)} onError={e=>e.target.src='https://placehold.co/60x60/eee/333?text=P'} />
            ))}
          </div>
        </div>
        {/* Info */}
        <div className="detail-info">
          <div className="brand">{brand}</div>
          <h1>{title}</h1>
          <StarRating value={avgRating} count={numReviews} />
          <div className="detail-price-row">
            <span className="detail-price">{fmt(finalPrice)}</span>
            {disc > 0 && <><span className="detail-orig">{fmt(price)}</span><span className="detail-disc">-{disc}% off</span></>}
          </div>
          {disc > 0 && <div style={{fontSize:13, color:'var(--green)', marginBottom:8}}>You save: {fmt(price - finalPrice)}</div>}
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{description}</p>
          {specs && specs.size > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Specifications</div>
              <table style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
                {[...specs.entries()].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '5px 10px 5px 0', fontWeight: 600, color: '#555', width: '35%' }}>{k}</td>
                    <td style={{ padding: '5px 0' }}>{v}</td>
                  </tr>
                ))}
              </table>
            </div>
          )}
          {/* Reviews */}
          <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Customer Reviews</h3>
            {ratings.slice(0, 5).map((r, i) => (
              <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.userName}</div>
                <div style={{ color: 'var(--orange)', fontSize: 13 }}>{stars(r.rating)} <span style={{color:'#555'}}>{r.title}</span></div>
                <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>{r.comment}</div>
              </div>
            ))}
            {user && (
              <form onSubmit={submitReview} style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 10 }}>Write a Review</h4>
                {reviewMsg && <div className={reviewMsg.includes('!') ? 'form-ok' : 'form-err'}>{reviewMsg}</div>}
                <div className="form-group">
                  <label>Rating</label>
                  <select value={reviewForm.rating} onChange={e => setRF(f => ({...f, rating: e.target.value}))}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Title</label><input value={reviewForm.title} onChange={e => setRF(f => ({...f, title: e.target.value}))} placeholder="Brief summary" /></div>
                <div className="form-group"><label>Comment</label><textarea value={reviewForm.comment} onChange={e => setRF(f => ({...f, comment: e.target.value}))} rows={3} style={{width:'100%',padding:'8px 12px',border:'1px solid var(--border)',borderRadius:4,fontSize:13,resize:'vertical'}} placeholder="Share your experience…" /></div>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>Submit Review</button>
              </form>
            )}
          </div>
        </div>
        {/* Buy Box */}
        <div className="buy-box">
          <div className="bb-price">{fmt(finalPrice)}</div>
          {disc > 0 && <div style={{fontSize:12,color:'#888',marginBottom:6}}>M.R.P.: <s>{fmt(price)}</s></div>}
          <div className="bb-delivery">✅ FREE Delivery</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>Estimated: 2 days</div>
          {stock > 0 ? <div className="bb-stock">In Stock</div> : <div style={{color:'var(--red)',fontWeight:700,marginBottom:12}}>Out of Stock</div>}
          {stock > 0 && (
            <div className="qty-select">
              <label>Qty:</label>
              <select value={qty} onChange={e => setQty(+e.target.value)}>
                {Array.from({length: Math.min(stock, 10)}, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
            </div>
          )}
          <button className="atc-lg" disabled={stock === 0} onClick={() => { for(let i=0;i<qty;i++) onAddToCart(product); }}>Add to Cart</button>
          <button className="buy-now" disabled={stock === 0} onClick={() => { for(let i=0;i<qty;i++) onAddToCart(product); onNavigate('checkout'); }}>Buy Now</button>
          <div style={{ fontSize: 12, color: '#888', marginTop: 10 }}>🔒 Secure transaction</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>Sold by: ShopZone</div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// LOGIN PAGE
// ──────────────────────────────────────────────────────────────
function LoginPage({ onNavigate }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.user);
  const [form, setForm]   = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (!res.error) onNavigate('home');
  };

  return (
    <div className="login-split">
      {/* Left decorative panel */}
      <div className="login-left-panel">
        <div className="login-left-brand">shop<span>Zone</span></div>
        <div style={{position:'relative',flex:1,display:'flex',alignItems:'flex-end',paddingBottom:40}}>
          <div className="login-art-circle c1" />
          <div className="login-art-circle c2" />
          <div className="login-art-circle c3" />
          <p className="login-left-tagline">Curated for<br/>the modern<br/>lifestyle</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right-panel">
        <div className="login-box">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to your ShopZone account</p>

          {error && <div className="form-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label>
                Password
                <button type="button" className="show-pass" onClick={() => setShowPass(s=>!s)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </label>
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required placeholder="••••••••" />
            </div>
            <div className="forgot-link">
              <a href="#" onClick={e=>{e.preventDefault();}}>Forgot password?</a>
            </div>
            <button type="submit" className="btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="divider-or"><span>or</span></div>

          <button className="btn-secondary" style={{width:'100%',justifyContent:'center'}} onClick={()=>onNavigate('register')}>
            Create New Account
          </button>

          <p style={{textAlign:'center',fontSize:13,color:'var(--text3)',marginTop:16,lineHeight:1.6}}>
            By signing in you agree to ShopZone&apos;s<br/>
            <span style={{color:'var(--gold)',cursor:'pointer',borderBottom:'1px solid var(--gold)'}}>Terms of Service</span> and <span style={{color:'var(--gold)',cursor:'pointer',borderBottom:'1px solid var(--gold)'}}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ onNavigate }) {
  const [form, setForm]       = useState({ name: '', email: '', password: '', mobile: '' });
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async e => {
    e.preventDefault();
    if (form.password.length < 8)
      return setMsg({ type: 'err', text: 'Password must be at least 8 characters' });
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      // Save token and user — direct login, no OTP needed
      if (data.token) {
        localStorage.setItem('sz_token', data.token);
        localStorage.setItem('sz_user', JSON.stringify(data.user));
        setMsg({ type: 'ok', text: 'Account created! Welcome to ShopZone!' });
        setTimeout(() => onNavigate('home'), 800);
      } else {
        // Server created account but no token yet (fallback)
        setMsg({ type: 'ok', text: 'Account created! Please login.' });
        setTimeout(() => onNavigate('login'), 1000);
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.msg || 'Registration failed. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="container page-content">
      <div className="form-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="logo" style={{ display: 'inline', fontSize: 28 }}>shop<span>Zone</span></div>
        </div>
        <h2>Create Account</h2>
        <p>Join ShopZone today — it's free!</p>
        {msg.text && <div className={msg.type === 'ok' ? 'form-ok' : 'form-err'}>{msg.text}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required placeholder="Enter your full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label>Mobile (optional)</label>
            <input value={form.mobile} onChange={e => setForm(f=>({...f,mobile:e.target.value}))} placeholder="Enter mobile number" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required placeholder="Min 8 characters" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <button className="form-link" onClick={() => onNavigate('login')}>
          Already have an account? Sign in →
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CHECKOUT PAGE
// ──────────────────────────────────────────────────────────────
function CheckoutPage({ onNavigate, showToast }) {
  const dispatch = useDispatch();
  const user  = useSelector(selectUser);
  const items = useSelector(selectCart);
  const total = useSelector(selectTotal);
  const [step, setStep]  = useState(1); // 1=address, 2=payment
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon]   = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [payMethod, setPayMethod] = useState('cod');
  const [addr, setAddr] = useState({
    fullName: user?.name || '', phone: user?.mobile || '', line1: '', line2: '', city: '', state: '', pincode: ''
  });

  if (!user) { onNavigate('login'); return null; }
  if (items.length === 0) { onNavigate('home'); return null; }

  const delivery = (total - discount) >= 499 ? 0 : 49;
  const grand    = total - discount + delivery;

  const applyCoupon = async () => {
    try {
      const { data } = await api.post('/api/orders/validate-coupon', { couponCode: coupon, subtotal: total });
      setDiscount(data.discount);
      setCouponMsg(`✅ ${coupon.toUpperCase()} applied — You save ${fmt(data.discount)}!`);
    } catch (err) { setCouponMsg('❌ ' + (err.response?.data?.msg || 'Invalid coupon')); }
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/orders', {
        cartItems: items.map(i => ({ productId: i.id, qty: i.qty })),
        shippingAddress: addr,
        paymentMethod: payMethod,
        couponCode: coupon || undefined,
      });
      dispatch(clearCart());
      showToast('🎉 Order placed successfully!');
      onNavigate('orderConfirm', data.order._id);
    } catch (err) { showToast('❌ ' + (err.response?.data?.msg || 'Order failed')); }
    setLoading(false);
  };

  return (
    <div className="container page-content">
      <h2 style={{ marginBottom: 20 }}>🔒 Secure Checkout</h2>
      <div className="checkout-layout">
        <div>
          {step === 1 && (
            <div className="checkout-step">
              <h3>📍 Delivery Address</h3>
              <div className="form-row">
                <div className="form-group"><label>Full Name</label><input value={addr.fullName} onChange={e=>setAddr(a=>({...a,fullName:e.target.value}))} required /></div>
                <div className="form-group"><label>Phone</label><input value={addr.phone} onChange={e=>setAddr(a=>({...a,phone:e.target.value}))} required /></div>
              </div>
              <div className="form-group"><label>Address Line 1</label><input value={addr.line1} onChange={e=>setAddr(a=>({...a,line1:e.target.value}))} required placeholder="House No, Street" /></div>
              <div className="form-group"><label>Address Line 2 (optional)</label><input value={addr.line2} onChange={e=>setAddr(a=>({...a,line2:e.target.value}))} placeholder="Area, Landmark" /></div>
              <div className="form-row">
                <div className="form-group"><label>City</label><input value={addr.city} onChange={e=>setAddr(a=>({...a,city:e.target.value}))} required /></div>
                <div className="form-group"><label>State</label><input value={addr.state} onChange={e=>setAddr(a=>({...a,state:e.target.value}))} required /></div>
              </div>
              <div className="form-group"><label>Pincode</label><input value={addr.pincode} onChange={e=>setAddr(a=>({...a,pincode:e.target.value}))} required maxLength={6} pattern="\d{6}" /></div>
              <button className="btn-primary" style={{width:'auto',padding:'10px 28px'}} onClick={() => {
                if (!addr.fullName||!addr.phone||!addr.line1||!addr.city||!addr.state||!addr.pincode) return showToast('Please fill all required fields');
                setStep(2);
              }}>Continue to Payment →</button>
            </div>
          )}
          {step === 2 && (
            <div className="checkout-step">
              <h3>💳 Payment Method</h3>
              <div className="payment-methods">
                {[['cod','💵 Cash on Delivery'],['upi','📱 UPI / GPay'],['card','💳 Credit/Debit Card'],['netbanking','🏦 Net Banking']].map(([val, label]) => (
                  <div key={val} className={`pm-option ${payMethod === val ? 'selected' : ''}`} onClick={() => setPayMethod(val)}>{label}</div>
                ))}
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code e.g. ANUJ20" style={{flex:1,padding:'8px 12px',border:'1px solid var(--border)',borderRadius:4,fontSize:13}} />
                <button onClick={applyCoupon} style={{padding:'8px 16px',background:'var(--orange)',border:'none',borderRadius:4,fontWeight:700,cursor:'pointer'}}>Apply</button>
              </div>
              {couponMsg && <div style={{fontSize:13,marginTop:6,color:couponMsg.includes('✅')?'var(--green)':'var(--red)'}}>{couponMsg}</div>}
              <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>Try: FIRST10 · SAVE500 · SHOPZONE · ANUJ20</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn-secondary" style={{width:'auto',padding:'10px 20px'}} onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" style={{width:'auto',padding:'10px 28px'}} disabled={loading} onClick={placeOrder}>{loading ? 'Placing order…' : `Place Order — ${fmt(grand)}`}</button>
              </div>
            </div>
          )}
        </div>
        {/* Order summary */}
        <div className="order-summary-box">
          <h3>Order Summary</h3>
          {items.map(item => (
            <div key={item.id} className="summary-item">
              <span style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title?.slice(0,28)}… ×{item.qty}</span>
              <span>{fmt(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="summary-item"><span>Subtotal</span><span>{fmt(total)}</span></div>
          {discount > 0 && <div className="summary-item discount"><span>Discount</span><span>-{fmt(discount)}</span></div>}
          <div className="summary-item"><span>Delivery</span><span style={{color:'var(--green)'}}>{delivery === 0 ? 'FREE' : fmt(delivery)}</span></div>
          <div className="summary-item total"><span>Total</span><span>{fmt(grand)}</span></div>
          {delivery === 0 && <div style={{fontSize:12,color:'var(--green)',marginTop:4}}>✓ Free delivery applied</div>}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ORDER CONFIRMATION PAGE
// ──────────────────────────────────────────────────────────────
function OrderConfirmPage({ orderId, onNavigate }) {
  const [order, setOrder] = useState(null);
  useEffect(() => {
    if (orderId) api.get(`/api/orders/${orderId}`).then(r => setOrder(r.data)).catch(()=>{});
  }, [orderId]);

  return (
    <div className="container page-content" style={{ maxWidth: 680, margin: '30px auto' }}>
      <div className="section" style={{ textAlign: 'center', padding: '40px 30px' }}>
        {/* Big success tick */}
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #4caf50' }}>
          <span style={{ fontSize: 44 }}>✅</span>
        </div>
        <h2 style={{ color: '#2e7d32', fontSize: 24, marginBottom: 6 }}>Order Placed Successfully!</h2>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>Thank you for shopping with ShopZone!</p>

        {order ? (
          <>
            {/* Order ID box */}
            <div style={{ background: '#f0f7ff', border: '1px solid #bbdefb', borderRadius: 8, padding: '12px 20px', marginBottom: 20, display: 'inline-block' }}>
              <div style={{ fontSize: 11, color: '#1565c0', fontWeight: 600, letterSpacing: 1, marginBottom: 2 }}>ORDER ID</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0d47a1', fontSize: 13 }}>#{order._id}</div>
            </div>

            {/* Items list */}
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'left', border: '1px solid #eee' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🛍️ Items Ordered</div>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < order.items.length - 1 ? '1px solid #eee' : 'none', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={item.image || 'https://placehold.co/40x40/eee/555?text=P'} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, border: '1px solid #eee' }} onError={e => e.target.src = 'https://placehold.co/40x40/eee/555?text=P'} />
                    <span style={{ color: '#333' }}>{item.title} <span style={{ color: '#888' }}>× {item.qty}</span></span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 10, fontSize: 15, paddingTop: 10, borderTop: '2px solid #eee' }}>
                <span>Total Paid</span><span style={{ color: 'var(--orange)' }}>{fmt(order.totalAmount)}</span>
              </div>
            </div>

            {/* Delivery info */}
            <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>📦 <strong>Status</strong></span>
                <span className={`status-badge status-${order.status}`}>{order.status?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
                <span>🚚 <strong>Estimated Delivery</strong></span>
                <span style={{ color: '#1b5e20', fontWeight: 600 }}>
                  {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '3-5 Business Days'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
                <span>💳 <strong>Payment</strong></span>
                <span style={{ fontWeight: 600 }}>{order.paymentMethod?.toUpperCase() || 'COD'}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="spinner" style={{ margin: '20px auto' }} />
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ width: 'auto', padding: '11px 28px' }} onClick={() => onNavigate('home')}>🛍️ Continue Shopping</button>
          <button className="btn-secondary" style={{ width: 'auto', padding: '11px 28px' }} onClick={() => onNavigate('orders')}>📦 View My Orders</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ORDERS PAGE — Full order history with status tracking
// ──────────────────────────────────────────────────────────────
function OrdersPage({ onNavigate }) {
  const user    = useSelector(selectUser);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // which order is expanded
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (!user) return onNavigate('login');
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    api.get('/api/orders/my')
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      showToast('Order cancelled successfully');
      loadOrders();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.msg || 'Could not cancel order'));
    }
    setCancelling(null);
  };

  // Status colours and labels
  const statusInfo = {
    pending:    { color: '#f57c00', bg: '#fff3e0', icon: '⏳', label: 'Pending' },
    confirmed:  { color: '#1976d2', bg: '#e3f2fd', icon: '✅', label: 'Confirmed' },
    processing: { color: '#7b1fa2', bg: '#f3e5f5', icon: '🔧', label: 'Processing' },
    shipped:    { color: '#0288d1', bg: '#e1f5fe', icon: '🚚', label: 'Shipped' },
    out_for_delivery: { color: '#00796b', bg: '#e0f2f1', icon: '🛵', label: 'Out for Delivery' },
    delivered:  { color: '#388e3c', bg: '#e8f5e9', icon: '📦', label: 'Delivered' },
    cancelled:  { color: '#c62828', bg: '#ffebee', icon: '❌', label: 'Cancelled' },
    returned:   { color: '#5d4037', bg: '#efebe9', icon: '↩️', label: 'Returned' },
  };

  // Delivery progress steps
  const progressSteps = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

  const getStepIndex = (status) => progressSteps.indexOf(status);

  if (!user) return null;

  return (
    <div className="container page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>📦 Returns & Orders</h2>
        <span style={{ fontSize: 13, color: '#888' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="spinner" /> : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🛍️</div>
          <div style={{ color: '#888', fontSize: 16, marginBottom: 20 }}>You have no orders yet</div>
          <button className="btn-primary" style={{ width: 'auto', padding: '11px 28px' }} onClick={() => onNavigate('home')}>Start Shopping</button>
        </div>
      ) : (
        orders.map(o => {
          const si     = statusInfo[o.status] || statusInfo.pending;
          const isOpen = expanded === o._id;
          const stepIdx = getStepIndex(o.status);
          const canCancel = ['pending', 'confirmed'].includes(o.status);

          return (
            <div key={o._id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

              {/* Order header */}
              <div style={{ background: '#fafafa', padding: '14px 18px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: 0.5 }}>ORDER PLACED</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: 0.5 }}>TOTAL</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(o.totalAmount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#999', fontWeight: 600, letterSpacing: 0.5 }}>ORDER ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#555' }}>#{o._id?.slice(-10)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: si.bg, color: si.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {si.icon} {si.label}
                  </span>
                  <button onClick={() => setExpanded(isOpen ? null : o._id)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                    {isOpen ? '▲ Hide' : '▼ Details'}
                  </button>
                </div>
              </div>

              {/* Items preview (always visible) */}
              <div style={{ padding: '12px 18px' }}>
                {o.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < o.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <img src={item.image || 'https://placehold.co/50x50/eee/555?text=P'} alt="" style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee', background: '#fafafa' }} onError={e => e.target.src = 'https://placehold.co/50x50/eee/555?text=P'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Qty: {item.qty} &nbsp;|&nbsp; Price: {fmt(item.price)} each</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #eee', padding: '16px 18px', background: '#fefefe' }}>

                  {/* Progress bar — only for active orders */}
                  {!['cancelled', 'returned'].includes(o.status) && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#333' }}>📍 Order Tracking</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                        {/* Progress line */}
                        <div style={{ position: 'absolute', top: 14, left: '10%', right: '10%', height: 3, background: '#e0e0e0', borderRadius: 2, zIndex: 0 }} />
                        <div style={{ position: 'absolute', top: 14, left: '10%', width: stepIdx < 0 ? '0%' : `${(stepIdx / (progressSteps.length - 1)) * 80}%`, height: 3, background: '#4caf50', borderRadius: 2, zIndex: 1, transition: 'width 0.4s' }} />

                        {progressSteps.map((step, idx) => {
                          const done    = idx <= stepIdx;
                          const current = idx === stepIdx;
                          const info    = statusInfo[step];
                          return (
                            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#4caf50' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, border: current ? '3px solid #2e7d32' : '2px solid ' + (done ? '#4caf50' : '#ccc'), boxShadow: current ? '0 0 0 3px #c8e6c9' : 'none' }}>
                                {done ? '✓' : <span style={{ fontSize: 10, color: '#999' }}>{idx + 1}</span>}
                              </div>
                              <div style={{ fontSize: 10, marginTop: 4, textAlign: 'center', fontWeight: current ? 700 : 400, color: done ? '#2e7d32' : '#aaa', maxWidth: 60 }}>{info?.label}</div>
                            </div>
                          );
                        })}
                      </div>

                      {o.estimatedDelivery && o.status !== 'delivered' && (
                        <div style={{ marginTop: 12, fontSize: 12, color: '#1565c0', background: '#e3f2fd', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
                          🗓️ Expected by: <strong>{new Date(o.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                        </div>
                      )}
                      {o.status === 'delivered' && o.deliveredAt && (
                        <div style={{ marginTop: 12, fontSize: 12, color: '#2e7d32', background: '#e8f5e9', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
                          ✅ Delivered on: <strong>{new Date(o.deliveredAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancelled message */}
                  {o.status === 'cancelled' && (
                    <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#c62828' }}>
                      ❌ This order was cancelled.
                      {o.cancelledAt && <span> On {new Date(o.cancelledAt).toLocaleDateString('en-IN')}</span>}
                    </div>
                  )}

                  {/* Delivery address */}
                  {o.shippingAddress && (
                    <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>📍 DELIVERY ADDRESS</div>
                      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>
                        <strong>{o.shippingAddress.fullName}</strong><br />
                        {o.shippingAddress.line1}{o.shippingAddress.line2 ? ', ' + o.shippingAddress.line2 : ''}<br />
                        {o.shippingAddress.city}, {o.shippingAddress.state} — {o.shippingAddress.pincode}<br />
                        📞 {o.shippingAddress.phone}
                      </div>
                    </div>
                  )}

                  {/* Payment info */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 140, background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>PAYMENT</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{o.paymentMethod?.toUpperCase() || 'COD'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 140, background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>AMOUNT PAID</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)', marginTop: 3 }}>{fmt(o.totalAmount)}</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    {canCancel && (
                      <button
                        onClick={() => cancelOrder(o._id)}
                        disabled={cancelling === o._id}
                        style={{ padding: '9px 20px', background: '#fff', border: '1px solid #e53935', color: '#e53935', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {cancelling === o._id ? 'Cancelling…' : '❌ Cancel Order'}
                      </button>
                    )}
                    {o.status === 'delivered' && (
                      <button
                        onClick={() => onNavigate('product', o.items?.[0]?.productId)}
                        style={{ padding: '9px 20px', background: '#fff', border: '1px solid var(--orange)', color: 'var(--orange)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        ⭐ Write a Review
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('home')}
                      style={{ padding: '9px 20px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      🛍️ Buy Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PROFILE PAGE
// ──────────────────────────────────────────────────────────────
function ProfilePage({ onNavigate }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [form, setForm]   = useState({ name: user?.name || '', mobile: user?.mobile || '' });
  const [msg, setMsg]     = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) { onNavigate('login'); return null; }

  const save = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/api/users/profile', form);
      localStorage.setItem('sz_user', JSON.stringify(data));
      dispatch(setUser(data));
      setMsg('Profile updated!');
    } catch (err) { setMsg(err.response?.data?.msg || 'Error'); }
    setLoading(false);
  };

  return (
    <div className="container page-content">
      <div className="form-card" style={{ maxWidth: 500 }}>
        <h2>My Profile</h2>
        <p>{user.email}</p>
        {msg && <div className="form-ok">{msg}</div>}
        <form onSubmit={save}>
          <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
          <div className="form-group"><label>Mobile</label><input value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} /></div>
          <div className="form-group"><label>Email</label><input value={user.email} disabled style={{background:'#f5f5f5',cursor:'not-allowed'}} /></div>
          <div className="form-group"><label>Role</label><input value={user.role} disabled style={{background:'#f5f5f5',cursor:'not-allowed'}} /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
        </form>
        <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
          <button className="btn-secondary" style={{width:'auto',padding:'8px 16px'}} onClick={()=>onNavigate('orders')}>My Orders</button>
          <button className="btn-secondary" style={{width:'auto',padding:'8px 16px'}} onClick={()=>{ dispatch(logout()); onNavigate('home'); }}>Logout</button>
        </div>
      </div>
    </div>
  );
}

import { setUser } from './store/userSlice';

// ──────────────────────────────────────────────────────────────
// ADMIN DASHBOARD PAGE
// ──────────────────────────────────────────────────────────────
function AdminPage({ onNavigate }) {
  const user = useSelector(selectUser);
  const [tab, setTab]    = useState('dashboard');
  const [stats, setStats]= useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [prodForm, setPF] = useState({ title:'', description:'', price:'', discountPrice:'', category:'Electronics', brand:'', stock:'100', isPrime: false, isFeatured: false, imageUrls:'' });
  const [prodMsg, setPMsg] = useState('');

  if (!user || user.role !== 'admin') { onNavigate('home'); return null; }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'dashboard') { const {data} = await api.get('/api/admin/dashboard'); setStats(data); }
        if (tab === 'products')  { const {data} = await api.get('/api/admin/products?limit=50');  setProducts(data.products || []); }
        if (tab === 'orders')    { const {data} = await api.get('/api/admin/orders?limit=50');    setOrders(data.orders || []); }
        if (tab === 'users')     { const {data} = await api.get('/api/admin/users?limit=50');     setUsers(data.users || []); }
      } catch {}
      setLoading(false);
    };
    load();
  }, [tab]);

  const createProduct = async e => {
    e.preventDefault();
    setPMsg('');
    try {
      const payload = { ...prodForm, imageUrls: prodForm.imageUrls.split('\n').map(s=>s.trim()).filter(Boolean) };
      await api.post('/api/admin/products', payload);
      setPMsg('✅ Product created!');
      setPF({ title:'', description:'', price:'', discountPrice:'', category:'Electronics', brand:'', stock:'100', isPrime:false, isFeatured:false, imageUrls:'' });
      const {data} = await api.get('/api/admin/products?limit=50');
      setProducts(data.products || []);
    } catch (err) { setPMsg('❌ ' + (err.response?.data?.msg || 'Error')); }
  };

  const deleteProduct = async id => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/api/admin/products/${id}`);
    setProducts(ps => ps.filter(p => p._id !== id));
  };

  const updateOrderStatus = async (id, status) => {
    await api.put(`/api/admin/orders/${id}/status`, { status });
    setOrders(os => os.map(o => o._id === id ? {...o, status} : o));
  };

  const nav = [
    ['dashboard','📊 Dashboard'], ['products','📦 Products'], ['orders','📋 Orders'], ['users','👥 Users']
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-logo">shopZone Admin</div>
        {nav.map(([key, label]) => (
          <div key={key} className={`admin-nav-item ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</div>
        ))}
        <div className="admin-nav-item" onClick={() => onNavigate('home')} style={{marginTop:'auto'}}>← Back to Store</div>
      </div>
      <div className="admin-content">
        {loading ? <div className="spinner" /> : (
          <>
            {tab === 'dashboard' && stats && (
              <>
                <h2 style={{marginBottom:20}}>Dashboard Overview</h2>
                <div className="kpi-grid">
                  {[
                    ['Total Revenue', fmt(stats.totalRevenue), `Today: ${fmt(stats.todayRevenue)}`, '#4F46E5'],
                    ['Total Orders', stats.totalOrders?.toLocaleString(), `Today: ${stats.todayOrders}`, '#059669'],
                    ['Active Users', stats.totalUsers?.toLocaleString(), 'Customers', '#EA580C'],
                    ['Low Stock', stats.lowStockCount, 'Products need restock', '#DC2626'],
                  ].map(([label, value, sub, color]) => (
                    <div key={label} className="kpi-card" style={{borderLeftColor:color}}>
                      <div className="kpi-label">{label}</div>
                      <div className="kpi-value">{value}</div>
                      <div className="kpi-sub">{sub}</div>
                    </div>
                  ))}
                </div>
                <div className="admin-table">
                  <h3>📈 Sales — Last 7 Days</h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '10px 0' }}>
                    {stats.salesChart?.map((d, i) => {
                      const max = Math.max(...stats.salesChart.map(x => x.revenue), 1);
                      const h = Math.max((d.revenue / max) * 100, 3);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 10, color: '#888' }}>{fmt(d.revenue)}</div>
                          <div style={{ width: '100%', height: `${h}%`, background: 'var(--orange)', borderRadius: '3px 3px 0 0', transition: 'height .5s' }} />
                          <div style={{ fontSize: 11, color: '#666' }}>{d.date}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="admin-table" style={{marginTop:16}}>
                  <h3>Recent Orders</h3>
                  <table className="tbl">
                    <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {stats.recentOrders?.map(o => (
                        <tr key={o._id}>
                          <td style={{fontFamily:'monospace',fontSize:11}}>#{o._id.slice(-8)}</td>
                          <td>{o.userId?.name || '—'}</td>
                          <td style={{fontWeight:700}}>{fmt(o.totalAmount)}</td>
                          <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                          <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'products' && (
              <>
                <h2 style={{marginBottom:20}}>Products Management</h2>
                <div className="section" style={{marginBottom:20}}>
                  <h3 style={{marginBottom:14}}>Add New Product</h3>
                  {prodMsg && <div className={prodMsg.includes('✅') ? 'form-ok' : 'form-err'}>{prodMsg}</div>}
                  <form onSubmit={createProduct}>
                    <div className="form-row">
                      <div className="form-group"><label>Title *</label><input value={prodForm.title} onChange={e=>setPF(f=>({...f,title:e.target.value}))} required /></div>
                      <div className="form-group"><label>Brand *</label><input value={prodForm.brand} onChange={e=>setPF(f=>({...f,brand:e.target.value}))} required /></div>
                    </div>
                    <div className="form-group"><label>Description *</label><textarea value={prodForm.description} onChange={e=>setPF(f=>({...f,description:e.target.value}))} required rows={3} style={{width:'100%',padding:'8px 12px',border:'1px solid var(--border)',borderRadius:4,fontSize:13,resize:'vertical'}} /></div>
                    <div className="form-row">
                      <div className="form-group"><label>Price (₹) *</label><input type="number" value={prodForm.price} onChange={e=>setPF(f=>({...f,price:e.target.value}))} required min="0" /></div>
                      <div className="form-group"><label>Discount Price (₹)</label><input type="number" value={prodForm.discountPrice} onChange={e=>setPF(f=>({...f,discountPrice:e.target.value}))} min="0" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Category *</label><select value={prodForm.category} onChange={e=>setPF(f=>({...f,category:e.target.value}))}><option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option><option>Books</option><option>Sports</option><option>Toys & Games</option></select></div>
                      <div className="form-group"><label>Stock</label><input type="number" value={prodForm.stock} onChange={e=>setPF(f=>({...f,stock:e.target.value}))} min="0" /></div>
                    </div>
                    <div className="form-group"><label>Image URLs (one per line)</label><textarea value={prodForm.imageUrls} onChange={e=>setPF(f=>({...f,imageUrls:e.target.value}))} rows={2} style={{width:'100%',padding:'8px 12px',border:'1px solid var(--border)',borderRadius:4,fontSize:13,resize:'vertical'}} placeholder="https://..." /></div>
                    <div style={{display:'flex',gap:16,marginBottom:14}}>
                      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}><input type="checkbox" checked={prodForm.isPrime} onChange={e=>setPF(f=>({...f,isPrime:e.target.checked}))} /> Prime</label>
                      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}><input type="checkbox" checked={prodForm.isFeatured} onChange={e=>setPF(f=>({...f,isFeatured:e.target.checked}))} /> Featured</label>
                    </div>
                    <button type="submit" className="btn-primary" style={{width:'auto',padding:'10px 24px'}}>Add Product</button>
                  </form>
                </div>
                <div className="admin-table">
                  <h3>All Products ({products.length})</h3>
                  <table className="tbl">
                    <thead><tr><th>Title</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id}>
                          <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</td>
                          <td>{p.category}</td>
                          <td>{fmt(p.discountPrice || p.price)}</td>
                          <td style={{color: p.stock < 10 ? 'var(--red)' : 'var(--green)', fontWeight: 600}}>{p.stock}</td>
                          <td><span className={`status-badge ${p.isActive ? 'status-delivered' : 'status-cancelled'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td><button onClick={() => deleteProduct(p._id)} style={{background:'none',color:'var(--red)',border:'1px solid var(--red)',padding:'3px 10px',borderRadius:4,cursor:'pointer',fontSize:12}}>Deactivate</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'orders' && (
              <>
                <h2 style={{marginBottom:20}}>Orders Management</h2>
                <div className="admin-table">
                  <h3>All Orders ({orders.length})</h3>
                  <table className="tbl">
                    <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Items</th><th>Payment</th><th>Status</th><th>Update</th></tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o._id}>
                          <td style={{fontFamily:'monospace',fontSize:11}}>#{o._id.slice(-8)}</td>
                          <td>{o.userId?.name || '—'}<br/><span style={{fontSize:11,color:'#888'}}>{o.userId?.email || ''}</span></td>
                          <td style={{fontWeight:700}}>{fmt(o.totalAmount)}</td>
                          <td>{o.items?.length || 0}</td>
                          <td><span className={`status-badge ${o.paymentStatus==='paid'?'status-delivered':'status-processing'}`}>{o.paymentStatus}</span></td>
                          <td><span className={`status-badge status-${o.status}`}>{o.status.replace(/_/g,' ')}</span></td>
                          <td>
                            <select value={o.status} onChange={e=>updateOrderStatus(o._id,e.target.value)} style={{fontSize:12,padding:'4px',border:'1px solid #ddd',borderRadius:4}}>
                              {['confirmed','processing','shipped','out_for_delivery','delivered','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === 'users' && (
              <>
                <h2 style={{marginBottom:20}}>User Management</h2>
                <div className="admin-table">
                  <h3>All Users ({users.length})</h3>
                  <table className="tbl">
                    <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Verified</th><th>Joined</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td style={{fontWeight:600}}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.mobile || '—'}</td>
                          <td><span className={`status-badge ${u.role==='admin'?'status-processing':u.role==='seller'?'status-shipped':'status-delivered'}`}>{u.role}</span></td>
                          <td>{u.isVerified ? '✅' : '❌'}</td>
                          <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// FOOTER — Addina style dark footer
// ──────────────────────────────────────────────────────────────
function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        {/* Brand col */}
        <div>
          <div className="footer-brand">shop<span>Zone</span></div>
          <p className="footer-desc">Curated selections for modern living. Premium products delivered across India with care and speed.</p>
          <div className="newsletter">
            <input placeholder="Your email address" />
            <button>Subscribe</button>
          </div>
        </div>
        {/* Shop */}
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            {['Electronics','Fashion','Home & Kitchen','Books','Sports','Beauty','Furniture'].map(c=>(
              <li key={c}><button onClick={()=>onNavigate('listing',{category:c})}>{c}</button></li>
            ))}
          </ul>
        </div>
        {/* Account */}
        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><button onClick={()=>onNavigate('profile')}>My Profile</button></li>
            <li><button onClick={()=>onNavigate('orders')}>Orders & Returns</button></li>
            <li><button onClick={()=>onNavigate('login')}>Sign In</button></li>
            <li><button onClick={()=>onNavigate('register')}>Create Account</button></li>
          </ul>
        </div>
        {/* Help */}
        <div className="footer-col">
          <h4>Help</h4>
          <ul>
            <li><button>Contact Us</button></li>
            <li><button>FAQs</button></li>
            <li><button>Shipping Policy</button></li>
            <li><button>Return Policy</button></li>
            <li><button>Privacy Policy</button></li>
          </ul>
        </div>
        {/* Coupons */}
        <div className="footer-col">
          <h4>Offers</h4>
          <ul>
            {[['ANUJ20','20% off (min ₹1000)'],['FIRST10','10% off any order'],['SAVE500','₹500 off (min ₹2000)'],['SHOPZONE','15% off (min ₹5000)']].map(([code,desc])=>(
              <li key={code} style={{marginBottom:12}}>
                <div style={{fontFamily:'monospace',fontSize:12,color:'var(--gold)',fontWeight:700,letterSpacing:1}}>{code}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:2}}>{desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 ShopZone · All rights reserved.</span>
        <span>Made with ❤️ by Anuj · PGDCA 2025–26 · Pt. Neki Ram Sharma Govt. College, Rohtak</span>
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────────────────────
export default function App() {
  const dispatch   = useDispatch();
  const cartCount  = useSelector(selectCount);
  const [page, setPage]       = useState({ name: 'home', params: null });
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, showToast]   = useToast();
  const [dark, setDark]         = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('sz_token');
    if (token) dispatch(fetchMe());
  }, []);

  const navigate = (name, params = null) => {
    setPage({ name, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = useCallback(product => {
    dispatch(addItem({
      id: product._id,
      title: product.title,
      price: product.discountPrice || product.price,
      image: product.images?.[0] || '',
      brand: product.brand,
    }));
    showToast(`✓ "${product.title?.slice(0,40)}…" added to cart`);
  }, [dispatch, showToast]);

  const renderPage = () => {
    switch (page.name) {
      case 'home':         return <HomePage onNavigate={navigate} onAddToCart={handleAddToCart} />;
      case 'listing':      return <ListingPage params={page.params} onNavigate={navigate} onAddToCart={handleAddToCart} />;
      case 'product':      return <ProductDetailPage productId={page.params} onNavigate={navigate} onAddToCart={handleAddToCart} />;
      case 'login':        return <LoginPage onNavigate={navigate} />;
      case 'register':     return <RegisterPage onNavigate={navigate} />;
      case 'checkout':     return <CheckoutPage onNavigate={navigate} showToast={showToast} />;
      case 'orderConfirm': return <OrderConfirmPage orderId={page.params} onNavigate={navigate} />;
      case 'orders':       return <OrdersPage onNavigate={navigate} />;
      case 'profile':      return <ProfilePage onNavigate={navigate} />;
      case 'admin':        return <AdminPage onNavigate={navigate} />;
      default:             return <HomePage onNavigate={navigate} onAddToCart={handleAddToCart} />;
    }
  };

  const isAdmin = page.name === 'admin';

  return (
    <>
      <Navbar
        onNavigate={navigate}
        onCartOpen={() => setCartOpen(true)}
        onSearch={q => navigate('listing', { q })}
        cartCount={cartCount}
        theme={dark ? 'dark' : 'light'}
        onThemeToggle={() => setDark(d => !d)}
      />
      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => navigate('checkout')}
      />
      {renderPage()}
      {!isAdmin && <Footer onNavigate={navigate} />}
      <Toast msg={toastMsg} />
    </>
  );
}
