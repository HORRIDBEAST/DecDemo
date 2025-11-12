// components/claims/claim-card.tsx
import Link from 'next/link';
import { Claim } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from './claim-status-badge';
import { ArrowRight } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
}

export function ClaimCard({ claim }: ClaimCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg capitalize">{claim.type} Claim</CardTitle>
          <ClaimStatusBadge status={claim.status} />
        </div>
        <CardDescription>
          {new Date(claim.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${claim.requested_amount.toLocaleString()}</p>
        <p className="text-slate-600 truncate mt-2">{claim.description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/claims/${claim.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}