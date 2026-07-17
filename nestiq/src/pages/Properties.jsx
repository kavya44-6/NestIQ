import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PropertyCard from '../components/property/PropertyCard'
import EmptyStateComponent from '../components/common/EmptyStateComponent'
import { getPublicProperties } from '../services/propertyService'

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore']

function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ height: 220, background: 'linear-gradient(90deg, var(--cream-200) 25%, var(--border) 50%, var(--cream-200) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 18, width: '75%', background: 'var(--cream-200)', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 13, width: '55%', background: 'var(--cream-200)', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 22, width: '40%', background: 'var(--cream-200)', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: 36, background: 'var(--cream-200)', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
      </div>
    </div>
  )
}

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    cities: searchParams.get('city') ? [searchParams.get('city')] : [],
    listingType: searchParams.get('listingType') || '',
    bhkList: [],
    minPrice: '',
    maxPrice: '',
    sortBy: 'trust', // Default sort is trust
  })

  useEffect(() => {
    const urlCity = searchParams.get('city')
    const urlType = searchParams.get('listingType')
    setFilters(prev => ({
      ...prev,
      cities: urlCity ? [urlCity] : prev.cities,
      listingType: urlType || prev.listingType,
    }))
  }, [searchParams])

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        sortBy: filters.sortBy
      }
      if (filters.cities && filters.cities.length > 0) {
        params.cities = filters.cities.join(',')
      }
      if (filters.listingType) {
        params.listingType = filters.listingType
      }
      if (filters.bhkList && filters.bhkList.length > 0) {
        params.bhks = filters.bhkList.map(Number).join(',')
      }
      if (filters.minPrice) {
        params.minPrice = Number(filters.minPrice)
      }
      if (filters.maxPrice) {
        params.maxPrice = Number(filters.maxPrice)
      }

      const res = await getPublicProperties(params)
      const data = res.data?.content || res.data || []
      setProperties(data)
    } catch (error) {
      console.error('Failed to load properties.', error)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const toggleMultiSelect = (key, value) => {
    setFilters(prev => {
      const list = prev[key]
      const exists = list.includes(value)
      const updated = exists ? list.filter(item => item !== value) : [...list, value]
      return { ...prev, [key]: updated }
    })
  }

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      cities: [],
      listingType: '',
      bhkList: [],
      minPrice: '',
      maxPrice: '',
      sortBy: 'trust',
    })
    setSearchParams({})
  }

  const sorted = properties;

  return (
    <MainLayout>
      <div style={{ paddingTop: 'var(--navbar-height)', background: 'var(--green-50)', minHeight: '100vh' }}>
        
        {/* Light Header Top Bar */}
        <div style={{ background: 'var(--cream-100)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                Properties in Tamil Nadu
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '4px 0 0 0' }}>
                Showing {sorted.length} properties matching your selection
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={e => handleFilter('sortBy', e.target.value)}
                style={{ 
                  padding: '8px 14px', fontSize: 13, borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border)', outline: 'none', background: 'var(--cream-100)', 
                  fontWeight: 600, color: 'var(--text-secondary)'
                }}
              >
                <option value="trust">Most Trusted</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              <button
                onClick={clearFilters}
                className="btn btn-outline btn-sm"
                style={{ padding: '8px 14px' }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Pills Filter Bar */}
        <div style={{ background: 'var(--cream-100)', borderBottom: '1px solid var(--border)', padding: '16px 0', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            {/* City scroll pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>Locality:</span>
              <button 
                onClick={() => handleFilter('cities', [])}
                className={`filter-pill ${filters.cities.length === 0 ? 'active' : ''}`}
              >
                All Cities
              </button>
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => toggleMultiSelect('cities', c)}
                  className={`filter-pill ${filters.cities.includes(c) ? 'active' : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Type & BHK configuration pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>Type:</span>
                {['', 'RENT', 'SALE'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleFilter('listingType', type)}
                    className={`filter-pill ${filters.listingType === type ? 'active' : ''}`}
                  >
                    {type === 'SALE' ? 'Buy' : type === 'RENT' ? 'Rent' : 'All'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>BHK:</span>
                <button
                  onClick={() => handleFilter('bhkList', [])}
                  className={`filter-pill ${filters.bhkList.length === 0 ? 'active' : ''}`}
                >
                  Any
                </button>
                {['1', '2', '3', '4'].map(b => (
                  <button
                    key={b}
                    onClick={() => toggleMultiSelect('bhkList', b)}
                    className={`filter-pill ${filters.bhkList.includes(b) ? 'active' : ''}`}
                  >
                    {b} BHK
                  </button>
                ))}
              </div>

              {/* Price Budget inputs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>Budget (₹):</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={e => handleFilter('minPrice', e.target.value)}
                  style={{ width: 80, padding: '6px 10px', fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--cream-100)', outline: 'none' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={e => handleFilter('maxPrice', e.target.value)}
                  style={{ width: 100, padding: '6px 10px', fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--cream-100)', outline: 'none' }}
                />
              </div>

            </div>

          </div>
        </div>

        {/* Spacious Listings Grid (100% width, no sidebar) */}
        <div className="container" style={{ padding: '32px 24px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 32 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyStateComponent onReset={clearFilters} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 32 }}>
              {sorted.map(property => (
                <div key={property.id} style={{ animation: 'slideUpFade 0.3s ease forwards' }}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  )
}