'use client';

import { useState } from 'react';
import { useClaims } from '@/hooks/use-claims'; // Assuming you have this hook
import { ClaimCard } from '@/components/claims/claim-card'; // Assuming you have this component
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function ClaimsListPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useClaims(page); // Using the hook

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      );
    }

    if (error) {
      return <p className="text-red-500">Failed to load claims: {error.message}</p>;
    }

    if (data && data.claims.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold">No claims found</h2>
          <p className="text-slate-600 mt-2">Get started by filing your first claim.</p>
          <Button asChild className="mt-4">
            <Link href="/claims/new">
              <Plus className="mr-2 h-4 w-4" /> File New Claim
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
        <div className="flex justify-between items-center mt-8">
          <Button onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <span>Page {data?.pagination.currentPage} of {data?.pagination.totalPages}</span>
          <Button onClick={() => setPage(p => p + 1)} disabled={page >= (data?.pagination.totalPages || 1)}>
            Next
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Claims</h1>
        <Button asChild>
          <Link href="/claims/new">
            <Plus className="mr-2 h-4 w-4" /> File New Claim
          </Link>
        </Button>
      </div>
      {renderContent()}
    </div>
  );
}