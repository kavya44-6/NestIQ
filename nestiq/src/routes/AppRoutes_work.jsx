import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import ProtectedRoute from '../components/common/ProtectedRoute'

import Home            from '../pages/Home'
import Properties      from '../pages/Properties'
import PropertyDetails from '../pages/PropertyDetails'
import RentPredictor   from '../pages/RentPredictor'
import AiMatcher       from '../pages/AiMatcher'
import NotFound        from '../pages/NotFound'

import AdminDashboard from '../pages/admin/Dashboard'
import AdminUsers     from '../pages/admin/Users'
import AdminApprovals from '../pages/admin/PropertiesApproval'
import AdminReports   from '../pages/admin/Reports'

import AgentLogin      from '../pages/agent/AgentLogin'
import AgentRegister   from '../pages/agent/AgentRegister'
import AgentDashboard  from '../pages/agent/Dashboard'
import AgentProperties from '../pages/agent/MyProperties'
import AddProperty     from '../pages/agent/AddProperty'
import EditProperty    from '../pages/agent/EditProperty'
import AgentInquiries  from '../pages/agent/Inquiries'
import AgentVisits     from '../pages/agent/Visits'
import ContactSeller   from '../pages/agent/ContactSeller'

import CustomerLogin     from '../pages/customer/CustomerLogin'
import CustomerRegister  from '../pages/customer/CustomerRegister'
import CustomerDashboard from '../pages/customer/Dashboard'
import CustomerInquiries from '../pages/customer/MyInquiries'
import CustomerVisits    from '../pages/customer/MyVisits'

const A = ({ children }) => <ProtectedRoute allowedRoles={['ADMIN']}>{children}</ProtectedRoute>
const G = ({ children }) => <ProtectedRoute allowedRoles={['AGENT']}>{children}</ProtectedRoute>
const C = ({ children }) => <ProtectedRoute allowedRoles={['CUSTOMER']}>{children}</ProtectedRoute>

function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/customer/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'AGENT') return <Navigate to="/agent/dashboard" replace />
  return <Navigate to="/customer/dashboard" replace />
}

function GuestRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (user && user.role === role) return <DashboardRedirect />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<Home />} />
      <Route path="/properties"     element={<Properties />} />
      <Route path="/properties/:id" element={<PropertyDetails />} />
      <Route path="/predict-rent"   element={<RentPredictor />} />
      <Route path="/ai-matcher"     element={<AiMatcher />} />

      {/* Agent auth */}
      <Route path="/agent/login"    element={<GuestRoute role="AGENT"><AgentLogin /></GuestRoute>} />
      <Route path="/agent/register" element={<GuestRoute role="AGENT"><AgentRegister /></GuestRoute>} />

      {/* Customer auth */}
      <Route path="/customer/login"    element={<GuestRoute role="CUSTOMER"><CustomerLogin /></GuestRoute>} />
      <Route path="/customer/register" element={<GuestRoute role="CUSTOMER"><CustomerRegister /></GuestRoute>} />

      {/* Legacy redirects */}
      <Route path="/login"    element={<Navigate to="/customer/login" replace />} />
      <Route path="/register" element={<Navigate to="/customer/register" replace />} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<A><AdminDashboard /></A>} />
      <Route path="/admin/users"     element={<A><AdminUsers /></A>} />
      <Route path="/admin/approvals" element={<A><AdminApprovals /></A>} />
      <Route path="/admin/reports"   element={<A><AdminReports /></A>} />

      {/* Agent */}
      <Route path="/agent/dashboard"      element={<G><AgentDashboard /></G>} />
      <Route path="/agent/properties"     element={<G><AgentProperties /></G>} />
      <Route path="/agent/add"            element={<G><AddProperty /></G>} />
      <Route path="/agent/edit/:id"       element={<G><EditProperty /></G>} />
      <Route path="/agent/inquiries"      element={<G><AgentInquiries /></G>} />
      <Route path="/agent/visits"         element={<G><AgentVisits /></G>} />
      <Route path="/agent/contact-seller" element={<G><ContactSeller /></G>} />

      {/* Customer */}
      <Route path="/customer/dashboard"  element={<C><CustomerDashboard /></C>} />
      <Route path="/customer/inquiries"  element={<C><CustomerInquiries /></C>} />
      <Route path="/customer/visits"     element={<C><CustomerVisits /></C>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}