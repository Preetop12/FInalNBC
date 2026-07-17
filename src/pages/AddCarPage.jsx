import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addCar, upsertUser, uploadCarImage } from '../lib/db'
import { notifyAdminNewListing } from '../lib/whatsapp'
import './AddCarPage.css'

const STEPS = ['Car Info', 'Specs', 'Photos', 'Pricing', 'Review']
const MAKES = ['Tata', 'Kia', 'Mahindra', 'Hyundai', 'Maruti Suzuki', 'Honda', 'Toyota', 'Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'MG', 'Skoda', 'Volkswagen', 'Nissan', 'Other']

export default function AddCarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    make: '', model: '', year: '', color: '', registration: '',
    fuelType: '', transmission: '', mileage: '', ownership: '',
    power: '', engine: '', zeroToHundred: '', location: '',
    photos: [], description: '',
    price: '', negotiable: true,
    sellerPhone: '', sellerName: user?.name || user?.email?.split('@')[0] || '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [errors, setErrors] = useState({})

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  // Validation per step
  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!form.make) e.make = 'Required'
      if (!form.model) e.model = 'Required'
      if (!form.year || form.year < 1990 || form.year > 2026) e.year = 'Enter a valid year'
      if (!form.ownership) e.ownership = 'Required'
    }
    if (step === 1) {
      if (!form.fuelType) e.fuelType = 'Required'
      if (!form.transmission) e.transmission = 'Required'
      if (!form.mileage) e.mileage = 'Required'
    }
    if (step === 3) {
      if (!form.price || Number(form.price) < 10000) e.price = 'Enter a valid price'
      if (!form.sellerPhone) e.sellerPhone = 'Phone number is required for buyer contact'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validate()) setStep((s) => s + 1)
  }

  // Handle photo upload to Supabase Storage
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingPhotos(true)
    const uploadedUrls = []

    try {
      for (const file of files) {
        const url = await uploadCarImage(file)
        uploadedUrls.push(url)
      }
      setForm((f) => ({
        ...f,
        photos: [...f.photos, ...uploadedUrls].slice(0, 10),
      }))
    } catch (err) {
      console.error('Error uploading photos:', err)
      alert('Failed to upload some images. Please check bucket rules or try again.')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removePhoto = (idx) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)

    // Build specs structure
    const specs = [
      { label: 'Engine', value: form.engine || 'N/A' },
      { label: 'Power', value: form.power || 'N/A' },
      { label: '0-100', value: form.zeroToHundred || 'N/A' },
    ]

    const carData = {
      name: `${form.make} ${form.model}`,
      make: form.make,
      model: form.model,
      year: Number(form.year),
      color: form.color,
      registration: form.registration,
      fuelType: form.fuelType,
      transmission: form.transmission,
      mileage: form.mileage,
      ownership: form.ownership,
      location: form.location || 'India',
      image: form.photos[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
      gallery: form.photos,
      description: form.description,
      price: Number(form.price),
      priceDisplay: `₹${Number(form.price).toLocaleString('en-IN')}`,
      negotiable: form.negotiable,
      sellerPhone: form.sellerPhone,
      sellerName: form.sellerName || user.name || user.email.split('@')[0],
      sellerEmail: user.email,
      sellerType: 'Private Seller',
      specs: specs
    }

    try {
      const newCar = await addCar(carData)

      // Update user as seller
      await upsertUser({ id: user.id, email: user.email, name: carData.sellerName, phone: form.sellerPhone, role: 'seller' })

      // Notify admin via WhatsApp
      try { notifyAdminNewListing(newCar) } catch { /* ignore */ }

      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting car:', err)
      alert('Failed to publish listing. Please make sure credentials and connection are active.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="add-car-page">
        <div className="add-car-success">
          <div className="success-icon-wrap">
            <span style={{ fontSize: '3rem' }}>🎉</span>
          </div>
          <h2 className="headline-m">Listing Submitted!</h2>
          <p className="body-l">Your listing is under review. We'll notify you once it's approved (usually within 2 hours).</p>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => { setSubmitted(false); setStep(0); setForm({ make:'',model:'',year:'',color:'',registration:'',fuelType:'',transmission:'',mileage:'',ownership:'',power:'',engine:'',zeroToHundred:'',location:'',photos:[],description:'',price:'',negotiable:true,sellerPhone:'',sellerName:user?.name||'' }) }}>
              + Add Another Car
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  const err = (key) => errors[key] ? <p className="form-error">{errors[key]}</p> : null

  return (
    <div className="add-car-page">
      <div className="container add-car-container">
        {/* Header */}
        <div className="add-car-header">
          <p className="label-m">Sell on NoBrokerCars</p>
          <h1 className="headline-l" style={{ marginTop: '0.5rem' }}>List Your Car</h1>
          <p className="body-l" style={{ marginTop: '0.5rem' }}>Free listing · AI-powered pricing · Connect directly with buyers via WhatsApp</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`step${i === step ? ' step--active' : ''}${i < step ? ' step--done' : ''}`}>
              <div className="step-circle" onClick={() => i < step && setStep(i)}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Form panels */}
        <div className="add-car-form">
          {/* ── STEP 0: Car Info ── */}
          {step === 0 && (
            <div className="form-panel">
              <h2 className="title-l form-panel-title">Basic Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-make">Make *</label>
                  <select id="car-make" className={`form-select${errors.make ? ' input-error' : ''}`} value={form.make} onChange={(e) => update('make', e.target.value)}>
                    <option value="">Select Make</option>
                    {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {err('make')}
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-model">Model *</label>
                  <input id="car-model" className={`form-input${errors.model ? ' input-error' : ''}`} placeholder="e.g. Harrier Dark Edition" value={form.model} onChange={(e) => update('model', e.target.value)} />
                  {err('model')}
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-year">Year *</label>
                  <input id="car-year" type="number" className={`form-input${errors.year ? ' input-error' : ''}`} placeholder="e.g. 2023" value={form.year} onChange={(e) => update('year', e.target.value)} min={1990} max={2026} />
                  {err('year')}
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-color">Colour</label>
                  <input id="car-color" className="form-input" placeholder="e.g. Dark Marble Black" value={form.color} onChange={(e) => update('color', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-reg">Registration Number</label>
                  <input id="car-reg" className="form-input" placeholder="e.g. MH01AB1234" value={form.registration} onChange={(e) => update('registration', e.target.value)} style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-ownership">Ownership *</label>
                  <select id="car-ownership" className={`form-select${errors.ownership ? ' input-error' : ''}`} value={form.ownership} onChange={(e) => update('ownership', e.target.value)}>
                    <option value="">Select</option>
                    <option>1st Owner</option><option>2nd Owner</option><option>3rd Owner</option><option>4th+ Owner</option>
                  </select>
                  {err('ownership')}
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-location">City / Location</label>
                  <input id="car-location" className="form-input" placeholder="e.g. Mumbai" value={form.location} onChange={(e) => update('location', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Specs ── */}
          {step === 1 && (
            <div className="form-panel">
              <h2 className="title-l form-panel-title">Technical Specs</h2>
              <div className="form-grid">
                {[
                  { id: 'fuel-type', label: 'Fuel Type *', key: 'fuelType', type: 'select', opts: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'] },
                  { id: 'transmission', label: 'Transmission *', key: 'transmission', type: 'select', opts: ['Manual', 'Automatic', 'DCT', 'CVT', 'AMT', 'iMT'] },
                  { id: 'mileage', label: 'KM Driven *', key: 'mileage', type: 'text', placeholder: 'e.g. 12000' },
                  { id: 'power', label: 'Power (HP)', key: 'power', type: 'text', placeholder: 'e.g. 170 HP' },
                  { id: 'engine', label: 'Engine', key: 'engine', type: 'text', placeholder: 'e.g. 2.0L Diesel' },
                  { id: 'zero-to-hundred', label: '0–100 KM/H', key: 'zeroToHundred', type: 'text', placeholder: 'e.g. 9.1s' },
                ].map((f) => (
                  <div key={f.id} className="form-group">
                    <label className="label-s form-label" htmlFor={f.id}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select id={f.id} className={`form-select${errors[f.key] ? ' input-error' : ''}`} value={form[f.key]} onChange={(e) => update(f.key, e.target.value)}>
                        <option value="">Select</option>
                        {f.opts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input id={f.id} className={`form-input${errors[f.key] ? ' input-error' : ''}`} placeholder={f.placeholder} value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} />
                    )}
                    {err(f.key)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Photos ── */}
          {step === 2 && (
            <div className="form-panel">
              <h2 className="title-l form-panel-title">Photos &amp; Description</h2>

              <label className="photo-upload-zone" htmlFor="photo-input" style={{ position: 'relative', pointerEvents: uploadingPhotos ? 'none' : 'auto' }}>
                {uploadingPhotos ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="loading-spinner" style={{ width: 35, height: 35, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p className="title-m">Uploading to Supabase Storage...</p>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '2.5rem' }}>📸</span>
                    <p className="title-m">Click to upload photos</p>
                    <p className="body-m">Upload up to 10 photos. Exterior, interior, engine bay.</p>
                    <span className="btn-secondary" style={{ marginTop: '0.75rem', pointerEvents: 'none' }}>Choose Photos</span>
                  </>
                )}
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos}
                />
              </label>

              {form.photos.length > 0 && (
                <div className="photo-grid" style={{ marginTop: '1.25rem' }}>
                  {form.photos.map((src, idx) => (
                    <div key={idx} className="photo-thumb">
                      <img src={src} alt={`Photo ${idx + 1}`} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300' }} />
                      <button className="photo-remove" onClick={() => removePhoto(idx)}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="label-s form-label" htmlFor="car-desc">Seller's Note</label>
                <textarea
                  id="car-desc"
                  className="form-input form-textarea"
                  rows={5}
                  placeholder="Describe the condition, features, service history, and anything special about your car…"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: Pricing ── */}
          {step === 3 && (
            <div className="form-panel">
              <h2 className="title-l form-panel-title">Set Your Price & Contact</h2>
              <div className="ai-price-suggestion glass">
                <span className="ai-insight-icon">🤖</span>
                <div>
                  <p className="label-m">AI Price Suggestion</p>
                  <p className="body-m" style={{ marginTop: '0.25rem' }}>
                    Based on your car's specs and current market data, a competitive price range is{' '}
                    <strong style={{ color: 'var(--secondary)' }}>₹{form.year >= 2022 ? '15L – 30L' : form.year >= 2018 ? '8L – 18L' : '3L – 10L'}</strong>
                  </p>
                </div>
              </div>
              <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="car-price">Asking Price (₹) *</label>
                  <input id="car-price" type="number" className={`form-input${errors.price ? ' input-error' : ''}`} placeholder="e.g. 2450000" value={form.price}
                    onChange={(e) => update('price', e.target.value)} />
                  {form.price > 0 && <p className="body-m" style={{ marginTop: '0.375rem', color: 'var(--secondary)' }}>₹{Number(form.price).toLocaleString('en-IN')}</p>}
                  {err('price')}
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.negotiable} onChange={(e) => update('negotiable', e.target.checked)} id="negotiable-check" />
                    <span className="body-m">Price is negotiable</span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="seller-name">Your Name</label>
                  <input id="seller-name" className="form-input" placeholder="Your display name" value={form.sellerName} onChange={(e) => update('sellerName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label-s form-label" htmlFor="seller-phone">WhatsApp Number *</label>
                  <input id="seller-phone" type="tel" className={`form-input${errors.sellerPhone ? ' input-error' : ''}`}
                    placeholder="+91 9876543210" value={form.sellerPhone} onChange={(e) => update('sellerPhone', e.target.value)} />
                  <p className="body-m" style={{ marginTop: '0.25rem', opacity: 0.7 }}>Buyers will contact you on this WhatsApp number</p>
                  {err('sellerPhone')}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div className="form-panel">
              <h2 className="title-l form-panel-title">Review Your Listing</h2>

              {/* Photo preview */}
              {form.photos.length > 0 && (
                <div className="review-photos">
                  {form.photos.slice(0, 4).map((src, idx) => (
                    <img key={idx} src={src} alt={`preview-${idx}`} className="review-photo" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300' }} />
                  ))}
                  {form.photos.length > 4 && <div className="review-photo more-photos">+{form.photos.length - 4}</div>}
                </div>
              )}

              <div className="review-grid">
                {[
                  { label: 'Make', value: form.make },
                  { label: 'Model', value: form.model },
                  { label: 'Year', value: form.year },
                  { label: 'Colour', value: form.color },
                  { label: 'Registration', value: form.registration },
                  { label: 'Ownership', value: form.ownership },
                  { label: 'Fuel Type', value: form.fuelType },
                  { label: 'Transmission', value: form.transmission },
                  { label: 'KM Driven', value: form.mileage ? `${Number(form.mileage).toLocaleString('en-IN')} km` : '' },
                  { label: 'Location', value: form.location },
                  { label: 'Asking Price', value: form.price ? `₹${Number(form.price).toLocaleString('en-IN')}${form.negotiable ? ' (negotiable)' : ''}` : '' },
                  { label: 'WhatsApp', value: form.sellerPhone },
                ].map((r) => r.value ? (
                  <div key={r.label} className="review-item">
                    <span className="label-s">{r.label}</span>
                    <span className="title-m">{r.value}</span>
                  </div>
                ) : null)}
              </div>
              {form.description && (
                <div style={{ marginTop: '1.5rem' }}>
                  <p className="label-s" style={{ marginBottom: '0.5rem' }}>Seller's Note</p>
                  <p className="body-m">{form.description}</p>
                </div>
              )}
              <div className="review-notice glass" style={{ marginTop: '1.5rem' }}>
                <span>💬</span>
                <p className="body-m">After your listing is approved, buyers will contact you directly via WhatsApp at <strong>{form.sellerPhone}</strong>.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-navigation">
            {step > 0 && (
              <button className="btn-secondary" onClick={() => setStep((s) => s - 1)} disabled={submitting}>← Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1 ? (
              <button id="next-step-btn" className="btn-primary" onClick={handleNext} disabled={uploadingPhotos}>Continue →</button>
            ) : (
              <button id="submit-listing-btn" className="btn-primary" onClick={handleSubmit} disabled={submitting || uploadingPhotos}>
                {submitting ? '⏳ Submitting…' : '🚀 Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
