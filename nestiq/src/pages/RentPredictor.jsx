import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { estimatePrice } from '../services/aiService'

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Vellore']
const FURNISHINGS = ['Unfurnished', 'Semi Furnished', 'Fully Furnished']

function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN') }

export default function RentPredictor() {
  // Inputs state
  const [city, setCity] = useState('Chennai')
  const [area, setArea] = useState('1000')
  const [bhk, setBhk] = useState('2')
  const [listingType, setListingType] = useState('RENT')
  const [furnishing, setFurnishing] = useState('Semi Furnished')
  const [bathrooms, setBathrooms] = useState('2')
  const [propertyAge, setPropertyAge] = useState('5')
  const [parking, setParking] = useState(true)

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // What-If Simulator local adjustments state
  const [simArea, setSimArea] = useState(1000)
  const [simBhk, setSimBhk] = useState(2)
  const [simFurnishing, setSimFurnishing] = useState('Semi Furnished')
  const [simParking, setSimParking] = useState(true)
  const [simBathrooms, setSimBathrooms] = useState(2)
  const [simAge, setSimAge] = useState(5)

  const calculate = async () => {
    setError('')
    setResult(null)

    if (!city) { setError('Please select a city.'); return }
    if (!area || isNaN(area) || Number(area) <= 0) { setError('Enter a valid area in sqft.'); return }
    if (!bhk) { setError('Please select BHK.'); return }

    setLoading(true)
    try {
      const data = await estimatePrice({
        city,
        area: Number(area),
        bhk: Number(bhk),
        listingType,
        furnishing,
        bathrooms: Number(bathrooms),
        propertyAge: Number(propertyAge),
        parking
      })
      setResult(data)

      // Initialize Simulator states with form values
      setSimArea(Number(area))
      setSimBhk(Number(bhk))
      setSimFurnishing(furnishing)
      setSimParking(parking)
      setSimBathrooms(Number(bathrooms))
      setSimAge(Number(propertyAge))
    } catch {
      setError('Could not run rent valuation engine. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Local formula mirror for What-If simulator
  const getCityRate = c => {
    const rates = { Chennai: 22.0, Coimbatore: 15.0, Madurai: 12.0, Tiruchirappalli: 11.0, Salem: 10.0, Tiruppur: 10.5, Vellore: 9.5 }
    return rates[c] || 12.0
  }

  const runLocalValuation = (c, b, ar, furn, park, ageVal, baths) => {
    const base = getCityRate(c)
    const bhkFactor = 0.8 + b * 0.1
    let rent = base * ar * bhkFactor
    const mult = furn === 'Fully Furnished' ? 1.25 : (furn === 'Semi Furnished' ? 1.10 : 1.0)
    rent *= mult
    if (park) rent += 1500
    rent += (baths - 1) * 1200
    rent -= ageVal * 120
    const finalVal = Math.max(3000, rent)
    return listingType === 'SALE' ? finalVal * 12.0 * 80.0 : finalVal
  }

  // Calculate What-If Predictions on changes
  const originalPrediction = result ? (result.predictedRent || (result.estimatedMin + result.estimatedMax)/2) : 0
  const simPrediction = runLocalValuation(city, simBhk, simArea, simFurnishing, simParking, simAge, simBathrooms)
  const simDelta = simPrediction - originalPrediction

  return (
    <MainLayout>
      <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--green-50)' }}>
        
        {/* Banner Section */}
        <div style={{ background: 'var(--green-900)', padding: '40px 0', borderBottom: '4px solid var(--gold-400)' }}>
          <div className="container">
            <h1 style={{ color: 'var(--text-on-dark)', fontSize: 30, fontWeight: 800, margin: 0 }}>
              🔮 Smart Rent Valuation Engine
            </h1>
            <p style={{ color: 'rgba(232,245,238,0.7)', fontSize: 14, margin: '6px 0 0 0' }}>
              Zillow-style automated property appraisal and future forecasting using Tamil Nadu ML regression models.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 36, alignItems: 'start' }} className="matcher-grid">
            
            {/* Input Form Panel */}
            <div style={{
              background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', padding: 28, boxShadow: 'var(--shadow-md)'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px 0' }}>Property Valuation Specs</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px 0' }}>
                Fill structural parameters to calculate rent values.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

              {/* Listing Type */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Appraisal Mode</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['RENT', 'SALE'].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setListingType(t)}
                      style={{
                        flex: 1, padding: 10, borderRadius: 6,
                        border: `1.5px solid ${listingType === t ? 'var(--green-500)' : 'var(--border)'}`,
                        background: listingType === t ? 'var(--green-600)' : 'transparent',
                        color: listingType === t ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                        fontWeight: 700, cursor: 'pointer', fontSize: 13
                      }}
                    >
                      {t === 'RENT' ? '🏠 Rental Value' : '💰 Capital Value'}
                    </button>
                  ))}
                </div>
              </div>

              {/* City Selection */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>City Location</label>
                <select value={city} onChange={e => setCity(e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Area (sqft) */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Super Built-up Area (Sq.Ft.)</label>
                <input
                  type="number" value={area}
                  onChange={e => setArea(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>

              {/* BHK */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>BHK Configuration</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3', '4'].map(b => (
                    <button
                      key={b} type="button"
                      onClick={() => setBhk(b)}
                      style={{
                        flex: 1, padding: 8, borderRadius: 6,
                        border: `1.5px solid ${bhk === b ? 'var(--green-500)' : 'var(--border)'}`,
                        background: bhk === b ? 'var(--green-600)' : 'transparent',
                        color: bhk === b ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {b} BHK
                    </button>
                  ))}
                </div>
              </div>

              {/* Furnishing Status */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Furnishing status</label>
                <select value={furnishing} onChange={e => setFurnishing(e.target.value)}>
                  {FURNISHINGS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Bathrooms */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Bathrooms Count</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '2', '3', '4'].map(bath => (
                    <button
                      key={bath} type="button"
                      onClick={() => setBathrooms(bath)}
                      style={{
                        flex: 1, padding: 8, borderRadius: 6,
                        border: `1.5px solid ${bathrooms === bath ? 'var(--green-500)' : 'var(--border)'}`,
                        background: bathrooms === bath ? 'var(--green-600)' : 'transparent',
                        color: bathrooms === bath ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {bath}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Age */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>Property Age (Years)</label>
                <input
                  type="number" value={propertyAge}
                  onChange={e => setPropertyAge(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>

              {/* Parking Checkbox Toggle */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={parking}
                    onChange={e => setParking(e.target.checked)}
                  />
                  Covered Car Parking Included
                </label>
              </div>

              <button
                onClick={calculate}
                disabled={loading}
                className="btn btn-gold btn-full btn-lg"
                style={{ marginTop: 12, justifyContent: 'center' }}
              >
                {loading ? '🔍 Processing Valuation…' : '🔮 Calculate Smart Rent'}
              </button>
            </div>

            {/* Dynamic Zillow-style Valuation Display */}
            <div>
              {loading && (
                <div style={{
                  background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', padding: '100px 40px', textAlign: 'center'
                }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Appraising property details...</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Running RandomForest ML regression model on 500 Tamil Nadu seed data rows</p>
                </div>
              )}

              {!loading && !result && (
                <div style={{
                  background: 'var(--cream-100)', borderRadius: 'var(--radius-lg)',
                  border: '2px dashed var(--border)', padding: '80px 40px', textAlign: 'center'
                }}>
                  <span style={{ fontSize: 64 }}>🔮</span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '12px 0 6px 0' }}>Automated Valuation Model (AVM)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 360, margin: '0 auto' }}>
                    Enter building specifications on the left to calculate high-fidelity estimates, comparables, and forecasts.
                  </p>
                </div>
              )}

              {!loading && result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>
                  
                  {/* MAIN ESTIMATE CARD */}
                  <div style={{
                    background: 'var(--green-900)', borderRadius: 'var(--radius-lg)',
                    padding: '32px 36px', color: 'var(--text-on-dark)',
                    borderBottom: '5px solid var(--gold-400)', boxShadow: 'var(--shadow-lg)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        NestIQ Smart Valuation
                      </span>
                      <span style={{
                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'var(--gold-300)'
                      }}>
                        🤖 {result.engine || 'RandomForestRegressor'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 40, fontWeight: 900, margin: '4px 0 2px 0', letterSpacing: '-1px' }}>
                      {fmt(result.predictedRent || (result.estimatedMin + result.estimatedMax)/2)}
                      <span style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>
                        {listingType === 'RENT' ? ' / month' : ' (Capital Valuation)'}
                      </span>
                    </h2>

                    <p style={{ fontSize: 13, color: 'rgba(232,245,238,0.6)', margin: '0 0 20px 0' }}>
                      Range Index: {fmt(result.estimatedMin)} – {fmt(result.estimatedMax)}
                    </p>

                    {/* Meta gauges row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 14 }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'rgba(232,245,238,0.5)', display: 'block', textTransform: 'uppercase' }}>Confidence</span>
                        <strong style={{ fontSize: 14, color: 'var(--gold-300)' }}>{result.confidenceScore || 85}% (High)</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'rgba(232,245,238,0.5)', display: 'block', textTransform: 'uppercase' }}>Market Status</span>
                        <strong style={{ fontSize: 14 }}>{result.marketPosition || 'Fairly Priced'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'rgba(232,245,238,0.5)', display: 'block', textTransform: 'uppercase' }}>Annual Growth</span>
                        <strong style={{ fontSize: 14 }}>+{result.areaGrowth || 7.2}%</strong>
                      </div>
                    </div>

                    {result.explanation && (
                      <p style={{ fontSize: 13, fontStyle: 'italic', margin: '20px 0 0 0', color: 'rgba(232,245,238,0.85)' }}>
                        ✨ AI context: {result.explanation}
                      </p>
                    )}
                  </div>

                  {/* TWO-COLUMN RESULTS (factors and simulator) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 24 }} className="matcher-grid">
                    
                    {/* Factors increasing/reducing */}
                    <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        ⚖️ Valuation Impact Factors
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {result.factorsIncreasing?.map(f => (
                          <div key={f.factor}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>{f.factor}</span>
                              <span style={{ color: '#16a34a', fontWeight: 800 }}>{f.impact}</span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.reason}</span>
                          </div>
                        ))}
                        {result.factorsReducing?.map(f => (
                          <div key={f.factor}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>{f.factor}</span>
                              <span style={{ color: '#dc2626', fontWeight: 800 }}>{f.impact}</span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What-If Simulator widget */}
                    <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        💡 What-If Valuation Simulator
                      </h4>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
                        Move sliders to instantly check how features impact market appraisals.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Area slider */}
                        <div>
                          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                            <span>Area Size:</span>
                            <span>{simArea} sqft</span>
                          </label>
                          <input
                            type="range" min="400" max="3000" step="50"
                            value={simArea} onChange={e => setSimArea(Number(e.target.value))}
                            style={{ width: '100%', height: 4, cursor: 'pointer' }}
                          />
                        </div>

                        {/* BHK configuration buttons */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>BHK Layout:</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[1, 2, 3, 4].map(b => (
                              <button
                                key={b} type="button" onClick={() => setSimBhk(b)}
                                style={{
                                  flex: 1, padding: 6, fontSize: 11.5, borderRadius: 4,
                                  border: `1px solid ${simBhk === b ? 'var(--green-500)' : 'var(--border)'}`,
                                  background: simBhk === b ? 'var(--green-600)' : 'transparent',
                                  color: simBhk === b ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                                  fontWeight: 700, cursor: 'pointer'
                                }}
                              >{b} BHK</button>
                            ))}
                          </div>
                        </div>

                        {/* Age slider */}
                        <div>
                          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                            <span>Property Age:</span>
                            <span>{simAge} Years</span>
                          </label>
                          <input
                            type="range" min="1" max="25" step="1"
                            value={simAge} onChange={e => setSimAge(Number(e.target.value))}
                            style={{ width: '100%', height: 4, cursor: 'pointer' }}
                          />
                        </div>

                        {/* Toggles */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                          <button
                            type="button" onClick={() => setSimParking(!simParking)}
                            style={{
                              flex: 1, padding: 6, borderRadius: 4, border: '1px solid var(--border)',
                              background: simParking ? 'var(--green-50)' : 'transparent',
                              color: simParking ? 'var(--green-700)' : 'var(--text-secondary)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            🚗 Parking: {simParking ? 'Yes' : 'No'}
                          </button>
                          <button
                            type="button" onClick={() => setSimFurnishing(simFurnishing === 'Fully Furnished' ? 'Unfurnished' : 'Fully Furnished')}
                            style={{
                              flex: 1, padding: 6, borderRadius: 4, border: '1px solid var(--border)',
                              background: simFurnishing === 'Fully Furnished' ? 'var(--green-50)' : 'transparent',
                              color: simFurnishing === 'Fully Furnished' ? 'var(--green-700)' : 'var(--text-secondary)',
                              fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            🪑 Fully Furnished: {simFurnishing === 'Fully Furnished' ? 'Yes' : 'No'}
                          </button>
                        </div>

                        {/* Real-time Simulator delta readout */}
                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid var(--border)', marginTop: 4, textAlign: 'center' }}>
                          <span style={{ fontSize: 11, display: 'block', color: 'var(--text-muted)' }}>Simulator Output</span>
                          <strong style={{ fontSize: 15, color: 'var(--green-700)' }}>
                            {fmt(simPrediction)}
                          </strong>
                          <span style={{ fontSize: 12, display: 'block', fontWeight: 700, color: simDelta >= 0 ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                            {simDelta >= 0 ? `▲ Value increases by ${fmt(simDelta)}` : `▼ Value decreases by ${fmt(Math.abs(simDelta))}`}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* COMPARABLE PROPERTIES AND FUTURE FORECASTS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }} className="matcher-grid">
                    
                    {/* Comparable Properties Table */}
                    <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        ⚖️ Comparable Tamil Nadu Listing Valuations
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                            <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>Property Specs</th>
                            <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>Est. Rent</th>
                            <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>Price Variance</th>
                            <th style={{ padding: '8px 4px', color: 'var(--text-muted)' }}>Similarity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.comparableProperties?.map((c, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 4px', fontWeight: 600 }}>{c.title}</td>
                              <td style={{ padding: '10px 4px', color: 'var(--green-700)', fontWeight: 700 }}>{fmt(c.rent)}</td>
                              <td style={{ padding: '10px 4px', fontWeight: 700, color: c.difference.startsWith('+') ? '#16a34a' : '#dc2626' }}>
                                {c.difference}
                              </td>
                              <td style={{ padding: '10px 4px', fontWeight: 700 }}>{c.similarity}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Future Forecasts */}
                    <div style={{ background: 'var(--cream-100)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        📈 Future Rental Valuation Trends
                      </h4>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
                        Projected rent movement based on Tamil Nadu sub-market indices.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {result.futureForecasts?.map(f => (
                          <div key={f.months} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, width: 80 }}>{f.months} Months:</span>
                            <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                width: f.months === 3 ? '40%' : f.months === 6 ? '70%' : '100%',
                                height: '100%', background: 'var(--green-600)'
                              }} />
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-700)', width: 60, textAlign: 'right' }}>
                              {fmt(f.rent)}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', width: 45 }}>
                              {f.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </MainLayout>
  )
}