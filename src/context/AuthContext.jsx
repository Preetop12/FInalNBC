import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserByEmail, upsertUser } from '../lib/db';

const AuthContext = createContext();

const isSupabaseWorking = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder') || key.startsWith('sb_publishable_val')) {
    return false;
  }
  return true;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseWorking()) {
      const localSession = localStorage.getItem('nbc_current_user');
      if (localSession) {
        setUser(JSON.parse(localSession));
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    // 1. Fetch initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from public profiles
          const profile = await getUserByEmail(session.user.email);
          const currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.name || session.user.email.split('@')[0],
            phone: profile?.phone || '',
            role: session.user.email === 'admin@nobrokercars.com' ? 'admin' : (profile?.role || 'user'),
            avatar: profile?.avatar || session.user.email[0].toUpperCase(),
            banned: profile?.banned || false,
          };
          setUser(currentUser);
          localStorage.setItem('nbc_current_user', JSON.stringify(currentUser));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching initial session:', err);
        const localSession = localStorage.getItem('nbc_current_user');
        if (localSession) setUser(JSON.parse(localSession));
      } finally {
        setLoading(false);
      }
    };
    getInitialSession();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getUserByEmail(session.user.email);
        const currentUser = {
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.email.split('@')[0],
          phone: profile?.phone || '',
          role: session.user.email === 'admin@nobrokercars.com' ? 'admin' : (profile?.role || 'user'),
          avatar: profile?.avatar || session.user.email[0].toUpperCase(),
          banned: profile?.banned || false,
        };
        setUser(currentUser);
        localStorage.setItem('nbc_current_user', JSON.stringify(currentUser));
      } else {
        setUser(null);
        localStorage.removeItem('nbc_current_user');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    if (!isSupabaseWorking()) {
      const profiles = JSON.parse(localStorage.getItem('nbc_profiles') || '[]');
      const profile = profiles.find(p => p.email === email);
      
      if (email === 'admin@nobrokercars.com' && password !== 'NBCAdminSecure7789!') {
        throw new Error('Access denied. Invalid administrator password.');
      }
      
      // In local mode, let admin sign in with the default credentials
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Fetch profile
      const profile = await getUserByEmail(email);
      const updatedUser = {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || email.split('@')[0],
        phone: profile?.phone || '',
        role: email === 'admin@nobrokercars.com' ? 'admin' : (profile?.role || 'user'),
        avatar: profile?.avatar || email[0].toUpperCase(),
        banned: profile?.banned || false,
      };
      
      if (updatedUser.banned) {
        await supabase.auth.signOut();
        throw new Error('This account has been banned. Please contact support.');
      }
      
      setUser(updatedUser);
      localStorage.setItem('nbc_current_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('Supabase auth login failed:', err);
      throw err;
    }
  };

  const signup = async (email, password, name, role = 'user') => {
    if (!isSupabaseWorking()) {
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });
      if (error) throw error;
      
      if (data.user) {
        await upsertUser({
          id: data.user.id,
          email,
          name,
          role,
          avatar: email[0].toUpperCase(),
        });
        
        const profile = await getUserByEmail(email);
        const newUser = {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || name,
          phone: profile?.phone || '',
          role: data.user.email === 'admin@nobrokercars.com' ? 'admin' : (profile?.role || role),
          avatar: profile?.avatar || email[0].toUpperCase(),
          banned: false,
        };
        setUser(newUser);
        localStorage.setItem('nbc_current_user', JSON.stringify(newUser));
        return newUser;
      }
      return null;
    } catch (err) {
      console.error('Supabase auth signup failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('nbc_current_user');
    if (!isSupabaseWorking()) {
      setUser(null);
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error logging out from Supabase:', err);
    } finally {
      setUser(null);
    }
  };

  const resetPassword = async (email) => {
    if (!isSupabaseWorking()) {
      alert(`Password reset link sent to ${email} (Local Mock Mode)`);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?tab=reset`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
