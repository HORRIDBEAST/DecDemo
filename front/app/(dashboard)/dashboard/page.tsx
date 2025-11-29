'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClaimStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, CheckCircle, DollarSign, BanknoteArrowUp, BanknoteArrowDown } from 'lucide-react';

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
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
          title="Total Requested"
          value={`$${stats?.totalRequested.toLocaleString() || 0}`} // ✅ Corrected variable
          icon={<BanknoteArrowUp  className="h-5 w-5" />}
          color="purple"
        />
       <StatsCard
          title="Approved Amount"
          value={`$${stats?.totalApproved.toLocaleString() || 0}`}
          icon={<BanknoteArrowDown className="h-5 w-5" />}
          color="green"
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

