import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { createProperty } from '../../services/propertyService'
import { generateDescription } from '../../services/aiService'
import api from '../../services/axiosConfig'

const CITIES = ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tiruppur']
const TYPES  = ['Apartment','Villa','House','Plot','Commercial']
const AMENITIES_LIST = ['Parking', 'Lift', 'Power Backup', 'Security', 'Gym', 'Swimming Pool', 'Garden', 'Club House', 'CCTV', 'Water Supply 24/7']

function calcTrust(form) {
  let score = 0
  if (form.title?.trim())       score += 15
  if (form.description?.trim()) score += 20
  if (form.price)               score += 15
  if (form.location?.trim())    score += 10
  if (form.city)                score += 10
  if (form.bhk)                 score += 10
  if (form.area)                score += 10
  if (form.propertyType)        score += 10
  return score
}

export default function AddProperty() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title:        '',
    description:  '',
    price:        '',
    location:     '',
    city:         '',
    bhk:          '',
    bathrooms:    '',
    area:         '',
    propertyType: '',
    listingType:  'RENT',
    status:       'AVAILABLE',
    imageUrl:     '',
    reraNumber:   '',
    reraRequired: false,
    amenities:    [],
  })

  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [genLoading,  setGenLoading]  = useState(false)
  const [genError,    setGenError]    = useState('')
  const [kycStatus,   setKycStatus]   = useState('NONE')
  const [customAmenity, setCustomAmenity] = useState('')

  useEffect(() => {
    api.get('/kyc/status')
      .then(res => {
        setKycStatus(res.data.kycStatus || 'NONE')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const isRequired = Number(form.area) > 5382
    if (form.reraRequired !== isRequired) {
      setForm(prev => ({ ...prev, reraRequired: isRequired }))
    }
  }, [form.area])

  const trust = calcTrust(form)

  const handleChange = e => {
    const { name, value } = e.target
    const numericFields = ['price', 'bhk', 'bathrooms', 'area']
    setForm(prev => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? value === '' ? '' : Number(value)
        : value,
    }))
  }

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  // ── ✨ Generate Description ────────────────────────────────────────────────
  const handleGenerateDescription = async () => {
    setGenError('')
    if (!form.city && !form.propertyType && !form.bhk) {
      setGenError('Fill in at least City, BHK, or Property Type to generate a description.')
      return
    }
    setGenLoading(true)
    try {
      const desc = await generateDescription({
        title:        form.title,
        city:         form.city,
        location:     form.location,
        bhk:          form.bhk,
        area:         form.area,
        propertyType: form.propertyType,
        listingType:  form.listingType,
        furnishing:   form.furnishing || '',
        amenities:    [],
      })
      if (desc) {
        setForm(prev => ({ ...prev, description: desc }))
      }
    } catch {
      setGenError('Could not generate description. Please write it manually.')
    } finally {
      setGenLoading(false)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.price || !form.city) {
      setError('Title, price, and city are required.')
      return
    }

    if (form.reraRequired && !form.reraNumber?.trim()) {
      setError('RERA Registration Number is required for properties > 500 sq.m.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        price:     Number(form.price),
        bhk:       Number(form.bhk || 0),
        area:      Number(form.area || 0),
        bathrooms: Number(form.bathrooms || 0),
      }
      await createProperty(payload)
      navigate('/agent/properties')
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err?.message || 'Failed to create property.'
      )
    } finally {
      setLoading(false)
    }
  }

  const trustColor = trust >= 80 ? 'var(--green-500)' : trust >= 60 ? 'var(--gold-400)' : '#e74c3c'

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Add New Property</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Fill in the details to list your property</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {kycStatus !== 'VERIFIED' && (
        <div style={{
          background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 12,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>Verification Account Boost</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              Your account has not submitted KYC documents. Submitting KYC documentation in your <strong>Profile Settings</strong> increases listed property trust score indices and adds verification badges to listing pages.
            </div>
          </div>
        </div>
      )}

      {/* Live Trust Score Preview */}
      <div style={{
        background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
        border: `2px solid ${trustColor}`, padding: '16px 20px',
        marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Live Trust Score Preview
          </div>
          <div style={{ height: 8, background: 'var(--cream-200)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${trust}%`, background: trustColor,
              borderRadius: 999, transition: 'width 0.3s ease, background 0.3s',
            }} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: trustColor, minWidth: 60, textAlign: 'right' }}>
          {trust}/100
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Basic Information ─────────────────────────────────────────── */}
        <div style={{
          background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Basic Information</h3>

          <div className="form-group">
            <label>Property Title *</label>
            <input
              name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Spacious 2BHK near Anna Nagar" required
            />
          </div>

          {/* Description + Generate button */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={genLoading}
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            6,
                  padding:        '5px 14px',
                  background:     genLoading ? 'var(--cream-200)' : 'linear-gradient(135deg, #6d28d9, #4f46e5)',
                  color:          genLoading ? 'var(--text-muted)' : 'var(--text-on-dark)',
                  border:         'none',
                  borderRadius:   'var(--radius-sm)',
                  fontSize:       12,
                  fontWeight:     600,
                  cursor:         genLoading ? 'not-allowed' : 'pointer',
                  transition:     'all 0.2s',
                  letterSpacing:  '0.2px',
                  boxShadow:      genLoading ? 'none' : '0 2px 8px rgba(109,40,217,0.25)',
                }}
              >
                {genLoading ? (
                  <><span className="spinner spinner-sm" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} /> Generating…</>
                ) : (
                  <>✨ Generate Description</>
                )}
              </button>
            </div>

            {genError && (
              <div style={{
                fontSize: 12, color: '#dc2626', background: '#fee2e2',
                borderRadius: 'var(--radius-sm)', padding: '6px 10px', marginBottom: 6,
              }}>
                {genError}
              </div>
            )}

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the property, surroundings, amenities… or click ✨ Generate Description above."
              rows={4}
              style={{
                transition: 'border-color 0.2s',
                borderColor: genLoading ? 'var(--green-500)' : undefined,
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              💡 Fill City, BHK, and Type first for the best AI-generated result. You can edit after generation.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number" name="price" value={form.price}
                onChange={handleChange} placeholder="e.g. 25000" required
              />
            </div>
            <div className="form-group">
              <label>Listing Type</label>
              <select name="listingType" value={form.listingType} onChange={handleChange}>
                <option value="RENT">For Rent</option>
                <option value="SALE">For Sale</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Location ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Location</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Address / Area *</label>
              <input
                name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Anna Nagar West" required
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <select name="city" value={form.city} onChange={handleChange} required>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Property Details ──────────────────────────────────────────── */}
        <div style={{
          background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Property Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Property Type</label>
              <select name="propertyType" value={form.propertyType} onChange={handleChange}>
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>BHK</label>
              <select name="bhk" value={form.bhk} onChange={handleChange}>
                <option value="">Select BHK</option>
                {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Property Image URL</label>
              <input
                type="text" name="imageUrl" value={form.imageUrl}
                onChange={handleChange} placeholder="https://example.com/house.jpg"
              />
            </div>
            <div className="form-group">
              <label>Bathrooms</label>
              <select name="bathrooms" value={form.bathrooms} onChange={handleChange}>
                <option value="">Select</option>
                {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Area (sqft)</label>
            <input
              type="number" name="area" value={form.area}
              onChange={handleChange} placeholder="e.g. 1200"
            />
          </div>

          {/* RERA field and warnings */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {form.reraRequired && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.08)', border: '1px solid #fee2e2', borderRadius: 'var(--radius-lg)',
                padding: '12px 16px', marginBottom: 12,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: 13 }}>RERA Registration Required for properties &gt; 500 sq.m</div>
                  <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2, lineHeight: 1.4 }}>
                    Since this property exceeds 500 sq.m (5,382 sq.ft), it requires a RERA certification number under the Real Estate Regulation Act to be approved by administration.
                  </div>
                </div>
              </div>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>RERA Number {form.reraRequired ? '*' : '(Optional)'}</label>
              <input
                type="text"
                name="reraNumber"
                value={form.reraNumber}
                onChange={handleChange}
                placeholder="e.g. TN/RERA/0129/2026"
                required={form.reraRequired}
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Amenities</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {AMENITIES_LIST.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                background: form.amenities.includes(a) ? 'var(--green-600)' : 'var(--cream-200)',
                color: form.amenities.includes(a) ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                border: `1px solid ${form.amenities.includes(a) ? 'var(--green-600)' : 'var(--border)'}`,
                fontWeight: form.amenities.includes(a) ? 600 : 400,
              }}>
                {form.amenities.includes(a) ? '✓ ' : ''}{a}
              </button>
            ))}
            {form.amenities.filter(a => !AMENITIES_LIST.includes(a)).map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                background: 'var(--green-600)', color: 'var(--text-on-dark)',
                border: '1px solid ' + 'var(--green-600)',
                fontWeight: 600,
              }}>
                ✓ {a} (Custom)
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <input
              type="text"
              placeholder="Add custom amenity (e.g. EV Charging, Solar Panels)"
              value={customAmenity}
              onChange={e => setCustomAmenity(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (customAmenity.trim()) {
                  const val = customAmenity.trim();
                  if (!form.amenities.includes(val)) {
                    setForm(prev => ({ ...prev, amenities: [...prev.amenities, val] }));
                  }
                  setCustomAmenity('');
                }
              }}
              style={{ padding: '8px 16px', background: 'var(--green-600)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              + Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button" className="btn btn-outline"
            onClick={() => navigate('/agent/properties')}
          >
            Cancel
          </button>
          <button
            type="submit" className="btn btn-primary btn-lg"
            style={{ flex: 1 }} disabled={loading}
          >
            {loading ? <><span className="spinner spinner-sm" /> Saving...</> : '🏠 List Property'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
}