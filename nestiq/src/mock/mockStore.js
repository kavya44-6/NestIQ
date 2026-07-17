/**
 * mockStore.js — Shared in-memory + localStorage-backed store that makes the
 * Customer ↔ Agent interaction work without a backend.
 *
 * - Properties added by an "agent" are saved here and immediately show up on
 *   the public /properties listing and on the agent's "My Properties" page.
 * - Inquiries & visits sent by a "customer" are saved here and immediately
 *   show up on the agent's Inquiries / Visits pages, and vice-versa for
 *   agent replies / status updates.
 *
 * Everything is persisted to localStorage so it survives page refreshes and
 * works across the Customer dashboard / Agent dashboard tabs of the same
 * browser (useful when testing both roles as the same person).
 *
 * In production you'd replace these with real API calls to your Spring Boot
 * backend. The service files (propertyService, inquiryService, visitService)
 * already try the real API first and only fall back to this store if that
 * call fails (e.g. backend offline).
 */

const LS_KEYS = {
  properties:      'nestiq_mock_properties',
  inquiries:       'nestiq_mock_inquiries',
  visits:          'nestiq_mock_visits',
  agentMsgs:       'nestiq_mock_agent_messages',
  counters:        'nestiq_mock_counters',
  ownerProperties: 'nestiq_mock_owner_properties',   // owner-submitted listings
  notifications:   'nestiq_mock_notifications',       // in-app notification bell
  ownerMessages:   'nestiq_mock_owner_messages',
}

// ── Persistence helpers ─────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore (e.g. storage full / disabled)
  }
}

