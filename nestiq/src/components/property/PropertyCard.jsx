import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TrustBadge from './TrustBadge'
import { formatPrice } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
  "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
  "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&q=80",
]

export default function PropertyCard({ property }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    id, title, price, location, city, propertyType,
    bhk, bathrooms, area, trustScore, listingType, agentName, images, image,
    agentVerified, agentRequestStatus, kycStatus, ownerName
  } = property

  const wishlistKey = user?.userId ? `nestiq_wishlist_${user.userId}` : 'nestiq_wishlist_guest'

  const primaryImg = (images && images[0]) || image || FALLBACK_IMAGES[id % FALLBACK_IMAGES.length]
  const [imgSrc, setImgSrc] = useState(primaryImg)
  const [imgError, setImgError] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    try {
      const savedIds = JSON.parse(localStorage.getItem(wishlistKey) || '[]')
      setIsSaved(savedIds.map(Number).includes(Number(id)))
    } catch {
      setIsSaved(false)
    }
  }, [wishlistKey, id])

  const showVerifiedRibbon = agentVerified || kycStatus === 'VERIFIED'

  // Estimate a local price verdict for visual display parity
  const base = { Chennai: 22, Coimbatore: 15, Madurai: 12, Tiruchirappalli: 11, Salem: 10, Tiruppur: 10.5, Vellore: 9.5 }[city] || 12
  const bhkVal = bhk || 2
  const areaVal = area || 1000
  const estimated = base * areaVal * (0.8 + bhkVal * 0.1)
  const diff = (((price || estimated) - estimated) / estimated) * 100

  let verdict = 'Fairly Priced'
  let verdictColor = 'var(--green-700)'
  if (diff < -10) {
    verdict = 'Great Deal'
    verdictColor = 'var(--green-600)'
  } else if (diff > 15) {
    verdict = 'Above Market'
    verdictColor = 'var(--gold-400)'
  }

  const agentInitial = agentName ? agentName.charAt(0).toUpperCase() : 'O'

  return (
    <div 
      className="card"
      onClick={() => navigate(`/properties/${id}`)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: 'var(--cream-100)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'var(--transition-smooth)',
        position: 'relative',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.14)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      {/* Property Image Container */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        
        {/* Wishlist Heart Icon */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
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
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 20,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            fontSize: 16
          }}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>

        {/* VERIFIED ribbon */}
        {showVerifiedRibbon && (
          <div className="ribbon-verified" style={{ position: 'absolute', top: 14, left: -4, zIndex: 10 }}>
            ✓ VERIFIED
          </div>
        )}

        {/* Listing Type Badge */}
        <span 
          className={`badge badge-${listingType === 'SALE' ? 'sale' : 'rent'}`}
          style={{ position: 'absolute', top: 14, left: showVerifiedRibbon ? 96 : 12, zIndex: 10, fontSize: 9, fontWeight: 700 }}
        >
          FOR {listingType}
        </span>

        {/* Trust Score badge */}
        {trustScore !== undefined && (
          <span style={{ position: 'absolute', top: 14, right: 60, zIndex: 10 }}>
            <TrustBadge score={trustScore} showModal={false} size="sm" />
          </span>
        )}

        {/* Image count indicator */}
        {images && images.length > 1 && (
          <span style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.65)', color: 'var(--text-on-dark)', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, zIndex: 10 }}>
            📷 {images.length}
          </span>
        )}

        {!imgError ? (
          <img
            src={imgSrc}
            alt={title}
            onError={() => {
              setImgSrc("data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width%3D'100' height%3D'100' viewBox%3D'0 0 100 100'%3E%3Crect width%3D'100%25' height%3D'100%25' fill%3D'%23f0faf4'%2F%3E%3Ctext x%3D'50%25' y%3D'50%25' font-size%3D'30' text-anchor%3D'middle' dy%3D'.3em'%3E🏠%3C%2Ftext%3E%3C%2Fsvg%3E")
              setImgError(true)
            }}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              display: 'block', 
              transition: 'transform 0.4s'
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--cream-200), var(--green-100))', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <span style={{ fontSize: 52, opacity: 0.3 }}>🏠</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(13, 43, 26, 0.8), transparent)', zIndex: 2 }} />
      </div>

      {/* Details Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 
          style={{ 
            fontSize: 16, 
            fontWeight: 700,
            marginBottom: 4, 
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
          }}
          title={title}
        >
          {title}
        </h3>
        
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          📍 {location}, {city}
        </p>

        {/* Price Hero Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-600)' }}>
            {formatPrice(price)}
          </span>
          {listingType === 'RENT' ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/mo</span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sale Price</span>
          )}
          
          <span 
            className="tag" 
            style={{ 
              marginLeft: 'auto', fontSize: 11, fontWeight: 700, 
              padding: '2px 8px', borderRadius: 4, background: `${verdictColor}15`, color: verdictColor 
            }}
          >
            {verdict}
          </span>
        </div>

        {/* Feature chips row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className="feature-pill">🛏️ {bhkVal} BHK</span>
          <span className="feature-pill">🚿 {bathrooms || 1} Bath</span>
          <span className="feature-pill">📐 {areaVal} sqft</span>
        </div>

        {/* Agent status chip */}
        {agentRequestStatus && agentRequestStatus !== 'OPEN' && (
          <div style={{ marginBottom: 14 }}>
            {agentRequestStatus === 'ASSIGNED' ? (
              <span className="agent-chip agent-chip-assigned">🟢 Agent Managed</span>
            ) : (
              <span className="agent-chip agent-chip-self">🏡 Owner Direct</span>
            )}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '12px 0 14px' }}></div>

        {/* Agent Info footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
          {agentName || ownerName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="agent-avatar" style={{ width: 32, height: 32, fontSize: 13, fontWeight: 700 }}>
                {agentInitial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {agentName || ownerName}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {agentName ? 'Broker representation' : 'Landlord direct'}
                </span>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
              🏡 Direct Listing
            </span>
          )}

          <button 
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(`/properties/${id}`)
            }}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
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