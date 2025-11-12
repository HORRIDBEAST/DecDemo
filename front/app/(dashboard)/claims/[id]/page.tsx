// app/(dashboard)/claims/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useClaim } from '@/hooks/use-claims';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect } from 'react';
import { ClaimDetails } from '@/components/claims/claim-details';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ClaimDetailPage() {
  const params = useParams();
  const claimId = params.id as string;
  const { user } = useAuth();
  
  // 1. Fetch claim data
  const { claim, error, isLoading, mutate } = useClaim(claimId);

  // 2. Connect to WebSocket
  const socket = useWebSocket(user?.id);

  // 3. Listen for live updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { claimId: string, status: string }) => {
      if (data.claimId === claimId) {
        toast.info(`Your claim status has been updated to: ${data.status.toUpperCase()}`);
        mutate(); // Re-fetch claim data
      }
    };

    const handleTxUpdate = (data: { claimId: string, txHash: string }) => {
      if (data.claimId === claimId) {
        toast.success('Blockchain transaction confirmed!', {
          description: 'Your claim has been recorded on-chain.',
        });
        mutate(); // Re-fetch claim data
      }
    };

    socket.on('claimStatusUpdate', handleStatusUpdate);
    socket.on('blockchainTransaction', handleTxUpdate);

    return () => {
      socket.off('claimStatusUpdate', handleStatusUpdate);
      socket.off('blockchainTransaction', handleTxUpdate);
    };
  }, [socket, claimId, mutate]);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (error) {
    return <p className="text-red-500">Error loading claim: {error.message}</p>;
  }

  if (!claim) {
    return <p>Claim not found.</p>;
  }

  // Pass the data and the 'mutate' function to the details component
  return <ClaimDetails claim={claim} onClaimUpdate={mutate} />;
}