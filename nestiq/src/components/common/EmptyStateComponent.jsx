import React from 'react'

export default function EmptyStateComponent({
  title = "No Properties Found",
  message = "We couldn't find any properties matching your current search filters. Try adjusting your budget, location, or unit sizes.",
  onReset
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      textAlign: 'center',
      background: 'var(--cream-100)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)',
      maxWidth: '600px',
      margin: '40px auto',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '18px',
        color: 'var(--text-muted)',
        background: 'var(--cream-200)',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
      }}>
        🔍
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        margin: '0 0 20px 0',
        maxWidth: '400px'
      }}>
        {message}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="btn btn-primary"
          style={{ padding: '8px 20px', fontSize: '13.5px' }}
        >
          🔄 Clear All Filters
        </button>
      )}
    </div>
  )
}
