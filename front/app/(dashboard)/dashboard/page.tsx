'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ClaimStats, Claim, ClaimStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Clock, CheckCircle, Banknote, TrendingUp, 
  Zap, AlertTriangle, ArrowRight, Brain, Activity, Shield,
  Lightbulb, Newspaper, DollarSign, Sparkles, BarChart3, Plus
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, claimsData, notesData, newsData] = await Promise.all([
          api.getClaimStats(),
          api.getClaims(1, 5),
          api.getNotifications(),
          api.getFinanceNews('insurance market trends')
        ]);

        setStats(statsData);
        setRecentClaims(claimsData.claims || []);
        setNotifications(notesData.slice(0, 5) || []);
        setMarketNews(newsData.slice(0, 4) || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Centered Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex-1 text-center md:text-left md:flex md:justify-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-center">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Welcome back! Here's an overview of your claims</p>
            </div>
          </div>
          <Link href="/claims/new" className="mx-auto md:mx-0">
            <Button size="lg" className="h-12 px-6 rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all">
              <Plus className="mr-2 h-5 w-5" /> File New Claim
            </Button>
          </Link>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Total Claims"
            value={stats?.total || 0}
            icon={FileText}
            color="blue"
            trend="+12%"
          />
          <StatsCard
            title="In Review"
            value={(stats?.byStatus.ai_review || 0) + (stats?.byStatus.human_review || 0)}
            icon={Clock}
            color="yellow"
            subtext="AI Processing"
          />
          <StatsCard
            title="Approved"
            value={stats?.byStatus.approved || 0}
            icon={CheckCircle}
            color="green"
            trend="+5%"
          />
          <StatsCard
            title="Total Approved"
            value={`$${(stats?.totalApproved || 0).toLocaleString()}`}
            icon={DollarSign}
            color="green"
            subtext="Payout Amount"
          />
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* A) Recent Claims */}
            <Card className="glass border-border/50 shadow-sm hover:border-primary/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Claims</CardTitle>
                  <CardDescription>Your latest submissions and their status</CardDescription>
                </div>
                <Link href="/claims">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentClaims.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No claims found.</p>
                  ) : (
                    recentClaims.map((claim) => (
                      <div key={claim.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            claim.type === 'auto' ? 'bg-blue-100 text-blue-600' :
                            claim.type === 'home' ? 'bg-green-100 text-green-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {claim.type === 'auto' && <Zap className="h-5 w-5" />}
                            {claim.type === 'home' && <Shield className="h-5 w-5" />}
                            {claim.type === 'health' && <Activity className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{claim.description.substring(0, 40)}...</p>
                            <p className="text-xs text-muted-foreground">{new Date(claim.created_at).toLocaleDateString()} • {claim.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">${parseFloat(claim.requested_amount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Requested</p>
                          </div>
                          <ClaimStatusBadge status={claim.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* D) Market Pulse (Finance API) */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" /> Market Pulse
                </CardTitle>
                <CardDescription>Real-time insurance and financial trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {marketNews.length > 0 ? marketNews.map((news, i) => (
                    <a key={i} href={news.url} target="_blank" rel="noopener noreferrer" className="group block space-y-3 p-4 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 transition-all">
                      <div className="text-xs text-muted-foreground font-mono">{new URL(news.url).hostname.replace('www.', '')}</div>
                      <h4 className="font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {news.title}
                      </h4>
                    </a>
                  )) : (
                    <div className="col-span-3 text-center py-4 text-muted-foreground text-sm">
                      Loading market data...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN (1/3 width) */}
          <div className="space-y-8">
            
            {/* E) AI Network Status */}
            {/* <Card className="glass border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" /> AI Network
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <AgentStatusRow name="Document Agent" status="idle" />
                  <AgentStatusRow name="Vision Agent" status="active" />
                  <AgentStatusRow name="Fraud Agent" status="idle" />
                  <AgentStatusRow name="Settlement Agent" status="idle" />
                </div>
                <div className="pt-4 border-t border-border/50 text-xs text-center text-muted-foreground">
                  System Operational • Latency 45ms
                </div>
              </CardContent>
            </Card> */}

            {/* B) Recent Activity */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" /> Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-4 border-l-2 border-border/50 space-y-6">
                  {notifications.length > 0 ? notifications.map((note, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-blue-500" />
                      <p className="text-sm font-medium">{note.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{note.message.substring(0, 50)}...</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(note.created_at).toLocaleTimeString()}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* C) Quick Tips */}
            <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5" /> Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-blue-100">
                  <p className="font-medium mb-1">• Better Photos</p>
                  Take photos from multiple angles for higher AI confidence scores.
                </div>
                <div className="text-sm text-blue-100">
                  <p className="font-medium mb-1">• Voice Mode</p>
                  Use our new Voice Assistant to file claims while driving (hands-free).
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatsCard({ title, value, icon: Icon, color, trend, subtext }: any) {
  const gradients = {
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
    yellow: 'from-yellow-500/10 to-yellow-500/5 text-yellow-600',
    green: 'from-green-500/10 to-green-500/5 text-green-600',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-600',
  };

  return (
    <Card className={`glass border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1 relative overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradients[color as keyof typeof gradients]}`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AgentStatusRow({ name, status }: { name: string, status: 'idle' | 'active' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{name}</span>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
        <span className={`text-xs font-medium ${status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function ClaimStatusBadge({ status }: { status: string }) {
  const styles = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200',
    ai_review: 'bg-purple-100 text-purple-700 border-purple-200',
    submitted: 'bg-slate-100 text-slate-700 border-slate-200',
    settled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  
  const label = status.replace('_', ' ').toUpperCase();
  const className = styles[status as keyof typeof styles] || styles.submitted;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${className}`}>
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Skeleton className="h-12 w-48" />
      <div className="grid grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <Skeleton className="col-span-2 h-96 rounded-xl" />
        <Skeleton className="col-span-1 h-96 rounded-xl" />
      </div>
    </div>
  );
}