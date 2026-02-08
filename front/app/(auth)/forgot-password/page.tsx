'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowRight, Shield, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
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
              {emailSent ? (
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Check Your Email
                </span>
              ) : (
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Reset Password
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              {emailSent 
                ? "We've sent you a password reset link"
                : "Enter your email to receive a reset link"
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {emailSent ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to:
                  </p>
                  <p className="font-semibold text-foreground">{email}</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Click the link in the email to reset your password.<br />
                    The link will expire in 1 hour.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full h-11 border-border/50"
                >
                  Send to Different Email
                </Button>
                <Button
                  asChild
                  className="w-full h-11 shadow-lg shadow-primary/25"
                >
                  <Link href="/login">
                    Back to Login
                  </Link>
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or try resending.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                <div className="relative">
                  <div className="relative flex items-center bg-background border-2 border-border/50 rounded-xl px-4 py-3 hover:border-primary/50 focus-within:border-primary transition-all duration-300">
                    <Mail className="w-5 h-5 text-muted-foreground mr-3" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 border-0 bg-transparent outline-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter the email associated with your account
                </p>
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </Button>
            </form>
          )}

          {/* Back to Login */}
          {!emailSent && (
            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
