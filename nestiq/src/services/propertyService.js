// src/services/propertyService.js
import api from './axiosConfig'
import { getCurrentUser } from '../utils/currentUser'
import {
  addProperty,
  getMyAddedProperties,
  getAllMockProperties,
  getMockPropertyById,
  updateMockProperty,
  deleteMockProperty,
  getOwnerMockProperties,
  updateOwnerMockProperty,
  addNotification,
} from '../mock/mockStore'
import { properties as seedProperties } from '../data/properties'

function applyFilters(list, params = {}) {
  let filtered = [...list]
  // Never show SOLD or RENTED properties on the public listing page
  filtered = filtered.filter(p => p.status !== 'SOLD' && p.status !== 'RENTED')

  // Filter out open requests that don't have an agent assigned yet
  filtered = filtered.filter(p => {
    const reqStatus = p.agentRequestStatus;
    if (!reqStatus) return true; // default to agent-created properties
    if (reqStatus === 'SELF_SELL') return true;
    if (reqStatus === 'ASSIGNED') return true;
    if (reqStatus === 'OPEN' && (p.agentId || p.agentName || p.agent)) return true;
    return false;
  })
  
  if (params.cities) {
    const citiesStr = typeof params.cities === 'string'
      ? params.cities
      : (Array.isArray(params.cities) ? params.cities.join(',') : String(params.cities))
    const cityList = citiesStr.toLowerCase().split(',').map(c => c.trim())
    filtered = filtered.filter(p => p.city && cityList.includes(p.city.toLowerCase()))
  } else if (params.city) {
    filtered = filtered.filter(p => p.city && p.city.toLowerCase() === params.city.toLowerCase())
  }
  
  if (params.listingType) {
    filtered = filtered.filter(p => p.listingType === params.listingType)
  }
  
  if (params.bhks) {
    const bhksStr = typeof params.bhks === 'string'
      ? params.bhks
      : (Array.isArray(params.bhks) ? params.bhks.join(',') : String(params.bhks))
    const bhkList = bhksStr.split(',').map(String)
    filtered = filtered.filter(p => bhkList.includes(String(p.bhk || p.bedrooms)))
  } else if (params.bhk) {
    filtered = filtered.filter(p => String(p.bhk || p.bedrooms) === String(params.bhk))
  }
  
  if (params.minPrice) {
    filtered = filtered.filter(p => Number(p.price) >= Number(params.minPrice))
  }
  
  if (params.maxPrice) {
    filtered = filtered.filter(p => Number(p.price) <= Number(params.maxPrice))
  }
  
  if (params.sortBy === 'price_asc') {
    filtered.sort((a, b) => Number(a.price) - Number(b.price))
  } else if (params.sortBy === 'price_desc') {
    filtered.sort((a, b) => Number(b.price) - Number(a.price))
  } else if (params.sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  } else {
    filtered.sort((a, b) => (Number(b.trustScore) || 0) - (Number(a.trustScore) || 0))
  }
  
  return filtered
}


export const getPublicProperties = async (params) => {
  const approvedOwnerProps = getOwnerMockProperties().filter(p => p.approved === true)
  const mergedMock = [...getAllMockProperties(), ...approvedOwnerProps, ...seedProperties]
  try {
    const res = await api.get('/properties/public', { params })
    const rawData = res.data
    const backendData = Array.isArray(rawData?.content) 
      ? rawData.content 
      : (Array.isArray(rawData) ? rawData : [])
    
    // Deduplicate by ID prioritizing backend data
    const seen = new Set()
    const unique = []
    for (const p of [...backendData, ...mergedMock]) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id)
        unique.push(p)
      }
    }

    const finalData = applyFilters(unique, params)
    return { ...res, data: finalData }
  } catch {
    return { data: applyFilters(mergedMock, params), _mock: true }
  }
}

export const getPublicProperty = async (id) => {
  try {
    return await api.get(`/properties/public/${id}`)
  } catch {
    const mockProp = getMockPropertyById(id)
    if (mockProp) return { data: mockProp, _mock: true }
    const seedProp = seedProperties.find(p => String(p.id) === String(id))
    if (seedProp) return { data: seedProp, _mock: true }
    throw new Error('Property not found')
  }
}

export const getMyProperties = async () => {
  try {
    return await api.get('/properties/my')
  } catch {
    const user = getCurrentUser()
    const agentId = user?.userId || user?.email
    const agentAdded = getMyAddedProperties(agentId)
    const assignedOwnerProps = getOwnerMockProperties().filter(p => String(p.agentId) === String(agentId))
    const combined = [...agentAdded, ...assignedOwnerProps]
    return { data: combined, _mock: true }
  }
}

export const createProperty = async (data) => {
  try {
    return await api.post('/properties', data)
  } catch {
    const user = getCurrentUser()
    return { data: addProperty(data, { userId: user?.userId, name: user?.name }), _mock: true }
  }
}

