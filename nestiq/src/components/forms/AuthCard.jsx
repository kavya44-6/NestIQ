import Card from '../common/Card'

export default function AuthCard({
  icon = '🏠',
  title = 'NestIQ',
  subtitle = '',
  header = '',
  error = '',
  success = '',
  children,
  footer
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--green-50)'
    }}>
      <Card style={{
        background: 'var(--cream-100)',
        borderRadius: 'var(--radius-lg)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{icon}</div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            fontFamily: 'Outfit, Inter, sans-serif'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              color: 'var(--text-secondary)',
              marginTop: '4px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {header && (
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily: 'Outfit, Inter, sans-serif'
          }}>
            {header}
          </h2>
        )}

        {success && (
          <div style={{
            background: 'var(--green-100)',
            border: '1px solid var(--green-400)',
            color: 'var(--green-700)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.05)',
            border: '1px solid rgba(220, 38, 38, 0.15)',
            color: '#dc2626',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {children}

        {footer && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            {footer}
          </div>
        )}
      </Card>
    </div>
  )
}
