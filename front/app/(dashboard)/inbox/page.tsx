'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function InboxPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotes = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const markAsRead = async (id: string, claimId?: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    // Call API (You need to create this endpoint, or just assume viewing effectively marks it)
    await api.markNotificationRead(id);

    if (claimId) {
        router.push(`/claims/${claimId}`);
    }
  };

  const unread = notifications.filter(n => !n.is_read);
  const all = notifications;

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center">
        <Bell className="mr-3 h-8 w-8" /> Inbox
      </h1>

      <Tabs defaultValue="unread" className="w-full">
        <TabsList>
          <TabsTrigger value="unread">Unread <Badge className="ml-2 bg-blue-600">{unread.length}</Badge></TabsTrigger>
          <TabsTrigger value="all">All Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="unread">
            {unread.length === 0 ? (
                <p className="text-slate-500 py-10 text-center">You're all caught up! 🎉</p>
            ) : (
                <NotificationList items={unread} onRead={markAsRead} />
            )}
        </TabsContent>

        <TabsContent value="all">
            <NotificationList items={all} onRead={markAsRead} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({ items, onRead }: any) {
    return (
        <div className="space-y-2 mt-4">
            {items.map((n: any) => (
                <Card 
                    key={n.id} 
                    className={`cursor-pointer transition-all hover:border-blue-300 ${!n.is_read ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : 'bg-slate-50 opacity-75'}`}
                    onClick={() => onRead(n.id, n.claim_id)}
                >
                    <CardContent className="p-4 flex justify-between items-start">
                        <div>
                            <h4 className={`text-sm font-semibold ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        {n.is_read && <CheckCheck className="h-4 w-4 text-slate-400" />}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}