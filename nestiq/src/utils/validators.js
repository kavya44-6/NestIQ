export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(phone)

export const isValidPassword = (password) =>
  password?.length >= 6

export const validateRegister = ({ name, email, password }) => {
  if (!name?.trim())           return 'Name is required'
  if (!isValidEmail(email))    return 'Enter a valid email'
  if (!isValidPassword(password)) return 'Password must be at least 6 characters'
  return null
}

export const validateProperty = (form) => {
  if (!form.title?.trim())    return 'Title is required'
  if (!form.price || isNaN(form.price)) return 'Enter a valid price'
  if (!form.location?.trim()) return 'Location is required'
  if (!form.city)             return 'Select a city'
  return null
}