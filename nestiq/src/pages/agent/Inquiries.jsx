import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import Modal from '../../components/common/Modal'
import { getAgentInquiries, respondToInquiry } from '../../services/inquiryService'
import { formatDate } from '../../utils/formatters'
import { TableRowSkeleton } from '../../components/common/SkeletonCard'

function showToast(msg) {
  let container = document.getElementById('nestiq-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'nestiq-toast-container'
    container.style.position = 'fixed'
    container.style.top = '20px'
    container.style.right = '20px'
    container.style.zIndex = '9999'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.gap = '10px'
    document.body.appendChild(container)
  }
  
  const toast = document.createElement('div')
  toast.innerText = msg
  toast.style.background = 'var(--green-900)'
  toast.style.color = '#fff'
  toast.style.padding = '12px 24px'
  toast.style.borderRadius = 'var(--radius-md)'
  toast.style.boxShadow = 'var(--shadow-lg)'
  toast.style.fontWeight = '600'
  toast.style.borderLeft = '4px solid var(--green-300)'
  toast.style.fontSize = '13.5px'
  toast.style.transition = 'all 0.3s ease'
  toast.style.opacity = '0'
  toast.style.transform = 'translateY(-10px)'
  
  container.appendChild(toast)
  
  setTimeout(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  }, 10)
  
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(-10px)'
    setTimeout(() => {
      toast.remove()
      if (container.children.length === 0) {
        container.remove()
      }
    }, 300)
  }, 3000)
}

export default function AgentInquiries() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [reply, setReply]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetch = (isSilent = false) => {
    if (!isSilent) setLoading(true)
    getAgentInquiries()
      .then(r => {
        const newData = r.data || []
        setInquiries(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newData)) {
            return prev
          }
          if (isSilent && prev.length > 0 && newData.length > prev.length) {
            showToast('New inquiry received')
          }
          return newData
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!isSilent) setLoading(false)
      })
  }

  useEffect(() => {
    fetch(false)
    const interval = setInterval(() => {
      fetch(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSubmitting(true)
    try {
      await respondToInquiry(selected.id, reply)
      setSelected(null)
      setReply('')
      fetch(false)
    } catch {
    } finally { setSubmitting(false) }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Customer Inquiries</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{inquiries.length} total · {inquiries.filter(i=>i.status==='NEW').length} new</p>
      </div>

      {!loading && inquiries.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">💬</div><p>No inquiries yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Property</th><th>Message</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : (
                inquiries.map(inq => (
                  <tr key={inq.id}>
                    <td style={{ fontWeight: 600 }}>{inq.customerName || 'Customer'}</td>
                    <td>{inq.propertyTitle || `#${inq.propertyId}`}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.message}</td>
                    <td>{formatDate(inq.createdAt)}</td>
                    <td><span className={`badge ${inq.status==='RESPONDED'?'badge-green':'badge-gold'}`}>{inq.status}</span></td>
                    <td>
                      {inq.status === 'NEW' && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(inq); setReply('') }}>Reply</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Reply to Inquiry">
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