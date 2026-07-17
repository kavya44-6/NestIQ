export default function Input({ label, error, type = 'text', ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input type={type} {...props} />
      {error && <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>}
    </div>
  )
}