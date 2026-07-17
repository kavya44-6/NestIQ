import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { getAgentVisits, updateVisitStatus } from '../../services/visitService'
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

export default function AgentVisits() {
  const [visits, setVisits]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = (isSilent = false) => {
    if (!isSilent) setLoading(true)
    getAgentVisits()
      .then(r => {
        const newData = r.data || []
        setVisits(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newData)) {
            return prev
          }
          if (isSilent && prev.length > 0 && newData.length > prev.length) {
            showToast('New visit booking received')
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

  const handle = async (id, status) => {
    await updateVisitStatus(id, status).catch(() => {})
    fetch(false)
  }

  const statusClass = s => s==='SCHEDULED'?'badge-blue':s==='COMPLETED'?'badge-green':'badge-red'

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Visit Requests</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{visits.filter(v=>v.status==='SCHEDULED').length} upcoming</p>
      </div>

      {!loading && visits.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📅</div><p>No visit requests yet.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Property</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : (
                visits.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.customerName || 'Customer'}</td>
                    <td>{v.propertyTitle || `#${v.propertyId}`}</td>
                    <td>{formatDate(v.visitDate)}</td>
                    <td>{v.timeSlot}</td>
                    <td><span className={`badge ${statusClass(v.status)}`}>{v.status}</span></td>
                    <td>
                      {v.status === 'SCHEDULED' && (
                        <div className="table-actions">
                          <button className="btn btn-primary btn-sm" onClick={() => handle(v.id, 'COMPLETED')}>Complete</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => handle(v.id, 'CANCELLED')}>Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}