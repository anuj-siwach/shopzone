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
  const img  = images?.[0] || `https://placehold.co/200x200/EAEDED/333?text=${encodeURIComponent(brand||'Product')}`;

  return (
    <div className="p-card" onClick={() => onNavigate('product', _id)}>
      {disc > 0 && <span className="badge-disc">-{disc}%</span>}
      {isPrime && <span className="badge-prime">prime</span>}
      <img src={img} alt={title} className="p-img" onError={e => { e.target.src = `https://placehold.co/200x200/EAEDED/333?text=Product`; }} />
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
// NAVBAR
// ──────────────────────────────────────────────────────────────
function Navbar({ onNavigate, onCartOpen, onSearch, cartCount }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [q, setQ] = useState('');

  return (
    <>
      <nav className="navbar-top">
        <div className="logo" onClick={() => onNavigate('home')}>shop<span>Zone</span></div>
        <div className="search-bar">
          <select defaultValue="All"><option>All</option><option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option><option>Books</option><option>Sports</option></select>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearch(q)} placeholder="Search products, brands…" />
          <button onClick={() => onSearch(q)}>🔍</button>
        </div>
        <div className="nav-actions">
          {user
            ? <button className="nav-btn" onClick={() => onNavigate('profile')}><small>Hello, {user.name?.split(' ')[0]}</small><strong>Account</strong></button>
            : <button className="nav-btn" onClick={() => onNavigate('login')}><small>Hello, Sign in</small><strong>Account &amp; Lists ▾</strong></button>
          }
          <button className="nav-btn" onClick={() => onNavigate('orders')}><small>Returns</small><strong>&amp; Orders</strong></button>
          {user?.role === 'admin' && <button className="nav-btn" onClick={() => onNavigate('admin')} style={{color:'#FF9900'}}>Admin</button>}
          {user && <button className="nav-btn" onClick={() => dispatch(logout())}>Logout</button>}
          <button className="nav-btn cart-btn" onClick={onCartOpen}>
            🛒<span className="cart-badge">{cartCount}</span><strong>Cart</strong>
          </button>
        </div>
      </nav>
      <div className="navbar-sub">
        {['☰ All','Electronics','Fashion','Home & Kitchen','Books','Sports','Toys & Games','Deals 🔥'].map(item => (
          <button key={item} className="sub-item" onClick={() => {
            if (item === '☰ All') onNavigate('home');
            else if (!item.includes('🔥') && !item.includes('☰')) onNavigate('listing', { category: item.replace(' & Kitchen','').replace(' & Games','') });
          }}>{item}</button>
        ))}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// HERO SLIDER
// ──────────────────────────────────────────────────────────────
function Hero({ onNavigate }) {
  const [idx, setIdx] = useState(0);
  const slides = [
    { cls: 's0', badge: 'NEW ARRIVALS', title: 'The Future of Electronics', sub: 'Discover latest phones, laptops & more — up to 40% off', cta: 'Shop Electronics', cat: 'Electronics' },
    { cls: 's1', badge: 'FLASH SALE', title: 'Fashion That Speaks Volumes', sub: 'Trending styles from top brands at unbeatable prices', cta: 'Explore Fashion', cat: 'Fashion' },
    { cls: 's2', badge: 'BEST SELLERS', title: 'Transform Your Home & Kitchen', sub: 'Premium home essentials with free delivery above ₹499', cta: 'Shop Home', cat: 'Home' },
  ];
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const go = d => setIdx(i => (i + d + slides.length) % slides.length);

  return (
    <div className="hero">
      <div className="hero-slides" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={i} className={`hero-slide ${s.cls}`}>
            <div className="hero-content">
              <div className="hero-badge">{s.badge}</div>
              <h1 className="hero-title">{s.title}</h1>
              <p className="hero-sub">{s.sub}</p>
              <button className="hero-cta" onClick={() => onNavigate('listing', { category: s.cat })}>{s.cta} →</button>
            </div>
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
      <div className="container page-content">
        <div className="deal-strip">
          <div className="deal-title">Today's<br /><span>Deals</span></div>
          {dealItems.map(d => (
            <div key={d.label} className="deal-item" onClick={() => onNavigate('listing', { category: d.cat })}>
              <div className="deal-item-img">{d.emoji}</div>
              <div className="deal-item-lbl">{d.label}</div>
              <div className="deal-item-off">{d.off}</div>
            </div>
          ))}
        </div>
        <Section title="🔌 Electronics — Best Sellers" key2="electronics" cat="Electronics" />
        <Section title="👗 Fashion — Top Picks" key2="fashion" cat="Fashion" />
        <Section title="🏠 Home & Kitchen" key2="home" cat="Home & Kitchen" />
        <Section title="📚 Books" key2="books" cat="Books" />
      </div>
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

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await dispatch(loginUser(form));
    if (!res.error) onNavigate('home');
  };

  return (
    <div className="container page-content">
      <div className="form-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="logo" style={{ display: 'inline', fontSize: 28 }}>shop<span>Zone</span></div>
        </div>
        <h2>Sign In</h2>
        <p>Access your account</p>
        {error && <div className="form-err">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required placeholder="you@email.com" /></div>
          <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required placeholder="••••••••" /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <button className="form-link" onClick={() => onNavigate('register')}>New customer? Create account →</button>
        <button className="form-link" onClick={() => onNavigate('forgot')} style={{ marginTop: 4 }}>Forgot your password?</button>
      </div>
    </div>
  );
}

// Import loginUser from slice
import { loginUser } from './store/userSlice';

// ──────────────────────────────────────────────────────────────
// REGISTER PAGE — No OTP, direct login after registration
// ──────────────────────────────────────────────────────────────
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
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required placeholder="Anuj Siwach" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required placeholder="you@email.com" />
          </div>
          <div className="form-group">
            <label>Mobile (optional)</label>
            <input value={form.mobile} onChange={e => setForm(f=>({...f,mobile:e.target.value}))} placeholder="9876543210" />
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
    <div className="container page-content" style={{ maxWidth: 700, margin: '40px auto' }}>
      <div className="section" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: 'var(--green)', fontSize: 26, marginBottom: 8 }}>Order Placed Successfully!</h2>
        {order && (
          <>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>Order ID: <strong>#{order._id}</strong></p>
            <div style={{ background: 'var(--gray)', borderRadius: 6, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < order.items.length-1 ? '1px solid #eee' : 'none', fontSize: 13 }}>
                  <span>{item.title} × {item.qty}</span><span style={{fontWeight:700}}>{fmt(item.price*item.qty)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 10, fontSize: 15 }}>
                <span>Total</span><span>{fmt(order.totalAmount)}</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--navy)', fontWeight: 600 }}>
              🚚 Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button className="btn-primary" style={{width:'auto',padding:'10px 24px'}} onClick={() => onNavigate('home')}>Continue Shopping</button>
          <button className="btn-secondary" style={{width:'auto',padding:'10px 24px'}} onClick={() => onNavigate('orders')}>View Orders</button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ORDERS PAGE
// ──────────────────────────────────────────────────────────────
function OrdersPage({ onNavigate }) {
  const user = useSelector(selectUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return onNavigate('login');
    api.get('/api/orders/my').then(r => setOrders(r.data.orders || [])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  return (
    <div className="container page-content">
      <h2 style={{ marginBottom: 20 }}>Your Orders</h2>
      {loading ? <div className="spinner" /> : orders.length === 0
        ? <div style={{textAlign:'center',padding:60,color:'#888'}}>No orders yet.<br/><button className="see-all" onClick={()=>onNavigate('home')}>Start Shopping</button></div>
        : orders.map(o => (
          <div key={o._id} className="section" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>ORDER ID</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>#{o._id}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Placed: {new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <div>
                <span className={`status-badge status-${o.status}`}>{o.status.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(o.totalAmount)}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {o.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <img src={item.image || 'https://placehold.co/40x40/eee/333?text=P'} alt="" style={{width:40,height:40,objectFit:'contain',border:'1px solid #eee',borderRadius:4}} onError={e=>e.target.src='https://placehold.co/40x40/eee/333?text=P'} />
                  <span>{item.title?.slice(0,30)}… ×{item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      }
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
// FOOTER
// ──────────────────────────────────────────────────────────────
function Footer({ onNavigate }) {
  return (
    <footer>
      <div className="footer-top" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>▲ Back to top</div>
      <div className="footer-grid">
        <div className="footer-col"><h4>Get to Know Us</h4><a>About ShopZone</a><a>Careers</a><a>Press</a><a>Blog</a></div>
        <div className="footer-col"><h4>Make Money with Us</h4><a>Sell Products</a><a>Become Affiliate</a><a>Advertise</a><a>Fulfilment</a></div>
        <div className="footer-col"><h4>Payment Products</h4><a>ShopZone Pay</a><a>EMI Options</a><a>Gift Cards</a><a>Reload Balance</a></div>
        <div className="footer-col">
          <h4>Let Us Help You</h4>
          <a onClick={() => onNavigate('orders')}>Your Orders</a>
          <a onClick={() => onNavigate('profile')}>Your Account</a>
          <a>Returns Centre</a>
          <a>Customer Service</a>
        </div>
      </div>
      <div className="footer-bottom">
        <div style={{marginBottom:8}}>
          <span className="logo" style={{fontSize:20,display:'inline'}}>shop<span>Zone</span></span>
        </div>
        <div>Developer: Anuj | anujsiwach002@gmail.com | +91 7015542002</div>
        <div style={{marginTop:4}}>Pt. Neki Ram Sharma Govt. College, Rohtak | PGDCA 2025–26</div>
        <div style={{marginTop:4,color:'#666'}}>© 2026 ShopZone — Academic Project</div>
      </div>
    </footer>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN APP ROUTER
// ──────────────────────────────────────────────────────────────
export default function App() {
  const dispatch   = useDispatch();
  const cartCount  = useSelector(selectCount);
  const [page, setPage]       = useState({ name: 'home', params: null });
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, showToast]   = useToast();

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
