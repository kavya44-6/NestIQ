import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import NotificationBell from '../common/NotificationBell'

const NAV_LINKS = [
  ['/', 'Home'],
  ['/properties', 'Properties'],
  ['/ai-matcher', '✨ AI Matcher'],
  ['/predict-rent', 'Predict Rent'],
  ['/price-trends', '📈 Price Trends'],
]

export default function Navbar() {
  const { user, logout }       = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [open, setOpen]           = useState(false)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }
  const dashPath = `/${(user?.role || 'customer').toLowerCase()}/dashboard`
  const active   = (p) => location.pathname === p

  const initials = user?.name 
    ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() 
    : 'U'

  return (
    <>
      <nav 
        className="glass-nav"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          background: scrolled ? 'rgba(13, 43, 26, 0.95)' : 'rgba(13, 43, 26, 0.85)',
          height: scrolled ? '64px' : '72px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: scrolled ? '0 10px 30px rgba(0, 0, 0, 0.15)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>

          <Link to="/" style={{ color: 'var(--text-on-dark)', fontWeight: 800, fontSize: 22, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.5px' }}>
            <span style={{ fontSize: 24 }}>🏠</span> NestIQ
          </Link>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="desktop-nav">
            {NAV_LINKS.map(([path, label]) => {
              const isActive = active(path)
              return (
                <Link 
                  key={path} 
                  to={path} 
                  style={{
                    color: isActive ? 'var(--green-300)' : 'rgba(232, 245, 238, 0.85)',
                    fontWeight: isActive ? 600 : 500, 
                    fontSize: 14, 
                    textDecoration: 'none',
                    position: 'relative',
                    padding: '8px 0',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {label}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'var(--green-300)',
                      borderRadius: 999,
                      animation: 'slideUpFade 0.3s ease forwards'
                    }} />
                  )}
                </Link>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', position: 'relative' }}>
            <button 
              onClick={toggleTheme} 
              style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                border: 'none', 
                color: 'rgba(232, 245, 238, 0.8)', 
                cursor: 'pointer', 
                fontSize: 16,
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {user && <NotificationBell />}
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link 
                  to={dashPath} 
                  style={{ 
                    color: 'var(--text-on-dark)', 
                    fontWeight: 600, 
                    fontSize: 13, 
                    textDecoration: 'none', 
                    padding: '8px 16px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: 999,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--green-400)', color: 'var(--text-on-dark)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700
                  }}>
                    {initials}
                  </div>
                  {(user.name || '').split(' ')[0]} 
                  <span style={{ opacity: 0.6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>({user.role.toLowerCase()})</span>
                </Link>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={handleLogout}
                  style={{ padding: '8px 16px', borderRadius: 999 }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }} className="desktop-nav">
                <button 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAuthMenuOpen(o => !o)}
                  onBlur={() => setTimeout(() => setAuthMenuOpen(false), 200)}
                  style={{ borderRadius: 999, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Access Portal ▾
                </button>
                {authMenuOpen && (
                  <div 
                    style={{
                      position: 'absolute', top: '120%', right: 0, background: 'var(--cream-100)',
                      border: '1px solid rgba(20, 61, 38, 0.08)', borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)', minWidth: 240, overflow: 'hidden', zIndex: 999,
                      animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <div style={{ padding: '12px 18px', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', borderBottom: '1px solid var(--border)' }}>
                      Identity Portals
                    </div>
                    <Link to="/customer/login" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', transition: 'background 0.2s' }}>
                      👤 Customer Desk
                    </Link>
                    <Link to="/agent/login" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      💼 Brokerage Desk
                    </Link>
                    <Link to="/owner/login" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      🏠 Landlord Desk
                    </Link>
                  </div>
                )}
              </div>
            )}
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-on-dark)', fontSize: 24, cursor: 'pointer', display: 'none' }}
              className="hamburger" 
              onClick={() => setOpen(!open)}
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div style={{ position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0, background: 'var(--green-900)', zIndex: 998, borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          {NAV_LINKS.map(([path, label]) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '16px 24px', color: 'var(--text-on-dark)', fontSize: 15, borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to={dashPath} onClick={() => setOpen(false)} style={{ display: 'block', padding: '16px 24px', color: 'var(--green-300)', fontSize: 15, textDecoration: 'none' }}>Go to Dashboard</Link>
              <div style={{ padding: '16px 24px' }}>
                <button className="btn btn-outline btn-full btn-sm" onClick={() => { handleLogout(); setOpen(false) }}>Sign Out</button>
              </div>
            </>
          ) : (
            <div style={{ padding: '8px 24px 0' }}>
              <div style={{ padding: '12px 0 6px', fontSize: 11, color: 'rgba(232,245,238,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Customer Portal</div>
              <Link to="/customer/login"    onClick={() => setOpen(false)} style={{ display: 'inline-block', marginRight: 16, color: 'var(--text-on-dark)', textDecoration: 'none' }}>Login</Link>
              <Link to="/customer/register" onClick={() => setOpen(false)} style={{ display: 'inline-block', color: 'var(--green-300)', textDecoration: 'none' }}>Register</Link>
              
              <div style={{ padding: '16px 0 6px', fontSize: 11, color: 'rgba(232,245,238,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 12 }}>Agent Portal</div>
              <Link to="/agent/login"    onClick={() => setOpen(false)} style={{ display: 'inline-block', marginRight: 16, color: 'var(--text-on-dark)', textDecoration: 'none' }}>Login</Link>
              <Link to="/agent/register" onClick={() => setOpen(false)} style={{ display: 'inline-block', color: 'var(--green-300)', textDecoration: 'none' }}>Register</Link>
              
              <div style={{ padding: '16px 0 6px', fontSize: 11, color: 'rgba(232,245,238,0.5)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 12 }}>Owner Portal</div>
              <Link to="/owner/login"    onClick={() => setOpen(false)} style={{ display: 'inline-block', marginRight: 16, color: 'var(--text-on-dark)', textDecoration: 'none' }}>Login</Link>
              <Link to="/owner/register" onClick={() => setOpen(false)} style={{ display: 'inline-block', color: 'var(--green-300)', textDecoration: 'none' }}>Register</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger   { display: block !important; }
        }
      `}</style>
    </>
  )
}