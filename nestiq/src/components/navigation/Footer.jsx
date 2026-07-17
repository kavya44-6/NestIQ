import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--green-900)', padding: '64px 0 24px', marginTop: 'auto', borderTop: '4px solid var(--gold-400)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div>
            <div style={{ color: 'var(--text-on-dark)', fontWeight: 800, fontSize: 22, marginBottom: 16 }}>🏠 NestIQ</div>
            <p style={{ color: 'rgba(232, 245, 238, 0.6)', fontSize: 14, lineHeight: 1.8, maxWidth: 300, marginBottom: 20 }}>
              The smart real estate management ecosystem. Discover, compare, and transact Tamil Nadu listings.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['𝕏', '💼', '📸', '🏠'].map((icon, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.06)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--text-on-dark)', 
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-on-dark)', fontWeight: 700, fontSize: 13, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '1px' }}>Company</h4>
            {[
              ['/', 'Home Dashboard'],
              ['/properties', 'All Listings'],
              ['/ai-matcher', '✨ Smart Matcher'],
              ['/predict-rent', 'Rent Predictions'],
              ['/price-trends', 'Appreciation Trends']
            ].map(([to, label]) => (
              <Link 
                key={to} 
                to={to} 
                style={{ display: 'block', color: 'rgba(232, 245, 238, 0.65)', fontSize: 14, marginBottom: 10, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--green-300)'}
                onMouseLeave={e => e.target.style.color = 'rgba(232, 245, 238, 0.65)'}
              >
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h4 style={{ color: 'var(--text-on-dark)', fontWeight: 700, fontSize: 13, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '1px' }}>Support</h4>
            {[
              ['/properties', 'Privacy Policy'],
              ['/properties', 'Terms of Service']
            ].map(([to, label]) => (
              <Link 
                key={label} 
                to={to} 
                style={{ display: 'block', color: 'rgba(232, 245, 238, 0.65)', fontSize: 14, marginBottom: 10, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--green-300)'}
                onMouseLeave={e => e.target.style.color = 'rgba(232, 245, 238, 0.65)'}
              >
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h4 style={{ color: 'var(--text-on-dark)', fontWeight: 700, fontSize: 13, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '1px' }}>Get Market Alerts</h4>
            <p style={{ color: 'rgba(232, 245, 238, 0.65)', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
              Sign up for weekly Tamil Nadu real estate alerts.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="email" 
                placeholder="Enter email address" 
                style={{ 
                  background: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.12)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '8px 12px', 
                  color: 'var(--text-on-dark)', 
                  fontSize: 13,
                  outline: 'none',
                  flex: 1
                }}
              />
              <button 
                className="btn btn-primary btn-sm" 
                style={{ background: 'var(--green-500)', border: 'none', borderRadius: 'var(--radius-sm)' }}
                onClick={() => alert('Subscribed!')}
              >
                Join
              </button>
            </div>
            <div style={{ marginTop: 18, color: 'rgba(232,245,238,0.5)', fontSize: 12 }}>
              📧 info@nestiq.in | 📞 +91 422 2420000
            </div>
          </div>
        </div>
        <div style={{ padding: '24px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'rgba(232, 245, 238, 0.45)', fontSize: 13 }}>
            © {new Date().getFullYear()} NestIQ Ecosystem. Built for high-trust brokerage management.
          </p>
          <div style={{ color: 'rgba(232, 245, 238, 0.45)', fontSize: 13 }}>
            📍 Coimbatore, TN, India
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          footer div {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  )
}