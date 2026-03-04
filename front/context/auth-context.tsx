'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api, setAuthToken } from '@/lib/api'; 
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, firstName?: string, lastName?: string, age?: number) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Session expiry constants
  const INACTIVITY_LIMIT = 4 * 24 * 60 * 60 * 1000; // 4 days
  const ABSOLUTE_LIMIT = 7 * 24 * 60 * 60 * 1000; // 7 days
  const UPDATE_THROTTLE = 60 * 1000; // 1 minute

  // Helper function to check if session should be expired
  const shouldExpireSession = () => {
    const lastActivity = localStorage.getItem('lastActivity');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    const now = Date.now();

    const isInactive = lastActivity && (now - parseInt(lastActivity) > INACTIVITY_LIMIT);
    const isAbsoluteExpired = loginTimestamp && (now - parseInt(loginTimestamp) > ABSOLUTE_LIMIT);

    return { isInactive, isAbsoluteExpired, shouldExpire: !!(isInactive || isAbsoluteExpired) };
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Don't set loading to true immediately on every event to prevent UI flickering on tab switch
        if (event === 'INITIAL_SESSION') setLoading(true);

        // ⚠️ CRITICAL: Check custom session expiry BEFORE processing any auth events
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          const { isInactive, isAbsoluteExpired, shouldExpire } = shouldExpireSession();
          
          if (shouldExpire) {
            console.log('🚫 Session expired - preventing token refresh');
            
            // Clear timestamps and sign out
            localStorage.removeItem('lastActivity');
            localStorage.removeItem('loginTimestamp');
            await supabase.auth.signOut();
            
            // Show specific message
            if (isInactive) {
              toast.info("Your session expired due to inactivity (4 days). Please log in again.");
            } else if (isAbsoluteExpired) {
              toast.info("For your security, sessions expire after 7 days. Please log in again.");
            }
            
            setLoading(false);
            router.push('/login');
            return; // Stop processing this event
          }
        }
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session) {
            setAuthToken(session.access_token);
            
            // Set login timestamp on fresh sign-in
            if (event === 'SIGNED_IN') {
              localStorage.setItem('loginTimestamp', Date.now().toString());
              localStorage.setItem('lastActivity', Date.now().toString());
            }
            
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
          // ✅ Token refresh allowed (passed expiry checks above)
          if (session) {
            setAuthToken(session.access_token);
            console.log('✅ Token refreshed (session still valid)');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthToken(null);
          // Clear session tracking timestamps
          localStorage.removeItem('loginTimestamp');
          localStorage.removeItem('lastActivity');
          router.push('/login');
        }
        
        setLoading(false);
      }
    );

    // ✅ Check session validity when user returns to tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // First check our custom expiry rules
        const { isInactive, isAbsoluteExpired, shouldExpire } = shouldExpireSession();
        
        if (shouldExpire) {
          console.log('🚫 Session expired on tab focus');
          localStorage.removeItem('lastActivity');
          localStorage.removeItem('loginTimestamp');
          await supabase.auth.signOut();
          
          if (isInactive) {
            toast.info("Your session expired due to inactivity (4 days). Please log in again.");
          } else if (isAbsoluteExpired) {
            toast.info("For your security, sessions expire after 7 days. Please log in again.");
          }
          return;
        }

        // If session is still valid, check Supabase token expiry
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
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

  // Activity tracking useEffect
  useEffect(() => {
    if (!user) return;

    let lastUpdateTime = Date.now();

    // Mark the absolute login time if it's a fresh login
    if (!localStorage.getItem('loginTimestamp')) {
      localStorage.setItem('loginTimestamp', Date.now().toString());
    }
    
    // Set initial activity
    localStorage.setItem('lastActivity', Date.now().toString());

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastUpdateTime > UPDATE_THROTTLE) {
        localStorage.setItem('lastActivity', now.toString());
        lastUpdateTime = now;
      }
    };

    const checkSessionValidity = async () => {
      const { isInactive, isAbsoluteExpired, shouldExpire } = shouldExpireSession();

      if (shouldExpire) {
        console.log('⏰ Periodic check: Session expired');
        
        // Clear storage and sign out
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('loginTimestamp');
        await supabase.auth.signOut();
        
        // Show specific message based on why they were logged out
        if (isInactive) {
          toast.info("Your session expired due to inactivity (4 days). Please log in again.");
        } else if (isAbsoluteExpired) {
          toast.info("For your security, sessions expire after 7 days. Please log in again.");
        }
        
        router.push('/login');
      }
    };

    // Listen for user interactions
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('keypress', updateActivity);

    // Check validity every 5 minutes
    const intervalId = setInterval(checkSessionValidity, 5 * 60 * 1000);
    
    // Check immediately when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSessionValidity();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [user, router]);

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
    // Clear session tracking timestamps
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('lastActivity');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
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