import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, verifyRegistrationOtp, resendRegistrationOtp } from '../../services/authService'
import AuthCard from '../../components/forms/AuthCard'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function OwnerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role:'OWNER' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // OTP view state
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [devOtp, setDevOtp] = useState('')

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const startResendTimer = () => {
    setResendCooldown(30)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const response = await registerUser(form)
      const successMessage = response.data || 'OTP sent to email. Please verify.'
      setSuccess(successMessage)
      const otpMatch = successMessage.match(/OTP[:\s]+(\d{4,6})/i)
      if (otpMatch) {
        setDevOtp(otpMatch[1])
      }
      setShowOtp(true)
      startResendTimer()
    } catch (err) {
      setError(err.response?.data?.message
             || err.response?.data
             || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setVerifying(true)
    try {
      await verifyRegistrationOtp(form.email, otp)
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/owner/login?registered=true')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message
             || err.response?.data
             || 'Invalid or expired OTP.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError('')
    setSuccess('')
    try {
      const response = await resendRegistrationOtp(form.email)
      const successMessage = response.data || 'A new OTP has been sent.'
      setSuccess(successMessage)
      const otpMatch = successMessage.match(/OTP[:\s]+(\d{4,6})/i)
      if (otpMatch) {
        setDevOtp(otpMatch[1])
      }
      startResendTimer()
    } catch (err) {
      setError(err.response?.data?.message
             || err.response?.data
             || 'Failed to resend OTP.')
    }
  }

  const footer = (
    <>
      <p style={{ margin: 0 }}>
        Already have an account?{' '}
        <Link to="/owner/login" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>
          Sign In
        </Link>
      </p>
      <p style={{ margin: '12px 0 0 0', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <Link to="/customer/register" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>
          Customer Sign Up
        </Link>
        {' · '}
        <Link to="/agent/register" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>
          Agent Sign Up
        </Link>
      </p>
    </>
  )

  if (showOtp) {
    return (
      <AuthCard
        icon="🏡"
        subtitle="Owner Portal"
        header="Email Verified?"
        error={error}
        success={success}
        footer={null}
      >
        <form onSubmit={handleVerifyOtp}>
          {devOtp && (
            <div style={{
              background: '#fefce8', border: '1px solid #fbbf24',
              borderRadius: 8, padding: '10px 16px',
              marginBottom: 12, fontSize: 13,
            }}>
              <span style={{ fontWeight: 700, color: '#92400e' }}>🔐 Dev Mode OTP: </span>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 4, color: '#78350f' }}>{devOtp}</span>
              <span style={{ color: '#b45309', fontSize: 11, display: 'block', marginTop: 2 }}>
                (Shown because SMTP is disabled — remove before production)
              </span>
            </div>
          )}
          <div style={{ marginBottom: '24px' }}>
            <Input
              label="Enter OTP"
              type="text"
              name="otp"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              placeholder="______"
              style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }}
            />
          </div>

          <Button type="submit" variant="primary" full loading={verifying}>
            Verify OTP
          </Button>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button
              type="button"
              variant="outline"
              full
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
            </Button>
            <Button
              type="button"
              variant="outline"
              full
              onClick={() => {
                setShowOtp(false)
                setError('')
                setSuccess('')
              }}
            >
              Back
            </Button>
          </div>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon="🏡"
      subtitle="Owner Portal"
      header="Create Account"
      error={error}
      success={success}
      footer={footer}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Property Owner"
        />
        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
        />
        <Input
          label="Phone"
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+91 98765 43212"
        />

        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Min. 6 characters"
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
          Create Account
        </Button>
      </form>
    </AuthCard>
  )
}