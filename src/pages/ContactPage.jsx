import { useState, useEffect } from 'react'
import { addContact, getSettings } from '../lib/db'
import { notifyAdminContact, openWhatsApp } from '../lib/whatsapp'
import './ContactPage.css'


const SUBJECTS = ['Buy a Car', 'Sell a Car', 'Report a Listing', 'Pricing Query', 'Technical Support', 'Partnership', 'Other']

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [adminWA, setAdminWA] = useState('919999999999')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings()
        if (settings?.adminWhatsApp) {
          setAdminWA(settings.adminWhatsApp)
        }
      } catch (err) {
        console.error('Error loading settings on contact page:', err)
      }
    }
    loadSettings()
  }, [])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.message.trim()) e.message = 'Message is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    try {
      const contact = await addContact(form)
      try { notifyAdminContact(contact) } catch { /* ignore */ }
      setSuccess(true)
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send contact inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="contact-page">
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', display: 'flex', justifyContent: 'center' }}>
          <div className="contact-form-card contact-success">
            <div className="contact-success-icon">✅</div>
            <h2 className="headline-m">Message Sent!</h2>
            <p className="body-l" style={{ marginTop: '0.5rem', maxWidth: 400, margin: '0.75rem auto 0' }}>
              We've received your message and will get back to you within 24 hours. You can also reach us directly on WhatsApp.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
              <button
                className="contact-wa-btn"
                onClick={() => openWhatsApp(adminWA, `Hi! I just submitted a contact form on NoBrokerCars. My name is ${form.name}.`)}
              >
                💬 Continue on WhatsApp
              </button>
              <button className="btn-secondary" onClick={() => { setSuccess(false); setForm({ name:'',email:'',phone:'',subject:'',message:'' }) }}>
                Send Another
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-page">
      {/* Hero */}
      <div className="contact-hero">
        <div className="container">
          <div className="contact-hero-badge">📞 Get in Touch</div>
          <h1 className="display-s">Contact Us</h1>
          <p className="body-l" style={{ marginTop: '0.75rem', opacity: 0.8, maxWidth: 500, margin: '0.75rem auto 0' }}>
            Have a question about a listing? Want to sell? We're here to help — typically respond within 2 hours.
          </p>
        </div>
      </div>

      <div className="contact-body">
        <div className="container contact-grid">
          {/* Info cards */}
          <div className="contact-info-list">
            <div className="contact-info-card">
              <div className="contact-info-icon">💬</div>
              <div>
                <p className="contact-info-label">WhatsApp</p>
                <p className="contact-info-value">+{adminWA}</p>
                <button
                  className="contact-wa-btn"
                  onClick={() => openWhatsApp(adminWA, 'Hi! I have a query about NoBrokerCars.')}
                >
                  💬 Chat Now
                </button>
              </div>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-icon">📧</div>
              <div>
                <p className="contact-info-label">Email</p>
                <p className="contact-info-value">support@nobrokercars.in</p>
              </div>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-icon">🕐</div>
              <div>
                <p className="contact-info-label">Working Hours</p>
                <p className="contact-info-value">Mon – Sat, 9 AM – 7 PM IST</p>
              </div>
            </div>
            <div className="contact-info-card">
              <div className="contact-info-icon">📍</div>
              <div>
                <p className="contact-info-label">Office</p>
                <p className="contact-info-value">Mumbai, Maharashtra, India</p>
              </div>
            </div>
            <div className="contact-info-card" style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)' }}>
              <div className="contact-info-icon" style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)' }}>🟢</div>
              <div>
                <p className="contact-info-label">Response Time</p>
                <p className="contact-info-value">Usually within 2 hours</p>
                <p className="body-m" style={{ opacity: 0.7 }}>For urgent queries, WhatsApp is fastest</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-card glass">
            <div className="contact-form-title">
              <h2 className="headline-m">Send a Message</h2>
              <p className="body-m" style={{ marginTop: '0.375rem', opacity: 0.7 }}>Fill in the form and we'll respond via email or WhatsApp.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="contact-form-grid">
                <div className="contact-form-group">
                  <label className="contact-label" htmlFor="c-name">Your Name *</label>
                  <input
                    id="c-name"
                    className={`contact-input${errors.name ? ' input-error' : ''}`}
                    placeholder="Preet Patel"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                  {errors.name && <p className="form-error">{errors.name}</p>}
                </div>
                <div className="contact-form-group">
                  <label className="contact-label" htmlFor="c-email">Email *</label>
                  <input
                    id="c-email"
                    type="email"
                    className={`contact-input${errors.email ? ' input-error' : ''}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                <div className="contact-form-group">
                  <label className="contact-label" htmlFor="c-phone">WhatsApp / Phone *</label>
                  <input
                    id="c-phone"
                    type="tel"
                    className={`contact-input${errors.phone ? ' input-error' : ''}`}
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                  {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>
                <div className="contact-form-group">
                  <label className="contact-label" htmlFor="c-subject">Subject</label>
                  <select
                    id="c-subject"
                    className="contact-input"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                  >
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="contact-form-group full">
                  <label className="contact-label" htmlFor="c-message">Message *</label>
                  <textarea
                    id="c-message"
                    className={`contact-input contact-textarea${errors.message ? ' input-error' : ''}`}
                    placeholder="Tell us how we can help you..."
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                  />
                  {errors.message && <p className="form-error">{errors.message}</p>}
                </div>
              </div>
              <div className="contact-form-footer">
                <p className="body-m" style={{ opacity: 0.6 }}>
                  Or contact us directly on{' '}
                  <button type="button" className="link-btn"
                    onClick={() => openWhatsApp(adminWA, 'Hi! I have a query about NoBrokerCars.')}>
                    WhatsApp
                  </button>
                </p>
                <button type="submit" className="btn-primary" id="submit-contact-btn" disabled={submitting}>
                  {submitting ? '⏳ Sending…' : '📨 Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
