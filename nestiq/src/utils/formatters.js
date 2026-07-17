export const formatPrice = (price) =>
  '₹' + Number(price).toLocaleString('en-IN')

export const formatDate = (dateStr) => {
  try {
    if (!dateStr) return 'Pending Date';
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Pending Date';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  } catch {
    return 'Pending Date';
  }
}

export const formatDateTime = (dateStr) => {
  try {
    if (!dateStr) return 'Pending Date';
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Pending Date';
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return 'Pending Date';
  }
}

export const truncate = (str, n = 80) =>
  str?.length > n ? str.slice(0, n) + '...' : str