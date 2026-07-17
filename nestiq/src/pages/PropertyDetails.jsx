import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import TrustBadge from '../components/property/TrustBadge'
import AiChatWidget from '../components/property/AiChatWidget'
import PropertyCard from '../components/property/PropertyCard'
import Modal from '../components/common/Modal'
import { getPublicProperty, getPublicProperties } from '../services/propertyService'
import { sendInquiry } from '../services/inquiryService'
import { bookVisit } from '../services/visitService'
import { getFairPrice, getTrustBreakdown, getPricePrediction } from '../services/aiService'
import { useAuth } from '../context/AuthContext'
import { formatPrice, formatDate } from '../utils/formatters'
import { properties } from '../data/properties'
import { StatusBadge } from '../components/property/PropertyTable'
import api from '../services/axiosConfig'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
]

// Frontend Loan EMI Calculator Widget
function LoanCalculator({ propertyPrice }) {
  const [downPayment, setDownPayment] = useState(Math.round(propertyPrice * 0.20))
  const [interestRate, setInterestRate] = useState(8.5)
  const [loanTerm, setLoanTerm] = useState(20)

  const loanAmount = Math.max(0, propertyPrice - downPayment)
  const monthlyRate = (interestRate / 12) / 100
  const totalMonths = loanTerm * 12

  let emi = 0
  if (monthlyRate > 0) {
    emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
  } else {
    emi = Math.round(loanAmount / totalMonths)
  }

  return (
    <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, marginTop: 24, boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>🧮 Home Loan EMI Calculator</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Estimate your monthly mortgage outflow based on current rates.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Down Payment (₹)</label>
          <input type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Interest Rate (% p.a.)</label>
          <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
          Loan Term: <strong>{loanTerm} Years</strong>
        </label>
        <input 
          type="range" 
          min="5" 
          max="30" 
          step="5" 
          value={loanTerm} 
          onChange={e => setLoanTerm(Number(e.target.value))} 
          style={{ width: '100%', accentColor: 'var(--green-600)' }}
        />
      </div>

      <div style={{ background: 'var(--green-50)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--green-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Estimated Monthly EMI</span>
          <strong style={{ fontSize: 22, color: 'var(--green-700)', fontWeight: 800 }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(emi)}</strong>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
          Principal: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(loanAmount)}
        </div>
      </div>
    </div>
  )
}

export default function PropertyDetails() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [property,       setProperty]       = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [inquiryModal,   setInquiryModal]   = useState(false)
  const [visitModal,     setVisitModal]     = useState(false)
  const [message,        setMessage]        = useState('')
  const [visitDate,      setVisitDate]      = useState('')
  const [visitTime,      setVisitTime]      = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [feedback,       setFeedback]       = useState('')
  const [activeImg,      setActiveImg]      = useState(0)
  const [imgErrors,      setImgErrors]      = useState({})
  const [fairPrice, setFairPrice] = useState(null)
  const [pricePrediction, setPricePrediction] = useState(null)
  const [trustBreakdown, setTrustBreakdown] = useState(null)
  const [duplicateCheck, setDuplicateCheck] = useState(null)
  const [fraudDismissed, setFraudDismissed] = useState(false)
  const [similar,        setSimilar]        = useState([])
  const [trustModalOpen, setTrustModalOpen] = useState(false)
  const wishlistKey = user?.userId ? `nestiq_wishlist_${user.userId}` : 'nestiq_wishlist_guest'
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem(wishlistKey) || '[]')
      setIsSaved(savedIds.map(Number).includes(Number(id)))
    } catch {
      setIsSaved(false)
    }
  }, [wishlistKey, id])

  const [reviews, setReviews] = useState([])
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewError('')
    setSubmittingReview(true)
    try {
      const res = await api.post('/reviews', {
        propertyId: Number(id),
        rating: newRating,
        comment: newComment
      })
      setReviews(prev => [...prev, res.data])
      setNewComment('')
      // Refetch trust breakdown to reflect updated reviews rating in the score
      getTrustBreakdown(Number(id)).then(setTrustBreakdown).catch(() => {})
    } catch (err) {
      setReviewError(err.response?.data?.message || err.response?.data || err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setFeedback('')
    setMessage('')
    setVisitDate('')
    setVisitTime('')
    setActiveImg(0)
    setImgErrors({})
    setFraudDismissed(false)
    setFairPrice(null)
    setTrustBreakdown(null)
    setDuplicateCheck(null)

    getPublicProperty(id)
      .then(res => {
        const data  = res.data
        const local = properties.find(p => String(p.id) === String(id))
        const fullProperty = local ? {
          ...local,
          ...data,
          images:        data.images        || local.images        || [data.image || local.image],
          sellerCompany: data.sellerCompany || local.sellerCompany,
          sellerPhone:   data.sellerPhone   || local.sellerPhone,
          sellerEmail:   data.sellerEmail   || local.sellerEmail,
          amenities:     data.amenities     || local.amenities     || [],
          agentPhone:    data.agentPhone    || local.agentPhone,
          agentEmail:    data.agentEmail    || local.agentEmail,
        } : data
        setProperty(fullProperty)

        getPublicProperties({ city: data.city })
          .then(simRes => {
            const list = simRes.data?.content || simRes.data || []
            setSimilar(list.filter(p => String(p.id) !== String(id)).slice(0, 3))
          })
          .catch(() => {})
      })
      .catch(() => {
        const local = properties.find(p => String(p.id) === String(id))
        setProperty(local || null)
      })
      .finally(() => setLoading(false))

    // Fetch reviews on load
    api.get(`/reviews/${id}`)
      .then(res => setReviews(res.data || []))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!property) return
    getFairPrice(property).then(setFairPrice).catch(() => {})
    getTrustBreakdown(property.id, property).then(setTrustBreakdown).catch(() => {})
    
    // Fetch ML price prediction if authenticated
    if (localStorage.getItem('token')) {
      const amenitiesStr = Array.isArray(property.amenities)
        ? property.amenities.join(', ')
        : (property.amenities || '');
      getPricePrediction({
        city: property.city || 'Chennai',
        district: property.location || '',
        bhk: property.bedrooms || property.bhk || 2,
        area: property.area || 1000,
        furnished: property.furnishing || 'Semi Furnished',
        parking: amenitiesStr.toLowerCase().includes('parking')
      }).then(setPricePrediction).catch(() => {})
    }
  }, [property])

  useEffect(() => {
    if (!id) return
    if (user) {
      api.get(`/ai/duplicate-check/${id}`)
        .then(res => setDuplicateCheck(res.data))
        .catch(() => setDuplicateCheck(null))
    } else {
      setDuplicateCheck(null)
    }
  }, [id, user])

  const handleInquiry = async () => {
    if (!user) { navigate('/customer/login'); return }
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await api.post('/inquiries', { propertyId: property.id, message })
      setFeedback('✅ Inquiry sent successfully! The agent will respond within 24 hours.')
      setInquiryModal(false)
      setMessage('')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to send inquiry'
      setFeedback(`❌ ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVisit = async () => {
    if (!user) { navigate('/customer/login'); return }
    if (!visitDate || !visitTime) return
    
    const selectedDate = new Date(visitDate + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      setFeedback('❌ Visit date cannot be in the past.')
      setVisitModal(false)
      return
    }

    setSubmitting(true)
    try {
      await api.post('/visits', { propertyId: property.id, visitDate, timeSlot: visitTime })
      setFeedback('✅ Visit booked! The agent will confirm within 24 hours.')
      setVisitModal(false)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to book visit'
      setFeedback(`❌ ${msg}`)
      setVisitModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInquiryClick = () => {
    if (!user) {
      setFeedback('❌ Please log in as a customer to send an inquiry.')
      return
    }
    if (user.role !== 'CUSTOMER') {
      setFeedback('❌ Only customers can send inquiries.')
      return
    }
    setInquiryModal(true)
  }

  const handleVisitClick = () => {
    if (!user) {
      setFeedback('❌ Please log in as a customer to book a visit.')
      return
    }
    if (user.role !== 'CUSTOMER') {
      setFeedback('❌ Only customers can book visits.')
      return
    }
    setVisitModal(true)
  }

  if (loading) return (
    <MainLayout>
      <div className="loading-page"><div className="spinner" /></div>
    </MainLayout>
  )

  if (!property) return (
    <MainLayout>
      <div className="empty-state" style={{ paddingTop: 120 }}>
        <div className="empty-icon">🏠</div>
        <p>Property not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/properties')}>
          Browse All Properties
        </button>
      </div>
    </MainLayout>
  )

  const allImages = property.images?.length > 0
    ? property.images
    : [property.image || FALLBACK_IMAGES[Number(id) % FALLBACK_IMAGES.length]]

  const chips = [
    property.bhk      > 0 && { icon: '🛏', label: `${property.bhk} BHK` },
    property.bedrooms > 0 && !property.bhk && { icon: '🛏', label: `${property.bedrooms} BHK` },
    { icon: '🚿', label: `${property.bathrooms || 2} Bath` },
    property.area && { icon: '📐', label: `${property.area} sqft` },
    property.propertyType && { icon: '🏗', label: property.propertyType },
    property.furnishing && { icon: '🪑', label: property.furnishing },
    property.facing     && { icon: '🧭', label: `${property.facing} Facing` },
  ].filter(Boolean)

  const getImgSrc = i => {
    if (imgErrors[i]) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" style="background:%23f4f6f4"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80">🏠</text></svg>`
    }
    return allImages[i] || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]
  }

  const currentScore = property.trustScore !== undefined && property.trustScore !== null ? property.trustScore : (trustBreakdown?.totalScore || 70)
  const scoreColor = currentScore >= 80 ? 'var(--green-600)' : (currentScore >= 50 ? '#eab308' : '#ef4444')
  const hideActionButtons = user && (
    user.role === 'ADMIN' || 
    (property?.ownerId && Number(user.userId) === Number(property.ownerId)) || 
    (property?.agentId && Number(user.userId) === Number(property.agentId))
  )

  const hasAgentContact = property.agentPhone && property.agentEmail
  const displayPhone = hasAgentContact ? property.agentPhone : property.sellerPhone
  const displayEmail = hasAgentContact ? property.agentEmail : property.sellerEmail
  const displayName = hasAgentContact ? (property.agentName || 'Lister Broker') : (property.ownerName || 'Property Owner')
  const callLabel = hasAgentContact ? 'Call Broker' : 'Call Verified Owner'
  const agentInitial = displayName.charAt(0).toUpperCase()

  const getInvestmentScore = () => {
    switch (property.city) {
      case 'Chennai': return { score: 88, appreciation: '8.4%', liquidity: 'High', outlook: 'Bullish' }
      case 'Coimbatore': return { score: 82, appreciation: '7.2%', liquidity: 'High', outlook: 'Stable' }
      case 'Madurai': return { score: 72, appreciation: '5.8%', liquidity: 'Moderate', outlook: 'Neutral' }
      case 'Salem': return { score: 75, appreciation: '6.1%', liquidity: 'Low', outlook: 'Steady' }
      default: return { score: 70, appreciation: '6.0%', liquidity: 'Moderate', outlook: 'Stable' }
    }
  }
  const inv = getInvestmentScore()

  return (
    <MainLayout>
      <div style={{ paddingTop: 'var(--navbar-height)', background: 'var(--green-50)', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px' }}>
          
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'var(--green-600)', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link to="/properties" style={{ color: 'var(--green-600)', textDecoration: 'none' }}>Properties</Link>
            <span>›</span>
            <Link to={`/properties?city=${property.city}`} style={{ color: 'var(--green-600)', textDecoration: 'none' }}>{property.city}</Link>
            <span>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{property.title?.substring(0, 45)}</span>
          </div>



          {/* Price Anomaly Alert */}
          {fairPrice && fairPrice.percentDiff < -20 && !fraudDismissed && (
            <div style={{
              background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '16px 20px', marginBottom: 28,
              display: 'flex', alignItems: 'flex-start', gap: 14,
              boxShadow: 'var(--shadow-sm)',
              animation: 'slideUpFade 0.4s ease forwards'
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, fontSize: 14.5 }}>
                  Price Anomaly Flag Triggered
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  This listing is valued at <strong>{Math.abs(fairPrice.percentDiff)}% below</strong> sub-market average rates 
                  (Estimated average: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fairPrice.estimatedPrice)}). 
                  NestIQ recommends verifying property papers and scheduling physical visits before transactions.
                </div>
              </div>
              <button onClick={() => setFraudDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 18, padding: 4 }}>✕</button>
            </div>
          )}

          {/* Details Layout */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}
            className="detail-grid"
          >
            {/* Left Brochure Column */}
            <div>
              {/* Premium 99acres Gallery Photo Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2.2fr 1fr',
                gap: 12,
                height: 400,
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                marginBottom: 28,
                boxShadow: 'var(--shadow-md)',
                position: 'relative'
              }}>
                {/* Large Main Photo */}
                <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={getImgSrc(activeImg)}
                    alt={property.title}
                    onError={() => setImgErrors(e => ({ ...e, [activeImg]: true }))}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }}
                  />
                  
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveImg(prev => (prev - 1 + allImages.length) % allImages.length)
                        }}
                        style={{
                          position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-md)', fontWeight: 'bold', fontSize: 16
                        }}
                      >
                        ⟨
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setActiveImg(prev => (prev + 1) % allImages.length)
                        }}
                        style={{
                          position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-md)', fontWeight: 'bold', fontSize: 16
                        }}
                      >
                        ⟩
                      </button>
                    </>
                  )}

                  <span
                    className={`badge badge-${property.listingType === 'SALE' ? 'sale' : 'rent'}`}
                    style={{ position: 'absolute', top: 20, left: 20, fontSize: 12, padding: '6px 14px', zIndex: 5 }}
                  >
                    FOR {property.listingType}
                  </span>
                </div>
                
                {/* Secondary Photos Column */}
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12, height: '100%' }}>
                  <div 
                    onClick={() => setActiveImg((activeImg + 1) % allImages.length)}
                    style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                  >
                    <img
                      src={getImgSrc((activeImg + 1) % allImages.length)}
                      alt={property.title}
                      onError={() => setImgErrors(e => ({ ...e, [(activeImg + 1) % allImages.length]: true }))}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </div>
                  <div 
                    onClick={() => setActiveImg((activeImg + 2) % allImages.length)}
                    style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                  >
                    <img
                      src={getImgSrc((activeImg + 2) % allImages.length)}
                      alt={property.title}
                      onError={() => setImgErrors(e => ({ ...e, [(activeImg + 2) % allImages.length]: true }))}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', filter: allImages.length > 3 ? 'brightness(0.5)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {allImages.length > 3 && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-on-dark)', fontWeight: 800, fontSize: 18, textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        pointerEvents: 'none'
                      }}>
                        +{allImages.length - 2} Photos
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3D Floor Plan Layout */}
              {property.floorPlanImage && (
                <div style={{
                  background: 'var(--cream-100)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  marginBottom: 28,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📐</span> Interactive 3D Floor Plan Layout
                  </h3>
                  <div style={{
                    width: '100%',
                    maxHeight: 450,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12
                  }}>
                    <img 
                      src={property.floorPlanImage} 
                      alt={`${property.title} 3D Floor Plan`} 
                      style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              {/* Sticky Sub-navigation Tabs */}
              <div className="sticky-tabs" style={{
                position: 'sticky',
                top: 'calc(var(--navbar-height) + 12px)',
                zIndex: 10,
                background: 'var(--sticky-tab-bg)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                display: 'flex',
                gap: 4,
                marginBottom: 24,
                boxShadow: 'var(--shadow-sm)',
                overflowX: 'auto',
                scrollbarWidth: 'none'
              }}>
                <a href="#overview" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 'var(--radius-sm)', background: 'var(--green-600)', color: 'var(--text-on-dark)', transition: 'var(--transition-smooth)' }}>Overview</a>
                <a href="#highlights" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-smooth)' }}>Highlights</a>
                <a href="#facts" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-smooth)' }}>Facts</a>
                <a href="#trust" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-smooth)' }}>Trust Dial & AI</a>
                <a href="#nearby" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-smooth)' }}>Nearby</a>
                <a href="#amenities" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-smooth)' }}>Amenities</a>
                <a href="#calculator" style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', transition: 'var(--transition-smooth)' }}>EMI Calc</a>
              </div>

              {/* Title & Location Info */}
              <div id="overview" style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 32, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
                  <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
                      {property.title}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>📍</span> {property.location || property.address}, <span className="tag" style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{property.city}</span>
                      {property.createdAt && <span style={{ color: 'var(--border)' }}>·</span>}
                      {property.createdAt && <span>Added {formatDate(property.createdAt)}</span>}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--green-700)', margin: 0 }}>
                      {formatPrice(property.price)}
                    </p>
                    {property.listingType === 'RENT' && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>per month</span>
                    )}
                    <span className={`badge badge-${property.status === 'AVAILABLE' ? 'green' : property.status === 'RESERVED' ? 'red' : 'gold'}`} style={{ fontSize: 11, padding: '4px 10px', textTransform: 'uppercase', fontWeight: 800 }}>
                      {property.status}
                    </span>
                  </div>
                </div>

                {/* Specs tag badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  {chips.map(c => (
                    <span
                      key={c.label}
                      className="feature-pill"
                    >
                      {c.icon} {c.label}
                    </span>
                  ))}
                </div>

                {/* Security Verification Badges */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    🛡️ Ecosystem Security Badges
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {property.ownerId && property.kycStatus === 'VERIFIED' && (
                      <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 10px' }}>👑 Verified Owner</span>
                    )}
                    {property.agentId && property.agentVerified && (
                      <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 10px' }}>💼 Verified Agent</span>
                    )}
                    {property.kycStatus === 'SUBMITTED' && (
                      <span className="badge badge-gold" style={{ fontSize: 11, padding: '4px 10px' }}>⏳ Document Pending</span>
                    )}
                    {currentScore >= 80 && (
                      <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 10px' }}>🛡️ Verified Property</span>
                    )}
                    {property.reraNumber && (
                      <span className="badge badge-green" style={{ fontSize: 11, padding: '4px 10px' }}>📄 Verified RERA Doc</span>
                    )}
                    {fairPrice?.percentDiff < -30 && (
                      <span className="badge badge-red" style={{ fontSize: 11, padding: '4px 10px' }}>🚨 Fraud Warning</span>
                    )}
                    {fairPrice?.percentDiff < -20 && (
                      <span className="badge badge-red" style={{ fontSize: 11, padding: '4px 10px' }}>📉 Price Anomaly</span>
                    )}
                    {duplicateCheck?.status === 'DUPLICATE' && (
                      <span className="badge badge-red" style={{ fontSize: 11, padding: '4px 10px' }}>⚠️ Duplicate Listing</span>
                    )}
                    {currentScore < 40 && (
                      <span className="badge badge-red" style={{ fontSize: 11, padding: '4px 10px' }}>⚠️ Suspicious Listing</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Highlights Section */}
              <div id="highlights" style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🎯 Property Highlights</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <span>📍</span> Location: {property.location || property.city}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <span>📐</span> Size: {property.area} sqft Built-up Area
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <span>🛡️</span> Trust Score: {currentScore}% ({trustBreakdown?.status || 'Trusted'})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <span>🪑</span> Furnishing: {property.furnishing || 'Semi Furnished'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <span>🧭</span> Facing: {property.facing || 'East'} Facing Layout
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                    <span>🏗️</span> Category: {property.propertyType || 'Apartment'} ({property.listingType})
                  </div>
                </div>
              </div>

              {/* Property Facts Section */}
              <div id="facts" style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Property Facts & Technical Data</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {[
                    { label: 'Property Type', val: property.propertyType || 'Residential' },
                    { label: 'Listing Mode', val: property.listingType === 'SALE' ? 'Sale Asset' : 'Rental Lease' },
                    { label: 'BHK Count', val: `${property.bhk || 2} Bedrooms` },
                    { label: 'Bathrooms', val: `${property.bathrooms || 2} Units` },
                    { label: 'Built Area', val: `${property.area} sq.ft.` },
                    { label: 'Furnishing State', val: property.furnishing || 'Semi Furnished' },
                    { label: 'Facing Orientation', val: property.facing || 'East Facing' },
                    { label: 'Floor Position', val: `${property.floor != null ? property.floor : 'Ground'} of ${property.totalFloors || 2}` },
                    { label: 'Listing Status', val: property.status || 'AVAILABLE' }
                  ].map(fact => (
                    <div key={fact.label} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                      <span style={{ fontSize: 11.5, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>{fact.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2, display: 'block' }}>{fact.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust & Audit Verification Timeline */}
              <div style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>📜 Platform Audit & Verification Timeline</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Listing Created', status: '✓ Complete', desc: 'Property registered in the NestIQ decentralised catalog.', date: property.createdAt ? formatDate(property.createdAt) : 'Active' },
                    { label: 'RERA Registry Check', status: property.area > 5382 ? (property.reraNumber ? '✓ RERA Compliant' : '⏳ Action Required') : '✓ Exempt (< 500 sq.m)', desc: property.area > 5382 ? `RERA registration ID: ${property.reraNumber || 'Missing'}` : 'Not required under Real Estate Regulation rules.' },
                    { label: 'Lister Document Audit', status: (property.agentVerified || property.kycStatus === 'VERIFIED') ? '✓ Document Verified' : '⏳ Pending KYC Upload', desc: 'Lister credentials cross-checked against database records.' },
                    { label: 'Price Valuation Check', status: fairPrice?.percentDiff < -20 ? '⚠️ Valuation Warning' : '✓ Pricing Normal', desc: fairPrice ? `Valuation is ${fairPrice.verdict}.` : 'Comparing with sub-market averages.' }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', 
                          background: step.status.startsWith('✓') ? 'var(--green-600)' : step.status.startsWith('⏳') ? 'var(--gold-400)' : '#e74c3c',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12
                        }}>
                          {idx + 1}
                        </div>
                        {idx < 3 && <div style={{ width: 2, height: 32, background: 'var(--border)', marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: idx < 3 ? 12 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{step.label}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: step.status.startsWith('✓') ? 'var(--green-700)' : step.status.startsWith('⏳') ? 'var(--gold-700)' : '#c0392b' }}>{step.status}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conic Trust score layout */}
              <div
                id="trust"
                onClick={() => setTrustModalOpen(true)}
                style={{
                  background: 'var(--cream-100)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '24px 32px', marginBottom: 24,
                  boxShadow: 'var(--shadow-sm)', cursor: 'pointer', position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                className="hover-card-grow"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                  {/* Conic dial */}
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `conic-gradient(${scoreColor} ${currentScore * 3.6}deg, var(--cream-200) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                  }}>
                    <div style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: 'var(--cream-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {currentScore}%
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      Live Trust Score <span>🛡️</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                      Evaluated across lister identity verification, duplicate listing detectors, pricing outliers, and listing specifications. Click to audit.
                    </div>
                  </div>
                  
                  <TrustBadge
                    score={currentScore}
                    breakdown={trustBreakdown}
                    size="md"
                  />
                </div>

                {/* Trust component progress bars */}
                {trustBreakdown && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 12 }}>
                    {[
                      { label: 'Listing completeness', val: trustBreakdown.listingQuality, max: 25 },
                      { label: 'Document verification', val: trustBreakdown.documentVerification, max: 25 },
                      { label: 'Agent/lister activity', val: trustBreakdown.agentActivity, max: 20 },
                      { label: 'Fraud & price signals', val: trustBreakdown.fraudSignals, max: 15 }
                    ].map(comp => (
                      <div key={comp.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          <span>{comp.label}</span>
                          <span>{comp.val} / {comp.max}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--cream-200)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--green-600)', width: `${(comp.val / comp.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div 
                  onClick={() => setTrustModalOpen(true)}
                  style={{ textAlign: 'right', fontSize: 12, color: 'var(--green-700)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  🔍 View Detailed Audit & Scam Prevention Report
                </div>
              </div>

              {/* Investment & Fair Price Analyzer Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, marginBottom: 24 }} className="trends-main-grid">
                
                {/* Fair Price comparison */}
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>💰 Sub-Market Price Analysis</h3>
                  {fairPrice ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Listed Price:</span>
                        <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{formatPrice(fairPrice.listedPrice)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Estimated Fair Avg:</span>
                        <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{formatPrice(fairPrice.estimatedPrice)}</strong>
                      </div>
                      {pricePrediction && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI Predicted Rent:</span>
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <strong style={{ fontSize: 14, color: 'var(--green-700)' }}>{formatPrice(pricePrediction.predicted_rent)}/mo</strong>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>via {pricePrediction.engine}</span>
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Market Position:</span>
                        <span style={{
                          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: fairPrice.color === '#16a34a' ? '#dcfce7' : '#fef3c7',
                          color: fairPrice.color === '#16a34a' ? '#16a34a' : '#d97706'
                        }}>
                          {fairPrice.verdict}
                        </span>
                      </div>
                      <div style={{ marginTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                          <span>Below Avg</span>
                          <span>Fair Market Price</span>
                          <span>Above Avg</span>
                        </div>
                        <div style={{ height: 6, background: 'linear-gradient(90deg, #10b981 0%, #34d399 35%, #22c55e 50%, #facc15 75%, #ef4444 100%)', borderRadius: 999, position: 'relative' }}>
                          <div 
                            style={{ 
                              position: 'absolute', 
                              top: '50%', 
                              left: `${Math.min(Math.max(50 + (fairPrice.percentDiff || 0), 10), 90)}%`, 
                              transform: 'translate(-50%, -50%)',
                              width: 14, 
                              height: 14, 
                              background: 'var(--text-on-dark)', 
                              border: `3px solid ${fairPrice.color || '#22c55e'}`,
                              borderRadius: '50%',
                              boxShadow: 'var(--shadow-sm)',
                              transition: 'left 0.3s ease'
                            }} 
                            title={`Listed Price is ${fairPrice.percentDiff}% from Average`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="skeleton" style={{ height: 100 }} />
                  )}
                </div>

                {/* Investment score card */}
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>⭐ Locality Investment Score</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', background: 'var(--green-900)', color: 'var(--gold-400)',
                      display: 'flex', alignItems: 'center', justifyObject: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, boxShadow: 'var(--shadow-sm)'
                    }}>
                      {inv.score}%
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Appreciation: +{inv.appreciation}/yr</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Liquidity: {inv.liquidity} | Outlook: {inv.outlook}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Listing Authenticity Check Card */}
              {duplicateCheck && (
                <div
                  id="listing-authenticity"
                  style={{
                    background: 'var(--cream-100)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '24px 32px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 24,
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--cream-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                  }}>
                    🛡️
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Listing Authenticity
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: duplicateCheck.color === 'green' ? '#dcfce7' : duplicateCheck.color === 'orange' ? '#ffedd5' : '#fee2e2',
                        color: duplicateCheck.color === 'green' ? '#16a34a' : duplicateCheck.color === 'orange' ? '#ea580c' : '#dc2626'
                      }}>
                        {duplicateCheck.status === 'UNIQUE' ? 'UNIQUE' : duplicateCheck.status === 'SIMILAR' ? 'SIMILAR LISTINGS FOUND' : 'DUPLICATE RISK'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                      {duplicateCheck.message}
                    </div>
                  </div>
                </div>
              )}

              {/* Nearby Places Section */}
              <div id="nearby" style={{ background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>🏫 Nearby Institutions & Infrastructure</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ border: '1px solid var(--border)', padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--cream-50)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>🏫 Educational Hubs</div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CBSE International and matriculation schools within 1.5km.</span>
                  </div>
                  <div style={{ border: '1px solid var(--border)', padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--cream-50)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>🏥 Emergency Care</div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Multi-specialty hospitals and clinics within 2.0km.</span>
                  </div>
                  <div style={{ border: '1px solid var(--border)', padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--cream-50)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>🚇 Transit Corridors</div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Metro stations and local bus terminals reachable within 800m.</span>
                  </div>
                  <div style={{ border: '1px solid var(--border)', padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--cream-50)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>🛍️ Shopping & Food Courts</div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Supermarkets and restaurant hubs accessible within 1km.</span>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div id="reviews" style={{
                background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', padding: '28px 32px', marginBottom: 24,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  ⭐ Customer Reviews ({reviews.length})
                </h3>

                {/* List of reviews */}
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14.5, marginBottom: 24 }}>No reviews yet for this property.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ padding: '14px 16px', background: 'var(--cream-200)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>
                              {r.customerName ? r.customerName.split(' ')[0] : 'Customer'}
                            </strong>
                            <span style={{ color: 'var(--gold-400)', fontSize: 14, marginLeft: 8 }}>
                              {'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}
                            </span>
                          </div>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Form */}
                {user ? (
                  !reviews.some(r => r.customerEmail === user.email) ? (
                    <form onSubmit={handleReviewSubmit} style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Leave a Review</h4>
                      {reviewError && <div className="alert alert-error" style={{ marginBottom: 12, fontSize: 12.5, color: '#b91c1c' }}>{reviewError}</div>}
                      
                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6, display: 'block' }}>Rating</label>
                        <select 
                          value={newRating} 
                          onChange={e => setNewRating(Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13.5 }}
                        >
                          {[5, 4, 3, 2, 1].map(num => (
                            <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6, display: 'block' }}>Comment</label>
                        <textarea
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="Share your thoughts about this property..."
                          rows={3}
                          required
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13.5 }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview || !newComment.trim()}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 8 }}
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 13.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ✓ You have already reviewed this property. Thank you!
                    </div>
                  )
                ) : (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 13.5, color: 'var(--text-muted)' }}>
                    🔑 <Link to="/customer/login" style={{ color: 'var(--green-600)', fontWeight: 700, textDecoration: 'none' }}>Login</Link> to leave a review.
                  </div>
                )}
              </div>

              {/* AI Reasoning Explainer */}
              {property.aiExplanation && (
                <div style={{
                  background: 'var(--green-50)', border: '1px solid var(--green-200)',
                  borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800 }}>
                    🤖 Neural AI Listing Analysis
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                    "{property.aiExplanation}"
                  </p>
                </div>
              )}

              {/* Detailed Description */}
              <div id="description" style={{
                background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', padding: '28px 32px', marginBottom: 24,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ marginBottom: 14, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>About This Property</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14.5, margin: 0 }}>
                  {property.description || 'No description has been added for this listing.'}
                </p>
              </div>

              {/* Amenities */}
              {property.amenities?.length > 0 && (
                <div id="amenities" style={{
                  background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', padding: '28px 32px', marginBottom: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 800 }}>Amenities & Utilities</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {property.amenities.map(a => (
                      <span key={a} className="tag" style={{
                        background: 'var(--green-50)', border: '1px solid var(--green-200)',
                        color: 'var(--green-700)', borderRadius: 999,
                        padding: '6px 16px', fontSize: 13, fontWeight: 600
                      }}>✓ {a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loan EMI Calculator */}
              <div id="calculator">
                <LoanCalculator propertyPrice={property.price} />
              </div>

            </div>

            {/* Right Sidebar Column */}
            <div style={{ position: 'sticky', top: 96 }} className="details-sidebar">
              
              {/* Premium Agent contact card */}
              <div className="agent-contact-card" style={{ marginBottom: 20 }}>
                
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)',
                }}>
                  <div className="agent-avatar">
                    {agentInitial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {displayName}
                      {(property.agentVerified || property.kycStatus === 'VERIFIED') && (
                        <span style={{ color: 'var(--green-600)', fontSize: 13 }}>✓</span>
                      )}
                    </div>
                    
                    {/* Clickable phone & email link */}
                    {displayPhone && (
                      <a href={`tel:${displayPhone}`} style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'block', textDecoration: 'none', marginTop: 4 }}>
                        📞 +91 {displayPhone}
                      </a>
                    )}

                    {displayEmail && (
                      <a href={`mailto:${displayEmail}`} style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'block', textDecoration: 'none', marginTop: 2 }}>
                        ✉️ {displayEmail}
                      </a>
                    )}
                  </div>
                </div>

                {/* Vertical CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['RESERVED', 'SOLD', 'RENTED'].includes(property.status) && (
                    <div style={{
                      background: 'rgba(220, 38, 38, 0.08)', border: '1px solid #fee2e2', borderRadius: 'var(--radius-md)',
                      padding: '12px 16px', fontSize: 13, color: '#b91c1c', fontWeight: 700, textAlign: 'center', lineHeight: 1.5
                    }}>
                      🔒 Transaction Locked ({property.status.replace('_', ' ')})
                    </div>
                  )}

                  {feedback && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: feedback.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                      border: feedback.startsWith('✅') ? '1px solid #86efac' : '1px solid #fca5a5',
                      color: feedback.startsWith('✅') ? '#166534' : '#991b1b',
                      fontSize: 13, fontWeight: 500, marginBottom: 12
                    }}>
                      {feedback}
                    </div>
                  )}

                  {!hideActionButtons && (
                    <>
                      <button
                        className="btn btn-primary btn-full"
                        onClick={handleInquiryClick}
                        style={{ padding: '12px', fontSize: 13, justifyContent: 'center' }}
                        disabled={['RESERVED', 'SOLD', 'RENTED'].includes(property.status)}
                      >
                        💬 Send Inquiry Message
                      </button>
                      <button
                        className="btn btn-outline btn-full"
                        onClick={handleVisitClick}
                        style={{ padding: '12px', fontSize: 13, justifyContent: 'center' }}
                        disabled={['RESERVED', 'SOLD', 'RENTED'].includes(property.status)}
                      >
                        📅 Schedule Site Visit
                      </button>
                    </>
                  )}
                  
                  {displayPhone && !['SOLD', 'RENTED'].includes(property.status) && (
                    <a
                      href={`tel:${displayPhone}`}
                      className="btn btn-gold btn-full"
                      style={{ textAlign: 'center', textDecoration: 'none', justifyContent: 'center', padding: '12px', fontSize: 13 }}
                    >
                      📞 {callLabel}
                    </a>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '18px 0 14px' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>🔒</span> Your info is only shared with this verified agent
                </div>

              </div>

              {/* KYC / DOCUMENT SECTION */}
              {(property.agentVerified || property.kycStatus === 'VERIFIED') ? (
                <div style={{
                  background: 'var(--green-50)', border: '1px solid var(--green-300)',
                  borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 20,
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✅</span> Verified Lister
                  </div>
                  <strong>RERA ID:</strong> TN/RERA/AG/2024/{property.id || '0129'}<br />
                  Document verification completed by NestIQ Quality Board.
                </div>
              ) : property.kycStatus === 'SUBMITTED' ? (
                <div style={{
                  background: 'rgba(217, 119, 6, 0.1)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 20,
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⏳</span> Verification Pending
                  </div>
                  Licensing documents submitted and currently under review by NestIQ.
                </div>
              ) : null}

              {/* Share actions */}
              <div style={{
                background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', padding: 18, display: 'flex', gap: 10,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied to clipboard!') }}
                >
                  🔗 Copy Link
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    let savedIds = []
                    try {
                      savedIds = JSON.parse(localStorage.getItem(wishlistKey) || '[]').map(Number)
                    } catch {}
                    
                    const nextSaved = !isSaved
                    const numericId = Number(id)
                    if (nextSaved) {
                      if (!savedIds.includes(numericId)) {
                        savedIds.push(numericId)
                      }
                      showToast("Property saved to wishlist")
                    } else {
                      savedIds = savedIds.filter(savedId => savedId !== numericId)
                      showToast("Removed from wishlist")
                    }
                    
                    localStorage.setItem(wishlistKey, JSON.stringify(savedIds))
                    setIsSaved(nextSaved)
                  }}
                >
                  {isSaved ? '❤️ Bookmarked' : '🤍 Bookmark'}
                </button>
              </div>
            </div>
          </div>

          {/* Similar Listings */}
          {similar.length > 0 && (
            <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>
                Recommended Listings in {property.city}
              </h3>
              <div className="similar-carousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                {similar.map(p => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Inquiry Modal */}
      <Modal isOpen={inquiryModal} onClose={() => setInquiryModal(false)} title="Submit Inquiry Form">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 18 }}>
          Your details will be shared with the listing broker <strong>{property.agentName || 'Lister'}</strong>.
        </p>
        <div className="form-group">
          <label>Inquiry Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Hi, I am interested in this listing. Please let me know its next available slot for a walk-through."
            rows={4}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setInquiryModal(false)}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleInquiry}
            disabled={submitting || !message.trim()}
          >
            {submitting ? 'Submitting…' : 'Submit Inquiry'}
          </button>
        </div>
      </Modal>

      {/* Visit Modal */}
      <Modal isOpen={visitModal} onClose={() => setVisitModal(false)} title="Book Site Inspection">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 18 }}>
          Confirm your preferred inspection slot for <strong>{property.title}</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label>Inspection Date</label>
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="form-group">
            <label>Preferred Slot</label>
            <select value={visitTime} onChange={e => setVisitTime(e.target.value)}>
              <option value="">Choose slot</option>
              {['09:00 AM','11:00 AM','02:00 PM','04:00 PM','06:00 PM'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ background: 'var(--green-50)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--green-700)', fontWeight: 600 }}>
          ℹ️ The broker will receive an alert and verify this slot via email.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setVisitModal(false)}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleVisit}
            disabled={submitting || !visitDate || !visitTime}
          >
            {submitting ? 'Scheduling…' : 'Confirm Inspection'}
          </button>
        </div>
      </Modal>

      {/* Ecosystem Trust Score Detailed Audit Modal */}
      <Modal isOpen={trustModalOpen} onClose={() => setTrustModalOpen(false)} title="🛡️ Ecosystem Trust Audit Report">
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            NestIQ automatically audits listings against government RERA datasets, local average transaction records, identity checks, and fraud indicators.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {[
              { 
                title: '📋 Listing Quality', 
                score: trustBreakdown?.listingQuality || 15, 
                max: 25, 
                desc: 'Completeness of description, specifications, area parameters, and pictures.',
                tip: 'Provide accurate furnishing, facing, and bathroom counts to complete details.'
              },
              { 
                title: '📄 Document Verification', 
                score: trustBreakdown?.documentVerification || 15, 
                max: 25, 
                desc: 'Owner or broker identity registry checks against official databases (Aadhaar/PAN/GSTIN).',
                tip: property?.agentVerified || property?.kycStatus === 'VERIFIED' ? 'Identity verified successfully!' : 'Submit KYC documents in Profile Settings to unlock verification badges.'
              },
              { 
                title: '💼 Agent/Owner Activity', 
                score: trustBreakdown?.agentActivity || 12, 
                max: 20, 
                desc: 'Historical platform audit and rating indexes of the listing agent or property owner.',
                tip: 'Dealing with verified platform brokers reduces scam risks.'
              },
              { 
                title: '💰 Fraud & Price Signals', 
                score: trustBreakdown?.fraudSignals || 15, 
                max: 15, 
                desc: 'Detects valuation manipulation. Properties priced >30% below sub-market averages are flagged.',
                tip: fairPrice?.percentDiff < -30 ? 'Listed price is significantly below average. Inspect papers thoroughly.' : 'Pricing aligns with normal market bounds.'
              },
              { 
                title: '⭐ Customer Reviews', 
                score: trustBreakdown?.customerReviews || 0, 
                max: 15, 
                desc: 'Aggregated reviews and ratings left by verified viewers.',
                tip: 'Submit review ratings after your site visit to help the community.'
              }
            ].map(item => {
              const itemColor = (item.score / item.max) >= 0.8 ? 'var(--green-600)' : ((item.score / item.max) >= 0.5 ? '#eab308' : '#ef4444');
              return (
                <div key={item.title} style={{ padding: 14, background: 'var(--cream-200)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.title}</strong>
                    <span style={{ fontSize: 13, fontWeight: 700, color: itemColor }}>{item.score} / {item.max} Points</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>{item.desc}</p>
                  
                  {/* Progress Meter Bar */}
                  <div style={{ width: '100%', height: 6, background: 'var(--cream-300)', borderRadius: 3, overflow: 'hidden', margin: '8px 0' }}>
                    <div style={{ width: `${(item.score / item.max) * 100}%`, height: '100%', background: itemColor, borderRadius: 3 }} />
                  </div>

                  <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-secondary)', borderLeft: `3px solid ${itemColor}`, paddingLeft: 8, marginTop: 6 }}>
                    💡 {item.tip}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'var(--green-900)', color: '#fff', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--green-300)', marginBottom: 6 }}>🛡️ Trust Assurance Score: {currentScore}%</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
              NestIQ audits all parameters in real-time. To maximize the safety index, prioritize listings with Verified Owner/Agent badges and active RERA numbers.
            </p>
          </div>
        </div>
      </Modal>

      {/* Floating AI Agent widget */}
      {property && <AiChatWidget property={property} />}

      <style>{`
        @media (max-width: 991px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
          .details-sidebar {
            position: static !important;
            margin-top: 32px;
          }
          .similar-carousel {
            display: flex !important;
            overflow-x: auto;
            flex-wrap: nowrap;
            gap: 20px;
            scroll-snap-type: x mandatory;
            padding-bottom: 12px;
          }
          .similar-carousel > div {
            min-width: 300px;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </MainLayout>
  )
}

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