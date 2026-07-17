import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginUser } from '../../services/authService'
import AuthCard from '../../components/forms/AuthCard'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registered = searchParams.get('registered')
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await loginUser(form)
      const data = res.data
      const role = (data.role || 'CUSTOMER').toUpperCase()
      if (role !== 'CUSTOMER' && role !== 'ADMIN') {
        setError(`This account is a ${role} account. Please use the ${role} login page.`)
        return
      }
      login({ token: data.token, role, name: data.name, userId: data.userId || data.id })
      if (role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/customer/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message
             || err.response?.data
             || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <>
      <p style={{ margin: 0 }}>
        Don't have an account?{' '}
        <Link to="/customer/register" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>
          Register
        </Link>
      </p>
      <p style={{ margin: '12px 0 0 0', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        Are you an agent?{' '}
        <Link to="/agent/login" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>
          Agent Login
        </Link>
        {' · '}
        <Link to="/owner/login" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>
          Owner Login
        </Link>
      </p>
    </>
  )

  return (
    <AuthCard
      icon="Customer Portal"
      subtitle="Customer Portal"
      header="Welcome Back"
      error={error}
      success={registered ? '✅ Account created successfully! Please sign in.' : ''}
      footer={footer}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
        />

        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '44px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              padding: 0
            }}
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        <Button type="submit" variant="primary" full loading={loading}>
          Sign In
        </Button>
      </form>
    </AuthCard>
  )
}
