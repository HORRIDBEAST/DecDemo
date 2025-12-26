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
import { LogOut, User, Settings, Bell, HelpCircle, TrendingUp, Shield, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Clickable to Homepage */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
              DecentralizedClaim
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/finance" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
              Finance News
            </Link>
            <Link href="/reviews" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
              Reviews
            </Link>
            <Link href="/help" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
              Help Center
            </Link>
            
            <div className="h-4 w-px bg-border" />
            
            <FeedbackModal />
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
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
                <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-6 space-y-4 animate-in slide-in-from-top-5">
          <Link 
            href="/finance" 
            className="block text-sm font-medium text-foreground/80 hover:text-primary py-2 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Finance News
          </Link>
          <Link 
            href="/reviews" 
            className="block text-sm font-medium text-foreground/80 hover:text-primary py-2 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Reviews
          </Link>
          <Link 
            href="/help" 
            className="block text-sm font-medium text-foreground/80 hover:text-primary py-2 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <HelpCircle className="w-4 h-4 inline mr-2" />
            Help Center
          </Link>
          
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}