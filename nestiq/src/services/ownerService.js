// FILE: src/services/ownerService.js
import api from './axiosConfig'
import { getCurrentUser } from '../utils/currentUser'
import {
  addOwnerMockProperty,
  getOwnerMockProperties,
  getOwnerMockMessages,
  replyOwnerMockMessage,
  inquiries,
  visits,
  ownerMessages
} from '../mock/mockStore'

// Get owner dashboard stats
export const getOwnerDashboard = async () => {
  try {
    return await api.get('/owner/dashboard')
  } catch {
    const user = getCurrentUser()
    const ownerId = user?.userId || user?.email
    const myProps = getOwnerMockProperties(ownerId)
    const propIds = myProps.map(p => Number(p.id))

    // Filter inquiries, visits, and messages for these properties
    const myInqs = inquiries.filter(i => propIds.includes(Number(i.propertyId)))
    const myVisits = visits.filter(v => propIds.includes(Number(v.propertyId)))
    const myMsgs = ownerMessages.filter(m => propIds.includes(Number(m.propertyId)) && m.status === 'PENDING')

    return {
      data: {
        totalProperties: myProps.length,
        totalInquiries: myInqs.length,
        totalVisits: myVisits.length,
        pendingMessages: myMsgs.length
      },
      _mock: true
    }
  }
}

// Get all properties this owner has listed
export const getOwnerProperties = async () => {
  try {
    return await api.get('/owner/properties')
  } catch {
    const user = getCurrentUser()
    return { data: getOwnerMockProperties(user?.userId || user?.email), _mock: true }
  }
}

// Owner lists a new property — try real API, fallback to mockStore
export const addOwnerProperty = async (data) => {
  try {
    return await api.post('/owner/properties', data)
  } catch {
    const user = getCurrentUser()
    const created = addOwnerMockProperty(data, { userId: user?.userId || user?.email, name: user?.name, email: user?.email })
    return { data: created, _mock: true }
  }
}

// All inquiries on owner's properties
export const getOwnerInquiries = async () => {
  try {
    return await api.get('/owner/inquiries')
  } catch {
    const user = getCurrentUser()
    const ownerId = user?.userId || user?.email
    const myProps = getOwnerMockProperties(ownerId)
    const propIds = myProps.map(p => Number(p.id))
    const myInqs = inquiries.filter(i => propIds.includes(Number(i.propertyId)))
    return { data: myInqs, _mock: true }
  }
}

// All visits on owner's properties
export const getOwnerVisits = async () => {
  try {
    return await api.get('/owner/visits')
  } catch {
    const user = getCurrentUser()
    const ownerId = user?.userId || user?.email
    const myProps = getOwnerMockProperties(ownerId)
    const propIds = myProps.map(p => Number(p.id))
    const myVisits = visits.filter(v => propIds.includes(Number(v.propertyId)))
    return { data: myVisits, _mock: true }
  }
}

// Messages from agents to this owner
export const getOwnerMessages = async () => {
  try {
    return await api.get('/owner/messages')
  } catch {
    const user = getCurrentUser()
    return { data: getOwnerMockMessages(user?.userId || user?.email), _mock: true }
  }
}

// Owner replies to an agent message
export const replyToAgentMessage = async (messageId, reply) => {
  try {
    return await api.put(`/owner/messages/${messageId}/reply`, { reply })
  } catch (err) {
    const updated = replyOwnerMockMessage(messageId, reply)
    return { data: updated, _mock: true }
  }
}