import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import Modal from '../../components/common/Modal'
import { getOwnerInquiries } from '../../services/ownerService'
import { respondToInquiry } from '../../services/inquiryService'
import { formatDate } from '../../utils/formatters'

export default function OwnerInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected, setSelected]   = useState(null)
  const [reply, setReply]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchInquiries = () => {
    getOwnerInquiries()
      .then(r => setInquiries(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSubmitting(true)
    try {
      await respondToInquiry(selected.id, reply)
      setSelected(null)
      setReply('')
      fetchInquiries()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Customer Inquiries</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          All customer messages on your properties
        </p>
      </div>

      <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
        💡 If a property is self-managed (SELF_SELL), you can respond to inquiries directly using the "Reply" action. For agent-managed properties, your assigned agent will handle responses on your behalf.
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> :
       inquiries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>No customer inquiries yet on your properties.</p>
        </div>
       ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Property</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
                <th>Response</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(inq => {
                const isSelfSell = inq.agentRequestStatus === 'SELF_SELL'
                const isNew = inq.status === 'NEW'
                return (
                  <tr key={inq.id}>
                    <td style={{ fontWeight: 600 }}>{inq.customerName || 'Customer'}</td>
                    <td>{inq.propertyTitle || `#${inq.propertyId}`}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inq.message}>
                      {inq.message}
                    </td>
                    <td>{formatDate(inq.createdAt)}</td>
                    <td>
                      <span className={`badge ${inq.status === 'RESPONDED' ? 'badge-green' : 'badge-gold'}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inq.agentResponse}>
                      {inq.agentResponse || '—'}
                    </td>
                    <td>
                      {isSelfSell && isNew && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(inq); setReply('') }}>
                          Reply
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
       )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Reply to Customer Inquiry">
        {selected && (
          <>
            <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16, fontSize: 14 }}>
              <strong>{selected.customerName}:</strong> {selected.message}
            </div>
            <div className="form-group">
              <label>Your Response</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4} placeholder="Type your reply..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={submitting || !reply.trim()}>
                {submitting ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </DashboardLayout>
  )
}