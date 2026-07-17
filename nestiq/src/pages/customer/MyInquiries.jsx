import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/axiosConfig'
import { formatDate } from '../../utils/formatters'

export default function MyInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetchData = (isSilent = false) => {
      if (!isSilent) setLoading(true)
      api.get('/inquiries/my')
        .then(r => {
          setInquiries(r.data || [])
        })
        .catch(() => {})
        .finally(() => {
          if (!isSilent) setLoading(false)
        })
    }

    fetchData(false)
    const interval = setInterval(() => {
      fetchData(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>My Inquiries</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Track all inquiries you've sent to agents</p>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : inquiries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>You haven't sent any inquiries yet.</p>
          <Link to="/properties" className="btn btn-primary">Browse Properties</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {inquiries.map(inq => (
            <div key={inq.id} style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700 }}>
                    <Link to={`/properties/${inq.propertyId}`} style={{ color: 'var(--green-600)', textDecoration: 'none' }}>
                      {inq.propertyTitle || `Property #${inq.propertyId}`}
                    </Link>
                  </h4>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Sent on {formatDate(inq.createdAt)}
                  </span>
                </div>
                <span className={`badge ${inq.status === 'RESPONDED' ? 'badge-green' : inq.status === 'CLOSED' ? 'badge-grey' : 'badge-gold'}`}>
                  {inq.status}
                </span>
              </div>

              <div style={{ background: 'var(--cream-200)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: inq.agentResponse ? 12 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>📤 Your Inquiry Message</div>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{inq.message}</p>
              </div>

              {inq.agentResponse && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: 'var(--radius-md)', padding: '12px 16px', marginTop: 10
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-700)', marginBottom: 4 }}>
                    ✅ Agent replied:
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {inq.agentResponse}
                  </p>
                </div>
              )}

              {inq.status === 'NEW' && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic', margin: 0 }}>
                  ⏳ Awaiting agent response...
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}