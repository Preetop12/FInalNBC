import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import './CarCard.css'

export default function CarCard({ car, size = 'default' }) {
  const cardRef = useRef(null)

  const { contextSafe } = useGSAP({ scope: cardRef })

  const handleMouseEnter = contextSafe(() => {
    gsap.to('.car-card-img', { scale: 1.1, duration: 0.8, ease: 'power3.out' })
    gsap.to('.car-card-preview-overlay', { y: 0, opacity: 1, duration: 0.4, delay: 0.1, ease: 'power3.out' })
    gsap.to('.car-card-spec-items', { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, delay: 0.15, ease: 'back.out(1.2)' })
  })

  const handleMouseLeave = contextSafe(() => {
    gsap.to('.car-card-img', { scale: 1, duration: 0.8, ease: 'power3.out' })
    gsap.to('.car-card-preview-overlay, .car-card-spec-items', { y: 15, opacity: 0, duration: 0.3, stagger: 0, ease: 'power2.in' })
  })

  return (
    <Link 
      to={`/car/${car.id}`} 
      className={`car-card car-card--${size}`} 
      id={`car-card-${car.id}`}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Wrap */}
      <div className="car-card-img-wrap">
        <img
          src={car.image}
          alt={car.name}
          className="car-card-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&fit=crop`
          }}
        />
        {car.tag && (
          <span className="car-card-tag chip chip-cyan">{car.tag}</span>
        )}
        
        {/* Advanced GSAP Hover Preview Overlay */}
        <div className="car-card-preview-overlay">
          <div className="preview-specs-grid">
            {car.specs.map((spec) => (
              <div className="car-card-spec-items" key={spec.label}>
                <span className="label-s" style={{ color: 'rgba(255,255,255,0.7)' }}>{spec.label}</span>
                <span className="car-card-spec-value" style={{ color: '#fff', fontSize: '1rem' }}>{spec.value}</span>
              </div>
            ))}
            <div className="car-card-spec-items" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <span className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.5rem' }}>View Details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="car-card-body">
        <div className="car-card-top">
          <div>
            <p className="label-s car-card-make">{car.make} · {car.year}</p>
            <h3 className="title-l car-card-name">{car.model} {car.name.replace(car.make, '').replace(car.model, '').trim()}</h3>
          </div>
          <div className="car-card-price">
            <span className="car-card-price-value">{car.priceDisplay}</span>
          </div>
        </div>

        {/* Specs mini grid */}
        <div className="car-card-specs">
          {car.specs.slice(0, 4).map((spec) => (
            <div className="car-card-spec" key={spec.label}>
              <span className="label-s">{spec.label}</span>
              <span className="car-card-spec-value">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="car-card-footer">
          <div className="car-card-meta">
            <span className="chip">{car.fuelType}</span>
            <span className="chip">{car.mileage}</span>
          </div>
          <span className="car-card-location">📍 {car.location}</span>
        </div>
      </div>
    </Link>
  )
}
