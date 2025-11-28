'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';
import { FeedbackModal } from './feedback-modal';

function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
        setNotifications([]);
      }
    };
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b font-semibold flex justify-between items-center">
            <span>Recent</span>
            <Link href="/inbox" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
        </div>
        
        {/* Preview (first 5 unread) */}
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
             <p className="p-4 text-sm text-slate-500">No notifications</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <Link 
                key={n.id} 
                href="/inbox"
                className="block p-4 border-b hover:bg-slate-50 text-sm"
              >
                <p className={`font-medium ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                  {n.title}
                </p>
                <p className="text-slate-600 text-xs mt-1 line-clamp-2">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t text-center">
            <Link href="/inbox">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Go to Inbox
                </Button>
            </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-slate-900">
          DecentralizedClaim
        </div>

        <div className="flex items-center gap-4">
          <FeedbackModal />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}