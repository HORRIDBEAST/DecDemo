// components/admin/action-buttons.tsx
'use client';

import { useState } from 'react';
import { Claim, ClaimStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  claim: Claim;
  onUpdate: () => void;
}

export function ActionButtons({ claim, onUpdate }: ActionButtonsProps) {
  const [amount, setAmount] = useState(claim.ai_assessment?.recommendedAmount || claim.approved_amount || 0);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState<null | 'approve' | 'reject'>(null);

  const canTakeAction = claim.status === ClaimStatus.AI_REVIEW || claim.status === ClaimStatus.HUMAN_REVIEW;

  const handleApprove = async () => {
    setIsLoading('approve');
    try {
      await api.approveClaim(claim.id, amount);
      toast.success('Claim Approved!');
      onUpdate();
    } catch (error: any) {
      toast.error(`Failed to approve: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };
  
  const handleReject = async () => {
    if (!reason) {
      toast.error('A reason is required to reject a claim.');
      return;
    }
    setIsLoading('reject');
    try {
      await api.rejectClaim(claim.id, reason);
      toast.success('Claim Rejected!');
      onUpdate();
    } catch (error: any) {
      toast.error(`Failed to reject: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  if (!canTakeAction) {
    return (
      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">No actions available for claim in "{claim.status}" status.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="approveAmount">Approve Amount</Label>
          <Input 
            id="approveAmount" 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <Button 
          className="w-full" 
          disabled={isLoading !== null}
          onClick={handleApprove}
        >
          {isLoading === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Approve'}
        </Button>
        
        <hr />
        
        <div>
          <Label htmlFor="rejectReason">Rejection Reason</Label>
          <Input 
            id="rejectReason" 
            placeholder="e.g., Suspected fraud"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button 
          variant="destructive" 
          className="w-full"
          disabled={isLoading !== null || !reason}
          onClick={handleReject}
        >
          {isLoading === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reject'}
        </Button>
      </CardContent>
    </Card>
  );
}