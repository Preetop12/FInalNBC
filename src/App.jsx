import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CarListingPage from './pages/CarListingPage'
import CarDetailPage from './pages/CarDetailPage'
import AIAssistantPage from './pages/AIAssistantPage'
import UserDashboardPage from './pages/UserDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AddCarPage from './pages/AddCarPage'
import AuthPage from './pages/AuthPage'
import ContactPage from './pages/ContactPage'

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--surface)' }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/buy" element={<CarListingPage />} />
            <Route path="/car/:carId" element={<CarDetailPage />} />
            <Route path="/ai" element={<AIAssistantPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* Protected Routes */}
            <Route path="/sell" element={
              <ProtectedRoute>
                <AddCarPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
