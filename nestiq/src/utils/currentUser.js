// FILE: src/utils/currentUser.js
// CHANGE: Removed the fallback scanner loop — same bug as axiosConfig.js.
// Mock services must read ONLY from the active-role pointer in sessionStorage.

const STORAGE_KEYS = {
  AGENT:    'nestiq_agent_session',
  CUSTOMER: 'nestiq_customer_session',
  ADMIN:    'nestiq_admin_session',
  OWNER:    'nestiq_owner_session',
}

export function getCurrentUser() {
  try {
    const activeRole = sessionStorage.getItem('nestiq_active_role')
    if (activeRole && STORAGE_KEYS[activeRole]) {
      const raw = localStorage.getItem(STORAGE_KEYS[activeRole])
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.token) return parsed
      }
    }
    // BUG FIX: no fallback scan — return null if pointer is missing
  } catch {}
  return null
}