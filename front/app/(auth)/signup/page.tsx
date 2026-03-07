// app/(auth)/signup/page.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, User, Hash, Check, X } from 'lucide-react';

export default function SignupPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password validation
  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password, firstName, lastName, age ? parseInt(age) : undefined);
      toast.success('Account created! Please check your email to verify.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-2xl relative z-10 glass border-border/50 shadow-2xl">
        {/* Logo & Title */}
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="flex justify-center mb-2">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-2.5 rounded-xl group-hover:from-primary/20 group-hover:to-purple-500/20 transition-colors">
                <Shield className="w-7 h-7 text-primary" />
              </div>
            </Link>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold mb-1">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent">
                Create Account
              </span>
            </CardTitle>
            <CardDescription className="text-sm">
              Join thousands using DecentralizedClaim
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold">First Name *</Label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === 'firstName' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl opacity-0 transition-all duration-300 blur-xl ${
                      focusedField === 'firstName' ? 'opacity-20' : ''
                    }`}
                  />
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-3 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <User className="w-5 h-5 text-muted-foreground mr-3" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold">Last Name</Label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === 'lastName' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl opacity-0 transition-all duration-300 blur-xl ${
                      focusedField === 'lastName' ? 'opacity-20' : ''
                    }`}
                  />
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <User className="w-4 h-4 text-muted-foreground mr-2.5" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Age Field */}
            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-xs font-semibold">Age (Optional)</Label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === 'age' ? 'scale-[1.02]' : ''
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl opacity-0 transition-all duration-300 blur-xl ${
                    focusedField === 'age' ? 'opacity-20' : ''
                  }`}
                />
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <Hash className="w-4 h-4 text-muted-foreground mr-2.5" />
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min="18"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onFocus={() => setFocusedField('age')}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
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
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <Mail className="w-4 h-4 text-muted-foreground mr-2.5" />
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

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
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
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <Lock className="w-4 h-4 text-muted-foreground mr-2.5" />
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
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">Confirm Password</Label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === 'confirm' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl opacity-0 transition-all duration-300 blur-xl ${
                      focusedField === 'confirm' ? 'opacity-20' : ''
                    }`}
                  />
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-2.5 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <Lock className="w-4 h-4 text-muted-foreground mr-2.5" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="glass border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Password Requirements</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'At least 6 characters', check: passwordChecks.length },
                  { label: 'Passwords match', check: passwordChecks.match },
                ].map((req, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${
                      req.check ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {req.check ? (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 flex-shrink-0 opacity-50" />
                    )}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 h-11 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-[length:200%_auto] animate-gradient" />
              <div className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-muted-foreground text-sm mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          {/* Back to Home */}
          <div className="pt-4 border-t border-border/50 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Homepage
            </Link>
          </div>

          {/* Terms */}
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}