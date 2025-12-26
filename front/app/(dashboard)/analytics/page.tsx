'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClaimStats } from '@/hooks/use-claims';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const { stats, isLoading } = useClaimStats();

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const typeData = [
    { name: 'Auto', value: stats?.byType.auto || 0, color: '#3b82f6' },
    { name: 'Home', value: stats?.byType.home || 0, color: '#10b981' },
    { name: 'Health', value: stats?.byType.health || 0, color: '#f59e0b' },
  ];

  const statusData = [
    { name: 'Approved', value: stats?.byStatus.approved || 0 },
    { name: 'Rejected', value: stats?.byStatus.rejected || 0 },
    { name: 'Processing', value: (stats?.byStatus.processing || 0) + (stats?.byStatus.ai_review || 0) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Analytics & Insights</h1>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Total Value Requested</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">${stats?.totalRequested.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Total Value Settled</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">${stats?.totalSettled.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Approval Rate</CardTitle></CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                    {stats?.total ? ((stats.byStatus.approved / stats.total) * 100).toFixed(1) : 0}%
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader><CardTitle>Claims by Category</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-sm">
                    {typeData.map(t => <div key={t.name} className="flex items-center"><div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: t.color}}/>{t.name}</div>)}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}