// components/dashboard/recent-claims.tsx
'use client';

import { useClaims } from '@/hooks/use-claims';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimCard } from '@/components/claims/claim-card';
import Link from 'next/link';

export function RecentClaims() {
  const { data, error, isLoading } = useClaims(1); // Only fetch page 1

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-48 w-full" />;
    }
    if (error) {
      return <p className="text-red-500">Could not load claims.</p>;
    }
    if (!data || data.claims.length === 0) {
      return <p>No recent claims found.</p>;
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