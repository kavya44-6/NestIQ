/**
 * NotificationBell.jsx
 * In-app notification bell for the NestIQ navbar.
 *
 * • Shows a red unread-count badge when there are unread notifications.
 * • Opens a dropdown listing the last 20 notifications.
 * • Clicking a notification marks it as read and navigates to its link (if any).
 * • "Mark all read" button clears the badge.
 * • Polls every 30 s so notifications arrive without a page refresh.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useNotificationStream from '../../hooks/useNotificationStream'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationService'

const POLL_INTERVAL = 30_000 // 30 seconds

function timeAgo(iso) {
  try {
    if (!iso) return 'Pending Date'
    const parsed = new Date(iso)
    if (isNaN(parsed.getTime())) return 'Pending Date'
    const diff = Date.now() - parsed.getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch {
    return 'Pending Date'
  }
}

export default function NotificationBell() {
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const dropdownRef     = useRef(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user?.userId) return
    try {
      const res = await fetchNotifications(user.userId)
      const data = Array.isArray(res?.data) ? res.data : []
      setNotifs(data)
    } catch { /* silent */ }
  }, [user?.userId])

  useNotificationStream(load)

  // Initial load + polling
  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [load])

  // Refresh when dropdown opens
  useEffect(() => { if (open) load() }, [open, load])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────
  const unread = notifs.filter(n => !n.read).length

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif.id)
      setNotifs(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      )
    }
    setOpen(false)
    if (notif.link) navigate(notif.link)
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user.userId)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (!user) return null

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        style={{
          position:   'relative',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          fontSize:   20,
          color:      'rgba(232,245,238,0.85)',
          display:    'flex',
          alignItems: 'center',
          padding:    '4px 6px',
          borderRadius: 8,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position:   'absolute',
            top:        0,
            right:      0,
            minWidth:   17,
            height:     17,
            background: '#ef4444',
            borderRadius: 999,
            fontSize:   10,
            fontWeight: 700,
            color:      '#fff',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding:    '0 3px',
            lineHeight: 1,
            boxShadow:  '0 0 0 2px var(--green-900)',
            animation:  unread > 0 ? 'notif-pop 0.3s ease' : 'none',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position:   'absolute',
          top:        'calc(100% + 10px)',
          right:      0,
          width:      340,
          maxHeight:  420,
          background: 'var(--cream-100)',
          border:     '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow:  'var(--shadow-md)',
          zIndex:     1000,
          display:    'flex',
          flexDirection: 'column',
          overflow:   'hidden',
        }}>
          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '12px 16px',
            borderBottom:   '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              🔔 Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 8,
                  background: '#ef4444',
                  color:      '#fff',
                  fontSize:   11,
                  fontWeight: 700,
                  borderRadius: 999,
                  padding:    '1px 7px',
                }}>
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  fontSize:   12,
                  color:      'var(--green-600)',
                  fontWeight: 600,
                  padding:    '2px 6px',
                  borderRadius: 4,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--green-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{
                padding:   '32px 16px',
                textAlign: 'center',
                color:     'var(--text-muted)',
                fontSize:  13,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              notifs.slice(0, 20).map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    display:    'flex',
                    alignItems: 'flex-start',
                    gap:        10,
                    padding:    '11px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor:     notif.link ? 'pointer' : 'default',
                    background: notif.read ? 'transparent' : 'var(--green-50)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (notif.link) e.currentTarget.style.background = 'var(--cream-200)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--green-50)'
                  }}
                >
                  {/* Unread dot */}
                  <span style={{
                    width:      8,
                    height:     8,
                    borderRadius: '50%',
                    background:   notif.read ? 'transparent' : '#ef4444',
                    flexShrink:   0,
                    marginTop:    5,
                    border:       notif.read ? '1.5px solid var(--border)' : 'none',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin:   0,
                      fontSize: 13,
                      color:    notif.read ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontWeight: notif.read ? 400 : 500,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {notif.message}
                    </p>
                    <span style={{
                      fontSize: 11,
                      color:    'var(--text-muted)',
                      marginTop: 3,
                      display:  'block',
                    }}>
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div style={{
              padding:      '8px 16px',
              borderTop:    '1px solid var(--border)',
              textAlign:    'center',
              fontSize:     12,
              color:        'var(--text-muted)',
              background:   'var(--cream-200)',
            }}>
              Showing {Math.min(notifs.length, 20)} of {notifs.length} notifications
            </div>
          )}
        </div>
      )}

      {/* Keyframe for the badge pop animation */}
      <style>{`
        @keyframes notif-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
