import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Maps a role to its dedicated login page so an agent route bounces to
// /agent/login (not a generic /login) and likewise for customers.
const LOGIN_PATH_FOR_ROLE = {
  AGENT:    '/agent/login',
  CUSTOMER: '/customer/login',
  OWNER:    '/owner/login',
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  if (!user) {
    const fallbackRole = allowedRoles?.[0] || 'CUSTOMER'
    return <Navigate to={LOGIN_PATH_FOR_ROLE[fallbackRole] || '/customer/login'} replace />
  }

  const normalizedAllowed = (allowedRoles || []).map(r => r.toUpperCase())
  if (allowedRoles && !normalizedAllowed.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
