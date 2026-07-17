export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  )
}