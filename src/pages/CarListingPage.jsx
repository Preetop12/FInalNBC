import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import CarCard from '../components/CarCard'
import { getCars } from '../lib/db'
import './CarListingPage.css'

const MAKES = ['All', 'Tata', 'Kia', 'Mahindra', 'Maruti Suzuki', 'Hyundai', 'Toyota', 'Honda', 'MG', 'Skoda', 'Volkswagen', 'Porsche', 'BMW', 'Lucid', 'Tesla']
const FUEL_TYPES = ['All', 'Petrol', 'Diesel', 'Electric']
const SORT_OPTIONS = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'year-desc', label: 'Newest First' },
]

export default function CarListingPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const container = useRef(null)

  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(initialQuery)
  const [selectedMake, setSelectedMake] = useState('All')
  const [selectedFuel, setSelectedFuel] = useState('All')
  const [maxPrice, setMaxPrice] = useState(30000000)
  const [sort, setSort] = useState('default')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        const data = await getCars()
        if (active) {
          // Keep only active status listings for standard buyers
          setCars(data.filter((c) => c.status === 'active' || c.status === 'sold'))
        }
      } catch (err) {
        console.error('Error loading inventory:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    let result = [...cars]
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.make.toLowerCase().includes(q) || c.model.toLowerCase().includes(q) || c.fuelType.toLowerCase().includes(q)
      )
    }
    if (selectedMake !== 'All') result = result.filter((c) => c.make === selectedMake)
    if (selectedFuel !== 'All') result = result.filter((c) => c.fuelType === selectedFuel)
    result = result.filter((c) => c.price <= maxPrice)

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sort === 'year-desc') result.sort((a, b) => b.year - a.year)

    return result
  }, [cars, query, selectedMake, selectedFuel, maxPrice, sort])

  const resetFilters = () => {
    setQuery('')
    setSelectedMake('All')
    setSelectedFuel('All')
    setMaxPrice(30000000)
    setSort('default')
  }

  useGSAP(() => {
    if (filtered.length > 0) {
      gsap.fromTo('.listing-results .car-card', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', overwrite: true }
      )
    }
  }, { scope: container, dependencies: [filtered] })

  return (
    <div className="listing-page" ref={container}>
      <div className="listing-header">
        <div className="container listing-header-inner">
          <div>
            <p className="label-m">Browse Inventory</p>
            <h1 className="headline-l" style={{ marginTop: '0.5rem' }}>The Curator's Choice</h1>
          </div>
          <div className="listing-controls">
            <div className="listing-search-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="listing-search"
                type="text"
                placeholder="Search cars…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="listing-search-input"
              />
            </div>
            <select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} className="listing-sort-select">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button id="filter-toggle-btn" className="btn-secondary filter-toggle" onClick={() => setFilterOpen(!filterOpen)}>
              ⚙ Filters {filterOpen ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Expandable filters */}
        <div className={`filter-panel${filterOpen ? ' filter-panel--open' : ''}`}>
          <div className="container filter-panel-inner">
            {/* Make */}
            <div className="filter-group">
              <p className="label-s filter-label">Make</p>
              <div className="filter-chips">
                {MAKES.map((m) => (
                  <button key={m} id={`filter-make-${m}`} className={`chip${selectedMake === m ? ' chip-cyan' : ''}`} onClick={() => setSelectedMake(m)}>{m}</button>
                ))}
              </div>
            </div>
            {/* Fuel */}
            <div className="filter-group">
              <p className="label-s filter-label">Fuel Type</p>
              <div className="filter-chips">
                {FUEL_TYPES.map((f) => (
                  <button key={f} id={`filter-fuel-${f}`} className={`chip${selectedFuel === f ? ' chip-cyan' : ''}`} onClick={() => setSelectedFuel(f)}>{f}</button>
                ))}
              </div>
            </div>
            {/* Price slider */}
            <div className="filter-group">
              <p className="label-s filter-label">Max Price: {maxPrice >= 10000000 ? `₹${(maxPrice / 10000000).toFixed(0)}Cr` : `₹${(maxPrice / 100000).toFixed(0)}L`}</p>
              <input id="price-range" type="range" min={1000000} max={30000000} step={500000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="price-range" />
            </div>
            <button className="btn-ghost" onClick={resetFilters}>Reset All</button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container listing-results">
        <p className="body-m listing-count">
          {loading ? 'Searching inventory...' : `${filtered.length} car${filtered.length !== 1 ? 's' : ''} found`}
        </p>
        {loading ? (
          <div className="grid-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="car-card skeleton-card" style={{ background: 'var(--surface-container-low)', borderRadius: '16px', height: '380px', border: '1px solid var(--border)', opacity: 0.7 }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid-3">
            {filtered.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="listing-empty">
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 className="headline-m">No cars found</h3>
            <p className="body-m">Try adjusting your filters or search terms.</p>
            <button className="btn-primary" onClick={resetFilters} style={{ marginTop: '1rem' }}>Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  )
}
