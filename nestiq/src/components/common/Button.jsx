export default function Button({
  children, variant = 'primary', size = '', full = false,
  loading = false, disabled = false, onClick, type = 'button', className = ''
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size   ? `btn-${size}` : '',
    full   ? 'btn-full'    : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={cls} onClick={onClick}
      disabled={disabled || loading}>
      {loading && <span className="spinner spinner-sm" />}
      {children}
    </button>
  )
}