'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md relative z-10 glass border-border/50 shadow-2xl">
        {/* Logo & Title */}
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </Link>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Welcome Back
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your claims dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === 'email' ? 'scale-[1.02]' : ''
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl opacity-0 transition-all duration-300 blur-xl ${
                    focusedField === 'email' ? 'opacity-20' : ''
                  }`}
                />
                <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-3 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                  <Mail className="w-5 h-5 text-muted-foreground mr-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === 'password' ? 'scale-[1.02]' : ''
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl opacity-0 transition-all duration-300 blur-xl ${
                    focusedField === 'password' ? 'opacity-20' : ''
                  }`}
                />
                <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-3 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                  <Lock className="w-5 h-5 text-muted-foreground mr-3" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
              </label>
              <Link href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-8 h-12 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] animate-gradient" />
              <div className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Create one
            </Link>
          </p>

          {/* Back to Home */}
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}