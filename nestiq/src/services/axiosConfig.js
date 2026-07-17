import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8089/api',
  timeout: 15000,
})

const STORAGE_KEYS = {
  AGENT:    'nestiq_agent_session',
  CUSTOMER: 'nestiq_customer_session',
  ADMIN:    'nestiq_admin_session',
  OWNER:    'nestiq_owner_session',
}

api.interceptors.request.use(config => {
  try {
    const activeRole = sessionStorage.getItem('nestiq_active_role')
    let token = null

    if (activeRole && STORAGE_KEYS[activeRole]) {
      const raw = localStorage.getItem(STORAGE_KEYS[activeRole])
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.token) {
          token = parsed.token
        }
      }
    }

    if (!token) {
      token = localStorage.getItem('token')
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
      sessionStorage.removeItem('nestiq_active_role')
      window.location.href = '/customer/login'
    }
    return Promise.reject(err)
  }
)

export default api