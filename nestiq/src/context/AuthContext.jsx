// FILE: src/context/AuthContext.jsx  (MODIFIED - adds OWNER)
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEYS = {
  AGENT:    'nestiq_agent_session',
  CUSTOMER: 'nestiq_customer_session',
  ADMIN:    'nestiq_admin_session',
  OWNER:    'nestiq_owner_session',   // NEW
}

function keyForRole(role) {
  const r = (role || '').toUpperCase()
  return STORAGE_KEYS[r] || STORAGE_KEYS.CUSTOMER
}

const ACTIVE_POINTER_KEY = 'nestiq_active_role'

function readSession(role) {
  try {
    const raw = localStorage.getItem(keyForRole(role))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token ? parsed : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const lastRole = sessionStorage.getItem(ACTIVE_POINTER_KEY)
      // Only restore from the exact active role — NO fallback scan (bug fix)
      const restored = lastRole ? readSession(lastRole) : null
      if (restored) setUser(restored)
    } catch {}
    setLoading(false)
  }, [])

  const login = useCallback((data) => {
    const role = (data.role || data.userRole || 'CUSTOMER').toUpperCase()
    const userObj = {
      token:  data.token,
      role,
      name:   data.name || data.username || '',
      userId: data.userId || data.id || null,
    }
    localStorage.setItem(keyForRole(role), JSON.stringify(userObj))
    localStorage.setItem('token', data.token)
    sessionStorage.setItem(ACTIVE_POINTER_KEY, role)
    setUser(userObj)
  }, [])

  const logout = useCallback(() => {
    setUser(currentUser => {
      if (currentUser?.role) localStorage.removeItem(keyForRole(currentUser.role))
      return null
    })
    localStorage.removeItem('token')
    sessionStorage.removeItem(ACTIVE_POINTER_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }