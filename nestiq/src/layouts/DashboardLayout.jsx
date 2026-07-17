import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import Navbar from '../components/navigation/NavBar'
import { useAuth } from '../context/AuthContext'
import api from '../services/axiosConfig'

function SidebarLink({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClick}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </NavLink>
  )
}

const AGENT_LINKS = [
  { to: '/agent/dashboard',      icon: '📊', label: 'Overview'       },
  { to: '/agent/properties',     icon: '🏠', label: 'My Properties'  },
  { to: '/agent/add',            icon: '➕', label: 'Add Property'   },
  { to: '/agent/inquiries',      icon: '💬', label: 'Inquiries'      },
  { to: '/agent/visits',         icon: '📅', label: 'Visits'         },
  { to: '/agent/contact-seller', icon: '📨', label: 'Message Owner'  },
]

const CUSTOMER_LINKS = [
  { to: '/customer/dashboard',  icon: '📊', label: 'Overview'       },
  { to: '/customer/inquiries',  icon: '💬', label: 'My Inquiries'   },
  { to: '/customer/visits',     icon: '📅', label: 'My Visits'      },
  { to: '/predict-rent',        icon: '🔮', label: 'Rent Predictor' },
]

const OWNER_LINKS = [
  { to: '/owner/dashboard',   icon: '📊', label: 'Overview'        },
  { to: '/owner/properties',  icon: '🏠', label: 'My Properties'   },
  { to: '/owner/inquiries',   icon: '💬', label: 'Inquiries'       },
  { to: '/owner/messages',    icon: '📨', label: 'Agent Messages'  },
]

const ADMIN_LINKS = [
  { to: '/admin/dashboard', icon: '📊', label: 'Overview'        },
  { to: '/admin/users',     icon: '👥', label: 'User Management' },
  { to: '/admin/properties',icon: '🏠', label: 'Properties'      },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [kycStatus, setKycStatus] = useState('VERIFIED')
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (user && (user.role === 'AGENT' || user.role === 'OWNER')) {
      api.get('/kyc/status')
      .then(res => {
        setKycStatus(res.data.kycStatus || 'PENDING')
      })
      .catch(() => {
        setKycStatus('PENDING')
      })
    }
  }, [user])

  const links =
    user?.role === 'AGENT'    ? AGENT_LINKS    :
    user?.role === 'OWNER'    ? OWNER_LINKS    :
    user?.role === 'ADMIN'    ? ADMIN_LINKS    :
    CUSTOMER_LINKS

  const initials = user?.name 
    ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() 
    : 'U'

  const roleName = user?.role === 'AGENT' ? 'Broker' : user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'ADMIN' : 'Client'
  const roleColor = user?.role === 'AGENT' ? '#d97706' : user?.role === 'OWNER' ? '#a78bfa' : user?.role === 'ADMIN' ? '#ef4444' : 'var(--green-300)'
  const roleBg = 'rgba(255, 255, 255, 0.12)'

  const renderSidebar = (onLinkClick) => (
    <>
      {/* Profile Header Block */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `linear-gradient(135deg, var(--green-600), var(--green-500))`,
          color: 'var(--text-on-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, boxShadow: 'var(--shadow-sm)'
        }}>
          {initials}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-on-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {user?.name || 'User Profile'}
          </div>
          <span style={{ 
            display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 999, 
            fontSize: 10, fontWeight: 700, color: roleColor, background: roleBg,
            textTransform: 'uppercase', letterSpacing: '0.5px', border: `1px solid rgba(255, 255, 255, 0.15)`
          }}>
            {roleName}
          </span>
        </div>
      </div>

      {/* KYC Alert Banner inside Sidebar */}
      {user && (user.role === 'AGENT' || user.role === 'OWNER') && kycStatus !== 'VERIFIED' && (
        <div style={{
          background: '#fff3cd', color: '#856404', padding: '10px 12px',
          borderRadius: 'var(--radius-sm)', border: '1px solid #ffeeba',
          fontSize: 11, margin: '14px 12px 0', fontWeight: 600, lineHeight: 1.4
        }}>
          ⚠️ Complete <Link to={user.role === 'AGENT' ? '/agent/profile' : '/owner/profile'} style={{ color: '#856404', textDecoration: 'underline' }} onClick={onLinkClick}>KYC Verification</Link> to build customer trust.
        </div>
      )}

      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, paddingLeft: 12 }}>
          Navigation
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {links.map(l => (
            <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} onClick={onLinkClick} />
          ))}
          
          {/* Settings / Profile Links */}
          {user?.role === 'AGENT' && (
            <SidebarLink to="/agent/profile" icon="👤" label="My KYC Profile" onClick={onLinkClick} />
          )}
          {user?.role === 'OWNER' && (
            <SidebarLink to="/owner/profile" icon="👤" label="My KYC Profile" onClick={onLinkClick} />
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 24, paddingTop: 18 }}>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'transparent', border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-sm)', color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="dashboard-layout" style={{ background: 'var(--green-50)', minHeight: '100vh' }}>
      <Navbar />

      <div className="dashboard-mobile-header" style={{
        display: 'none', background: 'var(--cream-100)', borderBottom: '1px solid var(--border)',
        padding: '12px 18px', position: 'fixed', top: 'var(--navbar-height)', left: 0, right: 0,
        zIndex: 50, justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
          {roleName} Panel
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--green-600)', color: 'var(--text-on-dark)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
        }}>
          {initials}
        </div>
      </div>

      <div style={{ display: 'flex', paddingTop: 'var(--navbar-height)' }}>
        {/* Sidebar Container */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: 260,
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          height: 'calc(100vh - var(--navbar-height))', position: 'fixed', top: 'var(--navbar-height)',
          left: 0, overflowY: 'auto', transition: 'transform 0.3s ease',
          background: 'var(--green-900)'
        }}>
          {renderSidebar(() => setSidebarOpen(false))}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        {/* Main Content Area */}
        <main className="dashboard-main" style={{
          marginLeft: 260, flex: 1, padding: 32, minHeight: 'calc(100vh - var(--navbar-height))'
        }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
            z-index: 100 !important;
          }
          .dashboard-sidebar.open {
            transform: translateX(0);
          }
          .dashboard-main {
            margin-left: 0 !important;
            padding: 20px !important;
            padding-top: 64px !important;
          }
          .dashboard-mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}