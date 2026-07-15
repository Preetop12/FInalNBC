import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('nbc_theme') !== 'light'
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-mode')
      localStorage.setItem('nbc_theme', 'dark')
    } else {
      document.body.classList.add('light-mode')
      localStorage.setItem('nbc_theme', 'light')
    }
  }, [isDark])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (menuOpen) setMenuOpen(false)
  }, [location.pathname, menuOpen])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/buy', label: 'Buy' },
    { to: '/sell', label: 'Sell' },
    { to: '/ai', label: 'AI Insights' },
    { to: '/contact', label: 'Contact' },
  ]

  if (user?.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin' })
  } else if (user) {
    navLinks.push({ to: '/dashboard', label: 'Dashboard' })
  }

  const handleAuthAction = () => {
    setMenuOpen(false)
    if (user) {
      logout()
      navigate('/')
    } else {
      navigate('/auth')
    }
  }

  return (
    <header className={`navbar glass${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img src="/images/logo.jpg" alt="NoBrokerCars Logo" className="logo-img" style={{ height: '36px', width: '36px', borderRadius: '8px', objectFit: 'cover' }} />
          <span className="logo-text">NoBrokerCars</span>
        </Link>

        {/* Desktop nav */}
        <nav className="navbar-links">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `navbar-link${isActive ? ' navbar-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* CTA + hamburger */}
        <div className="navbar-actions">
          {user ? (
            <div className="dashboard-avatar-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="dashboard-avatar">
                {user.avatar}
              </div>
              <button className="btn-ghost" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={handleAuthAction}>Logout</button>
            </div>
          ) : (
            <button className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }} onClick={() => navigate('/auth')}>
              Login / Sign Up
            </button>
          )}

          <button 
            className="btn-ghost theme-toggle" 
            onClick={() => setIsDark(!isDark)}
            style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px' }}
            aria-label="Toggle Theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          
          <button
            className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            id="hamburger-btn"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`}>
        <div className="mobile-menu-content">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `mobile-menu-link${isActive ? ' navbar-link--active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <div className="mobile-menu-divider" />
          <div className="mobile-menu-footer">
            {user ? (
              <>
                <div className="dashboard-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{user.avatar}</div>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={handleAuthAction}>Logout</button>
              </>
            ) : (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAuthAction}>
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
