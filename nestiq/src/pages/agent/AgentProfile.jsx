import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/axiosConfig'

export default function AgentProfile() {
  const { user } = useAuth()
  const [kyc, setKyc] = useState({
    kycStatus: 'PENDING',
    kycDocumentType: '',
    verified: 'false'
  })
  const [docType, setDocType] = useState('AADHAAR')
  const [docNumber, setDocNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchStatus = () => {
    setLoading(true)
    api.get('/kyc/status')
      .then(res => {
        setKyc(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!docNumber.trim()) return
    setSubmitting(true)
    setMsg('')
    api.post('/kyc/submit', {
      documentType: docType,
      documentNumber: docNumber
    })
    .then(() => {
      setMsg('✅ KYC Documents submitted successfully for review.')
      setDocNumber('')
      fetchStatus()
    })
    .catch((err) => {
      setMsg(`❌ Failed to submit: ${err.response?.data?.message || err.response?.data || err.message}`)
    })
    .finally(() => setSubmitting(false))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED': return <span className="badge badge-green">VERIFIED</span>
      case 'SUBMITTED': return <span className="badge badge-blue">UNDER REVIEW</span>
      case 'REJECTED': return <span className="badge badge-red">REJECTED / ACTION REQUIRED</span>
      default: return <span className="badge badge-gold">UNVERIFIED (PENDING)</span>
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Broker Profile & verification</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Submit official documentation to secure a verified listing badge.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        
        {/* Status card */}
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: 18, fontSize: 16 }}>Verification Status</h3>
          
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Broker Name</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Email Address</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>KYC Verification</span>
                {getStatusBadge(kyc.kycStatus)}
              </div>
              {kyc.kycDocumentType && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Document Verified</span>
                  <span style={{ fontWeight: 600 }}>{kyc.kycDocumentType}</span>
                </div>
              )}

              {kyc.kycStatus === 'VERIFIED' && (
                <div style={{ background: 'var(--green-50)', color: 'var(--green-700)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--green-200)', marginTop: 10, fontSize: 13, fontWeight: 600 }}>
                  🌟 Congratulations! You have a verified Broker badge. All your properties will display the "Verified Broker" trust indicator.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Form */}
        {kyc.kycStatus !== 'VERIFIED' && kyc.kycStatus !== 'SUBMITTED' && (
          <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 18, fontSize: 16 }}>Submit KYC Documents</h3>
            
            {msg && <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16, background: msg.startsWith('❌') ? '#f8d7da' : 'var(--green-50)', color: msg.startsWith('❌') ? '#721c24' : 'var(--green-700)', fontWeight: 600 }}>{msg}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Select Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} style={{ width: '100%', padding: '10px 12px' }}>
                  <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
                  <option value="PAN">PAN Card (Income Tax Dept)</option>
                  <option value="GSTIN">GSTIN Registration</option>
                  <option value="RERA_ID">RERA Broker Registration Number</option>
                </select>
              </div>
              <div className="form-group">
                <label>Document / Registration Number</label>
                <input
                  type="text"
                  placeholder="Enter registration or document number"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px' }}
                />
              </div>

              <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                ℹ️ By submitting this number, you authorize NestIQ's verification partners to check the authenticity of your broker credentials against government databases.
              </div>

              <button
                type="submit"
                disabled={submitting || !docNumber.trim()}
                className="btn btn-primary"
                style={{ justifyContent: 'center', marginTop: 8 }}
              >
                {submitting ? <><span className="spinner spinner-sm" style={{ marginRight: 6 }} /> Submitting Documents…</> : 'Submit Credentials'}
              </button>
            </form>
          </div>
        )}

        {kyc.kycStatus === 'SUBMITTED' && (
          <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: 18, fontSize: 16 }}>Review in Progress</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 0 }}>
              Your verification request has been successfully submitted and is being processed by our trust compliance desk. 
              Verification checks usually take less than 24 business hours. You will receive an email confirmation once verified by the platform admin.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
