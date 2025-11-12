// components/dashboard/claim-chart.tsx
'use "client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useClaimStats } from '@/hooks/use-claims';
import { Skeleton } from '../ui/skeleton';

export function ClaimChart() {
  const { stats, isLoading } = useClaimStats();

  const data = [
    { name: 'Auto', count: stats?.byType.auto || 0 },
    { name: 'Home', count: stats?.byType.home || 0 },
    { name: 'Health', count: stats?.byType.health || 0 },
  ];

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Claims by Type</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} />
            <YAxis stroke="#888888" fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}