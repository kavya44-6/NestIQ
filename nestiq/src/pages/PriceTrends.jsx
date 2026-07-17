import { useState, useEffect } from 'react'
import MainLayout from '../layouts/MainLayout'
import api from '../services/axiosConfig'
import { getAllMockProperties } from '../mock/mockStore'
import { properties as seedProperties } from '../data/properties'

const LOCALITIES_MOCK = {
  Chennai: [
    { name: 'Anna Nagar West', avgSale: 12500, avgRent: 35, growth: '+12.4%' },
    { name: 'Adyar Beachside', avgSale: 14200, avgRent: 42, growth: '+9.8%' },
    { name: 'OMR Sholinganallur', avgSale: 6800, avgRent: 22, growth: '+15.2%' },
    { name: 'ECR Sea Breeze', avgSale: 9500, avgRent: 32, growth: '+11.1%' }
  ],
  Coimbatore: [
    { name: 'Gandhipuram West', avgSale: 7500, avgRent: 20, growth: '+8.2%' },
    { name: 'Saravanampatti IT Corridor', avgSale: 4800, avgRent: 15, growth: '+13.5%' },
    { name: 'Avinashi Road', avgSale: 8200, avgRent: 24, growth: '+9.4%' },
    { name: 'RS Puram High Street', avgSale: 9800, avgRent: 28, growth: '+6.1%' }
  ],
  Madurai: [
    { name: 'KK Nagar', avgSale: 4900, avgRent: 12, growth: '+6.4%' },
    { name: 'Anna Nagar Madurai', avgSale: 5200, avgRent: 13, growth: '+7.1%' },
    { name: 'Simmakkal Central', avgSale: 7100, avgRent: 18, growth: '+3.8%' }
  ],
  Salem: [
    { name: 'Five Roads Junction', avgSale: 5200, avgRent: 14, growth: '+9.2%' },
    { name: 'Meyyanur Commercial', avgSale: 6100, avgRent: 16, growth: '+6.8%' },
    { name: 'Suramangalam', avgSale: 3900, avgRent: 10, growth: '+5.4%' }
  ],
  Tiruchirappalli: [
    { name: 'Cantonment', avgSale: 5500, avgRent: 15, growth: '+7.8%' },
    { name: 'Thillai Nagar', avgSale: 6200, avgRent: 18, growth: '+8.2%' },
    { name: 'Srirangam', avgSale: 4200, avgRent: 12, growth: '+6.1%' }
  ],
  Tiruppur: [
    { name: 'Avinashi Road', avgSale: 5100, avgRent: 13, growth: '+6.5%' },
    { name: 'Dharapuram Road', avgSale: 4300, avgRent: 11, growth: '+5.9%' }
  ],
  Vellore: [
    { name: 'Sathuvachari', avgSale: 4600, avgRent: 12, growth: '+6.2%' },
    { name: 'Gandhinagar', avgSale: 5000, avgRent: 14, growth: '+7.0%' }
  ]
}

const CITY_GROWTH_LEADERBOARD = [
  { rank: 1, city: 'Chennai', growth: '+8.4%', demand: 'Very High', status: 'BUY' },
  { rank: 2, city: 'Coimbatore', growth: '+7.2%', demand: 'High', status: 'BUY' },
  { rank: 3, city: 'Tiruchirappalli', growth: '+6.1%', demand: 'Moderate', status: 'HOLD' },
  { rank: 4, city: 'Madurai', growth: '+5.8%', demand: 'Stable', status: 'HOLD' },
  { rank: 5, city: 'Tiruppur', growth: '+5.5%', demand: 'Stable', status: 'WATCH' },
  { rank: 6, city: 'Salem', growth: '+5.2%', demand: 'Moderate', status: 'HOLD' },
  { rank: 7, city: 'Vellore', growth: '+4.8%', demand: 'Low', status: 'WATCH' }
]

