    'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClaimStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, CheckCircle, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getClaimStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Claims"
          value={stats?.total || 0}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="In Review"
          value={(stats?.byStatus.ai_review || 0) + (stats?.byStatus.human_review || 0)}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatsCard
          title="Approved"
          value={stats?.byStatus.approved || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Total Settled"
          value={`$${stats?.totalSettled.toLocaleString() || 0}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Add charts and recent claims here */}
    </div>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

/*
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useClaimStats } from '@/hooks/use-claims';
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/stats-card';
import { RecentClaims } from '@/components/dashboard/recent-claims';
import { ClaimChart } from '@/components/dashboard/claim-chart';
import { FileText, Clock, CheckCircle, DollarSign, XCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, isLoading } = useClaimStats();

  const renderStats = () => {
    if (isLoading) {
      return (
        <>
          {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
        </>
      );
    }
    return (
      <>
        <StatsCard
          title="Total Claims"
          value={stats?.total || 0}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="In Review"
          value={(stats?.byStatus.ai_review || 0) + (stats?.byStatus.human_review || 0) + (stats?.byStatus.processing || 0)}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatsCard
          title="Approved"
          value={(stats?.byStatus.approved || 0) + (stats?.byStatus.settled || 0)}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Total Settled"
          value={`$${stats?.totalSettled.toLocaleString() || 0}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="purple"
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user?.display_name || user?.email}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {renderStats()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentClaims />
        </div>
        <div className="lg:col-span-1">
          <ClaimChart />
        </div>
      </div>
    </div>
  );
}
*/