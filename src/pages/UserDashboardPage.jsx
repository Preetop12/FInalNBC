import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCarsByUser, deleteCar,
  getSavedCars, toggleSaveCar, getCars,
  getInquiriesForSeller, markInquiryRead,
  getUserByEmail, upsertUser,
} from '../lib/db'
import { openWhatsApp } from '../lib/whatsapp'
import './UserDashboardPage.css'

export default function UserDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [myListings, setMyListings] = useState([])
  const [savedCars, setSavedCars] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [profile, setProfile] = useState({ name: '', phone: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [editProfile, setEditProfile] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const [listings, savedIds, allCars, inqs, dbUser] = await Promise.all([
        getCarsByUser(user.email),
        getSavedCars(user.email),
        getCars(),
        getInquiriesForSeller(user.email),
        getUserByEmail(user.email)
      ])
      setMyListings(listings)
      setSavedCars(allCars.filter((c) => savedIds.includes(c.id)))
      setInquiries(inqs)
      setProfile({ name: dbUser?.name || user.name || '', phone: dbUser?.phone || '' })
    } catch (err) {
      console.error('Error refreshing dashboard:', err)
    }
  }, [user])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, [refresh])

  const handleUnsave = async (carId) => {
    await toggleSaveCar(user.email, carId)
    refresh()
  }

  const handleDeleteListing = async (id) => {
    if (confirm('Delete this listing?')) { 
      await deleteCar(id)
      refresh() 
    }
  }

  const handleReadInquiry = async (id) => { 
    await markInquiryRead(id)
    refresh() 
  }

  const handleSaveProfile = async () => {
    await upsertUser({ id: user.id, email: user.email, name: profile.name, phone: profile.phone, role: user.role })
    setProfileSaved(true)
    setEditProfile(false)
    setTimeout(() => setProfileSaved(false), 2500)
    refresh()
  }

  const handleLogout = () => { logout(); navigate('/') }

  const unreadCount = inquiries.filter((i) => !i.read).length
  const totalViews = myListings.reduce((s, c) => s + (c.views || 0), 0)

  const statusColor = { active: 'chip-green', pending: 'chip-amber', rejected: '#ff6b6b bg-error', sold: 'chip-cyan' }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div className="dashboard-user">
            <div className="dashboard-avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
            <div>
              <h1 className="headline-m">Welcome back, {user?.name || user?.email?.split('@')[0]}</h1>
              <p className="body-m">
                {profileSaved ? '✓ Profile updated!' : `${user?.email} · ${user?.role === 'admin' ? 'Administrator' : user?.role === 'seller' ? 'Seller' : 'User'}`}
              </p>
            </div>
          </div>
          <div className="dashboard-quick-stats">
            {[
              { label: 'Active Listings', value: myListings.filter((c) => c.status === 'active').length },
              { label: 'Saved Cars', value: savedCars.length },
              { label: 'Inquiries', value: inquiries.length },
            ].map((s) => (
              <div key={s.label} className="dashboard-quick-stat">
                <span className="dashboard-stat-value">{s.value}</span>
                <span className="label-s">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="container">
          <div className="dashboard-tabs">
            {[
              { id: 'overview', label: '🏠 Overview' },
              { id: 'my-listings', label: '🚗 My Listings' },
              { id: 'saved', label: '❤️ Saved Cars' },
              { id: 'messages', label: `💬 Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
              { id: 'profile', label: '👤 Profile' },
            ].map(({ id, label }) => (
              <button
                key={id}
                id={`tab-${id}`}
                className={`dashboard-tab${activeTab === id ? ' dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container dashboard-content">
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="stat-cards-row">
              {[
                { icon: '👁', title: 'Total Views', value: totalViews.toLocaleString('en-IN') },
                { icon: '🚗', title: 'My Listings', value: myListings.length },
                { icon: '❤️', title: 'Saved Cars', value: savedCars.length },
                { icon: '💬', title: 'Inquiries', value: inquiries.length },
              ].map((s) => (
                <div key={s.title} className="stat-card">
                  <span className="stat-icon">{s.icon}</span>
                  <div>
                    <p className="label-s stat-card-label">{s.title}</p>
                    <p className="stat-card-value">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="activity-card">
              <h3 className="title-l" style={{ marginBottom: '1.25rem' }}>Recent Activity</h3>
              {myListings.length === 0 && inquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                  <p style={{ fontSize: '2rem' }}>🌱</p>
                  <p className="title-m">Just getting started</p>
                  <p className="body-m">Sell a car or browse listings to see your activity here.</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <Link to="/sell" className="btn-primary">+ Sell a Car</Link>
                    <Link to="/buy" className="btn-secondary">Browse Cars</Link>
                  </div>
                </div>
              ) : (
                <div className="activity-list">
                  {myListings.slice(0, 3).map((car) => (
                    <div key={car.id} className="activity-item">
                      <span className="activity-icon">🚗</span>
                      <div>
                        <p className="title-m">{car.year} {car.make} {car.model}</p>
                        <p className="body-m">Status: <span className={`chip chip-sm ${statusColor[car.status] || 'chip-amber'}`}>{car.status}</span></p>
                      </div>
                      <span className="label-s activity-time">{new Date(car.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  ))}
                  {inquiries.slice(0, 3).map((inq) => (
                    <div key={inq.id} className="activity-item">
                      <span className="activity-icon">💬</span>
                      <div>
                        <p className="title-m">Inquiry from {inq.buyerName}</p>
                        <p className="body-m">{inq.message?.slice(0, 80)}…</p>
                      </div>
                      <span className="label-s activity-time">{new Date(inq.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MY LISTINGS ── */}
        {activeTab === 'my-listings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="headline-m">My Listings</h2>
              <Link to="/sell" className="btn-primary">+ Add Car</Link>
            </div>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.7 }}>
                <p style={{ fontSize: '3rem' }}>🚗</p>
                <p className="title-m">No listings yet</p>
                <p className="body-m">List your first car — it's free!</p>
                <Link to="/sell" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Sell a Car</Link>
              </div>
            ) : (
              <div className="listings-table">
                <div className="table-header">
                  <span>Car</span><span>Price</span><span>Views</span><span>Status</span><span>Actions</span>
                </div>
                {myListings.map((car) => (
                  <div key={car.id} className="table-row">
                    <div className="table-car-info">
                      {car.image ? (
                        <img src={car.image} alt={car.model} className="table-car-img" />
                      ) : (
                        <div className="table-car-img" style={{ background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🚗</div>
                      )}
                      <div>
                        <p className="title-m">{car.year} {car.make} {car.model}</p>
                        <p className="body-m">{car.fuelType} · {car.mileage} km</p>
                      </div>
                    </div>
                    <span className="title-m" style={{ color: 'var(--secondary)' }}>
                      ₹{Number(car.price).toLocaleString('en-IN')}
                      {car.negotiable && <span className="body-m" style={{ opacity: 0.6 }}> (neg.)</span>}
                    </span>
                    <span className="body-m">{car.views || 0}</span>
                    <span className={`chip ${statusColor[car.status] || 'chip-amber'}`}>{car.status}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/car/${car.id}`} className="btn-ghost">View</Link>
                      <button className="btn-ghost" style={{ color: '#ff6b6b' }} onClick={() => handleDeleteListing(car.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SAVED CARS ── */}
        {activeTab === 'saved' && (
          <div>
            <h2 className="headline-m" style={{ marginBottom: '1.5rem' }}>Saved Cars</h2>
            {savedCars.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.7 }}>
                <p style={{ fontSize: '3rem' }}>❤️</p>
                <p className="title-m">No saved cars yet</p>
                <p className="body-m">Browse listings and tap the heart icon to save cars.</p>
                <Link to="/buy" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>Browse Cars</Link>
              </div>
            ) : (
              <div className="grid-3">
                {savedCars.map((car) => (
                  <div key={car.id} className="saved-car-card">
                    {car.image ? (
                      <img src={car.image} alt={car.model} className="saved-car-img" />
                    ) : (
                      <div className="saved-car-img" style={{ background: 'var(--surface-container-high)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🚗</div>
                    )}
                    <div className="saved-car-info">
                      <p className="title-m">{car.year} {car.make} {car.model}</p>
                      <p className="body-m" style={{ color: 'var(--secondary)' }}>₹{Number(car.price).toLocaleString('en-IN')}</p>
                      <p className="body-m">📍 {car.location || 'India'}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <Link to={`/car/${car.id}`} className="btn-primary" style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem' }}>View</Link>
                        <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => handleUnsave(car.id)}>🗑 Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES / INQUIRIES ── */}
        {activeTab === 'messages' && (
          <div className="messages-list">
            <h2 className="headline-m" style={{ marginBottom: '1.5rem' }}>Inquiries on My Listings</h2>
            {inquiries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.7 }}>
                <p style={{ fontSize: '3rem' }}>💬</p>
                <p className="title-m">No inquiries yet</p>
                <p className="body-m">When buyers inquire about your listings, they'll appear here.</p>
              </div>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className={`message-item${!inq.read ? ' message-item--unread' : ''}`}>
                  <div className="msg-sender-avatar">{inq.buyerName?.[0] || '?'}</div>
                  <div className="message-item-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <p className="title-m">{inq.buyerName}</p>
                      <span className="label-s">{new Date(inq.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="body-m" style={{ marginTop: '0.125rem', opacity: 0.7 }}>📱 {inq.buyerPhone} · ✉ {inq.buyerEmail}</p>
                    <p className="body-m" style={{ marginTop: '0.5rem' }}>{inq.message}</p>
                    <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.75rem' }}>
                      {inq.buyerPhone && (
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', background: '#25d366', color: '#fff' }}
                          onClick={() => openWhatsApp(inq.buyerPhone.replace(/\D/g, ''), `Hi ${inq.buyerName}, thanks for your interest!`)}
                        >💬 Reply on WhatsApp</button>
                      )}
                      {!inq.read && (
                        <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => handleReadInquiry(inq.id)}>Mark Read</button>
                      )}
                    </div>
                  </div>
                  {!inq.read && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 className="headline-m">My Profile</h2>
              <button className="btn-secondary" onClick={() => setEditProfile((v) => !v)}>
                {editProfile ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
            <div className="profile-card glass">
              <div className="profile-avatar-lg">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
              <div className="profile-fields">
                <div className="profile-field">
                  <label className="label-s">Name</label>
                  {editProfile ? (
                    <input className="form-input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                  ) : (
                    <p className="title-m">{profile.name || user?.name || '—'}</p>
                  )}
                </div>
                <div className="profile-field">
                  <label className="label-s">Email</label>
                  <p className="title-m">{user?.email}</p>
                </div>
                <div className="profile-field">
                  <label className="label-s">Phone (for WhatsApp contact)</label>
                  {editProfile ? (
                    <input className="form-input" placeholder="+91 9876543210" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                  ) : (
                    <p className="title-m">{profile.phone || '—'}</p>
                  )}
                </div>
                <div className="profile-field">
                  <label className="label-s">Role</label>
                  <p className="title-m" style={{ textTransform: 'capitalize' }}>{user?.role || 'user'}</p>
                </div>
              </div>
              {editProfile && (
                <button className="btn-primary" style={{ marginTop: '1.5rem', alignSelf: 'flex-start' }} onClick={handleSaveProfile}>
                  Save Profile
                </button>
              )}
            </div>
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--outline-variant)' }}>
              <button className="btn-ghost" style={{ color: '#ff6b6b' }} onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
