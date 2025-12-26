'use client';

import { useState, useMemo } from 'react';
import { useClaims } from '@/hooks/use-claims';
import { ClaimCard } from '@/components/claims/claim-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Filter, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass border-border/50">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="glass border-red-200 bg-red-50/50">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 font-medium">Failed to load claims: {error.message}</p>
          </CardContent>
        </Card>
      );
    }

    if (filteredClaims.length === 0 && statusFilter === 'all' && typeFilter === 'all') {
      return (
        <Card className="glass border-border/50">
          <CardContent className="p-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                <Plus className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                No claims found
              </h2>
              <p className="text-muted-foreground">Get started by filing your first claim.</p>
              <Button asChild size="lg" className="mt-4 shadow-lg shadow-primary/25 hover:shadow-primary/40">
                <Link href="/claims/new">
                  <Plus className="mr-2 h-4 w-4" /> File New Claim
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (filteredClaims.length === 0) {
      return (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No claims found matching your filters.</p>
            <p className="text-sm text-muted-foreground/60 mt-2">Try adjusting your filter criteria</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {filteredClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
        
        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <Card className="glass border-border/50 mt-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button 
                  onClick={() => setPage(p => p - 1)} 
                  disabled={page <= 1}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page <span className="text-primary font-bold">{data.pagination.currentPage}</span> of {data.pagination.totalPages}
                </span>
                <Button 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={page >= data.pagination.totalPages}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex-1 text-center md:text-left md:flex md:justify-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent text-center">
                My Claims
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Track and manage all your insurance claims</p>
            </div>
          </div>
          <Link href="/claims/new" className="mx-auto md:mx-0">
            <Button size="lg" className="h-12 px-6 rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all">
              <Plus className="mr-2 h-5 w-5" /> File New Claim
            </Button>
          </Link>
        </div>

        {/* ✅ Filters Bar */}
        <Card className="glass border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Filter & Sort
            </CardTitle>
            <CardDescription>Refine your claims view</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wide">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
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
              <label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wide">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ClaimType.AUTO}>🚗 Auto</SelectItem>
                  <SelectItem value={ClaimType.HOME}>🏠 Home</SelectItem>
                  <SelectItem value={ClaimType.HEALTH}>🏥 Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wide">Sort By</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="h-11 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-500 delay-200">
            <Filter className="h-4 w-4" />
            <span>
              Showing <span className="font-bold text-primary">{filteredClaims.length}</span> of <span className="font-bold">{data.claims.length}</span> claims
            </span>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}