export const updateProperty = async (id, data) => {
  try {
    return await api.put(`/properties/${id}`, data)
  } catch {
    const updated = updateMockProperty(id, data)
    if (updated) return { data: updated, _mock: true }
    throw new Error('Update failed')
  }
}

export const deleteProperty = async (id) => {
  try {
    return await api.delete(`/properties/${id}`)
  } catch {
    deleteMockProperty(id)
    return { data: { success: true }, _mock: true }
  }
}

export const getAllPropertiesAdmin = async () => {
  try {
    return await api.get('/properties/admin/all')
  } catch {
    // Merge agent listings + owner-submitted listings + seed data for a full admin view
    const ownerProps = getOwnerMockProperties()          // all owner-submitted (no filter)
    const combined   = [...ownerProps, ...getAllMockProperties(), ...seedProperties]
    return { data: combined, _mock: true }
  }
}

/**
 * Approve a pending property.
 * Tries the real API first; on any outcome (success or offline failure)
 * also syncs the mockStore so the admin UI always reflects the change.
 */
export const approveProperty = async (id) => {
  let res = null
  try {
    res = await api.put(`/properties/admin/approve/${id}`)
  } catch {
    // backend offline — fall through to mockStore sync below
  }
  // Always update both stores so the change persists across page refreshes
  updateMockProperty(id, { status: 'ACTIVE', approved: true })
  const ownerProp = updateOwnerMockProperty(id, { status: 'ACTIVE', approved: true })
  // Notify the owner that their property has been approved
  if (ownerProp?.ownerId) {
    addNotification(
      ownerProp.ownerId,
      `✅ Your property "${ownerProp.title}" has been approved and is now ACTIVE!`,
      '/owner/properties'
    )
  }
  return res || { data: { success: true }, _mock: true }
}

/**
 * Reject (remove) a pending property.
 * Tries the real API first; on any outcome also marks the property in
 * mockStore as REJECTED so it no longer appears in pending lists.
 */
export const rejectProperty = async (id) => {
  let res = null
  try {
    res = await api.delete(`/properties/admin/reject/${id}`)
  } catch {
    // backend offline — fall through to mockStore sync below
  }
  // Mark as REJECTED in both stores (never delete from mock — admin may want audit trail)
  updateMockProperty(id, { status: 'REJECTED', approved: false })
  updateOwnerMockProperty(id, { status: 'REJECTED', approved: false })
  return res || { data: { success: true }, _mock: true }
}

// NEW: Get all open owner requests that agents can accept
// GET /api/properties/open-requests
export const getOpenRequests = async () => {
  try {
    return await api.get('/properties/open-requests')
  } catch {
    // Offline fallback: open requests from ownerProperties + seed properties without agent
    const ownerProps = getOwnerMockProperties().filter(p => p.agentRequestStatus === 'OPEN')
    const seedProps = seedProperties
      .filter(p => !p.agentId && !p.agentName)
      .map(p => ({ ...p, agentRequestStatus: 'OPEN', ownerName: p.ownerName || 'Property Owner' }))
    const combined = [...ownerProps, ...seedProps]
    return { data: combined, _mock: true }
  }
}

// NEW: Agent accepts an open property request
// PUT /api/properties/{id}/accept-assignment
export const acceptAssignment = async (propertyId) => {
  try {
    return await api.put(`/properties/${propertyId}/accept-assignment`)
  } catch {
    // Mock fallback: tag the owner property with this agent
    const user     = getCurrentUser()
    const agentId  = user?.userId || user?.email || 'demo-agent'
    const agentName = user?.name || 'Agent'
    const updated = updateOwnerMockProperty(propertyId, {
      agentId,
      agentName,
      agentRequestStatus: 'ASSIGNED',
      status: 'PENDING_APPROVAL',
    })
    // Notify the owner that an agent accepted their property request
    if (updated?.ownerId) {
      addNotification(
        updated.ownerId,
        `👤 Agent ${agentName} has accepted your property "${updated.title}". Awaiting admin approval.`,
        '/owner/properties'
      )
    }
    return { data: updated || { success: true }, _mock: true }
  }
}

/**
 * Mark a property as SOLD or RENTED.
 * Tries the real API first; on failure updates BOTH mock stores so the
 * change is visible across all dashboard views and the public listing.
 *
 * After marking SOLD/RENTED the property is excluded from public listings
 * because getPublicProperties already combines mock + seed data — the
 * updated status in mockStore means it won't pass any future "AVAILABLE" filter.
 *
 * @param {string|number} propertyId
 * @param {'SOLD'|'RENTED'} status
 */
export const markPropertyStatus = async (propertyId, status) => {
  try {
    return await api.put(`/properties/${propertyId}/status`, { status })
  } catch {
    // Update the agent's property store
    updateMockProperty(propertyId, { status })
    // Also update the owner store in case this is an owner-submitted property
    updateOwnerMockProperty(propertyId, { status })
    return { data: { id: propertyId, status }, _mock: true }
  }
}