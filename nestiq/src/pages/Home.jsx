import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PropertyCard from '../components/property/PropertyCard'
import { getPublicProperties } from '../services/propertyService'
import { featuredProperties, properties as seedProperties } from '../data/properties'
import { getAllMockProperties } from '../mock/mockStore'

const FEATURES = [
  { icon: '🛡️', title: '5-Point Trust System', desc: "We algorithmic evaluate every listing based on doc validity, pricing consistency, and owner history." },
  { icon: '💼', title: 'Verified Brokers',     desc: 'Work with background-verified real estate experts with official state credentials.' },
  { icon: '📅', title: 'Visit Scheduler',    desc: 'Book secure on-site inspections directly. Time slots are confirmed within 24 hours.' },
  { icon: '🔮', title: 'AI Rent Predictor',      desc: 'Get data-backed rental valuation projections using real-time local sub-market analytics.' },
  { icon: '🤖', title: 'AI Matching Desk', desc: 'Rank listings instantly using personalized lifestyle, budget constraints, and family sizes.' },
]

export default function Home() {
  const [featured, setFeatured]             = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [searchCity, setSearchCity]         = useState('')
  const [searchType, setSearchType]         = useState('SALE') // default to buy tab
  const [stats, setStats] = useState([
    { value: '—', label: 'Active Listings' },
    { value: '—', label: 'Cities Covered' },
    { value: '—', label: 'Verified Agents' },
  ])

  useEffect(() => {
    getPublicProperties()
      .then(res => {
        const data = res.data?.content || res.data || []
        setFeatured(data.length > 0 ? data.slice(0, 6) : featuredProperties)
        if (Array.isArray(data) && data.length > 0) {
          setStats([
            { value: data.length + '+', label: 'Active Listings' },
            { value: [...new Set(data.map(p => p.city).filter(Boolean))].length + '', label: 'Cities Covered' },
            { value: [...new Set(data.map(p => p.agentName || p.agentEmail).filter(Boolean))].length + '+', label: 'Verified Agents' },
          ])
        }
      })
      .catch(() => {
        setFeatured(featuredProperties)
      })
      .finally(() => setLoadingFeatured(false))
  }, [])

  return (
    <MainLayout>
      {/* Immersive Luxury Hero */}
      <section 
        style={{
          minHeight: '92vh',
          background: 'radial-gradient(circle at top right, var(--green-800) 0%, var(--green-900) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '120px 24px 80px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="hero-glow-1" style={{ position: 'absolute', top: '-10%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(110,196,143,0.18) 0%, transparent 70%)', pointerEvents: 'none', animation: 'pulse-slow 8s infinite alternate' }} />
        <div className="hero-glow-2" style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,149,42,0.1) 0%, transparent 70%)', pointerEvents: 'none', animation: 'pulse-slow 12s infinite alternate' }} />

        <div style={{ maxWidth: 1000, position: 'relative', zIndex: 5 }}>
          
         

          <h1 style={{ color: 'var(--text-on-dark)', marginBottom: 20, lineHeight: 1.15, fontSize: 'clamp(36px, 7vw, 64px)', fontWeight: 800, letterSpacing: '-1.5px' }}>
            Find Your Absolute Perfect<br />
            <span style={{ color: 'var(--gold-300)', fontStyle: 'italic', fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>Home in Tamil Nadu</span>
          </h1>

          <p style={{ color: 'rgba(232, 245, 238, 0.8)', fontSize: 16, maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.8 }}>
            NestIQ utilizes real-time market indicators and neural recommendation models to connect buyers, owners, and verified brokers under one unified portal.
          </p>

          {/* Premium Tabbed Search Console */}
          <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', padding: 8, boxShadow: 'var(--shadow-lg)', maxWidth: 780, margin: '0 auto 48px', border: '1px solid rgba(20, 61, 38, 0.08)' }}>
            
            {/* Search Tabs */}
            <div style={{ display: 'flex', gap: 4, paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
              {['SALE', 'RENT'].map(type => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: searchType === type ? 'var(--green-600)' : 'transparent',
                    color: searchType === type ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {type === 'SALE' ? 'Buy Property' : 'Rent Property'}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1.5, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }} className="search-field">
                <span style={{ fontSize: 18 }}>📍</span>
                <select 
                  value={searchCity} 
                  onChange={e => setSearchCity(e.target.value)}
                  style={{ width: '100%', padding: '12px 6px', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                >
                  <option value="">Search all Tamil Nadu cities</option>
                  {['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tiruppur','Vellore'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid var(--border)', paddingLeft: 12 }} className="search-field">
                <span style={{ fontSize: 18 }}>🏗️</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {searchType === 'SALE' ? 'Properties for Sale' : 'Properties for Rent'}
                </span>
              </div>

              <Link
                to={`/properties?city=${searchCity}&listingType=${searchType}`}
                className="btn btn-gold"
                style={{ padding: '14px 28px', borderRadius: 'var(--radius-md)' }}
              >
                🔍 Search Listings
              </Link>
            </div>
          </div>

          {/* Social Proof quotes panel */}
          <div className="social-proof-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto 56px' }}>
            {[
              { name: 'Priya Sundar', city: 'Coimbatore', quote: 'Found a verified 2BHK flat in just 48 hours!' },
              { name: 'Karthik Raja', city: 'Chennai', quote: 'Fully digital broker interactions. Extremely smooth.' },
              { name: 'Suresh Mani', city: 'Madurai', quote: 'Direct landlord dashboard was perfect. Highly recommend.' }
            ].map((sp, idx) => (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.06)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '16px 20px', 
                  textAlign: 'left', 
                  borderRadius: 'var(--radius-md)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gold-400)', color: 'var(--text-on-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                    {sp.name[0]}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-on-dark)' }}>
                    {sp.name} <span style={{ color: 'var(--green-300)', fontWeight: 400, fontSize: 11 }}>({sp.city})</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', lineHeight: 1.4 }}>"{sp.quote}"</div>
              </div>
            ))}
          </div>

          {/* Stats Summary Section */}
          <div style={{ display: 'flex', gap: 64, justifyContent: 'center', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32 }}>
            {stats.map(s => (
              <div key={s.label}>
                <div style={{ color: 'var(--text-on-dark)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.5px' }}>{s.value}</div>
                <div style={{ color: 'rgba(232, 245, 238, 0.6)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="section" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Featured Real Estate</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '8px 0 0 16px' }}>
                Handpicked, high-trust listings currently active on the market
              </p>
            </div>
            <Link to="/properties" style={{ color: 'var(--green-600)', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Explore all properties <span>→</span>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="loading-page" style={{ minHeight: 240 }}><div className="spinner" /></div>
          ) : (
            <div className="scroll-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 32 }}>
              {featured.slice(0, 6).map(p => {
                const isAiRecommended = p.trustScore >= 80
                return (
                  <div key={p.id} style={{ position: 'relative' }}>
                    {isAiRecommended && (
                      <span 
                        className="badge badge-green" 
                        style={{ 
                          position: 'absolute', top: -12, right: 24, zIndex: 10, 
                          background: 'var(--green-600)', color: 'var(--text-on-dark)', padding: '6px 14px', 
                          fontSize: 10, fontWeight: 800, border: 'none', boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        🤖 AI PREFERRED
                      </span>
                    )}
                    <PropertyCard property={p} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Structured Pipeline Workflow */}
      <section className="section" style={{ background: 'var(--cream-100)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <h2 className="section-title" style={{ textAlign: 'center', border: 'none', padding: 0 }}>How NestIQ Works</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', padding: 0, marginBottom: 48 }}>The seamless three-stage real estate lifecycle</p>
          
          <div className="step-bar" style={{ marginBottom: 48 }}>
            <div className="step-item">
              <div className="step-dot step-dot-done">1</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Upload Listing</span>
              </div>
              <div className="step-line step-line-done" />
            </div>
            <div className="step-item">
              <div className="step-dot step-dot-active">2</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Broker Match</span>
              </div>
              <div className="step-line" />
            </div>
            <div className="step-item" style={{ flex: 'none' }}>
              <div className="step-dot step-dot-pending">3</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>Secure Closing</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { title: '1. Landlords List', icon: '🏡', desc: 'Owners list properties directly to the open requests stream, selecting direct sell or broker management.' },
              { title: '2. Brokers Accept', icon: '💼', desc: 'Verified agents browse open assignments, claim management rights, and handle visitor queries.' },
              { title: '3. Clients Book', icon: '🔑', desc: 'Customers inspect AI trust scores, book physical visits, and secure contracts digitally.' }
            ].map(w => (
              <div key={w.title} style={{ background: 'var(--cream-100)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{w.icon}</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{w.title}</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proprietary AI Features Showcase */}
      <section className="section" style={{ background: 'var(--green-900)', color: 'var(--text-on-dark)', borderTop: '4px solid var(--gold-400)' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: 'var(--text-on-dark)', textAlign: 'center', border: 'none', padding: 0 }}>Smart Real Estate Core</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: 0, marginBottom: 48 }}>AI features designed to replace blind trust with mathematics</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }} className="ai-features-grid">
            <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🤖</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 10 }}>Semantic AI Matcher</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, flexGrow: 1, marginBottom: 24 }}>
                Enter your lifestyle goals, budget rules, and family sizes. Our vector search engine identifies high-matching layouts and generates personalized text reasoning.
              </p>
              <Link to="/ai-matcher" className="btn btn-gold btn-sm" style={{ alignSelf: 'flex-start' }}>Open AI Matcher →</Link>
            </div>
            <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🛡️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 10 }}>5-Point Trust Scale</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.7, flexGrow: 1, marginBottom: 24 }}>
                We algorithmically score all listings out of 100 based on detail completeness, broker verification status, contact validity, and duplicate listings counts.
              </p>
              <Link to="/properties" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>Inspect Trust Scores →</Link>
            </div>
            <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📈</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 10 }}>Locality Price Analyzer</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.7, flexGrow: 1, marginBottom: 24 }}>
                Evaluates listed rates against historical averages for the city. Instantly flags undervalued properties or overpriced listings to protect capital.
              </p>
              <Link to="/properties" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>Browse Listings →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Cities */}
      <section className="section" style={{ background: 'var(--cream-100)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', border: 'none', padding: 0 }}>Explore Locality Markets</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', padding: 0, marginBottom: 40 }}>Find properties inside active Tamil Nadu urban centers</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
            {[
              { city: 'Chennai',        emoji: '🌆', count: 420 },
              { city: 'Coimbatore',     emoji: '🏙️', count: 310 },
              { city: 'Madurai',        emoji: '🏛️', count: 180 },
              { city: 'Tiruchirappalli',emoji: '🕌', count: 140 },
              { city: 'Salem',          emoji: '🌇', count: 95  },
              { city: 'Tiruppur',       emoji: '🏭', count: 75  },
              { city: 'Vellore',        emoji: '🏰', count: 60  },
            ].map(({ city, emoji, count }) => (
              <Link
                key={city}
                to={`/properties?city=${city}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '24px 16px', background: 'var(--cream-100)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none', transition: 'var(--transition-smooth)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--green-300)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '' }}
              >
                <span style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{city}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{count}+ listings</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Platform Portal Cards */}
      <section className="section" style={{ background: 'var(--cream-200)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', border: 'none', padding: 0 }}>Portal Entryways</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', padding: 0, marginBottom: 48 }}>Gain access to your respective workflow panel</p>
          <div className="grid-3">
            {[
              {
                role: 'Customer Desk', emoji: '👤',
                desc: 'Browse verified listings, schedule visits, send inquiries, and check matching analytics.',
                loginHref: '/customer/login', regHref: '/customer/register',
                color: 'var(--green-600)', bgColor: 'var(--green-50)', quote: 'Booked a visit and finalized flat in 3 days.', author: 'Arjun M., Chennai'
              },
              {
                role: 'Brokerage Desk', emoji: '💼',
                desc: 'Claim open landlord requests, list property files, answer customer inquiries, and schedule inspections.',
                loginHref: '/agent/login', regHref: '/agent/register',
                color: '#d97706', bgColor: 'rgba(217, 119, 6, 0.1)', quote: 'Keeps my broker pipeline filled with high quality requests.', author: 'Sara K., Salem'
              },
              {
                role: 'Landlord Desk', emoji: '🏡',
                desc: 'Upload property directories, assign verified brokers, and monitor visitor engagements.',
                loginHref: '/owner/login', regHref: '/owner/register',
                color: '#7c3aed', bgColor: 'rgba(124, 58, 237, 0.1)', quote: 'Excellent dashboard visibility. Zero hidden charges.', author: 'Ravi T., Madurai'
              },
            ].map(c => (
              <div 
                key={c.role} 
                className="card card-body" 
                style={{ 
                  textAlign: 'center', 
                  border: `1px solid var(--border)`,
                  background: 'var(--cream-100)',
                  transition: 'var(--transition-smooth)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 32
                }}
              >
                <div style={{ width: 64, height: 64, background: c.bgColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px', border: `1px solid ${c.color}20` }}>
                  {c.emoji}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: 'var(--text-primary)' }}>{c.role}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{c.desc}</p>
                <div style={{ background: 'var(--cream-100)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: 12, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  "{c.quote}" — <strong style={{ color: 'var(--text-primary)' }}>{c.author}</strong>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 'auto' }}>
                  <Link to={c.loginHref} className="btn btn-sm" style={{ background: c.color, color: 'var(--text-on-dark)', border: 'none', flex: 1 }}>Sign In</Link>
                  <Link to={c.regHref}   className="btn btn-outline btn-sm" style={{ borderColor: c.color, color: c.color, flex: 1 }}>Join</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Banner */}
      <section className="section" style={{ background: 'var(--green-800)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(110,196,143,0.1) 0%, transparent 60%)' }} />
        <div className="container" style={{ position: 'relative', zIndex: 5 }}>
          <h2 style={{ color: 'var(--text-on-dark)', marginBottom: 16, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, letterSpacing: '-1px' }}>Find Your Ideal Home Today</h2>
          <p style={{ color: 'rgba(232, 245, 238, 0.75)', marginBottom: 36, fontSize: 16, maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Discover smart, verified properties or list your layouts on Tamil Nadu's fastest growing brokerage network.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/properties" className="btn btn-gold btn-lg">Browse Listings</Link>
            <Link to="/ai-matcher" className="btn btn-ghost btn-lg">✨ AI Matcher</Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.05); opacity: 1; }
        }
        @media (max-width: 768px) {
          .social-proof-grid, .ai-features-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .scroll-container {
            display: flex !important;
            overflow-x: auto;
            flex-wrap: nowrap;
            gap: 16px;
            scroll-snap-type: x mandatory;
            padding-bottom: 12px;
          }
          .scroll-container > div {
            min-width: 300px;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </MainLayout>
  )
}