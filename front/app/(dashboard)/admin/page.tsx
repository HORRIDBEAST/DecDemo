'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Claim, ClaimStatus, ClaimType } from '@/lib/types';
import { ClaimCard } from '@/components/claims/claim-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, SlidersHorizontal, Filter, AlertTriangle, TrendingUp, Users, FileCheck } from 'lucide-react';

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate stats
  const pendingCount = claims.filter(c => 
    [ClaimStatus.AI_REVIEW, ClaimStatus.HUMAN_REVIEW, ClaimStatus.PROCESSING, ClaimStatus.SUBMITTED].includes(c.status)
  ).length;
  const approvedCount = claims.filter(c => c.status === ClaimStatus.APPROVED).length;
  const totalAmount = claims.reduce((sum, c) => sum + Number(c.requested_amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center gap-3">
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1 text-lg text-center">Monitor and manage all insurance claims</p>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <Card className="glass border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <FileCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                  <h3 className="text-3xl font-bold mt-1">{claims.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <h3 className="text-3xl font-bold mt-1">{pendingCount}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <h3 className="text-3xl font-bold mt-1">${totalAmount.toLocaleString()}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Filters Bar */}
        <Card className="glass border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Filter & Sort
            </CardTitle>
            <CardDescription>Refine the claims view</CardDescription>
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
                  <SelectItem value="pending">⚠️ Pending Review</SelectItem>
                  <SelectItem value={ClaimStatus.SETTLED}>💰 Settled</SelectItem>
                  <SelectItem value={ClaimStatus.REJECTED}>❌ Rejected</SelectItem>
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
        {filteredClaims.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-500 delay-300">
            <Filter className="h-4 w-4" />
            <span>
              Showing <span className="font-bold text-primary">{filteredClaims.length}</span> of <span className="font-bold">{claims.length}</span> claims
            </span>
          </div>
        )}

        {/* Claims Grid */}
        {filteredClaims.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {filteredClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        ) : (
          <Card className="glass border-border/50 animate-in fade-in duration-700 delay-300">
            <CardContent className="p-16 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                  <Filter className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  No claims found
                </h2>
                <p className="text-muted-foreground">No claims match your current filters.</p>
                <p className="text-sm text-muted-foreground/60">Try adjusting your filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}