// ── Seed inquiries ──────────────────────────────────────────────────────────
const seedInquiries = [
  {
    id: 1001,
    propertyId: 1,
    propertyTitle: 'Spacious 3BHK Apartment near Gandhipuram',
    customerId: 'demo-customer',
    customerName: 'Meena Rajan',
    customerEmail: 'meena@example.com',
    message: 'Hi, I\'m interested in this property. Could you please share more details about parking availability and move-in date?',
    status: 'NEW',
    agentResponse: null,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 1002,
    propertyId: 2,
    propertyTitle: 'Modern 2BHK Villa with Garden',
    customerId: 'demo-customer',
    customerName: 'Meena Rajan',
    customerEmail: 'meena@example.com',
    message: 'Is pet-friendly accommodation available? We have a small dog.',
    status: 'RESPONDED',
    agentResponse: 'Hello Meena! Yes, we do allow small pets. Please schedule a visit and we can discuss further.',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
]

// ── Seed visits ─────────────────────────────────────────────────────────────
const seedVisits = [
  {
    id: 2001,
    propertyId: 3,
    propertyTitle: 'Luxury Apartment in Avinashi Road',
    customerId: 'demo-customer',
    customerName: 'Meena Rajan',
    customerEmail: 'meena@example.com',
    visitDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    status: 'SCHEDULED',
    agentNote: null,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
]

// ── Seed agent→company messages ─────────────────────────────────────────────
const seedAgentMessages = [
  {
    id: 3001,
    propertyId: 1,
    propertyTitle: 'Spacious 3BHK Apartment near Gandhipuram',
    agentId: 'arvind',
    agentName: 'Arvind Sharma',
    companyName: 'NestEdge Realty HQ',
    message: 'Customer Meena Rajan is very interested in property #1. She wants to book a visit next weekend. Please confirm if the property is still available.',
    status: 'PENDING',
    companyReply: null,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
]

// ── In-memory state (hydrated from localStorage, falling back to seed) ─────
export const inquiries      = load(LS_KEYS.inquiries, seedInquiries)
export const visits         = load(LS_KEYS.visits, seedVisits)
export const agentMessages  = load(LS_KEYS.agentMsgs, seedAgentMessages)
export const myProperties   = load(LS_KEYS.properties, [])
export const ownerProperties = load(LS_KEYS.ownerProperties, [])
export const ownerMessages  = load(LS_KEYS.ownerMessages, [])

// ── Counters for IDs (persisted so refresh doesn't collide) ────────────────
const defaultCounters = { inquiry: 1100, visit: 2100, msg: 3100, property: 9001, ownerMsg: 4100 }
const counters = { ...defaultCounters, ...load(LS_KEYS.counters, defaultCounters) }

function saveCounters() {
  save(LS_KEYS.counters, counters)
}

// ════════════════════════════════════════════════════════════════════════
// PROPERTY HELPERS
// ════════════════════════════════════════════════════════════════════════

/**
 * Add a new property listing (used by Agent → Add Property).
 * `agentMeta` is the logged-in user's info from AuthContext, used to tag the
 * listing as belonging to this agent and to display contact details.
 */
export function addProperty(payload, agentMeta = {}) {
  const id = counters.property++
  saveCounters()

  const property = {
    id,
    title: payload.title,
    description: payload.description || '',
    price: Number(payload.price) || 0,
    location: payload.location || '',
    city: payload.city || '',
    bhk: Number(payload.bhk) || 0,
    bathrooms: Number(payload.bathrooms) || 0,
    area: Number(payload.area) || 0,
    propertyType: payload.propertyType || 'Apartment',
    listingType: payload.listingType || 'RENT',
    status: payload.status || 'AVAILABLE',
    trustScore: payload.trustScore ?? 70,
    image: payload.imageUrl || '',
    images: payload.imageUrl ? [payload.imageUrl] : [],
    amenities: payload.amenities || [],
    furnishing: payload.furnishing || '',
    facing: payload.facing || '',
    floor: payload.floor ?? 0,
    totalFloors: payload.totalFloors ?? 0,
    // Agent / contact info — pulled from the logged-in agent so the
    // customer can actually "contact the agent"
    agentId: agentMeta.userId || agentMeta.email || 'demo-agent',
    agentName: agentMeta.name || 'Your Agent',
    agentPhone: agentMeta.phone || '+91 90000 00000',
    agentEmail: agentMeta.email || 'agent@nestiq.in',
    agentVerified: true,
    sellerCompany: payload.sellerCompany || 'NestIQ Direct Listing',
    sellerPhone: agentMeta.phone || '+91 90000 00000',
    sellerEmail: agentMeta.email || 'agent@nestiq.in',
    createdAt: new Date().toISOString(),
    approved: true,
  }

  myProperties.unshift(property)
  save(LS_KEYS.properties, myProperties)
  return property
}

export function getMyAddedProperties(agentId) {
  if (!agentId) return myProperties
  return myProperties.filter(p => p.agentId === agentId)
}

export function getAllMockProperties() {
  return myProperties
}

export function getMockPropertyById(id) {
  return myProperties.find(p => String(p.id) === String(id)) || 
         ownerProperties.find(p => String(p.id) === String(id))
}

export function updateMockProperty(id, data) {
  const idx = myProperties.findIndex(p => String(p.id) === String(id))
  if (idx === -1) return null
  myProperties[idx] = {
    ...myProperties[idx],
    ...data,
    price: data.price !== undefined ? Number(data.price) : myProperties[idx].price,
    bhk: data.bhk !== undefined ? Number(data.bhk) : myProperties[idx].bhk,
    area: data.area !== undefined ? Number(data.area) : myProperties[idx].area,
  }
  save(LS_KEYS.properties, myProperties)
  return myProperties[idx]
}

export function deleteMockProperty(id) {
  const idx = myProperties.findIndex(p => String(p.id) === String(id))
  if (idx === -1) return false
  myProperties.splice(idx, 1)
  save(LS_KEYS.properties, myProperties)
  return true
}

// ════════════════════════════════════════════════════════════════════════
// INQUIRY HELPERS
// ════════════════════════════════════════════════════════════════════════

export function addInquiry(payload) {
  const inq = {
    id: counters.inquiry++,
    propertyId: payload.propertyId,
    propertyTitle: payload.propertyTitle || `Property #${payload.propertyId}`,
    customerId: payload.customerId || 'guest',
    customerName: payload.customerName || 'Customer',
    customerEmail: payload.customerEmail || '',
    message: payload.message,
    status: 'NEW',
    agentResponse: null,
    createdAt: new Date().toISOString(),
  }
  saveCounters()
  inquiries.unshift(inq)
  save(LS_KEYS.inquiries, inquiries)
  return inq
}

export function respondInquiry(id, response) {
  const inq = inquiries.find(i => i.id === Number(id))
  if (inq) {
    inq.status = 'RESPONDED'
    inq.agentResponse = response
    save(LS_KEYS.inquiries, inquiries)
  }
  return inq
}

export function getInquiriesForCustomer(customerId) {
  return inquiries.filter(i => i.customerId === customerId)
}

/**
 * Inquiries visible to the agent. In this demo every inquiry is visible to
 * every agent (single-agent demo), so the agent can always see what
 * customers have sent — regardless of which property id it's for (seeded
 * properties 1-12 or any newly added mock property).
 */
export function getInquiriesForAgent() {
  return inquiries
}

// ════════════════════════════════════════════════════════════════════════
// VISIT HELPERS
// ════════════════════════════════════════════════════════════════════════

export function addVisit(payload) {
  const visit = {
    id: counters.visit++,
    propertyId: payload.propertyId,
    propertyTitle: payload.propertyTitle || `Property #${payload.propertyId}`,
    customerId: payload.customerId || 'guest',
    customerName: payload.customerName || 'Customer',
    customerEmail: payload.customerEmail || '',
    visitDate: payload.visitDate,
    timeSlot: payload.timeSlot,
    status: 'SCHEDULED',
    agentNote: null,
    createdAt: new Date().toISOString(),
  }
  saveCounters()
  visits.unshift(visit)
  save(LS_KEYS.visits, visits)
  return visit
}

export function updateVisitStatusById(id, status) {
  const v = visits.find(v => v.id === Number(id))
  if (v) {
    v.status = status
    save(LS_KEYS.visits, visits)
  }
  return v
}

export function getVisitsForCustomer(customerId) {
  return visits.filter(v => v.customerId === customerId)
}

export function getVisitsForAgent() {
  return visits
}

// ════════════════════════════════════════════════════════════════════════
// AGENT → COMPANY MESSAGE HELPERS
// ════════════════════════════════════════════════════════════════════════

export function addAgentMessage(payload) {
  const msg = {
    id: counters.msg++,
    propertyId: payload.propertyId,
    propertyTitle: payload.propertyTitle || `Property #${payload.propertyId}`,
    agentId: payload.agentId || 'arvind',
    agentName: payload.agentName || 'Arvind Sharma',
    companyName: payload.companyName || 'NestEdge Realty HQ',
    message: payload.message,
    status: 'PENDING',
    companyReply: null,
    createdAt: new Date().toISOString(),
  }
  saveCounters()
  agentMessages.unshift(msg)
  save(LS_KEYS.agentMsgs, agentMessages)
  return msg
}

export function getAgentMessages() {
  return agentMessages
}

// ════════════════════════════════════════════════════════════════════════
// OWNER PROPERTY HELPERS
// ════════════════════════════════════════════════════════════════════════

/**
 * Owner submits a new property listing (mock fallback for addOwnerProperty).
 * Saved under `nestiq_mock_owner_properties` so it never collides with agent
 * listings in `nestiq_mock_properties`.
 * Initial status is PENDING_AGENT — an agent must accept the assignment first.
 */
export function addOwnerMockProperty(payload, ownerMeta = {}) {
  const id = counters.property++
  saveCounters()

  const property = {
    id,
    title:           payload.title,
    description:     payload.description || '',
    price:           Number(payload.price) || 0,
    location:        payload.location || '',
    city:            payload.city || '',
    bhk:             Number(payload.bhk) || 0,
    bathrooms:       Number(payload.bathrooms) || 0,
    area:            Number(payload.area) || 0,
    propertyType:    payload.propertyType || 'Apartment',
    listingType:     payload.listingType || 'RENT',
    furnishing:      payload.furnishing || '',
    amenities:       payload.amenities || [],
    image:           payload.imageUrl || '',
    images:          payload.imageUrl ? [payload.imageUrl] : [],
    trustScore:      70,
    // Status flow: PENDING_AGENT → PENDING_APPROVAL → ACTIVE → SOLD/RENTED
    status:          payload.selfSell ? 'PENDING_APPROVAL' : 'PENDING_AGENT',
    // Agent assignment — empty until an agent accepts
    agentId:         null,
    agentName:       null,
    agentPhone:      null,
    agentEmail:      null,
    agentRequestStatus: payload.selfSell ? 'SELF_SELL' : 'OPEN',
    // Owner info
    ownerId:         ownerMeta.userId || ownerMeta.email || 'demo-owner',
    ownerName:       ownerMeta.name || 'Property Owner',
    // Counters shown on the card
    inquiryCount:    0,
    visitCount:      0,
    messageCount:    0,
    createdAt:       new Date().toISOString(),
    approved:        true,
  }

  ownerProperties.unshift(property)
  save(LS_KEYS.ownerProperties, ownerProperties)
  return property
}

/**
 * Returns all properties listed by this owner (by ownerId).
 * If no ownerId is supplied, returns everything (admin use).
 */
export function getOwnerMockProperties(ownerId) {
  if (!ownerId) return ownerProperties
  return ownerProperties.filter(p => String(p.ownerId) === String(ownerId))
}

/**
 * Updates a property in the owner properties store.
 * Used by admin approval to set status = ACTIVE.
 */
export function updateOwnerMockProperty(id, data) {
  const idx = ownerProperties.findIndex(p => String(p.id) === String(id))
  if (idx === -1) return null
  ownerProperties[idx] = { ...ownerProperties[idx], ...data }
  save(LS_KEYS.ownerProperties, ownerProperties)
  return ownerProperties[idx]
}

// ════════════════════════════════════════════════════════════════════════
// NOTIFICATION HELPERS
// ════════════════════════════════════════════════════════════════════════

/**
 * In-memory notifications array, hydrated from localStorage on load.
 * Each notification: { id, userId, message, link, read, createdAt }
 */
export const notifications = load(LS_KEYS.notifications, [])

let notifCounter = notifications.length > 0
  ? Math.max(...notifications.map(n => n.id)) + 1
  : 5000

/**
 * Add a notification for a specific user.
 * @param {string} userId  - The recipient user's id or email.
 * @param {string} message - Human-readable notification text.
 * @param {string} [link]  - Optional route to navigate to on click.
 */
export function addNotification(userId, message, link = '') {
  if (!userId || !message) return null
  const notif = {
    id:        notifCounter++,
    userId:    String(userId),
    message,
    link,
    read:      false,
    createdAt: new Date().toISOString(),
  }
  notifications.unshift(notif)
  // Keep at most 50 notifications per store to avoid bloat
  if (notifications.length > 50) notifications.splice(50)
  save(LS_KEYS.notifications, notifications)
  return notif
}

/**
 * Returns all notifications for a user, most recent first.
 */
export function getNotifications(userId) {
  if (!userId) return []
  return notifications.filter(n => String(n.userId) === String(userId))
}

/**
 * Mark a single notification as read.
 */
export function markRead(notifId) {
  const n = notifications.find(n => n.id === Number(notifId))
  if (n) {
    n.read = true
    save(LS_KEYS.notifications, notifications)
  }
  return n
}

/**
 * Mark ALL notifications for a user as read.
 */
export function markAllRead(userId) {
  notifications
    .filter(n => String(n.userId) === String(userId))
    .forEach(n => { n.read = true })
  save(LS_KEYS.notifications, notifications)
}

// ════════════════════════════════════════════════════════════════════════
// OWNER MESSAGES HELPERS
// ════════════════════════════════════════════════════════════════════════

export function addOwnerMockMessage(payload, agentMeta = {}) {
  const id = counters.ownerMsg++
  saveCounters()
  
  const msg = {
    id,
    propertyId: Number(payload.propertyId),
    propertyTitle: payload.propertyTitle || `Property #${payload.propertyId}`,
    agentId: agentMeta.userId || 'demo-agent',
    agentName: agentMeta.name || 'Agent',
    ownerId: payload.ownerId,
    ownerName: payload.ownerName || 'Owner',
    agentMessage: payload.message,
    message: payload.message,
    status: 'PENDING',
    ownerReply: null,
    repliedAt: null,
    createdAt: new Date().toISOString(),
  }
  
  ownerMessages.unshift(msg)
  save(LS_KEYS.ownerMessages, ownerMessages)
  return msg
}

export function getOwnerMockMessages(ownerId) {
  if (!ownerId) return ownerMessages
  return ownerMessages.filter(m => String(m.ownerId) === String(ownerId))
}

export function replyOwnerMockMessage(messageId, reply) {
  const msg = ownerMessages.find(m => m.id === Number(messageId))
  if (msg) {
    msg.status = 'REPLIED'
    msg.ownerReply = reply
    msg.repliedAt = new Date().toISOString()
    save(LS_KEYS.ownerMessages, ownerMessages)
  }
  return msg
}

export function getOwnerMockReplies(agentId) {
  if (!agentId) return ownerMessages
  return ownerMessages.filter(m => String(m.agentId) === String(agentId))
}