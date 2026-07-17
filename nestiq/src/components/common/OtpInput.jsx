import { useRef } from 'react'

export default function OtpInput({ value, onChange }) {
  // value is a 6-char string
  // onChange receives the new 6-char string
  const inputs = useRef([])

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      inputs.current[i-1].focus()
    }
  }

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const chars = (value || '      ').split('')
    chars[i] = digit || ' '
    onChange(chars.join(''))
    if (digit && i < 5) {
      inputs.current[i+1].focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value || '')[i] === ' ' ? '' : (value || '')[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          className="otp-digit"
        />
      ))}
    </div>
  )
}
