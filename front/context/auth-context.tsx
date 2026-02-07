'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api, setAuthToken } from '@/lib/api'; 
import { useRouter, usePathname } from 'next/navigation'; // <--- ADD usePathname
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, firstName?: string, lastName?: string, age?: number) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // <--- Get current path

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Don't set loading to true immediately on every event to prevent UI flickering on tab switch
        if (event === 'INITIAL_SESSION') setLoading(true); 
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session) {
            setAuthToken(session.access_token);
            try {
              // Optimistic check: If we already have a user and the ID matches, don't re-fetch
              // This prevents unnecessary API calls on tab focus
              if (!user || user.id !== session.user.id) {
                  const { user: backendUser } = await api.login(session.access_token);
                  setUser(backendUser);
              }

              // --- CRITICAL FIX START ---
              // Only redirect to dashboard if we are on strictly auth pages
              // Removed '/' so logged-in users can visit homepage and see "Go to Dashboard" button
              const publicRoutes = ['/login', '/signup'];
              if (event === 'SIGNED_IN' && publicRoutes.includes(pathname)) {
                router.push('/dashboard');
              }
              // If we are on /claims/new or homepage, DO NOTHING. Let the user stay there.
              // --- CRITICAL FIX END ---

            } catch (e) {
              console.error("Backend login/verify failed", e);
              // Only sign out if it's a hard auth error, otherwise it might just be network
              // await supabase.auth.signOut(); 
            }
          } else {
            // No session
            setUser(null);
            setAuthToken(null);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // ✅ Handle automatic token refresh
          if (session) {
            setAuthToken(session.access_token);
            console.log('🔄 Token refreshed automatically');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthToken(null);
          router.push('/login');
        }
        
        setLoading(false);
      }
    );

    // ✅ Refresh session when user returns to tab (after inactivity)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          // Check if token is close to expiry (within 5 minutes)
          const expiresAt = session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - now;
          
          if (timeUntilExpiry < 300) { // Less than 5 minutes
            console.log('⏰ Token expiring soon, refreshing...');
            await supabase.auth.refreshSession();
          }
        } else if (error) {
          console.error('Session expired, please log in again');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, pathname, user]); // Add dependencies

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, firstName?: string, lastName?: string, age?: number) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          age: age,
          display_name: firstName && lastName ? `${firstName} ${lastName}` : firstName || ''
        }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};