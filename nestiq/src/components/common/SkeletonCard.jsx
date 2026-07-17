export function PropertyCardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 220 }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 18, width: '75%' }} />
        <div className="skeleton" style={{ height: 13, width: '55%' }} />
        <div className="skeleton" style={{ height: 22, width: '40%' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ height: 13, width: 60 }} />
          <div className="skeleton" style={{ height: 13, width: 60 }} />
          <div className="skeleton" style={{ height: 13, width: 60 }} />
        </div>
        <div className="skeleton" style={{ height: 36 }} />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '13px 16px' }}>
          <div className="skeleton" style={{ height: 14, width: i === 0 ? '80%' : '60%' }} />
        </td>
      ))}
    </tr>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
      <div className="skeleton" style={{ height: 26, width: 26, borderRadius: '50%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: 100, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 32, width: 60 }} />
    </div>
  )
}
