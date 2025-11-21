import useSWR from 'swr';
import { api } from '@/lib/api';
import { Claim, ClaimStats, PaginatedResponse } from '@/lib/types';
import type { SWRConfiguration, BareFetcher } from 'swr'; // Import helper types

// The fetcher function for SWR
// We type it as 'any' here because the hooks will provide the specific types
const fetcher: BareFetcher<any> = (url: string) => {
  if (url.includes('/claims/stats')) {
    return api.getClaimStats();
  }
  if (url.includes('/claims/')) {
    const id = url.split('/claims/')[1];
    return api.getClaimById(id);
  }
  if (url.includes('/claims?')) {
    const params = new URLSearchParams(url.split('?')[1]);
    return api.getClaims(Number(params.get('page')) || 1);
  }
  throw new Error('Unknown API route');
};

// Hook to get a single claim
export const useClaim = (id: string | null) => {
  // FIX: Explicitly tell SWR to expect a 'Claim' or 'null'
  const { data, error, mutate, isLoading } = useSWR<Claim>(
    id ? `/claims/${id}` : null, 
    fetcher
  );
  return { claim: data, error, isLoading, mutate };
};

// Hook to get the paginated list of claims
export const useClaims = (page: number) => {
  // FIX: Explicitly tell SWR to expect 'PaginatedResponse<Claim>'
  const { data, error, isLoading } = useSWR<PaginatedResponse<Claim>>(
    `/claims?page=${page}`, 
    fetcher
  );
  return { data, error, isLoading };
};

// Hook to get dashboard stats
export const useClaimStats = () => {
  // FIX: Explicitly tell SWR to expect 'ClaimStats'
  const { data, error, isLoading } = useSWR<ClaimStats>(
    '/claims/stats', 
    fetcher
  );
  return { stats: data, error, isLoading };
};