import api from './axiosConfig'

/**
 * GET /api/trust/breakdown/{propertyId}
 * @returns {Promise<{ documentVerification, agentActivity, customerReviews,
 *                     listingQuality, fraudSignals, totalScore, status, color }>}
 */
export const getTrustBreakdown = (propertyId) =>
  api.get(`/trust/breakdown/${propertyId}`)

/**
 * GET /api/trust/score/{propertyId}
 * @returns {Promise<number>}
 */
export const getTrustScore = (propertyId) =>
  api.get(`/trust/score/${propertyId}`)