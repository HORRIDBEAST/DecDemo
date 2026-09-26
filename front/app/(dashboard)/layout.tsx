'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';
import Footer from '@/components/layout/footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    // overflow-x-hidden guards every page in this layout against the same class of
    // bug fixed on reviews/finance/verify/help: one child rendering wider than the
    // viewport making the whole page horizontally scrollable. Individual pages
    // shouldn't need horizontal scroll, so clipping it here is a safe default.
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">{children}</main>
      </div>
      <Footer />
    </div>
  );
}