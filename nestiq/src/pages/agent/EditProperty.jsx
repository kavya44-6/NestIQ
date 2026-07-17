import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { getPublicProperty, updateProperty } from '../../services/propertyService'

const CITIES = ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tiruppur']
const TYPES  = ['Apartment','Villa','House','Plot','Commercial']

export default function EditProperty() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPublicProperty(id).then(r => setForm(r.data)).catch(() => navigate('/agent/properties'))
  }, [id])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProperty(id, { ...form, price: Number(form.price), bhk: Number(form.bhk), area: Number(form.area) })
      navigate('/agent/properties')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <DashboardLayout><div className="loading-page"><div className="spinner" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Edit Property</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Update your listing details</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <div className="form-group"><label>Title</label><input name="title" value={form.title || ''} onChange={handleChange} required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" value={form.description || ''} onChange={handleChange} rows={3} /></div>
          <div className="form-row">
            <div className="form-group"><label>Price (₹)</label><input type="number" name="price" value={form.price || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Listing Type</label><select name="listingType" value={form.listingType || 'RENT'} onChange={handleChange}><option value="RENT">For Rent</option><option value="SALE">For Sale</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Location</label><input name="location" value={form.location || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>City</label><select name="city" value={form.city || ''} onChange={handleChange}><option value="">Select</option>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>BHK</label><select name="bhk" value={form.bhk || ''} onChange={handleChange}><option value="">Select</option>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></div>
            <div className="form-group"><label>Area (sqft)</label><input type="number" name="area" value={form.area || ''} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Type</label><select name="propertyType" value={form.propertyType || ''} onChange={handleChange}><option value="">Select</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label>Status</label><select name="status" value={form.status || 'AVAILABLE'} onChange={handleChange}><option value="AVAILABLE">Available</option><option value="SOLD">Sold</option><option value="RENTED">Rented</option></select></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/agent/properties')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
}