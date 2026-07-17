// src/pages/agent/MyProperties.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import PropertyTable from '../../components/property/PropertyTable'
import { getMyProperties, deleteProperty, markPropertyStatus } from '../../services/propertyService'

export default function MyProperties() {
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null) // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchProperties = () => {
    getMyProperties()
      .then(r => setProperties(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProperties() }, [])

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return
    try {
      await deleteProperty(id)
      setProperties(prev => prev.filter(p => String(p.id) !== String(id)))
      showToast('success', 'Property deleted.')
    } catch {
      showToast('error', 'Could not delete — please try again.')
    }
  }

  // ── Mark SOLD / RENTED ────────────────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    const prop  = properties.find(p => String(p.id) === String(id))
    const label = status === 'SOLD' ? 'Sold' : 'Rented'

    if (!window.confirm(
      `Mark "${prop?.title || 'this property'}" as ${label}?\n\n` +
      `It will be removed from public listings and no new inquiries will be accepted.`
    )) return

    try {
      await markPropertyStatus(id, status)
      // Optimistic update — no need to refetch
      setProperties(prev =>
        prev.map(p => String(p.id) === String(id) ? { ...p, status } : p)
      )
      showToast('success', `"${prop?.title}" has been marked as ${label}.`)
    } catch {
      showToast('error', `Could not mark as ${label} — please try again.`)
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header flex-between">
        <div>
          <h2>My Properties</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {properties.length} listing{properties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/agent/add" className="btn btn-gold">+ Add Property</Link>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: 16 }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Legend */}
      {!loading && properties.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          marginBottom: 16, padding: '8px 14px',
          background: 'var(--cream-100)', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)',
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quick actions:</span>
          <span>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', marginRight: 4 }} />
            Mark Sold — removes from public listings
          </span>
          <span>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#0369a1', marginRight: 4 }} />
            Mark Rented — removes from public listings
          </span>
        </div>
      )}

      {loading
        ? <div className="loading-page"><div className="spinner" /></div>
        : (
          <PropertyTable
            properties={properties}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )
      }
    </DashboardLayout>
  )
}