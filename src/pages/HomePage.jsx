import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CarCard from '../components/CarCard'
import { getCars, getFeaturedCars } from '../lib/db'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

const HERO_BG = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1800&q=80&fit=crop'

const BRANDS = ['Tata', 'Mahindra', 'Maruti Suzuki', 'Hyundai', 'Kia', 'Toyota', 'Honda', 'MG', 'Skoda', 'Volkswagen']

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const container = useRef(null)
  
  const [featuredCars, setFeaturedCars] = useState([])
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        const [feat, all] = await Promise.all([getFeaturedCars(), getCars()])
        if (active) {
          setFeaturedCars(feat)
          setCars(all)
        }
      } catch (err) {
        console.error('Error loading homepage cars:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [])

  // Hero Entry Animation (Runs immediately)
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.hero-eyebrow', { y: 24, opacity: 0, duration: 0.6 })
      .from('.hero-title', { y: 48, opacity: 0, duration: 0.9 }, '-=0.4')
      .from('.hero-subtitle', { y: 24, opacity: 0, duration: 0.6 }, '-=0.5')
      .from('.hero-search', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero-filter-chip', { y: 16, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.3')
      .from('.hero-scroll-indicator', { opacity: 0, duration: 0.6 }, '-=0.2')
  }, { scope: container })

  // Scroll Animations (Wait for elements to render)
  useGSAP(() => {
    if (loading) return

    // Scroll Animations for sections
    gsap.utils.toArray('.label-m, .headline-l, .btn-secondary, .body-l').forEach((el) => {
      if (!el.closest('.car-card')) {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          y: 24, opacity: 0, duration: 0.7, ease: 'power3.out'
        })
      }
    })

    // Featured Grid Stagger
    if (featuredCars.length > 0) {
      gsap.from('.featured-grid .car-card', {
        scrollTrigger: { trigger: '.featured-grid', start: 'top 85%', once: true },
        y: 60, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out'
      })
    }

    // Showcase Grid Stagger
    if (cars.length > 3) {
      gsap.from('.showcase-section .car-card', {
        scrollTrigger: { trigger: '.showcase-section .grid-3', start: 'top 85%', once: true },
        y: 60, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out'
      })
    }

    // Advantage Stats
    gsap.from('.advantage-stat', {
      scrollTrigger: { trigger: '.advantage-stats', start: 'top 85%', once: true },
      y: 30, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)'
    })
    
    gsap.from('.advantage-feature', {
      scrollTrigger: { trigger: '.advantage-features', start: 'top 80%', once: true },
      x: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out'
    })

    // Reviews Grid Stagger
    gsap.from('.reviews-grid .review-card', {
      scrollTrigger: { trigger: '.reviews-grid', start: 'top 85%', once: true },
      y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out'
    })

    // CTA Banner
    gsap.from('.cta-banner', {
      scrollTrigger: { trigger: '.cta-banner', start: 'top 90%', once: true },
      scale: 0.96, y: 30, opacity: 0, duration: 0.8, ease: 'power3.out'
    })
  }, { scope: container, dependencies: [loading] })

  const renderSkeleton = () => (
    <>
      {[1, 2, 3].map((n) => (
        <div key={n} className="car-card skeleton-card" style={{ background: 'var(--surface-container-low)', borderRadius: '16px', height: '380px', border: '1px solid var(--border)', opacity: 0.7 }} />
      ))}
    </>
  )

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/buy?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="home" ref={container}>
      {/* ── HERO ── */}
      <section className="hero" style={{ backgroundImage: `url(${HERO_BG})` }}>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="label-m hero-eyebrow">India's Premium Car Marketplace</span>
          <h1 className="display-l hero-title">
            ENGINEERED<br />
            <span className="hero-title-accent">PRECISION.</span>
          </h1>
          <p className="body-l hero-subtitle">
            Buy and sell premium cars without the brokerage.<br className="desktop-only" />
            AI-powered insights. Zero middlemen. Maximum value.
          </p>

          {/* Search bar */}
          <form className="hero-search" onSubmit={handleSearch}>
            <div className="hero-search-inner glass">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="hero-search-input"
                type="text"
                placeholder="Search make, model, or keyword…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hero-search-input"
              />
              <button type="submit" className="btn-primary hero-search-btn">Search</button>
            </div>
          </form>

          {/* Quick filters */}
          <div className="hero-filters">
            {['Tata', 'Mahindra', 'Maruti', 'Hyundai', 'Kia', 'SUV', 'Hatchback'].map((f) => (
              <button
                key={f}
                className="chip chip-cyan hero-filter-chip"
                onClick={() => navigate(`/buy?q=${f}`)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator">
          <div className="scroll-dot" />
        </div>
      </section>

      {/* ── BRAND STRIP ── */}
      <div className="brand-strip">
        <div className="brand-strip-inner">
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <span key={`${brand}-${i}`} className="brand-strip-item">{brand}</span>
          )).reduce((acc, el, i) => {
            if (i === 0) return [el]
            return [...acc, <span key={`dot-${i}`} className="brand-strip-dot" />, el]
          }, [])}
        </div>
      </div>

      {/* ── FEATURED CARS ── */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="label-m">Handpicked Listings</p>
              <h2 className="headline-l" style={{ marginTop: '0.5rem' }}>Best Deals For You</h2>
            </div>
            <button className="btn-secondary" onClick={() => navigate('/buy')}>View All Cars →</button>
          </div>

          <div className="grid-3 featured-grid">
            {loading ? renderSkeleton() : (
              featuredCars.length > 0 ? (
                featuredCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))
              ) : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '2rem 0', opacity: 0.6 }}>No deals listed yet. Check back soon!</div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE / EDITORIAL ── */}
      <section className="section showcase-section">
        <div className="container">
          <p className="label-m">Our Showcase</p>
          <h2 className="headline-l" style={{ marginTop: '0.5rem', marginBottom: '3rem' }}>Curated Inventory</h2>

          <div className="grid-3">
            {loading ? renderSkeleton() : (
              cars.length > 3 ? (
                cars.slice(3, 6).map((car) => (
                  <CarCard key={car.id} car={car} />
                ))
              ) : (
                cars.length > 0 ? (
                  cars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))
                ) : (
                  <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '2rem 0', opacity: 0.6 }}>No cars available.</div>
                )
              )
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button className="btn-secondary" onClick={() => navigate('/buy')}>
              Browse All {cars.length} Listings →
            </button>
          </div>
        </div>
      </section>

      {/* ── ADVANTAGE ── */}
      <section className="section advantage-section">
        <div className="container">
          <div className="advantage-inner">
            <div className="advantage-text">
              <p className="label-m">Why Choose Us</p>
              <h2 className="headline-l" style={{ marginTop: '0.5rem' }}>The NoBrokerCars Advantage</h2>
              <p className="body-l" style={{ marginTop: '1rem', maxWidth: '44ch' }}>
                We eliminate the middleman so you keep what's yours.
                AI-powered price analysis, verified sellers, and a seamless experience from search to keys.
              </p>
              <div className="advantage-stats">
                <div className="advantage-stat">
                  <span className="advantage-stat-value">₹0</span>
                  <span className="label-s">Brokerage Fees</span>
                </div>
                <div className="advantage-stat">
                  <span className="advantage-stat-value">500+</span>
                  <span className="label-s">AI Insights Daily</span>
                </div>
                <div className="advantage-stat">
                  <span className="advantage-stat-value">10K+</span>
                  <span className="label-s">Verified Listings</span>
                </div>
              </div>
              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => navigate('/buy')}>Browse Cars</button>
                <button className="btn-secondary" onClick={() => navigate('/ai')}>Try AI Insights</button>
              </div>
            </div>

            <div className="advantage-features">
              {ADVANTAGES.map((a) => (
                <div className="advantage-feature" key={a.title}>
                  <span className="advantage-icon">{a.icon}</span>
                  <div>
                    <h4 className="title-m">{a.title}</h4>
                    <p className="body-m" style={{ marginTop: '0.25rem' }}>{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ── */}
      <section className="section reviews-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="label-m">Testimonials</p>
            <h2 className="headline-l" style={{ marginTop: '0.5rem' }}>What Our Customers Say</h2>
          </div>

          <div className="reviews-grid">
            {REVIEWS.map((review) => (
              <div key={review.id} className="review-card">
                <div>
                  <div className="review-rating">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="review-text">"{review.text}"</p>
                </div>
                <div className="review-user">
                  <div className="review-avatar">{review.avatar}</div>
                  <div className="review-info">
                    <span className="review-name">{review.name}</span>
                    <span className="review-role">{review.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner glass">
            <div>
              <h3 className="headline-m">Ready to sell your car?</h3>
              <p className="body-m" style={{ marginTop: '0.5rem' }}>List in under 5 minutes. Our AI sets the right price.</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/sell')}>List Your Car Free →</button>
          </div>
        </div>
      </section>
    </div>
  )
}

const ADVANTAGES = [
  { icon: '🤖', title: 'AI Price Intelligence', desc: 'Real-time price analysis from 10,000+ comparable live listings across India.' },
  { icon: '✅', title: 'Verified Sellers Only', desc: 'Every listing is KYC-verified. No fake ads, no scams, no wasted time.' },
  { icon: '💰', title: 'Zero Brokerage', desc: 'You pay the price shown. Not a rupee more to any middleman, ever.' },
  { icon: '🛡️', title: 'Secure Transactions', desc: 'End-to-end encrypted communication and a secure payment process.' },
]

const REVIEWS = [
  {
    id: 1,
    name: 'Arjun Mehta',
    location: 'Mumbai',
    avatar: 'AM',
    rating: 5,
    text: 'Sold my Tata Safari through NoBrokerCars in just 4 days. Absolutely zero brokerage fee and the AI price evaluation was spot on. Highly recommended!'
  },
  {
    id: 2,
    name: 'Sneha Rao',
    location: 'Bangalore',
    avatar: 'SR',
    rating: 5,
    text: 'Bought a Kia Seltos. The seller verification process gave me complete peace of mind. End-to-end transparent process without any middleman hassle.'
  },
  {
    id: 3,
    name: 'Vikram Singh',
    location: 'Delhi NCR',
    avatar: 'VS',
    rating: 5,
    text: 'Listing my car was a breeze. The interface is premium and clean, and the AI chatbot helper gave great negotiating insights. Excellent platform!'
  }
]
