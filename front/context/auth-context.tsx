// 'use client';

// import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRouter } from 'next/navigation';
// import { api, setAuthToken } from '@/lib/api';
// import { User } from '@/lib/types';

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, pass: string) => Promise<void>;
//   signUp: (email: string, pass: string) => Promise<void>;
//   signOut: () => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     const checkUser = async () => {
//       setLoading(true);
//       const { data: { session } } = await supabase.auth.getSession();

//       if (session) {
//         setAuthToken(session.access_token);
//         try {
//           const { user: backendUser } = await api.verify();
//           setUser(backendUser);
//         } catch (e) {
//           console.error('Token verification failed', e);
//           await supabase.auth.signOut();
//           setUser(null);
//           setAuthToken(null);
//         }
//       } else {
//         setUser(null);
//         setAuthToken(null);
//       }
//       setLoading(false);
//     };

//     checkUser();

//     const { data: authListener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setLoading(true);
//         if (event === 'SIGNED_IN' && session) {
//           setAuthToken(session.access_token);
//           try {
//             const { user: backendUser } = await api.login(session.access_token);
//             setUser(backendUser);
//             router.push('/dashboard');
//           } catch (e) {
//             console.error("Backend login failed", e);
//             await supabase.auth.signOut();
//           }
//         } else if (event === 'SIGNED_OUT') {
//           setUser(null);
//           setAuthToken(null);
//           router.push('/login');
//         }
//         setLoading(false);
//       }
//     );

//     return () => authListener.subscription.unsubscribe();
//   }, [router]);

//   const signIn = async (email: string, pass: string) => {
//     const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
//     if (error) throw error;
//   };

//   const signUp = async (email: string, pass: string) => {
//     const { error } = await supabase.auth.signUp({ email, password: pass });
//     if (error) throw error;
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) throw error;
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api, setAuthToken } from '@/lib/api'; 
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types'; // Import your User type

interface AuthContextType {
  user: User | null; // Use the correct type
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading on init
  const router = useRouter();

  useEffect(() => {
    // onAuthStateChange fires on page load with 'INITIAL_SESSION',
    // on new sign-ins with 'SIGNED_IN', and on sign-outs with 'SIGNED_OUT'.
    // It's the only listener we need.
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        // This handles both new sign-ins and existing sessions
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session) {
            setAuthToken(session.access_token);
            try {
              // This is now our single point of entry.
              // api.login() will "get or create" the user.
              const { user: backendUser } = await api.login(session.access_token);
              setUser(backendUser);
              
              // Only redirect on a *new* sign-in
              if (event === 'SIGNED_IN') {
                router.push('/dashboard');
              }
            } catch (e) {
              console.error("Backend login/verify failed", e);
              // If backend login fails, force a Supabase sign-out
              await supabase.auth.signOut();
              setUser(null);
              setAuthToken(null);
            }
          } else {
            // This handles 'INITIAL_SESSION' with no user
            setUser(null);
            setAuthToken(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthToken(null);
          router.push('/login');
        }
        
        setLoading(false); // Auth check is complete
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
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

// ... useAuth hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};