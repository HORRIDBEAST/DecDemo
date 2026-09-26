'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Shield, Menu, X } from 'lucide-react';

/**
 * Shared navbar for public (no-auth-required) pages: reviews, finance, verify, help.
 * Modeled on the landing page's navbar (app/page.tsx), which already collapses
 * correctly on small screens (hidden md:flex + a md:hidden hamburger panel).
 * Those four pages each used to hand-roll their own always-visible flex row with
 * no responsive fallback, which is why they overflowed sideways on a phone instead
 * of wrapping - this replaces all four with one implementation that can't drift
 * out of sync with the others again.
 */
export function PublicNavbar() {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: '/finance', label: 'Finance News' },
    { href: '/verify', label: 'Verify' },
    { href: '/reviews', label: 'Reviews' },
    { href: '/help', label: 'Help Center' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
              DecentralizedClaim
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {!loading && (
              user ? (
                <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
                    Log In
                  </Link>
                  <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4 animate-in slide-in-from-top-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-foreground/80 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            {!loading && (
              user ? (
                <Button asChild className="w-full justify-center rounded-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full justify-center rounded-full">
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild className="w-full justify-center rounded-full">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
