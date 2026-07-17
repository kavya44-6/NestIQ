import React from 'react';

export default function Header({ title, subtitle, centered = false, dark = false }) {
  return (
    <div style={{
      textAlign: centered ? 'center' : 'left',
      marginBottom: '32px',
    }}>
      <h1 style={{
        fontSize: 'clamp(24px, 4vw, 40px)',
        fontWeight: '700',
        color: dark ? 'var(--text-on-dark)' : 'var(--text-primary)',
        marginBottom: subtitle ? '10px' : '0',
        lineHeight: '1.2',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontSize: '16px',
          color: dark ? 'rgba(232,245,238,0.75)' : 'var(--text-muted)',
          maxWidth: centered ? '560px' : 'none',
          margin: centered ? '0 auto' : '0',
          lineHeight: '1.6',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}