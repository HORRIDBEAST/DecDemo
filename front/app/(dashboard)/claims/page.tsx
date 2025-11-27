'use client';

import { useState, useMemo } from 'react';
import { useClaims } from '@/hooks/use-claims';
import { ClaimCard } from '@/components/claims/claim-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ClaimStatus, ClaimType } from '@/lib/types';

export default function ClaimsListPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useClaims(page);
  
  // ✅ Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // ✅ Filtering & Sorting Logic
  const filteredClaims = useMemo(() => {
    if (!data?.claims) return [];
    
    let result = [...data.claims];

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        result = result.filter(c => [
          ClaimStatus.AI_REVIEW, 
          ClaimStatus.HUMAN_REVIEW, 
          ClaimStatus.PROCESSING, 
          ClaimStatus.SUBMITTED
        ].includes(c.status));
      } else if (statusFilter === 'draft') {
        result = result.filter(c => c.status === ClaimStatus.DRAFT);
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
  }, [data?.claims, statusFilter, typeFilter, sortOrder]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      );
    }

    if (error) {
      return <p className="text-red-500">Failed to load claims: {error.message}</p>;
    }

    if (filteredClaims.length === 0 && statusFilter === 'all' && typeFilter === 'all') {
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

    if (filteredClaims.length === 0) {
      return (
        <div className="text-center py-10 text-slate-500">
          No claims found matching your filters.
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClaims.map((claim) => (
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

      {/* ✅ Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Claims</SelectItem>
                <SelectItem value="draft">📝 Draft</SelectItem>
                <SelectItem value="pending">⚠️ Pending Review</SelectItem>
                <SelectItem value={ClaimStatus.APPROVED}>✅ Approved</SelectItem>
                <SelectItem value={ClaimStatus.REJECTED}>❌ Rejected</SelectItem>
                <SelectItem value={ClaimStatus.SETTLED}>💰 Settled</SelectItem>
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
                <SelectItem value={ClaimType.AUTO}>🚗 Auto</SelectItem>
                <SelectItem value={ClaimType.HOME}>🏠 Home</SelectItem>
                <SelectItem value={ClaimType.HEALTH}>🏥 Health</SelectItem>
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

      {/* ✅ Results Count */}
      {!isLoading && data?.claims && (
        <div className="text-sm text-slate-500">
          Showing {filteredClaims.length} of {data.claims.length} claims
        </div>
      )}

      {renderContent()}
    </div>
  );
}