import { useState, useRef, useEffect } from 'react'
import { sendAiChat } from '../../services/aiService'

export default function AiChatWidget({ property }) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! 👋 I'm your AI assistant for **${property?.title || 'this property'}**. Ask me about the price, parking, amenities, how to book a visit, or anything else!`,
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    const updated = [...messages, { role: 'user', content: userMsg }]
    setMessages(updated)
    setLoading(true)

    // Pass history (skip the initial greeting) and full property object
    const history = updated.slice(1).map(m => ({ role: m.role, content: m.content }))

    // FIX: pass property as 4th argument so rule-based replies are specific
    const reply = await sendAiChat(property?.id, userMsg, history, property)

    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    setLoading(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Quick suggestion chips
  const SUGGESTIONS = ['Price info', 'Schedule a visit', 'Parking?', 'Amenities']

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Property Assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 60, height: 60, borderRadius: '50%',
          background: open
            ? 'var(--green-700)'
            : 'linear-gradient(135deg, var(--green-600), var(--green-500))',
          border: 'none', cursor: 'pointer', fontSize: 26,
          boxShadow: '0 4px 20px rgba(29,107,63,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, background 0.2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 100, right: 28, zIndex: 999,
          width: 370, maxWidth: 'calc(100vw - 40px)',
          background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(90deg, var(--green-900), var(--green-700))',
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-on-dark)', fontWeight: 700, fontSize: 14 }}>AI Property Assistant</div>
              <div style={{ color: 'var(--green-300)', fontSize: 11 }}>
                Answers about this property · free
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 18 }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px',
            maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '84%', padding: '10px 14px', borderRadius: 14,
                  fontSize: 13, lineHeight: 1.65,
                  background: m.role === 'user' ? 'var(--green-600)' : 'var(--cream-200)',
                  color: m.role === 'user' ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius:  m.role === 'user' ? 14 : 4,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: 'var(--cream-200)', borderRadius: 14,
                  padding: '10px 16px', fontSize: 18, letterSpacing: 3,
                }}>
                  ···
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Price details', 'Mortgage estimate', 'Ecosystem Trust', 'Nearby facilities', 'Schedule a visit'].map(s => (
              <button key={s}
                onClick={async () => {
                  setInput('');
                  const updated = [...messages, { role: 'user', content: s }]
                  setMessages(updated)
                  setLoading(true)
                  const history = updated.slice(1).map(m => ({ role: m.role, content: m.content }))
                  const reply = await sendAiChat(property?.id, s, history, property)
                  setMessages(prev => [...prev, { role: 'assistant', content: reply }])
                  setLoading(false)
                }}
                disabled={loading}
                style={{
                  background: 'var(--green-50)', border: '1px solid var(--green-200)',
                  color: 'var(--green-700)', borderRadius: 999,
                  padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div style={{
            borderTop: '1px solid var(--border)', padding: '12px 14px',
            display: 'flex', gap: 8,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about parking, price, visit…"
              disabled={loading}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', fontSize: 13,
                background: 'var(--green-50)', color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                padding: '9px 14px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'var(--green-600)',
                color: 'var(--text-on-dark)', cursor: 'pointer', fontSize: 16, fontWeight: 700,
                opacity: !input.trim() || loading ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}