export default function PriceTrends() {
  const [selectedCity, setSelectedCity] = useState('Chennai')
  const [chartType, setChartType] = useState('sale') // 'sale' | 'rent'
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Yield calculator state
  const [propCost, setPropCost] = useState(5000000)
  const [expectedRent, setExpectedRent] = useState(18000)

  useEffect(() => {
    const fetchMarketAnalysis = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/ai/market-analysis/${selectedCity}`)
        setMarketData(res.data)
      } catch (err) {
        console.error('Failed to fetch market analysis', err)
        
        // Calculate real averages from mock store and seed data
        const baseRate = selectedCity === 'Chennai' ? 22 : selectedCity === 'Coimbatore' ? 15 : selectedCity === 'Madurai' ? 12 : 10
        let saleAvg = baseRate * 1000 * 12 * 80 / 1000
        let rentAvg = baseRate

        const allProps = [...getAllMockProperties(), ...seedProperties].filter(p => p.city?.toLowerCase() === selectedCity.toLowerCase())
        const active = allProps.filter(p => p.status !== 'SOLD' && p.status !== 'RENTED')

        if (active.length > 0) {
          let saleSum = 0, saleCnt = 0
          let rentSum = 0, rentCnt = 0
          active.forEach(p => {
            const area = p.area && Number(p.area) > 0 ? Number(p.area) : 1000
            const price = Number(p.price || 0)
            if (p.listingType === 'SALE') {
              saleSum += (price / area)
              saleCnt++
            } else {
              rentSum += (price / area)
              rentCnt++
            }
          })
          if (saleCnt > 0) saleAvg = saleSum / saleCnt
          if (rentCnt > 0) rentAvg = rentSum / rentCnt
        }

        const growth = selectedCity === 'Chennai' ? '8.4%' : selectedCity === 'Coimbatore' ? '7.2%' : '5.8%'
        const liquidity = selectedCity === 'Chennai' ? 'High' : 'Moderate'
        const demand = selectedCity === 'Chennai' ? 'High' : 'Stable'

        setMarketData({
          city: selectedCity,
          avgSalePriceSqft: Math.round(saleAvg),
          avgRentPriceSqft: Math.round(rentAvg),
          appreciationRate: growth,
          liquidityScore: liquidity,
          demandQuotient: demand,
          diffSalePercent: 0,
          diffRentPercent: 0,
          buyerRecommendation: saleAvg > baseRate * 20 ? 'Asking rates are premium. Look for motivated sellers or properties with active RERA verification tags.' : 'Valuations are in line with local historical ranges. Focus on negotiation and look for high trust score profiles.',
          sellerRecommendation: 'Realize appreciation values by pricing within local sub-market bounds. Highlight lister verifications.',
          investmentOutlook: 'Stable rental assets perform best in this phase. Accumulate systematically.',
          aiMarketAnalysis: `The ${selectedCity} market exhibits a steady appreciation rate of ${growth} with consistent residential absorption across main corridors. Average sale pricing stands at ₹${Math.round(saleAvg)}/sqft and rent at ₹${Math.round(rentAvg)}/sqft/mo.`
        })
      } finally {
        setLoading(false)
      }
    }
    fetchMarketAnalysis()
  }, [selectedCity])

  const localities = LOCALITIES_MOCK[selectedCity] || LOCALITIES_MOCK.Chennai

  // Dynamic 5-year trend generator based on current average rates and appreciation
  const generateTrends = () => {
    if (!marketData) return []
    const appRateVal = parseFloat(marketData.appreciationRate.replace('%', '')) / 100
    const saleAvg = marketData.avgSalePriceSqft
    const rentAvg = marketData.avgRentPriceSqft

    return [
      { year: 2022, rent: Math.round(rentAvg / Math.pow(1 + appRateVal, 4)), sale: Math.round(saleAvg / Math.pow(1 + appRateVal, 4)) },
      { year: 2023, rent: Math.round(rentAvg / Math.pow(1 + appRateVal, 3)), sale: Math.round(saleAvg / Math.pow(1 + appRateVal, 3)) },
      { year: 2024, rent: Math.round(rentAvg / Math.pow(1 + appRateVal, 2)), sale: Math.round(saleAvg / Math.pow(1 + appRateVal, 2)) },
      { year: 2025, rent: Math.round(rentAvg / (1 + appRateVal)), sale: Math.round(saleAvg / (1 + appRateVal)) },
      { year: 2026, rent: Math.round(rentAvg), sale: Math.round(saleAvg) }
    ]
  }

  const trends = generateTrends()

  // Calculate coordinates for SVG line chart
  const padding = 45
  const chartWidth = 500
  const chartHeight = 220

  const getPoints = () => {
    if (trends.length === 0) return []
    const prices = trends.map(t => chartType === 'sale' ? t.sale : t.rent)
    const minVal = Math.min(...prices) * 0.85
    const maxVal = Math.max(...prices) * 1.15
    const valRange = maxVal - minVal

    return trends.map((t, idx) => {
      const x = padding + (idx * (chartWidth - padding * 2)) / (trends.length - 1)
      const val = chartType === 'sale' ? t.sale : t.rent
      const y = chartHeight - padding - ((val - minVal) * (chartHeight - padding * 2)) / (valRange || 1)
      return { x, y, ...t }
    })
  }

  const points = getPoints()
  const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const yieldVal = marketData
    ? ((marketData.avgRentPriceSqft * 12) / marketData.avgSalePriceSqft * 100).toFixed(1) + '%'
    : '4.1%'

  const investmentScore = selectedCity === 'Chennai' ? '90/100' : selectedCity === 'Coimbatore' ? '82/100' : '72/100'

  // Calculate user yield from calculator
  const userYield = ((expectedRent * 12) / propCost * 100).toFixed(2)
  const yieldVerdict = userYield >= 5.0 ? 'Excellent ROI Yield' : userYield >= 3.5 ? 'Stable Average Yield' : 'Low Return Yield'

  // Future growth forecasts
  const growthNum = marketData ? parseFloat(marketData.appreciationRate.replace('%', '')) : 6.0
  const forecasts = [
    { months: 3, rent: marketData ? Math.round(marketData.avgRentPriceSqft * (1 + (growthNum/400))) : 0, sale: marketData ? Math.round(marketData.avgSalePriceSqft * (1 + (growthNum/400))) : 0, growth: `+${(growthNum/4).toFixed(1)}%` },
    { months: 6, rent: marketData ? Math.round(marketData.avgRentPriceSqft * (1 + (growthNum/200))) : 0, sale: marketData ? Math.round(marketData.avgSalePriceSqft * (1 + (growthNum/200))) : 0, growth: `+${(growthNum/2).toFixed(1)}%` },
    { months: 12, rent: marketData ? Math.round(marketData.avgRentPriceSqft * (1 + (growthNum/100))) : 0, sale: marketData ? Math.round(marketData.avgSalePriceSqft * (1 + (growthNum/100))) : 0, growth: `+${growthNum.toFixed(1)}%` }
  ]

  // Dynamic AI commentary cards
  const getAiCommentary = () => {
    if (selectedCity === 'Chennai') {
      return [
        { label: 'Demand Surge', text: 'Rental demand increasing in Chennai ECR corridor and OMR tech areas.' },
        { label: 'Asset Class growth', text: '1 BHK properties showing strongest growth due to single IT professional influx.' },
        { label: 'Commercial impact', text: 'New Metro expansions drive land price premiums around Central station +8.4%.' }
      ]
    }
    if (selectedCity === 'Coimbatore') {
      return [
        { label: 'IT Corridor', text: 'Proximity to Saravanampatti IT Park generates high liquidity and premium rental bids.' },
        { label: 'BHK layout', text: 'Family housing demand rising in Coimbatore Avinashi road, 3 BHKs preferred.' },
        { label: 'Industrial base', text: 'Salem/Tiruppur border areas show moderate appreciation due to textile shifts.' }
      ]
    }
    return [
      { label: 'Local Market', text: 'Appraisals are stable. Focus on verified property documents before investing.' },
      { label: 'Rental return', text: 'Average yields are consistent, hovering around 4% annually.' },
      { label: 'Sub-market growth', text: 'Suburban localities lead growth charts over central commercial squares.' }
    ]
  }
  const aiComments = getAiCommentary()

  return (
    <MainLayout>
      <div style={{ background: 'var(--green-50)', minHeight: '100vh', paddingBottom: 48 }}>
        
        {/* Banner Section */}
        <div style={{ background: 'var(--green-900)', padding: '40px 0', borderBottom: '4px solid var(--gold-400)' }}>
          <div className="container">
            <h1 style={{ color: 'var(--text-on-dark)', fontSize: 30, fontWeight: 800, margin: 0 }}>
              📈 Market Intelligence Dashboard
            </h1>
            <p style={{ color: 'rgba(232,245,238,0.7)', fontSize: 14, margin: '6px 0 0 0' }}>
              Tamil Nadu sub-market indices, appreciation leaderboards, and interactive yield calculators.
            </p>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 36 }}>
          
          {/* Header Controls */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Live Analytics Terminal
              </h2>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Region scope:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  background: 'var(--cream-100)'
                }}
              >
                {Object.keys(LOCALITIES_MOCK).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {loading || !marketData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="skeleton" style={{ height: 120 }} />
              <div className="skeleton" style={{ height: 300 }} />
            </div>
          ) : (
            <>
              {/* Analytics Top Grid */}
              <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                  { icon: '💰', title: 'Avg Sale Rate', value: `₹${marketData.avgSalePriceSqft.toLocaleString('en-IN')}/sqft`, desc: `Appreciation: ${marketData.appreciationRate}` },
                  { icon: '🔑', title: 'Avg Rent Rate', value: `₹${marketData.avgRentPriceSqft}/sqft/mo`, desc: 'Consistent demand scale' },
                  { icon: '📊', title: 'Gross Return Yield', value: yieldVal, desc: 'Gross return ratio' },
                  { icon: '⭐', title: 'Valuation Score', value: investmentScore, desc: `Demand level: ${marketData.demandQuotient}` }
                ].map(stat => (
                  <div key={stat.title} className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                      {stat.title}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-700)', marginBottom: 2 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.desc}</div>
                  </div>
                ))}
              </div>

              {/* Recommendation Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 28 }} className="trends-recommendations">
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>🛍️</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Buyer Action</h3>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                    {marketData.buyerRecommendation}
                  </p>
                </div>
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>🏷️</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Seller Strategy</h3>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                    {marketData.sellerRecommendation}
                  </p>
                </div>
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>💎</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Investment Outlook</h3>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                    {marketData.investmentOutlook}
                  </p>
                </div>
              </div>

              {/* Main Analysis Chart and Localities Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24, marginBottom: 28 }} className="trends-main-grid">
                
                {/* SVG Chart */}
                <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex-between" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800 }}>📈 Sub-market Price Appreciation (5-Year Curve)</h3>
                    <div style={{ display: 'flex', gap: 4, background: 'var(--cream-200)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
                      <button
                        onClick={() => setChartType('sale')}
                        style={{
                          padding: '4px 12px', border: 'none', background: chartType === 'sale' ? 'var(--cream-200)' : 'transparent',
                          fontWeight: 700, fontSize: 11, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          boxShadow: chartType === 'sale' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          color: 'var(--text-primary)'
                        }}
                      >
                        Capital Value
                      </button>
                      <button
                        onClick={() => setChartType('rent')}
                        style={{
                          padding: '4px 12px', border: 'none', background: chartType === 'rent' ? 'var(--cream-200)' : 'transparent',
                          fontWeight: 700, fontSize: 11, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          boxShadow: chartType === 'rent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          color: 'var(--text-primary)'
                        }}
                      >
                        Rent Rate
                      </button>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = padding + ratio * (chartHeight - padding * 2)
                        return (
                          <line key={idx} x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="var(--border)" strokeDasharray="3,3" />
                        )
                      })}

                      <path d={pathData} fill="none" stroke="var(--green-600)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                      {points.length > 0 && (
                        <path
                          d={`${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`}
                          fill="url(#area-gradient)"
                          opacity="0.12"
                        />
                      )}

                      <defs>
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--green-600)" />
                          <stop offset="100%" stopColor="var(--green-100)" />
                        </linearGradient>
                      </defs>

                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="var(--green-700)" strokeWidth="2" />
                          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)">
                            {chartType === 'sale' ? `₹${p.sale}` : `₹${p.rent}`}
                          </text>
                          <text x={p.x} y={chartHeight - 12} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">
                            {p.year}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Localities Table */}
                <div className="card card-body" style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>🏡 Localities in {selectedCity}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {localities.map(loc => (
                      <div key={loc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--cream-100)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{loc.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            ₹{loc.avgSale.toLocaleString('en-IN')}/sqft · Rent ₹{loc.avgRent}/sqft
                          </div>
                        </div>
                        <span style={{ fontSize: 12, background: 'var(--green-50)', color: 'var(--green-700)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                          {loc.growth}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* THREE COLUMN DETAILS (leaderboard, yield calculator, forecast) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 24, marginBottom: 28 }} className="trends-recommendations">
                
                {/* 1. Growth Leaderboard */}
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 14px 0' }}>
                    🏆 Appreciation Leaderboard
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {CITY_GROWTH_LEADERBOARD.map(c => (
                      <div key={c.city} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span>
                          <strong style={{ marginRight: 6 }}>#{c.rank}</strong>
                          {c.city}
                        </span>
                        <div>
                          <span style={{ color: '#16a34a', fontWeight: 800, marginRight: 8 }}>{c.growth}</span>
                          <span style={{ fontSize: 10.5, background: 'var(--green-100)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Interactive Yield Calculator */}
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 14px 0' }}>
                    🧮 Interactive ROI Yield Calculator
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label style={{ fontSize: 11, fontWeight: 700 }}>Property Cost (₹)</label>
                      <input
                        type="number" value={propCost}
                        onChange={e => setPropCost(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11, fontWeight: 700 }}>Expected Monthly Rent (₹)</label>
                      <input
                        type="number" value={expectedRent}
                        onChange={e => setExpectedRent(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                      />
                    </div>

                    <div style={{ background: 'var(--green-50)', padding: 12, borderRadius: 6, textAlign: 'center', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 10.5, display: 'block', color: 'var(--text-muted)' }}>Estimated Net Yield</span>
                      <strong style={{ fontSize: 18, color: 'var(--green-700)', display: 'block' }}>{userYield}% / yr</strong>
                      <span style={{ fontSize: 11, fontWeight: 700, color: userYield >= 5.0 ? '#16a34a' : '#d97706', marginTop: 2, display: 'block' }}>
                        🎯 {yieldVerdict}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Future Index Forecast */}
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 14px 0' }}>
                    🔮 Future Price Index Forecasts
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {forecasts.map(f => (
                      <div key={f.months} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                        <span>In {f.months} Months</span>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: 'var(--green-700)', display: 'block' }}>
                            {chartType === 'sale' ? `₹${f.sale.toLocaleString('en-IN')}/sqft` : `₹${f.rent}/sqft`}
                          </strong>
                          <span style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700 }}>{f.growth}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* AI Dynamic Market Summary & Hot Areas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }} className="trends-main-grid">
                
                {/* AI Insights Commentary */}
                <div style={{ background: 'linear-gradient(135deg, var(--green-900), var(--green-800))', borderRadius: 'var(--radius-lg)', color: 'var(--text-on-dark)', padding: 28, boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 24 }}>🔮</span>
                    <h3 style={{ fontSize: 16, color: 'var(--green-300)', fontWeight: 800, margin: 0 }}>Smart Location Insights (AI-Orchestrated)</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                    {aiComments.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--gold-300)', borderRadius: 4, padding: '2px 8px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {c.label}
                        </span>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{c.text}</p>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.8)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, margin: 0, fontStyle: 'italic' }}>
                    "{marketData.aiMarketAnalysis}"
                  </p>
                </div>

                {/* Hot Areas listings */}
                <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 16px 0' }}>
                    🔥 Tamil Nadu Hot Investment Zones
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { type: '🚀 Top Growth Area', title: 'OMR Sholinganallur (Chennai)', info: '+15.2% appreciation index' },
                      { type: '🔥 High Rental Demand', title: 'Saravanampatti Corridor (Coimbatore)', info: '13.5% rental yield growth' },
                      { type: '💎 Best Value Location', title: 'Sathuvachari Locality (Vellore)', info: '₹4,600/sqft capital base' }
                    ].map(zone => (
                      <div key={zone.type}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-700)', display: 'block', textTransform: 'uppercase' }}>{zone.type}</span>
                        <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block', marginTop: 2 }}>{zone.title}</strong>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{zone.info}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </div>
      <style>{`
        @media (max-width: 991px) {
          .trends-recommendations { grid-template-columns: 1fr !important; gap: 16px !important; }
          .trends-main-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </MainLayout>
  )
}
