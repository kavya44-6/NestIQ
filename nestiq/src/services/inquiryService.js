import api from './axiosConfig'
import { getCurrentUser } from '../utils/currentUser'
import {
  addInquiry,
  respondInquiry,
  getInquiriesForCustomer,
  getInquiriesForAgent,
  getMockPropertyById,
} from '../mock/mockStore'
import { properties as seedProperties } from '../data/properties'
import { addNotification } from '../mock/mockStore'

function resolvePropertyTitle(propertyId) {
  const mockProp = getMockPropertyById(propertyId)
  if (mockProp) return mockProp.title
  const seedProp = seedProperties.find(p => String(p.id) === String(propertyId))
  return seedProp ? seedProp.title : undefined
}

export const sendInquiry = async (data) => {
  try {
    const res = await api.post('/inquiries', data)
    // Notify the agent (backend handles it on the real path)
    return res
  } catch (err) {
    const user = getCurrentUser()
    const inq = addInquiry({
      ...data,
      propertyTitle: data.propertyTitle || resolvePropertyTitle(data.propertyId),
      customerId: user?.userId || user?.email || 'guest',
      customerName: user?.name || 'Customer',
    })
    // Notify: agent gets an alert that a new inquiry arrived
    // We notify the generic 'demo-agent' in the mock (single-agent demo)
    addNotification(
      'demo-agent',
      `📩 New inquiry from ${inq.customerName} on "${inq.propertyTitle}"`,
      '/agent/inquiries'
    )
    return { data: inq, _mock: true }
  }
}

export const getMyInquiries = async () => {
  try {
    return await api.get('/inquiries/my')
  } catch (err) {
    const user = getCurrentUser()
    const mine = getInquiriesForCustomer(user?.userId || user?.email || 'guest')
    return { data: mine, _mock: true }
  }
}

export const getAgentInquiries = async () => {
  try {
    return await api.get('/inquiries/agent')
  } catch (err) {
    return { data: getInquiriesForAgent(), _mock: true }
  }
}

export const respondToInquiry = async (id, message) => {
  try {
    return await api.put(`/inquiries/${id}/respond`, { message })
  } catch (err) {
    const updated = respondInquiry(id, message)
    if (updated) {
      // Notify the customer that their inquiry got a response
      addNotification(
        updated.customerId,
        `💬 Agent responded to your inquiry on "${updated.propertyTitle}"`,
        '/customer/inquiries'
      )
      return { data: updated, _mock: true }
    }
    throw err
  }
}