import api from './axiosConfig'
import { getCurrentUser } from '../utils/currentUser'
import {
  addVisit,
  updateVisitStatusById,
  getVisitsForCustomer,
  getVisitsForAgent,
  getMockPropertyById,
  addNotification,
} from '../mock/mockStore'
import { properties as seedProperties } from '../data/properties'

function resolvePropertyTitle(propertyId) {
  const mockProp = getMockPropertyById(propertyId)
  if (mockProp) return mockProp.title
  const seedProp = seedProperties.find(p => String(p.id) === String(propertyId))
  return seedProp ? seedProp.title : undefined
}

export const bookVisit = async (data) => {
  try {
    const res = await api.post('/visits', data)
    // Backend handles agent notification on the real path
    return res
  } catch (err) {
    const user = getCurrentUser()
    const visit = addVisit({
      ...data,
      propertyTitle: data.propertyTitle || resolvePropertyTitle(data.propertyId),
      customerId: user?.userId || user?.email || 'guest',
      customerName: user?.name || 'Customer',
    })
    // Notify agent: a visit has been booked
    addNotification(
      'demo-agent',
      `📅 Visit booked by ${visit.customerName} on "${visit.propertyTitle}" — ${visit.visitDate} at ${visit.timeSlot}`,
      '/agent/visits'
    )
    return { data: visit, _mock: true }
  }
}

export const getMyVisits = async () => {
  try {
    return await api.get('/visits/my')
  } catch (err) {
    const user = getCurrentUser()
    const mine = getVisitsForCustomer(user?.userId || user?.email || 'guest')
    return { data: mine, _mock: true }
  }
}

export const getAgentVisits = async () => {
  try {
    return await api.get('/visits/agent')
  } catch (err) {
    return { data: getVisitsForAgent(), _mock: true }
  }
}

export const updateVisitStatus = async (id, status) => {
  try {
    return await api.put(`/visits/${id}/status`, { status })
  } catch (err) {
    const updated = updateVisitStatusById(id, status)
    if (updated) {
      // Notify the customer about the status change
      const statusLabel =
        status === 'CONFIRMED'  ? '✅ confirmed' :
        status === 'CANCELLED'  ? '❌ cancelled' :
        status === 'COMPLETED'  ? '🏁 marked as completed' :
        `updated to ${status}`
      addNotification(
        updated.customerId,
        `📅 Your visit for "${updated.propertyTitle}" has been ${statusLabel}`,
        '/customer/visits'
      )
      return { data: updated, _mock: true }
    }
    throw err
  }
}

export const cancelVisit = (id) => updateVisitStatus(id, 'CANCELLED')