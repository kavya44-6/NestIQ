// src/pages/owner/OwnerProperties.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { getOwnerProperties } from '../../services/ownerService'
import { STATUS_BADGE, resolveStatusKey, StatusBadge } from '../../components/property/PropertyTable'

// ── Agent assignment panel ────────────────────────────────────────────────────
function AgentPanel({ p }) {
  const isAssigned = !!(p.agentId || p.agentRequestStatus === 'ASSIGNED')
  const isSelfSell = p.agentRequestStatus === 'SELF_SELL'

  if (isAssigned && p.agentName) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 180 }}>
        <span className="badge badge-green" style={{ fontSize: 12 }}>
          🟢 Agent Assigned
        </span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>
          {p.agentName}
        </div>
        {p.agentPhone && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            📞 {p.agentPhone}
          </div>
        )}
        {p.agentEmail && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            ✉️ {p.agentEmail}
          </div>
        )}
      </div>
    )
  }

  if (isSelfSell) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 180 }}>
        <span style={{
          fontSize: 12, background: 'var(--cream-200)', color: 'var(--text-secondary)',
          borderRadius: 999, padding: '3px 10px', fontWeight: 600,
        }}>
          🔵 Self Managing
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 180 }}>
      <span className="badge badge-gold" style={{ fontSize: 12 }}>
        ⏳ Awaiting Agent
      </span>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', maxWidth: 160, lineHeight: 1.4 }}>
        Agents can see this listing and accept the assignment.
      </div>
    </div>
  )
}

// ── Activity summary (shown once an agent is assigned) ───────────────────────
function ActivitySummary({ p }) {
  const isAssigned = !!(p.agentId || p.agentRequestStatus === 'ASSIGNED')
  if (!isAssigned) return null
  return (
    <div style={{
      marginTop: 14, padding: '10px 14px',
      background: 'var(--green-50)', borderRadius: 'var(--radius-sm)',
      display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13,
    }}>
      <span>💬 Inquiries: <strong>{p.inquiryCount || 0}</strong></span>
      <span>📅 Visits: <strong>{p.visitCount || 0}</strong></span>
      <span>📨 Agent messages: <strong>{p.messageCount || 0}</strong></span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OwnerProperties() {
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    getOwnerProperties()
      .then(r => setProperties(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="dashboard-header flex-between">
        <div>
          <h2>My Properties</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} — agents manage inquiries and visits on your behalf
          </p>
        </div>
        <Link to="/owner/add-property" className="btn btn-gold">+ Add Property</Link>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <p>No properties listed yet.</p>
          <Link to="/owner/add-property" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 12 }}>
            + Add Your First Property
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {properties.map(p => {
            const statusKey = resolveStatusKey(p)
            const badge     = STATUS_BADGE[statusKey] || STATUS_BADGE.PENDING_APPROVAL

            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--cream-100)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  padding: 20,
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', flexWrap: 'wrap', gap: 16,
                }}>
                  {/* ── Left: image + property details ── */}
                  <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
                    <Link to={`/properties/${p.id}`}>
                      <img
                        src={p.imageUrl || p.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=120&q=80'}
                        alt={p.title}
                        style={{ width: 100, height: 100, borderRadius: 'var(--radius-md)', objectFit: 'cover', display: 'block', border: '1px solid var(--border)' }}
                      />
                    </Link>
                    <div style={{ flex: 1 }}>
                      <Link to={`/properties/${p.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                          {p.title}
                        </div>
                      </Link>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                        📍 {p.address || p.location || p.city}
                        {(p.bedrooms || p.bhk) ? ` · ${p.bedrooms || p.bhk}BHK` : ''}
                        {p.propertyType ? ` · ${p.propertyType}` : ''}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-600)', marginBottom: 10 }}>
                        ₹{Number(p.price).toLocaleString('en-IN')}
                        {p.listingType === 'RENT' && (
                          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
                        )}
                      </div>

                    {/* ── Status + trust score badges — uses shared STATUS_BADGE ── */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <StatusBadge property={p} />
                      {p.trustScore != null && (
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: p.trustScore >= 80 ? 'var(--green-600)' : p.trustScore >= 60 ? 'var(--gold-400)' : '#dc2626',
                        }}>
                          Trust: {Number(p.trustScore).toFixed(0)}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                  {/* ── Right: agent assignment panel ── */}
                  <AgentPanel p={p} />
                </div>

                {/* ── Activity summary strip ── */}
                <ActivitySummary p={p} />
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}