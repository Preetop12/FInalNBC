import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/images/logo.jpg" alt="NoBrokerCars Logo" className="logo-img" style={{ height: '36px', width: '36px', borderRadius: '8px', objectFit: 'cover' }} />
            <span className="logo-text">NoBrokerCars</span>
          </div>
          <p className="body-m footer-tagline">
            India's premium car marketplace.<br />No brokerage. No middlemen. Just value.
          </p>
        </div>

        {/* Links */}
        <div className="footer-links-group">
          <h4 className="label-m footer-group-title">Explore</h4>
          <Link to="/buy" className="footer-link">Browse Cars</Link>
          <Link to="/sell" className="footer-link">Sell Your Car</Link>
          <Link to="/ai" className="footer-link">AI Insights</Link>
          <a href="#" className="footer-link">Price Trends</a>
        </div>

        <div className="footer-links-group">
          <h4 className="label-m footer-group-title">Company</h4>
          <a href="#" className="footer-link">About Us</a>
          <Link to="/contact" className="footer-link">Contact Support</Link>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
        </div>

        <div className="footer-links-group">
          <h4 className="label-m footer-group-title">Cities</h4>
          <a href="#" className="footer-link">Mumbai</a>
          <a href="#" className="footer-link">Bangalore</a>
          <a href="#" className="footer-link">Delhi NCR</a>
          <a href="#" className="footer-link">Hyderabad</a>
          <a href="#" className="footer-link">Chennai</a>
        </div>
      </div>

      <div className="footer-bottom container">
        <p className="footer-copy">
          © 2024 NoBrokerCars Pvt. Ltd. · Aerodynamic Minimalism · Made in India
        </p>
        <div className="footer-bottom-links">
          <a href="#" className="footer-link" style={{ fontSize: '0.75rem' }}>Privacy</a>
          <a href="#" className="footer-link" style={{ fontSize: '0.75rem' }}>Terms</a>
          <a href="#" className="footer-link" style={{ fontSize: '0.75rem' }}>Cookies</a>
        </div>
      </div>
    </footer>
  )
}
