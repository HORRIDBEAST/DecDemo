'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api'; // You'll need to update api.ts (step 4)
import { Claim } from '@/lib/types';
import { ClaimCard } from '@/components/claims/claim-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Security redirect if not admin
    if (!authLoading && user?.role !== 'admin') {
      console.log('User is not admin, redirecting...', user); // Add logging
      router.push('/dashboard');
      return;
    }

    const fetchAdminClaims = async () => {
      try {
        console.log('Fetching admin claims...'); // Add logging
        const data = await api.getAdminClaims(); 
        console.log('Received claims:', data); // Add logging
        setClaims(data);
      } catch (error) {
        console.error('Failed to fetch admin claims', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchAdminClaims();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {claims.length > 0 ? (
          claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))
        ) : (
          <p className="text-slate-500">No claims pending review.</p>
        )}
      </div>
    </div>
  );
}