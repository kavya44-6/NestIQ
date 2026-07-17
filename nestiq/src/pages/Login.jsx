import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginUser(form)

      console.log('LOGIN RESPONSE:', res.data)

      const data = res.data

      const user = {
        token: data.token || data.accessToken || data.jwt,
        role: data.role || data.userRole || 'CUSTOMER',
        name: data.name || data.username || '',
        userId: data.userId || data.id || null
      }

      console.log('ROLE:', user.role)

      if (!user.token) {
        throw new Error('No token received from backend')
      }

      login(user)

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else if (user.role === 'AGENT') {
        navigate('/agent/dashboard')
      } else {
        navigate('/customer/dashboard')
      }

    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          🏠 NestIQ
        </div>

        <h2>Welcome Back</h2>

        <p className="auth-subtitle">
          Sign in to continue to NestIQ
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-8"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">
            Create one
          </Link>
        </p>

      </div>
    </div>
  )
}