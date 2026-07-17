import api from './axiosConfig'
import { getCurrentUser } from '../utils/currentUser'
import {
  addAgentMessage,
  getAgentMessages,
  addOwnerMockMessage,
  getOwnerMockReplies,
  ownerProperties
} from '../mock/mockStore'

// Agent sends a message to property seller company (legacy)
export const sendAgentMessage = async (data) => {
  try {
    return await api.post('/agent-messages', data)
  } catch (err) {
    const user = getCurrentUser()
    const msg = addAgentMessage({
      ...data,
      agentId: user?.userId || 'agent',
      agentName: user?.name || 'Agent',
    })
    return { data: msg, _mock: true }
  }
}

// Agent: get all messages they sent (legacy)
export const getMyAgentMessages = async () => {
  try {
    return await api.get('/agent-messages/my')
  } catch (err) {
    return { data: getAgentMessages(), _mock: true }
  }
}

// NEW: Agent sends a message directly to property owner
// POST /api/agent-messages/to-owner  { propertyId, message }
export const sendToOwner = async ({ propertyId, message }) => {
  try {
    return await api.post('/agent-messages/to-owner', { propertyId, message })
  } catch (err) {
    const user = getCurrentUser()
    const prop = ownerProperties.find(p => String(p.id) === String(propertyId))
    const ownerId = prop?.ownerId || 'demo-owner'
    const ownerName = prop?.ownerName || 'Property Owner'
    const propertyTitle = prop?.title || `Property #${propertyId}`

    const mockMsg = addOwnerMockMessage({
      propertyId,
      message,
      ownerId,
      ownerName,
      propertyTitle
    }, {
      userId: user?.userId || user?.email,
      name: user?.name || 'Agent'
    })
    return { data: mockMsg, _mock: true }
  }
}

// NEW: Agent gets all owner replies to their messages
// GET /api/agent-messages/owner-replies
export const getOwnerReplies = async () => {
  try {
    return await api.get('/agent-messages/owner-replies')
  } catch {
    const user = getCurrentUser()
    const agentId = user?.userId || user?.email
    return { data: getOwnerMockReplies(agentId), _mock: true }
  }
}