import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService, type AuthUser } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<'signed_in' | 'check_email'>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySessionUser = async (sessionUser: User | null) => {
      const nextUser = sessionUser ? await authService.buildUser(sessionUser) : null;
      if (active) {
        setUser(nextUser);
        setIsLoading(false);
      }
    };

    // The Supabase session is the single source of truth for "signed in".
    // INITIAL_SESSION fires once on load with the stored session (or null).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Supabase warns against awaiting its own calls inside this callback (it can deadlock),
      // so the profile lookup is deferred until after the callback returns
      setTimeout(() => applySessionUser(session?.user ?? null), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { user: authUser, error } = await authService.signIn(email, password);

    if (error) {
      console.error('Login error:', error);
      // Re-throw so the page can show the real reason (e.g. unconfirmed email)
      throw new Error(error);
    }

    if (authUser) {
      setUser(authUser);
      return true;
    }

    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<'signed_in' | 'check_email'> => {
    const { user: authUser, error, needsConfirmation } = await authService.signUp(email, password, name);

    if (error) {
      console.error('Signup error:', error);
      throw new Error(error);
    }

    if (needsConfirmation) {
      return 'check_email';
    }

    if (authUser) {
      setUser(authUser);
      return 'signed_in';
    }

    throw new Error('Registration failed - no user created');
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Re-read the profile, e.g. after the user changes their name
  const refreshUser = async () => {
    setUser(await authService.getCurrentUser());
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
