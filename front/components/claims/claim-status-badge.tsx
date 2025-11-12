// components/claims/claim-status-badge.tsx
import { ClaimStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  status: ClaimStatus;
}

const statusColors: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'bg-slate-100 text-slate-600',
  [ClaimStatus.SUBMITTED]: 'bg-blue-100 text-blue-600',
  [ClaimStatus.PROCESSING]: 'bg-blue-100 text-blue-600 animate-pulse',
  [ClaimStatus.AI_REVIEW]: 'bg-purple-100 text-purple-600',
  [ClaimStatus.HUMAN_REVIEW]: 'bg-yellow-100 text-yellow-600',
  [ClaimStatus.APPROVED]: 'bg-green-100 text-green-600',
  [ClaimStatus.REJECTED]: 'bg-red-100 text-red-600',
  [ClaimStatus.SETTLED]: 'bg-green-100 text-green-700 font-bold',
};

export function ClaimStatusBadge({ status }: Props) {
  return (
    <Badge className={cn('capitalize', statusColors[status])}>
      {status.replace('_', ' ')}
    </Badge>
  );
}