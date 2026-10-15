import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const isConfigured = isSupabaseConfigured();

  // Fetch or auto-create profile for authenticated user
  const fetchProfile = useCallback(async (currentUser) => {
    if (!currentUser || !isConfigured) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Could not fetch profile from Supabase:', error.message);
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // If no profile exists yet, insert fallback profile record
      const defaultFullName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Zetoco User';
      const defaultUsername = (currentUser.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + currentUser.id.substring(0, 4);

      const newProfile = {
        id: currentUser.id,
        full_name: defaultFullName,
        username: defaultUsername,
        job_title: 'Workspace Member',
        bio: 'Collaborating on Zetoco workspaces.',
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .maybeSingle();

      if (insertError) {
        // In case of table/schema delays or conflict, fall back gracefully
        setProfile(newProfile);
        return newProfile;
      }

      setProfile(insertedData || newProfile);
      return insertedData || newProfile;
    } catch (err) {
      console.warn('Profile fetch/init exception:', err.message);
      return null;
    }
  }, [isConfigured]);

  useEffect(() => {
    let isMounted = true;

    // Retrieve initial session from Supabase
    const initAuth = async () => {
      try {
        if (!isConfigured) {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
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
          const currentUser = initialSession?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser);
          }
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
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isConfigured, fetchProfile]);

  /**
   * User Registration with Email + Password and Full Name metadata
   */
  const signUp = async ({ email, password, fullName }) => {
    setAuthError(null);
    if (!isConfigured) {
      const errorMsg = 'Supabase credentials are not configured in client/.env.';
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

      if (data.user && data.session) {
        await fetchProfile(data.user);
      }

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
      const errorMsg = 'Supabase credentials are not configured in client/.env.';
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
      if (data.user) {
        await fetchProfile(data.user);
      }
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
      setProfile(null);
      return { success: true };
    } catch (err) {
      console.error('Error signing out:', err);
      setUser(null);
      setSession(null);
      setProfile(null);
      return { success: true };
    }
  };

  /**
   * Update Profile data
   */
  const updateProfile = async (updates) => {
    if (!user || !isConfigured) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      setProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const refreshProfile = () => {
    if (user) {
      return fetchProfile(user);
    }
    return Promise.resolve(null);
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    isConfigured,
    authError,
    clearError,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
