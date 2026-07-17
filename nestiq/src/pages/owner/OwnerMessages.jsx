import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/axiosConfig'
import { formatDate } from '../../utils/formatters'

export default function OwnerMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyDrafts, setReplyDrafts] = useState({})

  const fetchMessages = (isSilent = false) => {
    if (!isSilent) setLoading(true)
    api.get('/owner/messages')
      .then(r => {
        setMessages(r.data || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!isSilent) setLoading(false)
      })
  }

  useEffect(() => {
    fetchMessages(false)
  }, [])

  const handleReply = async (messageId, replyText) => {
    try {
      await api.put(`/owner/messages/${messageId}/reply`, { reply: replyText })
      // Update local state immediately
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, ownerReply: replyText, status: 'REPLIED' }
          : m
      ))
      setReplyDrafts(prev => {
        const next = { ...prev }
        delete next[messageId]
        return next
      })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply')
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Agent Messages</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Messages from agents managing your properties — reply to give instructions or approvals
        </p>
      </div>

      <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
        💡 When an agent contacts you about a customer inquiry or visit request, it shows up here. Reply directly to give your go-ahead or special instructions.
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>No messages from agents yet.</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            When an agent is assigned to your property and contacts you, messages appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: `1px solid ${msg.status === 'PENDING' ? '#fca5a5' : 'var(--border)'}`, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{msg.propertyTitle || `Property #${msg.propertyId}`}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    From: <strong>{msg.agentName || 'Agent'}</strong> · {formatDate(msg.createdAt)}
                  </div>
                </div>
                <span className={`badge ${msg.status === 'REPLIED' ? 'badge-green' : 'badge-gold'}`}>{msg.status}</span>
              </div>

              {/* Agent's message */}
              <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-700)', marginBottom: 4 }}>📤 Agent's Message</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{msg.agentMessage || msg.message}</p>
              </div>

              {/* Reply section */}
              {msg.status === 'REPLIED' ? (
                <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>✅ Your Reply · {msg.repliedAt ? formatDate(msg.repliedAt) : 'Just now'}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{msg.ownerReply}</p>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={replyDrafts[msg.id] || ''}
                    onChange={e => setReplyDrafts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                    placeholder="Type your reply to the agent..."
                    rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 8, fontSize: 13.5 }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const text = replyDrafts[msg.id] || ''
                      if (text.trim()) {
                        handleReply(msg.id, text.trim())
                      }
                    }}
                    disabled={!(replyDrafts[msg.id] || '').trim()}
                  >
                    Send Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}