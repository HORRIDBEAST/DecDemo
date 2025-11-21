'use client';

import { useClaims } from '@/hooks/use-claims';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimCard } from '@/components/claims/claim-card';
import Link from 'next/link';
import { Button } from '../ui/button';

export function RecentClaims() {
  const { data, error, isLoading } = useClaims(1); // Only fetch page 1

  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }
    if (error) {
      return <p className="text-red-500">Could not load claims: {error.message}</p>;
    }
    if (!data || data.claims.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold">No claims yet!</h3>
          <p className="text-sm text-slate-600">Get started by filing your first claim.</p>
          <Button asChild className="mt-4">
            <Link href="/claims/new">File a New Claim</Link>
          </Button>
        </div>
      );
    }
    
    // Show only the 3 most recent
    return (
      <div className="space-y-4">
        {data.claims.slice(0, 3).map(claim => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    );
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Claims</CardTitle>
          <Link href="/claims" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}