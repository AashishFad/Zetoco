import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;

    // Retrieve initial session from Supabase
    const initAuth = async () => {
      try {
        if (!isConfigured) {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error retrieving initial Supabase session:', error.message);
        }

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isConfigured]);

  /**
   * User Registration with Email + Password and Full Name metadata
   */
  const signUp = async ({ email, password, fullName }) => {
    setAuthError(null);
    if (!isConfigured) {
      const errorMsg = 'Supabase credentials are not configured in client/.env. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      // Check if user was created and whether email confirmation is required
      // If session is null but user exists, email confirmation is required by Supabase project
      const needsEmailConfirmation = data.user && !data.session;

      return {
        success: true,
        user: data.user,
        session: data.session,
        needsEmailConfirmation,
      };
    } catch (err) {
      const message = err.message || 'An unexpected error occurred during registration.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * User Sign In with Email + Password
   */
  const signIn = async ({ email, password }) => {
    setAuthError(null);
    if (!isConfigured) {
      const errorMsg = 'Supabase credentials are not configured in client/.env. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let friendlyMessage = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          friendlyMessage = 'Invalid email or password.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          friendlyMessage = 'Please verify your email address before signing in.';
        }
        setAuthError(friendlyMessage);
        return { success: false, error: friendlyMessage };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      const message = err.message || 'An unexpected network error occurred.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * User Sign Out
   */
  const signOut = async () => {
    setAuthError(null);
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      console.error('Error signing out:', err);
      // Still clear local state on error
      setUser(null);
      setSession(null);
      return { success: true };
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
    isConfigured,
    authError,
    clearError,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
