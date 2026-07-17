import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getOwnerDashboard, getOwnerProperties, getOwnerInquiries, getOwnerMessages } from '../../services/ownerService'
import { formatDate, formatPrice } from '../../utils/formatters'
import { StatusBadge } from '../../components/property/PropertyTable'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const [stats,      setStats]      = useState({ totalProperties: 0, totalInquiries: 0, totalVisits: 0, pendingMessages: 0 })
  const [properties, setProperties] = useState([])
  const [inquiries,  setInquiries]  = useState([])
  const [messages,   setMessages]   = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      getOwnerDashboard().then(r => setStats(r.data || {})),
      getOwnerProperties().then(r => setProperties(r.data || [])),
      getOwnerInquiries().then(r => setInquiries(r.data || [])),
      getOwnerMessages().then(r => setMessages(r.data || [])),
    ]).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { icon: '🏠', label: 'My Properties',    value: stats.totalProperties,  sub: 'Properties listed', color: 'var(--green-600)' },
    { icon: '💬', label: 'Total Inquiries',   value: stats.totalInquiries,   sub: 'Client contacts', color: 'var(--green-600)' },
    { icon: '📅', label: 'Total Visits',      value: stats.totalVisits,      sub: 'Inspections scheduled', color: 'var(--gold-400)'  },
    { icon: '📨', label: 'Pending Messages',  value: stats.pendingMessages,  sub: stats.pendingMessages > 0 ? 'Action required' : 'Clear inbox', color: stats.pendingMessages > 0 ? '#dc2626' : 'var(--green-600)' },
  ]

  if (loading) return <DashboardLayout><div className="loading-page"><div className="spinner" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="dashboard-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Welcome back, {user?.name}! 🏡</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14.5 }}>Monitor your listed real estate assets, check tenant inquiries, and reply to managing brokers.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        {statCards.map(c => (
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
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }} className="dashboard-main-grid">
        
        {/* Left Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Quick Actions */}
          <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { href: '/owner/properties', label: '🏠 My Listings', desc: `${properties.length} active listings` },
                { href: '/owner/inquiries',  label: '💬 Tenant Inquiries', desc: `${inquiries.length} customer messages` },
                { href: '/owner/messages',   label: '📨 Broker Chat', desc: stats.pendingMessages > 0 ? `⚠️ ${stats.pendingMessages} new threads` : 'No unread messages' },
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

          {/* Properties preview list */}
          {properties.length > 0 && (
            <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
              <div className="flex-between" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>My Listings</h3>
                <Link to="/owner/properties" style={{ fontSize: 13, color: 'var(--green-600)', fontWeight: 700 }}>View All →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {properties.slice(0, 3).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        📍 {p.city} · {p.bedrooms || p.bhk} BHK · <strong>{formatPrice(p.price)}</strong>
                      </div>
                    </div>
                    <StatusBadge property={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Pending broker requests alert */}
          {messages.filter(m => m.status === 'PENDING').length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, color: '#991b1b', fontWeight: 800, margin: 0 }}>⚠️ Pending Broker Requests</h3>
                <Link to="/owner/messages" style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>All →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {messages.filter(m => m.status === 'PENDING').slice(0, 2).map(msg => (
                  <div key={msg.id} style={{ paddingBottom: 12, borderBottom: '1px solid rgba(153,27,27,0.1)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#991b1b' }}>{msg.agentName} regarding {msg.propertyTitle}</div>
                    <div style={{ fontSize: 12.5, color: '#7f1d1d', marginTop: 4, fontStyle: 'italic' }}>"{msg.agentMessage?.substring(0, 80)}..."</div>
                    <div style={{ fontSize: 10.5, color: '#b91c1c', marginTop: 6 }}>{formatDate(msg.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Customer Inquiries */}
          {inquiries.length > 0 && (
            <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
              <div className="flex-between" style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Recent Inquiries</h3>
                <Link to="/owner/inquiries" style={{ fontSize: 13, color: 'var(--green-600)', fontWeight: 700 }}>View All →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {inquiries.slice(0, 3).map(inq => (
                  <div key={inq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{inq.customerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{inq.propertyTitle} · {formatDate(inq.createdAt)}</div>
                    </div>
                    <span className={`badge ${inq.status === 'RESPONDED' ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: 9 }}>{inq.status}</span>
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