// src/services/aiService.js
/**
 * AI INTEGRATION PRIORITY CHAIN:
 * 1. Gemini API (Frontend) — Primary for direct, fast, conversational or generation work
 * 2. Spring Boot Endpoint — Secondary, contacts backend services
 * 3. Rule-based Fallback — Tertiary, localized math-based calculations
 * 4. Mock Fallback — Last resort
 */

// ── Paste your FREE keys here ────────────────────────────────────────────────
const GEMINI_API_KEY = '' // Disabled for review — re-enable after getting key from aistudio.google.com/app/apikey
// Get it free at: https://aistudio.google.com/app/apikey
// No credit card needed. 15 req/min, 1M tokens/day free.
// After pasting: all AI features use real Gemini instead of rule-based fallback.

const HF_TOKEN       = '' // https://huggingface.co/settings/tokens   (free)
// ────────────────────────────────────────────────────────────────────────────

import api from './axiosConfig'
import { properties as seedProperties } from '../data/properties'
import { getAllMockProperties } from '../mock/mockStore'

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
const HF_MODEL   = 'mistralai/Mistral-7B-Instruct-v0.2'
const HF_URL     = `https://api-inference.huggingface.co/models/${HF_MODEL}`

const BASE_RENTS = {
  Chennai: 22, Coimbatore: 15, Madurai: 12,
  Tiruchirappalli: 11, Salem: 10, Tiruppur: 10.5, Vellore: 9.5,
}

