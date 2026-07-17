export const API_BASE = 'http://localhost:8089/api'

export const CITIES = [
  'Chennai', 'Coimbatore', 'Madurai',
  'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore'
]

export const PROPERTY_TYPES = ['Apartment', 'Villa', 'House', 'Plot', 'Commercial']

export const BHK_OPTIONS = ['1', '2', '3', '4', '4+']

export const LISTING_TYPES = ['SALE', 'RENT']

export const PROPERTY_STATUS = ['AVAILABLE', 'SOLD', 'RENTED']

export const ROLES = { ADMIN: 'ADMIN', AGENT: 'AGENT', CUSTOMER: 'CUSTOMER' }

export const TRUST_SCORE_LABELS = {
  HIGH: { min: 80, label: 'Highly Trusted',      color: 'var(--green-600)' },
  MID:  { min: 60, label: 'Moderately Trusted',  color: 'var(--gold-400)'  },
  LOW:  { min: 0,  label: 'Low Trust',           color: '#e74c3c'          },
}