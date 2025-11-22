'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Claim, ClaimStatus, ClaimType } from '@/lib/types';
import { ClaimCard } from '@/components/claims/claim-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchAdminClaims = async () => {
      try {
        const data = await api.getAdminClaims(); 
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

  // ✅ Filtering Logic
  const filteredClaims = useMemo(() => {
    let result = [...claims];

    // Status Filter
    if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
            result = result.filter(c => [ClaimStatus.AI_REVIEW, ClaimStatus.HUMAN_REVIEW, ClaimStatus.PROCESSING, ClaimStatus.SUBMITTED].includes(c.status));
        } else {
            result = result.filter(c => c.status === statusFilter);
        }
    }

    // Type Filter
    if (typeFilter !== 'all') {
        result = result.filter(c => c.type === typeFilter);
    }

    // Sort Order
    result.sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === 'amount_desc') return b.requested_amount - a.requested_amount;
        if (sortOrder === 'amount_asc') return a.requested_amount - b.requested_amount;
        return 0;
    });

    return result;
  }, [claims, statusFilter, typeFilter, sortOrder]);

  if (authLoading || loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-slate-500">Total Claims: {filteredClaims.length}</div>
      </div>

      {/* ✅ Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Claims</SelectItem>
                        <SelectItem value="pending">⚠️ Pending Review</SelectItem>
                        <SelectItem value={ClaimStatus.APPROVED}>✅ Approved</SelectItem>
                        <SelectItem value={ClaimStatus.REJECTED}>❌ Rejected</SelectItem>
                        <SelectItem value={ClaimStatus.AI_REVIEW}>🤖 AI Review</SelectItem>
                        <SelectItem value={ClaimStatus.HUMAN_REVIEW}>👤 Human Review</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value={ClaimType.AUTO}>Auto</SelectItem>
                        <SelectItem value={ClaimType.HOME}>Home</SelectItem>
                        <SelectItem value={ClaimType.HEALTH}>Health</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Sort By</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">📅 Newest First</SelectItem>
                        <SelectItem value="oldest">📅 Oldest First</SelectItem>
                        <SelectItem value="amount_desc">💰 Amount (High to Low)</SelectItem>
                        <SelectItem value="amount_asc">💰 Amount (Low to High)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-slate-500">
            No claims found matching filters.
          </div>
        )}
      </div>
    </div>
  );
}