// Helper to sanitize Gemini's output if it outputs Markdown
function cleanJsonResponse(text) {
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

// ════════════════════════════════════════════════════════════════════════════
// GEMINI HELPER
// ════════════════════════════════════════════════════════════════════════════
async function callGemini(prompt, maxTokens = 250) {
  if (!GEMINI_API_KEY) throw new Error('No Gemini key')

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return text.trim()
}

// ════════════════════════════════════════════════════════════════════════════
// 1. FAIR PRICE — Gemini -> Spring Boot -> Rule-based
// ════════════════════════════════════════════════════════════════════════════
export const getFairPrice = async (property) => {
  // Priority 1: Gemini API directly
  if (GEMINI_API_KEY) {
    try {
      const bhk = property.bedrooms || property.bhk || 2
      const prompt = `Analyze if this property is fairly priced:
Property details:
- Title: ${property.title}
- Price: ₹${property.price}
- City: ${property.city}
- BHK: ${bhk}
- Area: ${property.area} sqft

Respond with a raw JSON object only (no markdown, no backticks, no code fence).
Keys:
- listedPrice: number (the listed price)
- estimatedPrice: number (your estimated fair price based on ₹/sqft in Tamil Nadu cities)
- percentDiff: number (percentage difference, e.g. 15 or -10)
- verdict: string (a short verdict, e.g. "Fairly Priced" or "15% above market")
- color: string (hex color: green '#16a34a', gold '#d97706', red '#dc2626')`

      const reply = await callGemini(prompt, 200)
      const data = JSON.parse(cleanJsonResponse(reply))
      if (data.verdict) return data
    } catch {}
  }

  // Priority 2: Spring Boot endpoint
  if (property.id) {
    try {
      const res = await api.get(`/ai/fair-price/${property.id}`)
      if (res.data) return res.data
    } catch {}
  }

  // Priority 3: Local Rule-based math
  const base      = BASE_RENTS[property.city] || 12
  const bhk       = property.bedrooms || property.bhk || 2
  const area      = property.area || 1000
  const estimated = base * area * (0.8 + bhk * 0.1)
  const listed    = property.price || estimated
  const diff      = ((listed - estimated) / estimated) * 100

  let verdict, color
  if      (diff < -10) { verdict = `Great Deal — ${Math.abs(diff).toFixed(0)}% below market`; color = '#16a34a' }
  else if (diff <  10) { verdict = 'Fairly Priced';                                            color = '#2d8653' }
  else if (diff <  20) { verdict = `${diff.toFixed(0)}% above market`;                        color = '#b8952a' }
  else                 { verdict = `${diff.toFixed(0)}% above market — negotiate`;             color = '#dc2626' }

  return { listedPrice: listed, estimatedPrice: Math.round(estimated), percentDiff: Math.round(diff), verdict, color }
}

// ═════════════════════════════════════════════
// o═══════════════════════════════
// 2. TRUST BREAKDOWN — Gemini -> Spring Boot -> Rule-based
// ════════════════════════════════════════════════════════════════════════════
export const getTrustBreakdown = async (propertyId, property = null) => {
  let p = property
  if (!p && propertyId) {
    try {
      const res = await api.get(`/properties/public/${propertyId}`)
      p = res.data
    } catch {}
  }
  if (!p) p = {}

  const forceMatch = (data) => {
    if (p.trustScore !== undefined && p.trustScore !== null) {
      data.totalScore = p.trustScore
      if (p.trustScore >= 80) {
        data.status = 'Highly Trusted'
        data.color = '#16a34a'
      } else if (p.trustScore >= 60) {
        data.status = 'Moderately Trusted'
        data.color = '#d97706'
      } else {
        data.status = 'Low Trust'
        data.color = '#dc2626'
      }
    }
    return data
  }

  // Priority 1: Gemini API directly
  if (GEMINI_API_KEY) {
    try {
      const prompt = `Evaluate the trust profile of this property listing and provide a score breakdown:
Property Details:
- Title: ${p.title}
- Agent Verified: ${p.agentVerified ? 'Yes' : 'No'}
- User Review Trust Score: ${p.trustScore || 'N/A'}
- Image/Details Present: ${[p.title, p.description, p.area, p.bhk || p.bedrooms, p.imageUrl].filter(Boolean).length} / 5

Respond with a raw JSON object only (no markdown, no backticks, no code fence).
Keys:
- documentVerification: number (score out of 30)
- agentActivity: number (score out of 25)
- customerReviews: number (score out of 20)
- listingQuality: number (score out of 15)
- fraudSignals: number (score out of 10)
- totalScore: number (sum of the above, out of 100)
- status: string (e.g. "Highly Trusted", "Moderately Trusted", "Low Trust")
- color: string (hex color: '#16a34a' for high, '#d97706' for medium, '#dc2626' for low)`

      const reply = await callGemini(prompt, 250)
      const data = JSON.parse(cleanJsonResponse(reply))
      if (data.totalScore) return forceMatch(data)
    } catch {}
  }

  // Priority 2: Spring Boot endpoint
  if (propertyId) {
    try {
      const res = await api.get(`/ai/trust/${propertyId}`)
      if (res.data) return forceMatch(res.data)
    } catch {}
  }

  // Priority 3: Local Rule-based math
  const docScore    = p.agentVerified ? 28 : 14
  const actScore    = p.agentVerified ? 22 : 12
  const reviewScore = p.trustScore ? Math.round((p.trustScore / 100) * 20) : 14
  const listScore   = [p.title, p.description, p.area, p.bhk || p.bedrooms, p.imageUrl].filter(Boolean).length >= 4 ? 14 : 8
  const fraudScore  = p.trustScore >= 80 ? 10 : p.trustScore >= 60 ? 7 : 4
  const totalScore  = docScore + actScore + reviewScore + listScore + fraudScore

  let status, color
  if      (totalScore >= 80) { status = 'Highly Trusted';      color = '#16a34a' }
  else if (totalScore >= 60) { status = 'Moderately Trusted';  color = '#d97706' }
  else                       { status = 'Low Trust';           color = '#dc2626' }

  return forceMatch({ documentVerification: docScore, agentActivity: actScore, customerReviews: reviewScore, listingQuality: listScore, fraudSignals: fraudScore, totalScore, status, color })
}

// ════════════════════════════════════════════════════════════════════════════
// 3. AI PROPERTY MATCHER — Gemini -> Spring Boot -> Rule-based
// ════════════════════════════════════════════════════════════════════════════
export const getAiRecommendations = async (payload) => {
  // Priority 1: Gemini API directly
  if (GEMINI_API_KEY) {
    try {
      const allProps = [...getAllMockProperties(), ...seedProperties].filter(p => p.status === 'AVAILABLE' || !p.status)
      const prompt = `You are an AI Matcher for NestIQ. Match the following user profile with the list of available properties.
User profile:
- Income: ₹${payload.income}/month (Max rent/EMI budget should be around ₹${payload.income * 0.4}/month)
- Family Size: ${payload.familySize}
- Preferred City: ${payload.preferredCity || 'Any'}
- Workplace Area: ${payload.workplaceArea || 'Any'}
- Lifestyle Needs: ${payload.lifestyleNeeds || 'Any'}

Available Properties:
${JSON.stringify(allProps.map(p => ({ id: p.id, title: p.title, city: p.city, price: p.price, bhk: p.bedrooms || p.bhk, area: p.area, agentVerified: p.agentVerified, trustScore: p.trustScore })))}

Respond with a raw JSON array of the top 5 matching properties. Do not wrap in markdown or code blocks.
Each item in the array must be an object with these keys:
- property: { id: number, title: string, city: string, price: number, bedrooms: number, area: number, trustScore: number }
- matchScore: number (score between 0 and 100)
- budgetFit: number (score out of 25)
- familySizeFit: number (score out of 20)
- cityMatch: number (score out of 15)
- trustScoreContrib: number (score out of 20)
- lifestyleMatch: number (score out of 20)
- reasoning: string (a brief explanation of why this property matches the user's profile)`

      const reply = await callGemini(prompt, 1000)
      const matches = JSON.parse(cleanJsonResponse(reply))
      if (Array.isArray(matches) && matches.length > 0) return matches
    } catch {}
  }

  // Priority 2: Spring Boot endpoint
  try {
    const res = await api.post('/ai/recommend', payload)
    if (res.data && res.data.length > 0) return res.data
  } catch {}

  // Priority 3: Local Rule-based matching
  return localRecommend(payload)
}

function localRecommend({ income, familySize, preferredCity, workplaceArea, lifestyleNeeds }) {
  const maxBudget = income * 0.4
  const allProps   = [...getAllMockProperties(), ...seedProperties]

  return allProps
    .filter(p => p.status === 'AVAILABLE' || !p.status)
    .map(p => {
      // 1. Budget Fit (max 25)
      let budgetFit = 12.5
      if (income && p.price) {
        const price = Number(p.price)
        if (price <= maxBudget) {
          budgetFit = 15.0 + 10.0 * (1.0 - (price / maxBudget))
        } else {
          budgetFit = Math.max(0, 15.0 * (maxBudget / price))
        }
      }

      // 2. Family Size Fit (max 20)
      let familySizeFit = 10.0
      const bhk = p.bhk || p.bedrooms || 0
      if (familySize) {
        const idealBhk = familySize <= 2 ? 1 : familySize <= 4 ? 2 : 3
        const diff = Math.abs(bhk - idealBhk)
        familySizeFit = Math.max(0, 20.0 - diff * 10)
      }

      // 3. Preferred City Match (max 15)
      let cityMatch = 0.0
      if (preferredCity && p.city) {
        cityMatch = p.city.toLowerCase() === preferredCity.toLowerCase() ? 15.0 : 0.0
      } else {
        cityMatch = 7.5
      }

      // 4. Trust Score Contribution (max 20)
      let trustScoreContrib = 10.0
      if (p.trustScore) {
        trustScoreContrib = p.trustScore * 0.2
      }

      // 5. Lifestyle Compatibility (max 20)
      let lifestyleMatch = 10.0
      if (lifestyleNeeds) {
        const words = lifestyleNeeds.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3)
        const body  = ((p.title || '') + ' ' + (p.description || '') + ' ' + (p.amenities || []).join(' ')).toLowerCase()
        let hits = 0
        words.forEach(w => { if (body.includes(w)) hits++ })
        lifestyleMatch = Math.min(20, 10.0 + hits * 5.0)
      }

      const totalScore = budgetFit + familySizeFit + cityMatch + trustScoreContrib + lifestyleMatch

      return {
        property:   normalise(p),
        matchScore: Math.round(Math.min(totalScore, 99) * 10) / 10,
        budgetFit: Math.round(budgetFit * 10) / 10,
        familySizeFit: Math.round(familySizeFit * 10) / 10,
        cityMatch: Math.round(cityMatch * 10) / 10,
        trustScoreContrib: Math.round(trustScoreContrib * 10) / 10,
        lifestyleMatch: Math.round(lifestyleMatch * 10) / 10,
        reasoning:  buildReason(p, familySize ? (familySize <= 2 ? 1 : familySize <= 4 ? 2 : 3) : 2, income ? income * 40 : null),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
}

function buildReason(p, idealBhk, maxBudget) {
  const bhk = p.bhk || p.bedrooms || 0
  const parts = []
  if (bhk === idealBhk)     parts.push(`${bhk} BHK perfectly suits your family size`)
  else if (bhk > idealBhk)  parts.push(`${bhk} BHK gives extra space`)
  else                      parts.push(`Compact ${bhk} BHK — budget-efficient`)
  if (p.price && maxBudget) {
    const pct = Math.round((p.price / maxBudget) * 100)
    if (pct <= 60) parts.push(`only ${pct}% of your max budget`)
    else if (pct <= 80) parts.push('comfortably within budget')
  }
  if (p.agentVerified)    parts.push('managed by a verified agent')
  if (p.trustScore >= 85) parts.push(`high trust score (${p.trustScore}/100)`)
  const loc = p.location || p.city
  if (loc) parts.push(`in ${loc}`)
  return parts.length ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + '. ' + parts.slice(1).join(', ') + '.' : `A solid property in ${p.city}.`
}

function normalise(p) {
  return { id: p.id, title: p.title, city: p.city, address: p.location || p.address, propertyType: p.propertyType || p.type, bedrooms: p.bhk || p.bedrooms, area: p.area, price: p.price, imageUrl: p.images?.[0] || p.image || p.imageUrl, trustScore: p.trustScore }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. AI CHAT — Gemini -> Spring Boot -> HuggingFace -> Rule-based
// ════════════════════════════════════════════════════════════════════════════
export const sendAiChat = async (propertyId, message, history = [], property = null) => {
  // Gemini disabled for review stability — using intelligent rule-based responses
  // To re-enable: add valid Gemini key (starts with AIza) to GEMINI_API_KEY above
  return ruleChat(message, property)
}

function ruleChat(message, property) {
  const msg  = message.toLowerCase()
  const p    = property || {}
  const name = p.title || 'this property'

  if (msg.includes('price') || msg.includes('cost') || msg.includes('rent') || msg.includes('how much')) {
    const formattedPrice = p.price ? `₹${Number(p.price).toLocaleString('en-IN')}${p.listingType === 'RENT' ? '/month' : ''}` : 'not specified'
    return `The listed price for ${name} is ${formattedPrice}.`
  }
  if (msg.includes('bedroom') || msg.includes('bhk')) {
    const bhk = p.bhk || p.bedrooms || 'not specified'
    return `${name} has ${bhk} BHK/bedrooms configuration.`
  }
  if (msg.includes('visit') || msg.includes('schedule') || msg.includes('book')) {
    return 'Click the Schedule Visit button above to book a site visit.'
  }
  if (msg.includes('area') || msg.includes('sqft') || msg.includes('size')) {
    return p.area ? `${name} has a built-up area of ${p.area} sqft.` : 'Area details are not specified for this listing.'
  }
  if (msg.includes('parking') || msg.includes('park') || msg.includes('car')) {
    const has = Array.isArray(p.amenities) && p.amenities.some(a => a.toLowerCase().includes('park'))
    return has ? `Yes, ${name} includes dedicated parking facility.` : `Parking details are not explicitly listed for ${name}.`
  }
  if (msg.includes('amenities') || msg.includes('facilities') || msg.includes('feature')) {
    const list = Array.isArray(p.amenities) && p.amenities.length > 0 ? p.amenities.join(', ') : 'standard amenities'
    return `Amenities in ${name} include: ${list}.`
  }
  if (msg.includes('hello') || msg.includes('hi')) {
    return `Hi there! 👋 I'm your AI assistant for ${name}. Ask me about price, configuration, amenities, or scheduling a visit!`
  }
  return 'For detailed questions about this property, use the Inquiry button above to contact the agent directly.'
}

// ════════════════════════════════════════════════════════════════════════════
// 5. AI DESCRIPTION GENERATOR — Gemini -> Spring Boot -> Rule-based
// ════════════════════════════════════════════════════════════════════════════
export const generateDescription = async (details) => {
  // Priority 1: Gemini API directly
  if (GEMINI_API_KEY) {
    try {
      const { title, city, location, bhk, area, propertyType, listingType, furnishing, amenities } = details
      const prompt = `Write a professional 3-sentence property description for a Tamil Nadu real estate listing.
Use ONLY the provided details — do not invent any information.
Tone: factual, professional, appealing to a genuine buyer or tenant.

Property details:
- Title: ${title || 'Residential Property'}
- City: ${city || 'Tamil Nadu'}
- Location/Area: ${location || city || 'Tamil Nadu'}
- BHK: ${bhk || 2}
- Area: ${area ? area + ' sqft' : 'not specified'}
- Property Type: ${propertyType || 'Apartment'}
- Listing Type: ${listingType === 'SALE' ? 'For Sale' : 'For Rent'}
- Furnishing: ${furnishing || 'Not specified'}
- Amenities: ${Array.isArray(amenities) && amenities.length > 0 ? amenities.join(', ') : 'Standard amenities'}

Write exactly 3 sentences. No bullet points. No invented details.`

      const desc = await callGemini(prompt, 200)
      if (desc) return desc
    } catch {}
  }

  // Priority 2: Spring Boot endpoint
  try {
    const res = await api.post('/ai/generate-description', details)
    if (res.data?.description) return res.data.description
  } catch {}

  // Priority 3: Rule-based fallback
  const { title, city, bhk, area, propertyType, listingType, furnishing } = details
  const bhkStr  = bhk ? `${bhk}BHK ` : ''
  const typeStr = propertyType || 'property'
  const areaStr = area ? ` spanning ${area} sqft` : ''
  const listStr = listingType === 'SALE' ? 'for sale' : 'available for rent'
  const furnStr = furnishing ? ` The property is ${furnishing.toLowerCase()}.` : ''
  return `This ${bhkStr}${typeStr}${areaStr} is ${listStr} in ${city || 'Tamil Nadu'}.${furnStr} Located in a well-connected neighbourhood, it offers a comfortable living experience suitable for families and professionals. Contact the agent for a site visit and more details.`
}

// ════════════════════════════════════════════════════════════════════════════
// 6. AI PRICE ESTIMATOR — Gemini -> Spring Boot -> Rule-based
// ════════════════════════════════════════════════════════════════════════════
export const estimatePrice = async (details) => {
  // Priority 1: Gemini API directly
  if (GEMINI_API_KEY) {
    try {
      const { city, bhk, area, listingType, furnishing } = details
      const prompt = `Estimate the price range for a property in Tamil Nadu:
- City: ${city}
- BHK: ${bhk}
- Area: ${area} sqft
- Listing Type: ${listingType}
- Furnishing: ${furnishing}

Respond with a raw JSON object only (no markdown, no backticks, no code fence).
Keys:
- estimatedMin: number (minimum price/rent estimate)
- estimatedMax: number (maximum price/rent estimate)
- explanation: string (one-sentence explanation of why it fits the local market rates)`

      const response = await callGemini(prompt, 250)
      const est = JSON.parse(cleanJsonResponse(response))
      if (est.estimatedMin && est.estimatedMax) {
        const base    = BASE_RENTS[city] || 12
        const bhkNum  = Number(bhk) || 2
        const areaNum = Number(area) || 1000
        const mult = furnishing === 'Fully Furnished' ? 1.25 : (furnishing === 'Semi Furnished' ? 1.10 : 1.0)
        const saleMult = listingType === 'SALE' ? 12 * 80 : 1.0
        est.breakdown = {
          baseRate: base,
          areaContribution: base * areaNum,
          bhkFactor: 0.8 + bhkNum * 0.1,
          furnishingMultiplier: mult,
          saleMultiplier: saleMult,
          baseEstimate: base * areaNum * (0.8 + bhkNum * 0.1)
        }
        return est
      }
    } catch {}
  }

  // Priority 2: Spring Boot endpoint
  try {
    const res = await api.post('/ai/estimate-price', details)
    if (res.data?.estimatedMin) return res.data
  } catch {}

  // Priority 3: Rule-based fallback
  const { city, bhk, area, listingType, furnishing } = details
  const base    = BASE_RENTS[city] || 12
  const bhkNum  = Number(bhk) || 2
  const areaNum = Number(area) || 1000

  let estimated = base * areaNum * (0.8 + bhkNum * 0.1)

  const mult = furnishing === 'Fully Furnished' ? 1.25 : (furnishing === 'Semi Furnished' ? 1.10 : 1.0)
  const saleMult = listingType === 'SALE' ? 12 * 80 : 1.0

  if (furnishing === 'Fully Furnished')   estimated *= 1.25
  if (furnishing === 'Semi Furnished')    estimated *= 1.10
  if (listingType === 'SALE') estimated = estimated * 12 * 80

  const min = Math.round(estimated * 0.9)
  const max = Math.round(estimated * 1.15)

  let explanation = `Based on the ${city} market rate of ₹${base}/sqft/month for a ${bhkNum}BHK, the estimated range for this ${area} sqft property is ₹${min.toLocaleString('en-IN')}–₹${max.toLocaleString('en-IN')}${listingType === 'RENT' ? '/month' : ' (total sale price)'}.`

  return {
    estimatedMin: min,
    estimatedMax: max,
    explanation,
    breakdown: {
      baseRate: base,
      areaContribution: base * areaNum,
      bhkFactor: 0.8 + bhkNum * 0.1,
      furnishingMultiplier: mult,
      saleMultiplier: saleMult,
      baseEstimate: base * areaNum * (0.8 + bhkNum * 0.1)
    }
  }
}

export const getPricePrediction = async (params) => {
  try {
    const res = await api.post('/ai/predict-price', params)
    return res.data
  } catch (err) {
    console.warn('Price prediction unavailable:', err)
    return null;
  }
}