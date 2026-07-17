import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ navItems, user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: 'calc(100vh - var(--navbar-height))',
      background: 'var(--cream-100)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 'var(--navbar-height)',
      height: 'calc(100vh - var(--navbar-height))',
      overflowY: 'auto',
    }}>
      {/* User greeting */}
      <div style={{
        padding: '24px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--green-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-on-dark)',
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '10px',
        }}>
          {user?.name?.[0] || '?'}
        </div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Hi, {user?.name?.split(' ')[0]} 👋
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginTop: '2px' }}>
          {user?.role === 'ADMIN' ? 'ADMIN' : (user?.role || 'User')}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 12px', flex: 1 }}>
        {(user?.role === 'ADMIN'
          ? navItems.filter(item => item.label === 'Overview' || item.label === 'Dashboard' || item.path.includes('admin'))
          : navItems
        ).map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2px',
              color: isActive(item.path) ? 'var(--green-600)' : 'var(--text-secondary)',
              fontWeight: isActive(item.path) ? '600' : '400',
              fontSize: '14px',
              textDecoration: 'none',
              background: isActive(item.path) ? 'var(--green-50)' : 'transparent',
              borderLeft: isActive(item.path) ? '3px solid var(--green-400)' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '9px 12px',
            background: 'transparent',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}