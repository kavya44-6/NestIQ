import { Link } from 'react-router-dom'
import TrustBadge from './TrustBadge'
import { formatPrice } from '../../utils/formatters'

// ── Canonical status badge mapping — single source of truth for ALL property views ──
export const STATUS_BADGE = {
  AVAILABLE:        { label: 'Available',       cls: 'badge-green' },
  ACTIVE:           { label: 'Live',            cls: 'badge-green' },
  PENDING_AGENT:    { label: 'Awaiting Agent',  cls: 'badge-gold'  },
  PENDING_APPROVAL: { label: 'Pending Approval',cls: 'badge-gold'  },
  SOLD:             { label: 'Sold',            cls: 'badge-gray'  },
  RENTED:           { label: 'Rented',          cls: 'badge-gray'  },
  REJECTED:         { label: 'Rejected',        cls: 'badge-red'   },
}

/**
 * Resolves the canonical status key for a property.
 * Handles the legacy boolean `approved` field for older records.
 */
export function resolveStatusKey(p) {
  if (p.status && STATUS_BADGE[p.status]) return p.status
  if (p.approved === true)  return 'ACTIVE'
  return 'PENDING_APPROVAL'
}

/**
 * Renders a consistent status badge span.
 * Import this wherever a status badge is needed instead of inline logic.
 */
export function StatusBadge({ property, style = {} }) {
  const key   = resolveStatusKey(property)
  const badge = STATUS_BADGE[key] || STATUS_BADGE.PENDING_APPROVAL
  return (
    <span className={`badge ${badge.cls}`} style={style}>
      {badge.label}
    </span>
  )
}

// ── Table component ───────────────────────────────────────────────────────────

export default function PropertyTable({
  properties = [],
  onDelete,
  onStatusChange,   // NEW: (id, status) => void — for SOLD/RENTED actions
  showApprove,
  onApprove,
  onReject,
}) {
  if (!properties.length)
    return (
      <div className="empty-state" style={{ padding: '64px 20px', background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="empty-icon" style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No pending assignments at this time.</p>
      </div>
    )

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>City</th>
            <th>Price</th>
            <th>Type</th>
            <th>Status</th>
            <th>Trust Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(p => (
            <tr key={p.id}>
              <td style={{ maxWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Link to={`/properties/${p.id}`}>
                    <img
                      src={p.imageUrl || p.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&q=80'}
                      alt={p.title}
                      style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover', display: 'block', border: '1px solid var(--border)' }}
                    />
                  </Link>
                  <Link
                    to={`/properties/${p.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}
                  >
                    {p.title}
                  </Link>
                </div>
              </td>
              <td>{p.city}</td>
              <td style={{ fontWeight: 600, color: 'var(--green-600)' }}>{formatPrice(p.price)}</td>
              <td>
                <span className={`badge badge-${p.listingType === 'SALE' ? 'sale' : 'rent'}`}>
                  {p.listingType}
                </span>
              </td>
              <td>
                {/* Uses canonical StatusBadge — no ad-hoc badge logic */}
                <StatusBadge property={p} />
              </td>
              <td>
                <div className="trust-bar-wrap">
                  <div className="trust-bar-track">
                    <div
                      className={`trust-bar-fill ${
                        p.trustScore >= 80 ? 'trust-high' :
                        p.trustScore >= 60 ? 'trust-mid'  : 'trust-low'
                      }`}
                      style={{ width: `${p.trustScore || 0}%` }}
                    />
                  </div>
                  <TrustBadge score={p.trustScore} />
                </div>
              </td>
              <td>
                <div className="table-actions">
                  {showApprove ? (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => onApprove(p.id)}>Approve</button>
                      <button className="btn btn-danger btn-sm"  onClick={() => onReject(p.id)}>Reject</button>
                    </>
                  ) : (
                    <>
                      <Link to={`/agent/edit/${p.id}`} className="btn btn-outline btn-sm">Edit</Link>

                      {/* SOLD / RENTED quick-actions — Task H */}
                      {onStatusChange && p.status !== 'SOLD' && p.status !== 'RENTED' && (
                        <>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'var(--green-600)', color: 'var(--text-on-dark)', border: 'none',
                              padding: '5px 10px', fontSize: 11, fontWeight: 700,
                              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            }}
                            onClick={() => onStatusChange(p.id, 'SOLD')}
                          >
                            Mark Sold
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'var(--green-600)', color: 'var(--text-on-dark)', border: 'none',
                              padding: '5px 10px', fontSize: 11, fontWeight: 700,
                              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            }}
                            onClick={() => onStatusChange(p.id, 'RENTED')}
                          >
                            Mark Rented
                          </button>
                        </>
                      )}

                      {onDelete && (
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(p.id)}>
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}