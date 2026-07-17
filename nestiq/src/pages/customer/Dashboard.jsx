import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyInquiries } from '../../services/inquiryService'
import { getMyVisits } from '../../services/visitService'
import { formatDate, formatPrice } from '../../utils/formatters'
import { properties } from '../../data/properties'
import { getPublicProperties } from '../../services/propertyService'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [inquiries, setInquiries] = useState([])
  const [visits, setVisits]       = useState([])
  const [savedProperties, setSavedProperties] = useState([])

  useEffect(() => {
    getMyInquiries().then(r => setInquiries(r.data || [])).catch(() => {})
    getMyVisits().then(r => setVisits(r.data || [])).catch(() => {})
    
    const wishlistKey = user?.userId ? `nestiq_wishlist_${user.userId}` : 'nestiq_wishlist_guest'

    getPublicProperties()
      .then(res => {
        try {
          const savedIds = JSON.parse(localStorage.getItem(wishlistKey) || '[]').map(Number)
          const allProps = res.data || []
          const matched = allProps.filter(p => savedIds.includes(Number(p.id)))
          setSavedProperties(matched)
        } catch {
          setSavedProperties([])
        }
      })
      .catch(() => {
        try {
          const savedIds = JSON.parse(localStorage.getItem(wishlistKey) || '[]').map(Number)
          const matched = properties.filter(p => savedIds.includes(Number(p.id)))
          setSavedProperties(matched)
        } catch {
          setSavedProperties([])
        }
      })
  }, [user])

  const stats = [
    { icon: '💬', label: 'Inquiries Submitted', value: inquiries.length, sub: `${inquiries.filter(i => i.status === 'NEW').length} awaiting response`, color: 'var(--gold-400)' },
    { icon: '📅', label: 'Visits Scheduled',  value: visits.length, sub: `${visits.filter(v => v.status === 'SCHEDULED').length} upcoming bookings`, color: 'var(--green-600)' },
    { icon: '❤️', label: 'Wishlisted Properties',   value: savedProperties.length, sub: 'Saved for quick view', color: 'var(--green-600)' },
  ]

  const neighborhoodMetrics = [
    { icon: '🏫', name: 'Nearby Academy Rating', rating: '9.4/10', desc: '5 top CBSE schools in 3km' },
    { icon: '🏥', name: 'Emergency Care Access', rating: '8.9/10', desc: 'Trauma specialty care unit 1km' },
    { icon: '🚇', name: 'Transit & Highways', rating: '9.1/10', desc: 'Walkable OMR IT expressway' },
    { icon: '🛡️', name: 'Safety Quotient', rating: '9.6/10', desc: 'Zero incidents recorded last 12mo' }
  ]

  return (
    <DashboardLayout>
      <div className="dashboard-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Welcome back, {user?.name}! 👋</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5 }}>Track your real estate inquiries, schedules, and inspect lifestyle match details.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {stats.map(s => (
          <div 
            key={s.label} 
            className="card" 
            style={{ 
              background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              padding: 24, display: 'flex', alignItems: 'center', gap: 20
            }}
          >
            <div style={{ width: 48, height: 48, background: 'var(--green-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', fontSize: 22, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, margin: '2px 0' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, marginBottom: 32 }} className="dashboard-main-grid">
        
        {/* Left Columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Wishlisted listings */}
          <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ❤️ Wishlisted Properties ({savedProperties.length})
              </h3>
              <Link to="/properties" style={{ fontSize: 13, color: 'var(--green-600)', fontWeight: 700 }}>Browse Listings →</Link>
            </div>
            
            {savedProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>You haven't saved any properties yet.</p>
                <Link to="/properties" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Explore Properties</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {savedProperties.map(p => (
                  <div key={p.id} style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <img src={p.imageUrl || p.image} alt={p.title} style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <Link to={`/properties/${p.id}`} style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {p.title}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        📍 {p.location || p.address}, {p.city} · {p.bhk || p.bedrooms} BHK Setup
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--green-600)', fontSize: 15 }}>
                        {formatPrice(p.price)}
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 9, marginTop: 6 }}>Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Banner alert */}
          <div style={{
            background: 'linear-gradient(135deg, var(--green-900), var(--green-800))',
            borderRadius: 'var(--radius-lg)', padding: '32px 40px', color: 'var(--text-on-dark)', boxShadow: 'var(--shadow-md)',
            position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--gold-400)'
          }}>
            <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: 0.08 }}>🤖</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <h3 style={{ fontSize: 17, color: 'var(--green-300)', fontWeight: 800, margin: 0 }}>Ecosystem Matcher Radar</h3>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(232,245,238,0.85)', lineHeight: 1.6, marginBottom: 24, maxWidth: 480 }}>
              Based on your search filters, we noticed new pricing appreciation drops of 4% in Madurai. Check matches instantly.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/ai-matcher" className="btn btn-gold btn-sm">
                Open AI Matcher
              </Link>
              <Link to="/predict-rent" className="btn btn-ghost btn-sm">
                Rent Predictions
              </Link>
            </div>
          </div>

        </div>

        {/* Right Columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Smart scores neighborhood */}
          <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>📈 Locality Indicators</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>Tamil Nadu sub-market municipal indicators & scores.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {neighborhoodMetrics.map(m => (
                <div key={m.name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'var(--cream-100)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--green-700)' }}>{m.rating}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Inquiries preview */}
          {inquiries.length > 0 && (
            <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
              <div className="flex-between" style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>💬 Inquiries</h3>
                <Link to="/customer/inquiries" style={{ fontSize: 13, color: 'var(--green-600)', fontWeight: 700 }}>All →</Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {inquiries.slice(0, 3).map(inq => (
                  <div key={inq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                        {inq.propertyTitle}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(inq.createdAt)}</div>
                    </div>
                    <span className={`badge ${inq.status === 'RESPONDED' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: 9 }}>
                      {inq.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
      <style>{`
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .dashboard-main-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}