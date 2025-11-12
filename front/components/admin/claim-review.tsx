// components/admin/claim-review.tsx
'use client';
// This component would be rendered on a page like /admin/claims/[id]
// It's similar to ClaimDetails but with action buttons.
import { Claim } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButtons } from './action-buttons';

interface ClaimReviewProps {
  claim: Claim;
  onUpdate: () => void;
}

export function ClaimReview({ claim, onUpdate }: ClaimReviewProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        {/* You would put the full ClaimDetails component here */}
        <Card>
          <CardHeader><CardTitle>Claim Details (Admin View)</CardTitle></CardHeader>
          <CardContent>
            <p><strong>User ID:</strong> {claim.user_id}</p>
            <p><strong>Status:</strong> {claim.status}</p>
            <p><strong>Requested:</strong> ${claim.requested_amount}</p>
            <h4 className="font-bold mt-4">AI Assessment:</h4>
            <pre className="bg-slate-100 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(claim.ai_assessment, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-1">
        <ActionButtons claim={claim} onUpdate={onUpdate} />
      </div>
    </div>
  );
}