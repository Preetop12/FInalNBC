import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  getCarById,
  getCars,
  incrementViews,
  getSavedCars,
  toggleSaveCar,
  addInquiry
} from '../lib/db'
import { sendCarInquiryWhatsApp } from '../lib/whatsapp'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'
import './CarDetailPage.css'

export default function CarDetailPage() {
  const { carId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const container = useRef(null)

  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [similar, setSimilar] = useState([])
  const [saved, setSaved] = useState(false)
  
  // Contact Form modal state
  const [contactOpen, setContactOpen] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [submittingInquiry, setSubmittingInquiry] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)

  // Populate contact form fields if user is already logged in
  useEffect(() => {
    if (user) {
      setInquiryForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }))
    }
  }, [user])

  useEffect(() => {
    let active = true
    const loadCar = async () => {
      setLoading(true)
      try {
        const data = await getCarById(carId)
        if (active && data) {
          setCar(data)
          
          // Increment views
          incrementViews(carId)

          // Load similar cars
          const allCars = await getCars()
          const sim = allCars
            .filter((c) => c.id !== data.id && c.status === 'active' && (c.make === data.make || c.fuelType === data.fuelType))
            .slice(0, 3)
          setSimilar(sim)

          // Check favorite saved status
          if (user) {
            const savedList = await getSavedCars(user.email)
            setSaved(savedList.includes(data.id))
          }
        }
      } catch (err) {
        console.error('Error loading car details:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadCar()
    return () => { active = false }
  }, [carId, user])

  useGSAP(() => {
    if (loading || !car) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.car-detail-hero', { y: 20, opacity: 0, duration: 0.8 })
      .from('.breadcrumb', { opacity: 0, duration: 0.5 }, '-=0.4')
      .from('.car-detail-left > div', { y: 30, opacity: 0, stagger: 0.1, duration: 0.6 }, '-=0.3')
      .from('.car-detail-sidebar', { x: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.similar-cars', { y: 30, opacity: 0, duration: 0.6 }, '-=0.2')
  }, { scope: container, dependencies: [carId, loading] })

  const handleToggleSave = async () => {
    if (!user) {
      navigate('/auth')
      return
    }
    try {
      const updatedList = await toggleSaveCar(user.email, car.id)
      setSaved(updatedList.includes(car.id))
    } catch (err) {
      console.error('Error toggling save status:', err)
    }
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.email) {
      alert('Please fill in Name, Phone, and Email.')
      return
    }
    setSubmittingInquiry(true)
    try {
      const messageText = inquiryForm.message || `Hi! I'm interested in your ${car.year} ${car.make} ${car.model} listed on NoBrokerCars.`
      
      // 1. Save inquiry in database
      await addInquiry({
        carId: car.id,
        sellerEmail: car.sellerEmail,
        buyerName: inquiryForm.name,
        buyerPhone: inquiryForm.phone,
        buyerEmail: inquiryForm.email,
        message: messageText
      })

      // 2. Open WhatsApp for Click-to-Chat with seller
      sendCarInquiryWhatsApp(car, inquiryForm.name, inquiryForm.phone, messageText)
      
      setInquirySuccess(true)
      setTimeout(() => {
        setContactOpen(false)
        setInquirySuccess(false)
        setInquiryForm((prev) => ({ ...prev, message: '' }))
      }, 2000)
    } catch (err) {
      console.error('Error submitting contact inquiry:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSubmittingInquiry(false)
    }
  }

  if (loading) {
    return (
      <div className="car-detail" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="loading-spinner" style={{ width: 50, height: 50, border: '5px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="car-detail-404">
        <h2 className="headline-m">Car not found</h2>
        <button className="btn-primary" onClick={() => navigate('/buy')}>Browse Inventory</button>
      </div>
    )
  }

  return (
    <div className="car-detail" ref={container}>
      {/* Hero image */}
      <div className="car-detail-hero" style={{ backgroundImage: `url(${car.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&fit=crop'})` }}>
        <div className="car-detail-hero-overlay" />
        <div className="container car-detail-hero-content">
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep">›</span>
            <Link to="/buy" className="breadcrumb-link">Buy</Link>
            <span className="breadcrumb-sep">›</span>
            <span style={{ color: 'var(--on-surface)' }}>{car.name}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container car-detail-body">
        <div className="car-detail-grid">
          {/* Left column */}
          <div className="car-detail-left">
            {/* AI Insight banner */}
            <div className="ai-insight-banner glass">
              <span className="ai-insight-icon">🤖</span>
              <div>
                <p className="label-m">AI Price Intelligence</p>
                <p className="body-m" style={{ marginTop: '0.25rem' }}>
                  Our AI analyzed comparable listings in {car.location || 'India'}. This car is priced <strong style={{ color: 'var(--secondary)' }}>competitively</strong> with verified history.
                </p>
              </div>
            </div>

            {/* Title + price */}
            <div className="car-detail-title-wrap">
              <div>
                <p className="label-m car-detail-year">{car.make} · {car.year} · {car.fuelType}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 className="display-m car-detail-name">{car.name}</h1>
                  <button 
                    onClick={handleToggleSave}
                    className="fav-toggle-btn"
                    style={{ background: 'none', border: 'none', fontSize: '1.75rem', cursor: 'pointer', outline: 'none', padding: '0.25rem' }}
                    title={saved ? 'Remove from Saved' : 'Save Car'}
                  >
                    {saved ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
              <div className="car-detail-price-block">
                <span className="car-detail-price">{car.priceDisplay}</span>
                <span className="label-s">No Brokerage Fee</span>
              </div>
            </div>

            {/* Specs grid */}
            <div className="car-detail-specs-grid">
              {car.specs && car.specs.map((spec) => (
                <div className="car-detail-spec-item" key={spec.label}>
                  <span className="label-s">{spec.label}</span>
                  <span className="car-detail-spec-value">{spec.value}</span>
                </div>
              ))}
              <div className="car-detail-spec-item">
                <span className="label-s">Driven</span>
                <span className="car-detail-spec-value">{car.mileage} {car.mileage && !car.mileage.toLowerCase().includes('km') ? 'km' : ''}</span>
              </div>
              <div className="car-detail-spec-item">
                <span className="label-s">Ownership</span>
                <span className="car-detail-spec-value">{car.ownership}</span>
              </div>
              <div className="car-detail-spec-item">
                <span className="label-s">Location</span>
                <span className="car-detail-spec-value">📍 {car.location}</span>
              </div>
              <div className="car-detail-spec-item">
                <span className="label-s">Transmission</span>
                <span className="car-detail-spec-value">{car.transmission}</span>
              </div>
            </div>

            {/* Gallery */}
            {car.gallery && car.gallery.length > 0 && (
              <div className="car-detail-gallery" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <h2 className="title-l" style={{ marginBottom: '0.75rem' }}>Gallery</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {car.gallery.map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt={`${car.name} gallery ${i+1}`} 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80' }}
                      style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', height: '300px', border: '1px solid var(--border)' }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="car-detail-desc">
              <h2 className="title-l" style={{ marginBottom: '0.75rem' }}>Seller's Note</h2>
              <p className="body-l">{car.description || 'No description provided by the seller.'}</p>
              <div className="car-detail-seller">
                <div className="seller-avatar">{(car.sellerName || car.sellerEmail || 'S')[0].toUpperCase()}</div>
                <div>
                  <p className="title-m">{car.sellerName || car.sellerEmail.split('@')[0]}</p>
                  <span className="chip">{car.sellerType || 'Private Seller'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — CTA sidebar */}
          <div className="car-detail-sidebar">
            <div className="sidebar-card glass">
              <h3 className="title-l">Interested in this car?</h3>
              <div className="nbc-advantage">
                <div className="advantage-row">
                  <span className="label-s">Market Price</span>
                  <span className="body-m" style={{ textDecoration: 'line-through' }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(car.price * 1.05)}
                  </span>
                </div>
                <div className="advantage-row">
                  <span className="label-s">NoBroker Price</span>
                  <span className="car-detail-price">{car.priceDisplay}</span>
                </div>
                <div className="advantage-savings chip-green chip" style={{ width: '100%', justifyContent: 'center', padding: '0.5rem' }}>
                  You save ≈ {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(car.price * 0.05)} in fees
                </div>
              </div>
              <button 
                id="contact-seller-btn" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setContactOpen(true)}
              >
                Contact Seller
              </button>
              <button 
                id="test-drive-btn" 
                className="btn-secondary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}
                onClick={() => setContactOpen(true)}
              >
                Schedule Test Drive
              </button>
              <button 
                id="ai-eval-btn" 
                className="btn-ghost" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} 
                onClick={() => navigate('/ai')}
              >
                🤖 Get AI Evaluation
              </button>
            </div>
          </div>
        </div>

        {/* Similar cars */}
        {similar.length > 0 && (
          <div className="similar-cars">
            <h2 className="headline-m" style={{ marginBottom: '2rem' }}>Similar Cars</h2>
            <div className="grid-3">
              {similar.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTACT MODAL OVERLAY ── */}
      {contactOpen && (
        <div className="modal-overlay" onClick={() => setContactOpen(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setContactOpen(false)}>×</button>
            
            <div className="modal-header">
              <h2 className="title-l modal-title">🚗 Contact Seller</h2>
              <p className="body-m" style={{ marginBottom: '1.25rem', opacity: 0.8 }}>
                Connect directly with the seller of this <strong>{car.year} {car.make} {car.model}</strong>.
              </p>
            </div>

            {inquirySuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <span style={{ fontSize: '3rem' }}>💬</span>
                <h3 className="title-l" style={{ marginTop: '1rem', color: '#64dc82' }}>Connecting to WhatsApp...</h3>
                <p className="body-m" style={{ marginTop: '0.5rem' }}>Your inquiry is recorded. Direct chat will open in a new tab.</p>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label className="label-s" htmlFor="i-name">Your Name</label>
                  <input
                    id="i-name"
                    type="text"
                    required
                    className="modal-input"
                    placeholder="Enter your name"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label-s" htmlFor="i-email">Email Address</label>
                  <input
                    id="i-email"
                    type="email"
                    required
                    className="modal-input"
                    placeholder="Enter your email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label-s" htmlFor="i-phone">WhatsApp Number</label>
                  <input
                    id="i-phone"
                    type="tel"
                    required
                    className="modal-input"
                    placeholder="e.g. +91 98765 43210"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label-s" htmlFor="i-message">Message (Optional)</label>
                  <textarea
                    id="i-message"
                    className="modal-input"
                    rows={3}
                    placeholder={`Hi! I'm interested in your ${car.year} ${car.make} ${car.model}.`}
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} 
                  disabled={submittingInquiry}
                >
                  {submittingInquiry ? 'Please wait...' : 'Send WhatsApp Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
