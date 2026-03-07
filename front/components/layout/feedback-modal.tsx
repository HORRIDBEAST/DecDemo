'use client';

import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function FeedbackModal() {
  const pathname = usePathname();

  // Hide button if already on reviews page to avoid clutter
  if (pathname === '/reviews') return null;

  return (
    <Link href="/reviews">
      <Button variant="ghost" size="sm" className="hidden md:flex">
        <MessageSquarePlus className="w-4 h-4 mr-2" /> 
        Feedback
      </Button>
    </Link>
  );
}