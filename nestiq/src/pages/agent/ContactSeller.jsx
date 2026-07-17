import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/axiosConfig'
import { formatDate } from '../../utils/formatters'

export default function ContactSeller() {
  const [myProperties, setMyProperties] = useState([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [ownerReplies, setOwnerReplies] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReplies = () => {
    api.get('/agent-messages/owner-replies')
      .then(res => setOwnerReplies(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/properties/my')
      .then(res => {
        const props = res.data || []
        // Only show properties that have an owner assigned
        const withOwner = props.filter(p => p.ownerId || p.ownerName)
        setMyProperties(withOwner)
        if (withOwner.length > 0) setSelectedPropertyId(String(withOwner[0].id))
      })
      .catch(() => setMyProperties([]))

    fetchReplies()
  }, [])

  const handleSend = async () => {
    if (!selectedPropertyId || !messageText.trim()) return
    setSending(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/agent-messages/to-owner', {
        propertyId: Number(selectedPropertyId),
        message: messageText.trim()
      })
      setSuccess('✅ Message sent to owner successfully.')
      setMessageText('')
      fetchReplies()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Message Property Owner</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Send messages to property owners of your assigned listings.
        </p>
      </div>

      <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📨 Send New Message</h3>
        
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: 16, color: '#b91c1c' }}>❌ {error}</div>}

        {myProperties.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>📭 No assigned properties with owners found.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Accept an owner's property request first, then return here to message them.
            </p>
          </div>
        ) : (
          <div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Select Property *</label>
              <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                {myProperties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.city} (Owner: {p.ownerName || 'Owner'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your Message *</label>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={4}
                placeholder="Type your message to the owner here..."
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              style={{ padding: '10px 24px' }}
            >
              {sending ? 'Sending...' : '📨 Send Message'}
            </button>
          </div>
        )}
      </div>

      <div className="replies-section">
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>💬 Owner Responses</h3>
        {loading ? (
          <div className="loading-page" style={{ minHeight: 120 }}><div className="spinner" /></div>
        ) : ownerReplies.length === 0 ? (
          <div style={{ background: 'var(--cream-100)', padding: '24px', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>No replies yet. Owner will respond here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ownerReplies.map(reply => (
              <div key={reply.id} style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px 0' }}>{reply.propertyTitle || `Property #${reply.propertyId}`}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Owner: <strong>{reply.ownerName || 'Owner'}</strong> · Sent: {formatDate(reply.createdAt)}
                    </span>
                  </div>
                  <span className={`badge ${reply.status === 'REPLIED' ? 'badge-green' : 'badge-gold'}`}>
                    {reply.status}
                  </span>
                </div>

                <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: reply.ownerReply ? 12 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-700)', marginBottom: 4 }}>📤 Your Message</div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.agentMessage || reply.message}</p>
                </div>

                {reply.ownerReply && (
                  <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>🏡 Owner Reply · {reply.repliedAt ? formatDate(reply.repliedAt) : ''}</div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}