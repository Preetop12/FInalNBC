// AuthContext.jsx — MongoDB & Local Authentication Context
import { createContext, useContext, useState, useEffect } from 'react';
import { mongoFetch, isMongoConfigured } from '../lib/mongodb';
import { getUserByEmail, upsertUser } from '../lib/db';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve current logged in session from localStorage
    const localSession = localStorage.getItem('nbc_current_user');
    if (localSession) {
      setUser(JSON.parse(localSession));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // 1. Local storage mock fallback
    if (!isMongoConfigured()) {
      const profiles = JSON.parse(localStorage.getItem('nbc_profiles') || '[]');
      const profile = profiles.find(p => p.email === email);
      
      if (email === 'admin@nobrokercars.com' && password !== 'NBCAdminSecure7789!') {
        throw new Error('Access denied. Invalid administrator password.');
      }
      
      if (email === 'admin@nobrokercars.com' && password === 'NBCAdminSecure7789!') {
        const adminUser = {
          id: 'admin-id',
          email: 'admin@nobrokercars.com',
          name: 'NBC Admin',
          phone: '919999999999',
          role: 'admin',
          avatar: 'A',
          banned: false
        };
        setUser(adminUser);
        localStorage.setItem('nbc_current_user', JSON.stringify(adminUser));
        return adminUser;
      }
      
      if (!profile) {
        throw new Error('User not found. Please sign up first.');
      }
      if (profile.banned) {
        throw new Error('This account has been banned. Please contact support.');
      }
      
      const loggedUser = {
        id: profile.id || Math.random().toString(36).slice(2, 10),
        email: profile.email,
        name: profile.name,
        phone: profile.phone || '',
        role: profile.role || 'user',
        avatar: profile.avatar || profile.email[0].toUpperCase(),
        banned: profile.banned || false
      };
      
      setUser(loggedUser);
      localStorage.setItem('nbc_current_user', JSON.stringify(loggedUser));
      return loggedUser;
    }

    // 2. Live MongoDB Auth check
    try {
      const response = await mongoFetch('findOne', 'profiles', {
        filter: { email: email }
      });
      const profile = response?.document;
      
      if (!profile) {
        // Fallback check to default admin credentials
        if (email === 'admin@nobrokercars.com' && password === 'NBCAdminSecure7789!') {
          const adminUser = {
            id: 'admin-id',
            email: 'admin@nobrokercars.com',
            name: 'NBC Admin',
            phone: '919999999999',
            role: 'admin',
            avatar: 'A',
            banned: false
          };
          // Create the admin profile in MongoDB
          await upsertUser(adminUser);
          setUser(adminUser);
          localStorage.setItem('nbc_current_user', JSON.stringify(adminUser));
          return adminUser;
        }
        throw new Error('User not found. Please register first.');
      }

      if (profile.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      if (profile.banned) {
        throw new Error('This account has been banned. Please contact support.');
      }

      const loggedUser = {
        id: profile.id || profile._id || Math.random().toString(36).slice(2, 10),
        email: profile.email,
        name: profile.name,
        phone: profile.phone || '',
        role: profile.role || 'user',
        avatar: profile.avatar || profile.email[0].toUpperCase(),
        banned: profile.banned || false
      };
      
      setUser(loggedUser);
      localStorage.setItem('nbc_current_user', JSON.stringify(loggedUser));
      return loggedUser;
    } catch (err) {
      console.error('MongoDB login error:', err);
      throw err;
    }
  };

  const signup = async (email, password, name, role = 'user') => {
    // 1. Local storage mock fallback
    if (!isMongoConfigured()) {
      const profiles = JSON.parse(localStorage.getItem('nbc_profiles') || '[]');
      const existing = profiles.find(p => p.email === email);
      if (existing) {
        throw new Error('User already exists with this email address.');
      }
      
      const newProfile = {
        id: Math.random().toString(36).slice(2, 10),
        email,
        name,
        phone: '',
        role,
        avatar: email[0].toUpperCase(),
        joined_at: new Date().toISOString(),
        banned: false
      };
      
      profiles.push(newProfile);
      localStorage.setItem('nbc_profiles', JSON.stringify(profiles));
      
      const newUser = {
        id: newProfile.id,
        email: newProfile.email,
        name: newProfile.name,
        phone: newProfile.phone,
        role: newProfile.role,
        avatar: newProfile.avatar,
        banned: false
      };
      
      setUser(newUser);
      localStorage.setItem('nbc_current_user', JSON.stringify(newUser));
      return newUser;
    }

    // 2. Live MongoDB Signup
    try {
      const checkResponse = await mongoFetch('findOne', 'profiles', {
        filter: { email: email }
      });
      if (checkResponse?.document) {
        throw new Error('User already exists with this email address.');
      }

      const uid = Math.random().toString(36).slice(2, 10);
      const newProfile = {
        id: uid,
        email,
        password, // stored securely/plain for Atlas Data API demo
        name,
        phone: '',
        role,
        avatar: email[0].toUpperCase(),
        joined_at: new Date().toISOString(),
        banned: false
      };

      await mongoFetch('insertOne', 'profiles', {
        document: newProfile
      });

      const newUser = {
        id: uid,
        email,
        name,
        phone: '',
        role,
        avatar: email[0].toUpperCase(),
        banned: false
      };

      setUser(newUser);
      localStorage.setItem('nbc_current_user', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      console.error('MongoDB signup error:', err);
      throw err;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('nbc_current_user');
  };

  const resetPassword = async (email) => {
    alert(`Password reset link sent to ${email} (Mock Mode)`);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
