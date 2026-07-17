import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

function showHtmlToast(message) {
  const container = document.getElementById('nestiq-toast-container') || (() => {
    const c = document.createElement('div')
    c.id = 'nestiq-toast-container'
    c.style.position = 'fixed'
    c.style.top = '80px'
    c.style.right = '20px'
    c.style.zIndex = '9999'
    c.style.display = 'flex'
    c.style.flexDirection = 'column'
    c.style.gap = '10px'
    document.body.appendChild(c)
    return c
  })()

  const toast = document.createElement('div')
  toast.style.background = 'var(--green-900)'
  toast.style.color = '#fff'
  toast.style.padding = '14px 24px'
  toast.style.borderRadius = '8px'
  toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  toast.style.fontSize = '13.5px'
  toast.style.fontWeight = '600'
  toast.style.borderLeft = '4px solid var(--gold-400)'
  toast.style.display = 'flex'
  toast.style.alignItems = 'center'
  toast.style.gap = '10px'
  toast.style.animation = 'slideIn 0.3s ease forwards'
  toast.innerHTML = `<span>🔔</span> <span>${message}</span>`

  if (!document.getElementById('nestiq-toast-styles')) {
    const s = document.createElement('style')
    s.id = 'nestiq-toast-styles'
    s.innerHTML = `
      @keyframes slideIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
    `
    document.head.appendChild(s)
  }

  container.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }, 4000)
}

export default function useNotificationStream(onNewNotification) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.userId) return

    const url = `http://localhost:8089/api/notifications/stream/${user.userId}`
    const eventSource = new EventSource(url)

    eventSource.addEventListener('NOTIFICATION', (event) => {
      try {
        const notif = JSON.parse(event.data)
        showHtmlToast(notif.message)
        if (onNewNotification) {
          onNewNotification(notif)
        }
        // Also dispatch a custom event globally
        window.dispatchEvent(new CustomEvent('nestiq-new-notification', { detail: notif }))
      } catch (err) {
        console.error('Failed to parse SSE event data', err)
      }
    })

    eventSource.addEventListener('INIT', (event) => {
      console.log('SSE notification stream opened:', event.data)
    })

    eventSource.onerror = (err) => {
      console.warn('SSE notification stream encountered an error. Reconnecting...', err)
    }

    return () => {
      eventSource.close()
    }
  }, [user?.userId, onNewNotification])
}
