import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setSubmitting(true)
    
    try {
      if (tab === 'signup') {
        const name = email.split('@')[0]
        await signup(email, password, name, role)
        if (role === 'admin') navigate('/admin')
        else navigate('/dashboard')
      } else if (tab === 'login') {
        const u = await login(email, password)
        if (u.role === 'admin') navigate('/admin')
        else navigate('/dashboard')
      } else if (tab === 'admin') {
        const u = await login(email, password)
        if (u.role !== 'admin') {
          throw new Error('Access denied. You are not an administrator.')
        }
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container glass">
        <div className="auth-header">
          <img src="/images/logo.jpg" alt="NoBrokerCars Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', margin: '0 auto' }} />
          <h1 className="headline-m" style={{ marginTop: '1rem' }}>Welcome Back</h1>
          <p className="body-m">Enter your details to proceed.</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            User Login
          </button>
          <button 
            className={`auth-tab ${tab === 'signup' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            Sign Up
          </button>
          <button 
            className={`auth-tab ${tab === 'admin' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('admin'); setError(''); }}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="auth-error-msg" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.15)', border: '1px solid #ff6b6b', color: '#ff8585', fontSize: '0.875rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label-s auth-label">Email Address</label>
            <input 
              type="email" 
              className="auth-input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label-s auth-label">Password</label>
            <input 
              type="password" 
              className="auth-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {tab === 'signup' && (
            <div className="form-group">
              <label className="label-s auth-label">Account Type</label>
              <select 
                className="auth-input" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', borderRadius: '8px', cursor: 'pointer' }}
              >
                <option value="user">User / Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}
          
          <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Please wait...' : (
              <>
                {tab === 'login' && 'Sign In'}
                {tab === 'signup' && 'Create Account'}
                {tab === 'admin' && 'Admin Login'}
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
