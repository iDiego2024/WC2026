import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { profilesService } from '../services/api';

interface AuthContextType {
  user: any | null; // Supabase raw Auth user
  profile: any | null; // Database profile row
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['dlnscl@gmail.com'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile details and assign admin role if email matches list
  const syncProfile = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      setProfile(null);
      return null;
    }

    try {
      let dbProfile;
      try {
        dbProfile = await profilesService.getProfile(sessionUser.id);
      } catch (err) {
        const displayName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Player';
        const photoUrl = sessionUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sessionUser.id}`;
        dbProfile = await profilesService.updateProfile(sessionUser.id, {
          display_name: displayName,
          photo_url: photoUrl,
          email: sessionUser.email
        });
      }

      // Check for Admin promotion and email sync
      const isTargetAdmin = sessionUser.email && ADMIN_EMAILS.includes(sessionUser.email);
      const currentRole = dbProfile.role || 'user';
      const targetRole = isTargetAdmin ? 'admin' : 'user';
      
      const needsRoleUpdate = currentRole !== targetRole;
      const needsEmailUpdate = sessionUser.email && dbProfile.email !== sessionUser.email;

      if (needsRoleUpdate || needsEmailUpdate) {
        dbProfile = await profilesService.updateProfile(sessionUser.id, {
          role: targetRole,
          email: sessionUser.email
        });
      }

      setProfile(dbProfile);
      return dbProfile;
    } catch (e) {
      console.error('Failed to sync profile in AuthProvider:', e);
      // Fallback fallback profile
      const fallback = {
        id: sessionUser.id,
        email: sessionUser.email,
        display_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
        photo_url: sessionUser.user_metadata?.avatar_url,
        score: 0,
        role: ADMIN_EMAILS.includes(sessionUser.email || '') ? 'admin' : 'user'
      };
      setProfile(fallback);
      return fallback;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await syncProfile(session.user);
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  }, [syncProfile]);

  useEffect(() => {
    // Check initial session
    refreshUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await syncProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, syncProfile]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const isAuthenticated = user !== null;
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
