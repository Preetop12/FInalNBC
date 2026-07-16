import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getCars, updateCar, deleteCar,
  getUsers, updateUserRole, banUser,
  getInquiries, markInquiryRead,
  getContacts, markContactRead, deleteContact,
  getAnalytics, getSettings, updateSettings,
} from '../lib/db'
import { openWhatsApp } from '../lib/whatsapp'
import './AdminDashboardPage.css'

const TABS = [
  { id: 'listings',  icon: '📋', label: 'Listings' },
  { id: 'users',     icon: '👥', label: 'Users' },
  { id: 'inbox',     icon: '📩', label: 'Inbox' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
  { id: 'settings',  icon: '⚙️', label: 'Settings' },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('listings')
  const [cars, setCars] = useState([])
  const [users, setUsers] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [contacts, setContacts] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [settings, setSettings] = useState({
    adminWhatsApp: '919999999999',
    listingFee: 'Free',
    aiModel: 'v2.4',
    emailNotifications: true,
    moderationEnabled: true,
    siteName: 'NoBrokerCars'
  })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [allCars, allUsers, allInquiries, allContacts, allAnalytics, activeSettings] = await Promise.all([
        getCars(),
        getUsers(),
        getInquiries(),
        getContacts(),
        getAnalytics(),
        getSettings()
      ])
      setCars(allCars)
      setUsers(allUsers)
      setInquiries(allInquiries)
      setContacts(allContacts)
      setAnalytics(allAnalytics)
      if (activeSettings) setSettings(activeSettings)
    } catch (err) {
      console.error('Error refreshing admin dashboard:', err)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleApprove = async (id) => { await updateCar(id, { status: 'active' }); refresh() }
  const handleReject  = async (id) => { await updateCar(id, { status: 'rejected' }); refresh() }
  const handleDelete  = async (id) => { if (confirm('Delete this listing?')) { await deleteCar(id); refresh() } }
  const handleMarkSold = async (id) => { await updateCar(id, { status: 'sold' }); refresh() }

  const handleBan = async (email) => { await banUser(email); refresh() }
  const handleRoleChange = async (email, role) => { await updateUserRole(email, role); refresh() }

  const handleReadContact = async (id) => { await markContactRead(id); refresh() }
  const handleDeleteContact = async (id) => { await deleteContact(id); refresh() }
  const handleReadInquiry = async (id) => { await markInquiryRead(id); refresh() }

  const handleSaveSettings = async () => {
    await updateSettings(settings)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
    refresh()
  }

  const filteredCars = cars
    .filter((c) => filter === 'all' || c.status === filter)
    .filter((c) => !search || `${c.make} ${c.model} ${c.year}`.toLowerCase().includes(search.toLowerCase()))

  const unreadInbox = contacts.filter((c) => !c.read).length + inquiries.filter((i) => !i.read).length

  const statusColor = { active: 'chip-green', pending: 'chip-amber', rejected: 'chip-red', sold: 'chip-cyan' }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar glass">
        <div className="admin-logo">
          <img src="/images/logo.jpg" alt="NoBrokerCars Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Admin</span>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`admin-tab-${t.id}`}
            className={`admin-nav-item${tab === t.id ? ' admin-nav-item--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            <span style={{ textTransform: 'capitalize' }}>{t.label}</span>
            {t.id === 'inbox' && unreadInbox > 0 && (
              <span className="badge-pill">{unreadInbox}</span>
            )}
          </button>
        ))}
        <div className="admin-sidebar-footer">
          <div className="dashboard-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {user?.avatar || 'A'}
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>{user?.name || 'Admin'}</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Administrator</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <h1 className="headline-m">
            {TABS.find((t) => t.id === tab)?.icon}&nbsp;
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="chip chip-green">● System Online</span>
            <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={refresh}>↻ Refresh</button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="admin-kpis">
          {[
            { icon: '📋', title: 'Total Listings', value: analytics.cars?.length ?? 0, sub: `${analytics.active ?? 0} active` },
            { icon: '👥', title: 'Registered Users', value: analytics.users?.length ?? 0, sub: 'Platform users' },
            { icon: '📩', title: 'Inquiries', value: analytics.inquiries?.length ?? 0, sub: `${analytics.inquiries?.filter(i=>!i.read).length ?? 0} unread` },
            { icon: '👁', title: 'Total Views', value: analytics.totalViews ?? 0, sub: 'Across all listings' },
          ].map((k) => (
            <div key={k.title} className="admin-kpi-card">
              <span className="kpi-icon">{k.icon}</span>
              <div>
                <p className="label-s">{k.title}</p>
                <p className="kpi-value">{k.value.toLocaleString('en-IN')}</p>
                <p className="body-m" style={{ color: 'var(--on-surface-variant)' }}>{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── LISTINGS TAB ── */}
        {tab === 'listings' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="title-l">All Listings</h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['all', 'pending', 'active', 'rejected', 'sold'].map((f) => (
                  <button
                    key={f}
                    className={`chip${filter === f ? ' chip-active' : ''}`}
                    onClick={() => setFilter(f)}
                    style={{ cursor: 'pointer', border: 'none', background: filter === f ? 'var(--primary)' : undefined, color: filter === f ? '#000' : undefined }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({cars.filter(c => f === 'all' || c.status === f).length})
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <input
                className="form-input"
                placeholder="🔍 Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 320 }}
              />
            </div>
            {filteredCars.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '3rem' }}>🚗</span>
                <p className="title-m">No listings found</p>
                <p className="body-m">Listings submitted via "Sell Car" will appear here.</p>
              </div>
            ) : (
              <div className="admin-table">
                <div className="admin-table-header">
                  <span>Listing</span><span>Seller</span><span>Price</span><span>Views</span><span>Status</span><span>Actions</span>
                </div>
                {filteredCars.map((car) => (
                  <div key={car.id} className="admin-table-row">
                    <div className="table-car-info">
                      {car.image ? (
                        <img src={car.image} alt={car.model} className="table-car-img" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100&q=60' }} />
                      ) : (
                        <div className="table-car-img" style={{ background: 'var(--surface-container-high)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>🚗</div>
                      )}
                      <div>
                        <p className="title-m">{car.year} {car.make} {car.model}</p>
                        <p className="body-m">{car.fuelType} · {car.transmission}</p>
                      </div>
                    </div>
                    <div>
                      <p className="body-m">{car.sellerName || '—'}</p>
                      <p className="body-m" style={{ opacity: 0.6 }}>{car.sellerEmail || ''}</p>
                    </div>
                    <span className="body-m" style={{ color: 'var(--secondary)' }}>
                      ₹{Number(car.price).toLocaleString('en-IN')}
                    </span>
                    <span className="body-m">{car.views || 0}</span>
                    <span className={`chip ${statusColor[car.status] || ''}`}>{car.status}</span>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {car.status === 'pending' && (
                        <>
                          <button className="btn-ghost admin-action-btn" style={{ color: '#64dc82' }} onClick={() => handleApprove(car.id)}>✓ Approve</button>
                          <button className="btn-ghost admin-action-btn" style={{ color: '#ff6b6b' }} onClick={() => handleReject(car.id)}>✗ Reject</button>
                        </>
                      )}
                      {car.status === 'active' && (
                        <button className="btn-ghost admin-action-btn" style={{ color: 'var(--secondary)' }} onClick={() => handleMarkSold(car.id)}>Mark Sold</button>
                      )}
                      <button className="btn-ghost admin-action-btn" style={{ color: '#ff6b6b' }} onClick={() => handleDelete(car.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="admin-section">
            <h2 className="title-l" style={{ marginBottom: '1.5rem' }}>Registered Users</h2>
            {users.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '3rem' }}>👥</span>
                <p className="title-m">No users yet</p>
                <p className="body-m">Users will appear here once they register or log in.</p>
              </div>
            ) : (
              <div className="admin-table">
                <div className="admin-table-header">
                  <span>User</span><span>Role</span><span>Listings</span><span>Joined</span><span>Status</span><span>Actions</span>
                </div>
                {users.map((u, i) => (
                  <div key={i} className="admin-table-row">
                    <div className="table-car-info">
                      <div className="dashboard-avatar" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}>
                        {(u.name || u.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="title-m">{u.name || u.email.split('@')[0]}</p>
                        <p className="body-m">{u.email}</p>
                      </div>
                    </div>
                    <select
                      className="form-select"
                      style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.email, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    <span className="body-m">{cars.filter((c) => c.sellerEmail === u.email).length}</span>
                    <span className="body-m">{u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN') : '—'}</span>
                    <span className={`chip ${u.banned ? 'chip-red' : 'chip-green'}`}>{u.banned ? 'Banned' : 'Active'}</span>
                    <button
                      className="btn-ghost admin-action-btn"
                      style={{ color: u.banned ? '#64dc82' : '#ff6b6b' }}
                      onClick={() => handleBan(u.email)}
                    >
                      {u.banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX TAB ── */}
        {tab === 'inbox' && (
          <div className="admin-section">
            <h2 className="title-l" style={{ marginBottom: '1.5rem' }}>Inbox</h2>

            {/* Contact messages */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 className="title-m" style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>📩 Contact Messages ({contacts.length})</h3>
              {contacts.length === 0 ? (
                <p className="body-m" style={{ opacity: 0.6 }}>No contact messages yet.</p>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className={`message-item${!c.read ? ' message-item--unread' : ''}`} style={{ marginBottom: '0.75rem' }}>
                    <div className="msg-sender-avatar">{c.name?.[0] || '?'}</div>
                    <div className="message-item-body" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <p className="title-m">{c.name} <span className="body-m" style={{ opacity: 0.6 }}>· {c.email}</span></p>
                        <span className="label-s">{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="body-m" style={{ marginTop: '0.25rem' }}>📱 {c.phone}</p>
                      <p className="body-m" style={{ marginTop: '0.25rem' }}>{c.message}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        {c.phone && (
                          <button className="btn-secondary admin-action-btn" style={{ color: '#25d366', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                            onClick={() => openWhatsApp(c.phone.replace(/\D/g,''), `Hi ${c.name}, regarding your inquiry on NoBrokerCars...`)}
                          >💬 WhatsApp</button>
                        )}
                        {!c.read && (
                          <button className="btn-secondary admin-action-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={() => handleReadContact(c.id)}>Mark Read</button>
                        )}
                        <button className="btn-secondary admin-action-btn" style={{ color: '#ff6b6b', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={() => handleDeleteContact(c.id)}>🗑 Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Car inquiries */}
            <div>
              <h3 className="title-m" style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>🚗 Car Inquiries ({inquiries.length})</h3>
              {inquiries.length === 0 ? (
                <p className="body-m" style={{ opacity: 0.6 }}>No car inquiries yet.</p>
              ) : (
                inquiries.map((inq) => {
                  const car = cars.find((c) => c.id === inq.carId)
                  return (
                    <div key={inq.id} className={`message-item${!inq.read ? ' message-item--unread' : ''}`} style={{ marginBottom: '0.75rem' }}>
                      <div className="msg-sender-avatar">{inq.buyerName?.[0] || '?'}</div>
                      <div className="message-item-body" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <p className="title-m">{inq.buyerName} <span className="body-m" style={{ opacity: 0.6 }}>→ {car ? `${car.year} ${car.make} ${car.model}` : 'Unknown Car'}</span></p>
                          <span className="label-s">{new Date(inq.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="body-m" style={{ marginTop: '0.25rem' }}>📱 {inq.buyerPhone} · ✉ {inq.buyerEmail}</p>
                        <p className="body-m" style={{ marginTop: '0.25rem' }}>{inq.message}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                          {inq.buyerPhone && (
                            <button className="btn-secondary admin-action-btn" style={{ color: '#25d366', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                              onClick={() => openWhatsApp(inq.buyerPhone.replace(/\D/g,''), `Hi ${inq.buyerName}, regarding your inquiry for the ${car ? `${car.make} ${car.model}` : 'car'} on NoBrokerCars...`)}
                            >💬 WhatsApp</button>
                          )}
                          {!inq.read && (
                            <button className="btn-secondary admin-action-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={() => handleReadInquiry(inq.id)}>Mark Read</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className="admin-section">
            <h2 className="title-l" style={{ marginBottom: '1.5rem' }}>Analytics Overview</h2>
            <div className="analytics-grid">
              {[
                { label: 'Total Listings', value: analytics.cars?.length ?? 0, desc: `${analytics.active ?? 0} active, ${analytics.pending ?? 0} pending` },
                { label: 'Total Users', value: analytics.users?.length ?? 0, desc: 'All registered accounts' },
                { label: 'Total Views', value: (analytics.totalViews ?? 0).toLocaleString('en-IN'), desc: 'Cumulative across all listings' },
                { label: 'Avg Listing Price', value: analytics.avgPrice ? `₹${(analytics.avgPrice / 100000).toFixed(1)}L` : '—', desc: 'Across all listings' },
                { label: 'Total Inquiries', value: analytics.inquiries?.length ?? 0, desc: `${analytics.inquiries?.filter(i=>!i.read).length ?? 0} unread` },
                { label: 'Contact Messages', value: analytics.contacts?.length ?? 0, desc: `${analytics.contacts?.filter(c=>!c.read).length ?? 0} unread` },
              ].map((a) => (
                <div key={a.label} className="analytics-card">
                  <p className="label-m" style={{ marginBottom: '0.5rem' }}>{a.label}</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.02em' }}>{a.value}</p>
                  <p className="body-m">{a.desc}</p>
                </div>
              ))}
            </div>

            {/* Listing status breakdown */}
            <div style={{ marginTop: '2rem' }}>
              <h3 className="title-m" style={{ marginBottom: '1rem' }}>Listing Status Breakdown</h3>
              <div className="analytics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {['active', 'pending', 'rejected', 'sold'].map((s) => {
                  const count = cars.filter((c) => c.status === s).length
                  const pct = cars.length ? Math.round((count / cars.length) * 100) : 0
                  return (
                    <div key={s} className="analytics-card">
                      <p className="label-m" style={{ textTransform: 'capitalize', marginBottom: '0.5rem' }}>{s}</p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{count}</p>
                      <div style={{ background: 'var(--surface-container-high)', borderRadius: 4, height: 6, marginTop: '0.5rem' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--secondary)', borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                      <p className="body-m" style={{ marginTop: '0.25rem' }}>{pct}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="admin-section">
            <h2 className="title-l" style={{ marginBottom: '1.5rem' }}>Platform Settings</h2>
            <div className="settings-list">
              <div className="setting-row">
                <div>
                  <p className="title-m">Admin WhatsApp Number</p>
                  <p className="body-m">Used for notifications and customer contact (E.164 format, no +)</p>
                </div>
                <input
                  className="form-input"
                  style={{ width: 220 }}
                  placeholder="e.g. 919876543210"
                  value={settings.adminWhatsApp || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, adminWhatsApp: e.target.value }))}
                />
              </div>
              <div className="setting-row">
                <div>
                  <p className="title-m">Site Name</p>
                  <p className="body-m">Displayed across the platform</p>
                </div>
                <input
                  className="form-input"
                  style={{ width: 220 }}
                  value={settings.siteName || 'NoBrokerCars'}
                  onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
                />
              </div>
              <div className="setting-row">
                <div>
                  <p className="title-m">Listing Fee</p>
                  <p className="body-m">Current fee structure for car listings</p>
                </div>
                <select
                  className="form-select"
                  style={{ width: 160 }}
                  value={settings.listingFee || 'Free'}
                  onChange={(e) => setSettings((s) => ({ ...s, listingFee: e.target.value }))}
                >
                  <option>Free</option>
                  <option>₹499</option>
                  <option>₹999</option>
                  <option>₹1999</option>
                </select>
              </div>
              <div className="setting-row">
                <div>
                  <p className="title-m">Email Notifications</p>
                  <p className="body-m">Send automated alerts for new listings and inquiries</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications ?? true}
                    onChange={(e) => setSettings((s) => ({ ...s, emailNotifications: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="setting-row">
                <div>
                  <p className="title-m">Auto-Moderation</p>
                  <p className="body-m">Automatically flag suspicious listings</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.moderationEnabled ?? true}
                    onChange={(e) => setSettings((s) => ({ ...s, moderationEnabled: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={handleSaveSettings}>
                  {settingsSaved ? '✓ Saved!' : 'Save Settings'}
                </button>
                <button className="btn-secondary" onClick={async () => {
                  try {
                    const { seedSupabaseDatabase } = await import('../lib/seedSupabase.js')
                    await seedSupabaseDatabase()
                    refresh()
                  } catch (e) {
                    console.error(e)
                    alert('Error running seeder. See console.')
                  }
                }}>
                  🌱 Initialize Database (Supabase)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
