// src/pages/owner/OwnerAddProperty.jsx  (NEW FILE)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { addOwnerProperty } from '../../services/ownerService'
import { generateDescription, estimatePrice } from '../../services/aiService'
import api from '../../services/axiosConfig'

const CITIES = ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tiruppur','Vellore']
const TYPES  = ['Apartment','Villa','House','Plot','Commercial']
const FURNISHING_OPTIONS = ['Unfurnished', 'Semi Furnished', 'Fully Furnished']
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

export default function OwnerAddProperty() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', description: '', price: '', location: '', city: '',
    bhk: '', bathrooms: '', area: '', propertyType: '',
    listingType: 'RENT', furnishing: '', imageUrl: '',
    selfSell: false, amenities: [], reraNumber: '', reraRequired: false
  })
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [kycStatus,   setKycStatus]   = useState('NONE')
  const [customAmenity, setCustomAmenity] = useState('')

  // AI description state
  const [descLoading, setDescLoading] = useState(false)
  const [descToast,   setDescToast]   = useState('')

  // AI price estimate state
  const [priceLoading,  setPriceLoading]  = useState(false)
  const [priceEstimate, setPriceEstimate] = useState(null) // { estimatedMin, estimatedMax, explanation }

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
  const trustColor = trust >= 80 ? 'var(--green-500)' : trust >= 60 ? 'var(--gold-400)' : '#e74c3c'

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              ['price','bhk','bathrooms','area'].includes(name) ? (value === '' ? '' : Number(value)) :
              value,
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

  // ── AI Description Generator ──────────────────────────────────────────────
  const handleGenerateDescription = async () => {
    setDescLoading(true)
    setDescToast('')
    try {
      const desc = await generateDescription({
        title:       form.title,
        city:        form.city,
        location:    form.location,
        bhk:         form.bhk,
        area:        form.area,
        propertyType: form.propertyType,
        listingType:  form.listingType,
        furnishing:   form.furnishing,
        amenities:    form.amenities,
      })
      setForm(prev => ({ ...prev, description: desc }))
      setDescToast('success')
    } catch {
      setDescToast('error')
    } finally {
      setDescLoading(false)
      setTimeout(() => setDescToast(''), 4000)
    }
  }

  // ── AI Price Estimator ────────────────────────────────────────────────────
  const handleEstimatePrice = async () => {
    if (!form.city || !form.bhk || !form.area) {
      setPriceEstimate({ error: 'Please fill in City, BHK, and Area first.' })
      return
    }
    setPriceLoading(true)
    setPriceEstimate(null)
    try {
      const result = await estimatePrice({
        city:        form.city,
        bhk:         form.bhk,
        area:        form.area,
        propertyType: form.propertyType,
        listingType:  form.listingType,
        furnishing:   form.furnishing,
      })
      setPriceEstimate(result)
    } catch {
      setPriceEstimate({ error: 'Could not estimate price. Please try again.' })
    } finally {
      setPriceLoading(false)
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
      await addOwnerProperty({
        ...form,
        price:     Number(form.price),
        bhk:       Number(form.bhk || 0),
        area:      Number(form.area || 0),
        bathrooms: Number(form.bathrooms || 0),
      })
      navigate('/owner/properties')
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to list property.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h2>Add Your Property</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          List your property. Choose whether to self-manage or request an agent.
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

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

      {/* Live trust score */}
      <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: `2px solid ${trustColor}`, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Live Trust Score Preview</div>
          <div style={{ height: 8, background: 'var(--cream-200)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${trust}%`, background: trustColor, borderRadius: 999, transition: 'width 0.3s ease' }} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: trustColor, minWidth: 60, textAlign: 'right' }}>{trust}/100</div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic info */}
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Basic Information</h3>

          <div className="form-group">
            <label>Property Title *</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Spacious 3BHK Villa near ECR" required />
          </div>

          {/* Description with AI generator */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>Description</label>
              <button type="button"
                onClick={handleGenerateDescription}
                disabled={descLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', fontSize: 12, fontWeight: 600,
                  background: descLoading ? 'var(--cream-200)' : 'linear-gradient(90deg, var(--green-600), #7c3aed)',
                  color: descLoading ? 'var(--text-muted)' : 'var(--text-on-dark)',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: descLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {descLoading ? <><span className="spinner spinner-sm" /> Generating...</> : '✨ Generate with AI'}
              </button>
            </div>
            {descToast === 'success' && (
              <div style={{ fontSize: 12, color: 'var(--green-600)', marginBottom: 6 }}>✅ Description generated! You can edit it before saving.</div>
            )}
            {descToast === 'error' && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 6 }}>❌ Could not generate description — please write manually.</div>
            )}
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the property, surroundings, amenities... or click Generate with AI ✨"
              rows={4} />
          </div>

          {/* Price with AI estimator */}
          <div className="form-row">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ margin: 0 }}>Price (₹) *</label>
                <button type="button"
                  onClick={handleEstimatePrice}
                  disabled={priceLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', fontSize: 12, fontWeight: 600,
                    background: priceLoading ? 'var(--cream-200)' : 'linear-gradient(90deg, #d97706, #7c3aed)',
                    color: priceLoading ? 'var(--text-muted)' : 'var(--text-on-dark)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: priceLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {priceLoading ? <><span className="spinner spinner-sm" /> Estimating...</> : '✨ Estimate Price'}
                </button>
              </div>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                placeholder="e.g. 25000" required />

              {/* Price estimate result box */}
              {priceEstimate && !priceEstimate.error && (
                <div style={{ marginTop: 10, background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                    💡 AI Price Estimate
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold-400)', marginBottom: 4 }}>
                    ₹{Number(priceEstimate.estimatedMin).toLocaleString('en-IN')} — ₹{Number(priceEstimate.estimatedMax).toLocaleString('en-IN')}
                    {form.listingType === 'RENT' ? '/month' : ' (sale)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{priceEstimate.explanation}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    ℹ️ This is an estimate only. Set your own price above.
                  </div>
                </div>
              )}
              {priceEstimate?.error && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>❌ {priceEstimate.error}</div>
              )}
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

        {/* Location */}
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Location</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Address / Area *</label>
              <input name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Saravanampatti, Coimbatore" required />
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

        {/* Property Details */}
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
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
              <label>Furnishing</label>
              <select name="furnishing" value={form.furnishing} onChange={handleChange}>
                <option value="">Select furnishing</option>
                {FURNISHING_OPTIONS.map(f => <option key={f}>{f}</option>)}
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
              <label>Bathrooms</label>
              <select name="bathrooms" value={form.bathrooms} onChange={handleChange}>
                <option value="">Select</option>
                {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Area (sqft)</label>
              <input type="number" name="area" value={form.area} onChange={handleChange} placeholder="e.g. 1200" />
            </div>
          </div>
          <div className="form-group">
            <label>Property Image URL</label>
            <input type="text" name="imageUrl" value={form.imageUrl} onChange={handleChange}
              placeholder="https://example.com/house.jpg" />
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

        {/* Agent preference */}
        <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Agent Preference</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${!form.selfSell ? 'var(--green-500)' : 'var(--border)'}`, background: !form.selfSell ? 'var(--green-50)' : 'transparent' }}>
              <input type="radio" name="agentPref" checked={!form.selfSell}
                onChange={() => setForm(f => ({ ...f, selfSell: false }))} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>🏗️ Request an Agent</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Agents can see this listing and accept to manage inquiries, visits, and negotiations on your behalf. Recommended for best results.
                </div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.selfSell ? 'var(--green-600)' : 'var(--border)'}`, background: form.selfSell ? 'var(--green-50)' : 'transparent' }}>
              <input type="radio" name="agentPref" checked={form.selfSell}
                onChange={() => setForm(f => ({ ...f, selfSell: true }))} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>🏡 Self Manage</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Handle all customer communication yourself. No agent fee, but you are responsible for managing inquiries and visits.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/owner/properties')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Listing...</> : '🏠 List My Property'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
}