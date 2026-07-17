import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import api from '../../services/axiosConfig'
import { formatPrice } from '../../utils/formatters'
import { properties as seedProperties } from '../../data/properties'
import { 
  getAllMockProperties, 
  getOwnerMockProperties, 
  inquiries, 
  visits 
} from '../../mock/mockStore'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalInquiries: 0,
    totalVisits: 0,
    pendingKyc: 0,
    lowTrustProperties: 0
  })
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [toastMsg, setToastMsg] = useState('')
  const [kycLoadingId, setKycLoadingId] = useState(null)
  const [recalcLoadingId, setRecalcLoadingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('title')
  
  const location = useLocation()
  const activeTab = location.pathname.endsWith('/users') ? 'users' : location.pathname.endsWith('/properties') ? 'properties' : 'overview'

  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const useFallbackData = () => {
    const fallbackProps = [...getAllMockProperties(), ...getOwnerMockProperties(), ...seedProperties]
    const fallbackUsers = [
      { id: 101, name: 'Rajan Murugan', email: 'rajan@nestiq.in', role: 'AGENT', kycStatus: 'SUBMITTED', kycDocumentType: 'PAN_CARD', kycDocumentNumber: 'ABCDE1234F' },
      { id: 102, name: 'Priya Suresh', email: 'priya@nestiq.in', role: 'AGENT', kycStatus: 'SUBMITTED', kycDocumentType: 'AADHAAR', kycDocumentNumber: '1234-5678-9012' },
      { id: 103, name: 'Property Owner', email: 'owner@nestiq.in', role: 'OWNER', kycStatus: 'SUBMITTED', kycDocumentType: 'PASSPORT', kycDocumentNumber: 'Z1234567' },
      { id: 104, name: 'John Doe', email: 'john@nestiq.in', role: 'CUSTOMER', kycStatus: 'VERIFIED', kycDocumentType: null, kycDocumentNumber: null }
    ]
    const fallbackStats = {
      totalUsers: 14,
      totalProperties: fallbackProps.length,
      totalInquiries: inquiries.length,
      totalVisits: visits.length,
      pendingKyc: fallbackUsers.filter(u => u.kycStatus === 'SUBMITTED').length,
      lowTrustProperties: fallbackProps.filter(p => p.trustScore !== null && p.trustScore < 40).length
    }
    setStats(fallbackStats)
    setUsers(fallbackUsers)
    setProperties(fallbackProps)
  }

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/admin/stats')
      const usersRes = await api.get('/admin/users')
      const propsRes = await api.get('/admin/properties')
      
      const statsData = statsRes.data
      const usersData = usersRes.data
      const propsData = propsRes.data

      if (!statsData || statsData.totalProperties === 0) {
        useFallbackData()
      } else {
        setStats(statsData)
        setUsers(usersData)
        setProperties(propsData)
      }
    } catch (err) {
      useFallbackData()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleVerifyKyc = async (userId) => {
    setKycLoadingId(userId)
    try {
      await api.put(`/admin/kyc/${userId}/verify`)
      showToast('✅ KYC verified successfully')
      setUsers(prev => prev.filter(u => u.id !== userId))
      setStats(prev => ({ ...prev, pendingKyc: Math.max(0, prev.pendingKyc - 1) }))
    } catch (err) {
      showToast('❌ Failed to verify KYC')
    } finally {
      setKycLoadingId(null)
    }
  }

  const handleRejectKyc = async (userId) => {
    setKycLoadingId(userId)
    try {
      await api.put(`/admin/kyc/${userId}/reject`)
      showToast('⚠️ KYC request rejected')
      setUsers(prev => prev.filter(u => u.id !== userId))
      setStats(prev => ({ ...prev, pendingKyc: Math.max(0, prev.pendingKyc - 1) }))
    } catch (err) {
      showToast('❌ Failed to reject KYC')
    } finally {
      setKycLoadingId(null)
    }
  }

  const handleRemoveProperty = async (propertyId) => {
    try {
      await api.delete(`/admin/property/${propertyId}`)
      showToast('🗑️ Property deleted successfully')
      setProperties(prev => prev.filter(p => p.id !== propertyId))
      setStats(prev => ({ 
        ...prev, 
        totalProperties: Math.max(0, prev.totalProperties - 1),
        lowTrustProperties: Math.max(0, prev.lowTrustProperties - 1)
      }))
    } catch (err) {
      showToast('❌ Failed to delete property')
    }
  }

  const handleApproveProperty = async (propertyId) => {
    try {
      await api.put(`/admin/property/${propertyId}/approve`)
      showToast('✅ Property approved')
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, approved: true, status: 'AVAILABLE' } : p))
    } catch (err) {
      showToast('❌ Failed to approve property')
    }
  }

  const handleRejectProperty = async (propertyId) => {
    try {
      await api.put(`/admin/property/${propertyId}/reject`)
      showToast('❌ Property rejected')
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, approved: false, status: 'REJECTED' } : p))
    } catch (err) {
      showToast('❌ Failed to reject property')
    }
  }

  const handleRecalculateTrust = async (propertyId) => {
    setRecalcLoadingId(propertyId)
    try {
      await api.put(`/admin/property/${propertyId}/recalculate-trust`)
      showToast('🔄 Trust score recalculated successfully')
      await fetchData()
    } catch (err) {
      showToast('❌ Failed to recalculate trust score')
    } finally {
      setRecalcLoadingId(null)
    }
  }

  const filteredProperties = properties
    .filter(p => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = (p.title || '').toLowerCase().includes(query) || (p.city || '').toLowerCase().includes(query)
      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'APPROVED' ? p.approved === true :
        p.approved === false
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'trust_score') return (b.trustScore || 0) - (a.trustScore || 0)
      return 0
    })

  const pendingKycUsers = users.filter(u => u.kycStatus === 'SUBMITTED')

  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.toLowerCase().trim()
    const matchesSearch = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    const matchesRole = userRoleFilter === 'ALL' ? true : u.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="skeleton" style={{ height: 400 }} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: 'var(--green-900)', color: '#fff',
          padding: '12px 24px', borderRadius: 'var(--radius-md)', zIndex: 1000,
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, borderLeft: '4px solid var(--green-300)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          🛡️ Platform Administration Panel
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
          Monitor user growth, listing quality standards, fraud reports, and platform KPIs.
        </p>
      </div>

      {/* SECTION 1 — Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: 28 }}>
        <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>👥</span>
            <span style={{ fontSize: 11, background: 'var(--green-50)', color: 'var(--green-700)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Active Users
            </span>
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
            Total Users
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats.totalUsers || 0}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>🏠</span>
            <span style={{ fontSize: 11, background: 'var(--green-50)', color: 'var(--green-700)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Listings
            </span>
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
            Total Properties
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats.totalProperties || 0}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>📄</span>
            <span style={{ fontSize: 11, background: 'var(--gold-50)', color: 'var(--gold-700)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Action Required
            </span>
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
            Pending KYC
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats.pendingKyc || 0}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>💬</span>
            <span style={{ fontSize: 11, background: 'var(--green-50)', color: 'var(--green-700)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Inquiries
            </span>
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
            Total Inquiries
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats.totalInquiries || 0}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>📅</span>
            <span style={{ fontSize: 11, background: 'var(--green-50)', color: 'var(--green-700)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Inspections
            </span>
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
            Total Visits
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats.totalVisits || 0}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>⚠️</span>
            <span style={{ fontSize: 11, background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              Flags
            </span>
          </div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>
            Low Trust score
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats.lowTrustProperties || 0}
          </div>
        </div>
      </div>

      {/* Tab contents */}
      {activeTab === 'overview' && (
        <>
          {/* SECTION 2 — Pending KYC table */}
          <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📄 Pending KYC Document Reviews</h3>
            {pendingKycUsers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: 0 }}>No pending KYC document reviews.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Document Type</th>
                    <th>Document Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingKycUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className="tag" style={{ textTransform: 'capitalize' }}>{u.role.toLowerCase()}</span></td>
                      <td>{u.kycDocumentType || 'N/A'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{u.kycDocumentNumber || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleVerifyKyc(u.id)}
                            disabled={kycLoadingId !== null}
                          >
                            {kycLoadingId === u.id ? '...' : 'Verify'}
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleRejectKyc(u.id)}
                            disabled={kycLoadingId !== null}
                          >
                            {kycLoadingId === u.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* SECTION 3 — Listings table */}
          <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🏡 All Listings & Auditing</h3>
              
              {/* Controls Panel */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search by Title / City..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', outline: 'none', width: 200
                  }}
                />
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select 
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff'
                  }}
                >
                  <option value="title">Sort by Title</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="trust_score">Highest Trust Score</option>
                </select>
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '20px 0 0' }}>No matching properties found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>City</th>
                    <th>BHK</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Trust Score</th>
                    <th>Agent/Lister</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/properties/${p.id}`} style={{ color: 'var(--green-700)', textDecoration: 'none', fontWeight: 600 }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                          {p.title}
                        </Link>
                      </td>
                      <td>{p.city}</td>
                      <td>{p.bhk} BHK</td>
                      <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>{formatPrice(p.price)}</td>
                      <td>
                        <span className={`badge badge-${p.approved ? 'green' : 'red'}`}>
                          {p.approved ? 'APPROVED' : 'REJECTED'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${p.trustScore >= 80 ? 'green' : p.trustScore >= 60 ? 'gold' : 'red'}`}>
                          {p.trustScore || 0}%
                        </span>
                      </td>
                      <td>{p.agentName || p.ownerName || 'Lister'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleApproveProperty(p.id)}
                            disabled={p.approved}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleRejectProperty(p.id)}
                            disabled={!p.approved}
                          >
                            Reject
                          </button>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleRecalculateTrust(p.id)}
                            disabled={recalcLoadingId === p.id}
                          >
                            {recalcLoadingId === p.id ? 'Recalculating...' : 'Recalculate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>👥 Platform User Directory</h3>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search by Name / Email..." 
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', outline: 'none', width: 200
                }}
              />
              <select 
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff'
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="OWNER">Owner</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '20px 0 0' }}>No matching users found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>KYC Status</th>
                  <th>KYC Document</th>
                  <th>Verification Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`tag tag-${u.role === 'ADMIN' ? 'red' : u.role === 'OWNER' ? 'blue' : u.role === 'AGENT' ? 'purple' : 'green'}`} style={{ textTransform: 'capitalize' }}>
                        {u.role.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.kycStatus === 'VERIFIED' ? 'green' : u.kycStatus === 'SUBMITTED' ? 'gold' : 'red'}`}>
                        {u.kycStatus || 'NONE'}
                      </span>
                    </td>
                    <td>{u.kycDocumentType || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{u.kycDocumentNumber || 'N/A'}</td>
                    <td>
                      {u.kycStatus === 'SUBMITTED' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleVerifyKyc(u.id)}
                            disabled={kycLoadingId !== null}
                          >
                            Verify
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            style={{ padding: '4px 10px', fontSize: 11 }} 
                            onClick={() => handleRejectKyc(u.id)}
                            disabled={kycLoadingId !== null}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No Action Required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🏡 All Listings & Auditing</h3>
            
            {/* Controls Panel */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search by Title / City..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', outline: 'none', width: 200
                }}
              />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', outline: 'none', background: '#fff'
                }}
              >
                <option value="title">Sort by Title</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="trust_score">Highest Trust Score</option>
              </select>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '20px 0 0' }}>No matching properties found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>City</th>
                  <th>BHK</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Trust Score</th>
                  <th>Agent/Lister</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/properties/${p.id}`} style={{ color: 'var(--green-700)', textDecoration: 'none', fontWeight: 600 }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                        {p.title}
                      </Link>
                    </td>
                    <td>{p.city}</td>
                    <td>{p.bhk} BHK</td>
                    <td style={{ fontWeight: 700, color: 'var(--green-700)' }}>{formatPrice(p.price)}</td>
                    <td>
                      <span className={`badge badge-${p.approved ? 'green' : 'red'}`}>
                        {p.approved ? 'APPROVED' : 'REJECTED'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${p.trustScore >= 80 ? 'green' : p.trustScore >= 60 ? 'gold' : 'red'}`}>
                        {p.trustScore || 0}%
                      </span>
                    </td>
                    <td>{p.agentName || p.ownerName || 'Lister'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ padding: '4px 10px', fontSize: 11 }} 
                          onClick={() => handleApproveProperty(p.id)}
                          disabled={p.approved}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '4px 10px', fontSize: 11 }} 
                          onClick={() => handleRejectProperty(p.id)}
                          disabled={!p.approved}
                        >
                          Reject
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ padding: '4px 10px', fontSize: 11 }} 
                          onClick={() => handleRecalculateTrust(p.id)}
                          disabled={recalcLoadingId === p.id}
                        >
                          {recalcLoadingId === p.id ? 'Recalculating...' : 'Recalculate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
