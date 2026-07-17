/**
 * notificationService.js
 * Wraps in-app notification operations.
 *
 * Pattern (same as all other services):
 *   1. Try the Spring Boot backend.
 *   2. On failure → fall back to mockStore.
 *   3. Never throw uncaught exceptions.
 */
import api from './axiosConfig'
import {
  addNotification   as mockAdd,
  getNotifications  as mockGet,
  markRead          as mockMarkRead,
  markAllRead       as mockMarkAll,
} from '../mock/mockStore'

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all notifications for the currently-logged-in user.
 * @param {string} userId
 * @returns {{ data: Notification[], _mock?: true }}
 */
export const fetchNotifications = async (userId) => {
  try {
    return await api.get('/notifications')
  } catch {
    return { data: mockGet(userId), _mock: true }
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Push a notification for a user.
 * Used internally by other services — not called from UI directly.
 *
 * @param {string} userId   Recipient user id / email
 * @param {string} message  Human-readable text
 * @param {string} [link]   Optional route the bell click navigates to
 */
export const pushNotification = async (userId, message, link = '') => {
  try {
    return await api.post('/notifications', { userId, message, link })
  } catch {
    return { data: mockAdd(userId, message, link), _mock: true }
  }
}

// ── Mark read ─────────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read.
 * @param {number} notifId
 */
export const markNotificationRead = async (notifId) => {
  try {
    return await api.put(`/notifications/${notifId}/read`)
  } catch {
    return { data: mockMarkRead(notifId), _mock: true }
  }
}

/**
 * Mark ALL notifications for a user as read.
 * @param {string} userId
 */
export const markAllNotificationsRead = async (userId) => {
  try {
    return await api.put('/notifications/read-all')
  } catch {
    mockMarkAll(userId)
    return { data: true, _mock: true }
  }
}
