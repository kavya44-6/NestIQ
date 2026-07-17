import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyProperties, getOpenRequests, acceptAssignment } from '../../services/propertyService'
import { getAgentInquiries } from '../../services/inquiryService'
import { getAgentVisits } from '../../services/visitService'
import { StatCardSkeleton } from '../../components/common/SkeletonCard'
import { formatPrice } from '../../utils/formatters'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [tab,          setTab]          = useState('overview')
  const [properties,   setProperties]   = useState([])
  const [inquiries,    setInquiries]    = useState([])
  const [visits,       setVisits]       = useState([])
  const [openRequests, setOpenRequests] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [loadingReqs,  setLoadingReqs]  = useState(false)
  const [accepting,    setAccepting]    = useState(null)
  const [acceptMsg,    setAcceptMsg]    = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getMyProperties(),
      getAgentInquiries(),
      getAgentVisits()
    ]).then(([propRes, inqRes, visitRes]) => {
      setProperties(propRes.data || [])
      setInquiries(inqRes.data || [])
      setVisits(visitRes.data || [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadOpenRequests = () => {
    setLoadingReqs(true)
    getOpenRequests()
      .then(r => setOpenRequests(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingReqs(false))
  }

  useEffect(() => {
    if (tab === 'open-requests') loadOpenRequests()
  }, [tab])

  const handleAccept = async (propertyId) => {
    if (!window.confirm('Accept this property assignment? You will be the managing broker.')) return
    setAccepting(propertyId)
    try {
      await acceptAssignment(propertyId)
      setAcceptMsg('✅ Assignment accepted! Property added to your listings.')
      setOpenRequests(prev => prev.filter(p => p.id !== propertyId))
      getMyProperties().then(r => setProperties(r.data || [])).catch(() => {})
    } catch {
      setAcceptMsg('❌ Could not accept assignment — please try again.')
    } finally {
      setAccepting(null)
      setTimeout(() => setAcceptMsg(''), 4000)
    }
  }

  const stats = [
    { icon: '🏠', label: 'My Listings',    value: properties.length, sub: 'Active representations', color: 'var(--green-600)' },
    { icon: '💬', label: 'New Inquiries',   value: inquiries.filter(i => i.status === 'NEW').length, sub: 'Awaiting response', color: 'var(--gold-400)' },
    { icon: '📅', label: 'Upcoming Visits', value: visits.filter(v => v.status === 'SCHEDULED').length, sub: 'Inspections scheduled', color: 'var(--green-600)' },
    { icon: '✅', label: 'Deals Closed',       value: inquiries.filter(i => i.status === 'RESPONDED').length, sub: 'Responded threads', color: 'var(--green-600)' },
  ]

  return (
    <DashboardLayout>
      <div className="dashboard-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Welcome back, {user?.name}! 👋</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5 }}>Manage your listings, coordinate inspections, and answer client inquiries.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'overview',       label: '📊 Workspace Overview' },
          { key: 'open-requests',  label: `🏡 Open Owner Requests${openRequests.length > 0 ? ` (${openRequests.length})` : ''}` },
        ].map(t => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key)} 
            style={{
              padding: '12px 24px', border: 'none', background: 'transparent',
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--green-700)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '3px solid var(--green-600)' : '3px solid transparent',
              cursor: 'pointer', fontSize: 14, marginBottom: -2,
              transition: 'all 0.25s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              stats.map(c => (
                <div 
                  key={c.label} 
                  className="card" 
                  style={{ 
                    background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                    padding: 20, display: 'flex', alignItems: 'center', gap: 16
                  }}
                >
                  <div style={{ width: 44, height: 44, background: 'var(--green-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', fontSize: 20, flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, margin: '2px 0' }}>{c.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.sub}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }} className="dashboard-main-grid">
            
            {/* Left overview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Quick Actions */}
              <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {[
                    { href: '/agent/properties', label: '🏠 Manage Listings', desc: `${properties.length} active listings` },
                    { href: '/agent/inquiries',  label: '💬 Client Messages',  desc: `${inquiries.filter(i=>i.status==='NEW').length} unread threads` },
                    { href: '/agent/visits',     label: '📅 Manage Visits',   desc: `${visits.filter(v=>v.status==='SCHEDULED').length} inspections booked` },
                  ].map(q => (
                    <Link 
                      key={q.href} 
                      to={q.href} 
                      className="card" 
                      style={{ 
                        textDecoration: 'none', padding: 20, border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', transition: 'var(--transition-smooth)',
                        background: 'var(--cream-100)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-300)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, fontSize: 14 }}>{q.label}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{q.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Performance Scorecard */}
              <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>📊 Broker Performance Scorecard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {[
                    { title: 'Response Rate', value: '98.8%', desc: 'Threshold 1hr', color: 'var(--green-700)' },
                    { title: 'Customer Rating', value: '4.95 / 5', desc: '48 visit ratings', color: 'var(--green-700)' },
                    { title: 'Est. Commission', value: '₹1.85 Lakh', desc: 'Pipeline volume', color: 'var(--green-700)' },
                    { title: 'Avg Closure Time', value: '4.5 Days', desc: 'Top tier closure', color: 'var(--gold-400)' }
                  ].map(card => (
                    <div key={card.title} style={{ padding: 16, background: 'var(--cream-100)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6 }}>{card.title}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: card.color, marginBottom: 2 }}>{card.value}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{card.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Nudge Alert */}
              <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>🏡 Open Landlord Requests</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                  Property owners have listed listings and are seeking brokers to coordinate visits. Claim management rights to earn brokerage fees.
                </p>
                <button 
                  className="btn btn-sm" 
                  style={{ background: '#d97706', color: 'var(--text-on-dark)', border: 'none', padding: '10px 18px', width: '100%', justifyContent: 'center' }}
                  onClick={() => setTab('open-requests')}
                >
                  Inspect Open Stream →
                </button>
              </div>

              {/* Recent Inquiries preview */}
              {inquiries.length > 0 && (
                <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
                  <div className="flex-between" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Recent Inquiries</h3>
                    <Link to="/agent/inquiries" style={{ fontSize: 13, color: 'var(--green-600)', fontWeight: 700 }}>View All →</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inquiries.slice(0, 3).map(inq => (
                      <div key={inq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{inq.customerName || 'Client lister'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{inq.propertyTitle || `Listing #${inq.propertyId}`}</div>
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
        </>
      )}

      {/* Open requests tab */}
      {tab === 'open-requests' && (
        <>
          {acceptMsg && (
            <div className={`alert ${acceptMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
              {acceptMsg}
            </div>
          )}

          <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 28, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            💡 <strong>Ecosystem Rules:</strong> Property listings under this tab are looking for representation. Accepting claims managing agent rights. Owners receive automated email alerts.
          </div>

          {loadingReqs ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : openRequests.length === 0 ? (
            <div className="empty-state" style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '64px 20px' }}>
              <div className="empty-icon" style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No pending assignments at this time.</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '8px auto 0' }}>All landlord requests have been claimed by brokers. Check back soon for new property postings.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
              {openRequests.map(p => (
                <div 
                  key={p.id} 
                  className="card"
                  style={{ 
                    background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
                    padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {(p.imageUrl || p.image) && (
                    <img 
                      src={p.imageUrl || p.image} 
                      alt={p.title}
                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                      onError={e => { e.target.style.display = 'none' }} 
                    />
                  )}

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>{p.title}</h4>
                      <span className="badge badge-gold" style={{ fontSize: 10 }}>Open</span>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                      📍 {p.address || p.location || p.city}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                      {(p.bedrooms || p.bhk) && (
                        <span style={{ fontSize: 11, background: 'var(--cream-200)', padding: '4px 10px', borderRadius: 999, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          🛏️ {p.bedrooms || p.bhk} BHK
                        </span>
                      )}
                      {p.area && (
                        <span style={{ fontSize: 11, background: 'var(--cream-200)', padding: '4px 10px', borderRadius: 999, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          📐 {p.area} sqft
                        </span>
                      )}
                      {p.propertyType && (
                        <span style={{ fontSize: 11, background: 'var(--cream-200)', padding: '4px 10px', borderRadius: 999, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          🏗️ {p.propertyType}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-600)', marginBottom: 14 }}>
                      {formatPrice(p.price)}
                      {p.listingType === 'RENT' && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>}
                    </div>

                    {/* Owner Card details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--green-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--green-100)' }}>
                      <span style={{ fontSize: 20 }}>🏡</span>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Landlord</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.ownerName || 'Direct Owner'}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleAccept(p.id)}
                    disabled={accepting === p.id}
                    style={{ marginTop: 'auto', padding: '12px' }}
                  >
                    {accepting === p.id ? '⏳ Claiming Rights...' : '✅ Accept Management'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <style>{`
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .dashboard-main-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}