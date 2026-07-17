import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/authService'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'CUSTOMER' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await registerUser(form)
      setSuccess('Account created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🏠 NestIQ</div>
        <h2>Create an Account</h2>
        <p className="auth-subtitle">Join NestIQ and start exploring properties</p>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="Rajan Kumar" required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrap">
              <input type={showPass ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters" required />
              <button type="button" className="password-toggle"
                onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>I am a</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {['CUSTOMER', 'AGENT'].map(r => (
                <button key={r} type="button"
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${form.role === r ? 'var(--green-500)' : 'var(--border)'}`,
                    background: form.role === r ? 'var(--green-100)' : 'var(--cream-100)',
                    color: form.role === r ? 'var(--green-700)' : 'var(--text-muted)',
                    fontWeight: form.role === r ? 700 : 400, cursor: 'pointer',
                    transition: 'all 0.2s', fontSize: 14,
                  }}>
                  {r === 'CUSTOMER' ? '🏠 Customer' : '🏗 Agent'}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-8" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}