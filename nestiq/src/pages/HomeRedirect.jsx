import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomeRedirect() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/customer/login" />
  }

  const role = user.role?.toLowerCase()

  return <Navigate to={`/${role}/dashboard`} />
}
