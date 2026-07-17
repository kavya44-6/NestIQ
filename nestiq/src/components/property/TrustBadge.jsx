import { useState } from 'react'
import Modal from '../common/Modal'

/**
 * TrustBadge — clickable badge that opens a full trust breakdown modal.
 *
 * Props:
 *   score         — numeric 0-100
 *   breakdown     — { documentVerification, agentActivity, customerReviews,
 *                     listingQuality, fraudSignals, totalScore, status, color }
 *   size          — 'sm' | 'lg'
 *   onClickModal  — optional external handler (if parent manages modal state)
 */
export default function TrustBadge({ score, breakdown, size = 'sm', onClickModal, showModal = true }) {
  const [open, setOpen] = useState(false)

  if (score === null || score === undefined) return null

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a'   // green
    if (score >= 60) return '#d97706'   // amber  
    return '#dc2626'                     // red
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Highly Trusted'
    if (score >= 60) return 'Trusted'
    return 'Needs Review'
  }

  const bg   = getScoreColor(score)
  const label = getScoreLabel(score)
  const icon = score >= 80 ? '✓' : score >= 60 ? '⚡' : '⚠️'
  const pad  = size === 'lg' ? '5px 14px' : '3px 9px'
  const fs   = size === 'lg' ? '13px' : '11px'

  const hasBreakdown = !!breakdown && showModal

  const handleClick = () => {
    if (!showModal) return
    if (onClickModal) { onClickModal(); return }
    if (hasBreakdown) setOpen(true)
  }

  const breakdownRows = breakdown ? [
    { label: 'Document Verification', pts: breakdown.documentVerification, max: 30, icon: '📄' },
    { label: 'Agent Activity',         pts: breakdown.agentActivity,        max: 25, icon: '✅' },
    { label: 'Customer Reviews',       pts: breakdown.customerReviews,      max: 20, icon: '⭐' },
    { label: 'Listing Quality',        pts: breakdown.listingQuality,       max: 15, icon: '📋' },
    { label: 'Fraud Signals Absent',   pts: breakdown.fraudSignals,         max: 10, icon: '🛡️' },
  ] : []

  return (
    <>
      <span
        onClick={handleClick}
        title={hasBreakdown ? 'Click to see breakdown' : undefined}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          background: bg, color: 'var(--text-on-dark)', borderRadius: 999,
          padding: pad, fontSize: fs, fontWeight: 700, letterSpacing: '0.3px',
          cursor: hasBreakdown ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        {icon} Trust {score}
        {hasBreakdown && <span style={{ fontSize: fs, opacity: 0.75, marginLeft: 2 }}>▸</span>}
      </span>

      {/* Self-contained breakdown modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Trust Score Breakdown">
        {breakdown && (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: breakdown.color, lineHeight: 1 }}>
                {breakdown.totalScore}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>out of 100</div>
              <span style={{
                display: 'inline-block', marginTop: 8,
                background: breakdown.color, color: 'var(--text-on-dark)',
                borderRadius: 999, padding: '3px 14px', fontSize: 13, fontWeight: 700,
              }}>
                {breakdown.status}
              </span>
            </div>

            {breakdownRows.map(row => {
              const safePts = row.pts !== undefined && row.pts !== null ? row.pts : 0
              const safeMax = row.max || 1
              const percentage = (safePts / safeMax) * 100
              return (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginBottom: 5, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{row.icon} {row.label}</span>
                    <span style={{ fontWeight: 700 }}>{safePts}/{safeMax}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--cream-200)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${percentage}%`,
                      background: safePts / safeMax >= 0.8 ? 'var(--green-500)'
                        : safePts / safeMax >= 0.6 ? 'var(--gold-400)' : '#ef4444',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
              Trust scores are calculated from document verification, agent history, customer reviews,
              listing completeness, and fraud detection signals.
            </p>
          </>
        )}
      </Modal>
    </>
  )
}