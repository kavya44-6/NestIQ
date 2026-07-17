import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { getMyVisits, cancelVisit } from '../../services/visitService'
import { formatDate } from '../../utils/formatters'

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

export default function MyVisits() {
  const [visits, setVisits]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchVisits = (isSilent = false) => {
    if (!isSilent) setLoading(true)
    getMyVisits()
      .then(r => {
        const newData = r.data || []
        setVisits(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newData)) {
            return prev
          }
          if (isSilent && prev.length > 0) {
            newData.forEach(newItem => {
              const oldItem = prev.find(o => o.id === newItem.id)
              if (oldItem && oldItem.status !== newItem.status) {
                showToast(`Your visit status updated to ${newItem.status}`)
              }
            })
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
    fetchVisits(false)
    const interval = setInterval(() => {
      fetchVisits(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this visit?')) return
    await cancelVisit(id).catch(() => {})
    fetchVisits(false)
  }

  const statusClass = (s) =>
    s === 'SCHEDULED' ? 'badge-blue' : s === 'COMPLETED' ? 'badge-green' : 'badge-red'

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>My Visits</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>View and manage your scheduled property visits</p>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> :
       visits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No visits scheduled yet. Find a property and book a visit!</p>
          <Link to="/properties" className="btn btn-primary">Browse Properties</Link>
        </div>
       ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Property</th><th>Date</th><th>Time Slot</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/properties/${v.propertyId}`} style={{ color: 'var(--green-600)', fontWeight: 600 }}>
                      {v.propertyTitle || `Property #${v.propertyId}`}
                    </Link>
                  </td>
                  <td>{formatDate(v.visitDate)}</td>
                  <td>{v.timeSlot}</td>
                  <td><span className={`badge ${statusClass(v.status)}`}>{v.status}</span></td>
                  <td>
                    {v.status === 'SCHEDULED' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(v.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       )}
    </DashboardLayout>
  )
}