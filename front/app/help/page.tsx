'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { Mail, PlayCircle, FileText, Shield, HelpCircle, BookOpen, Video, Send, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function HelpPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || 'anonymous@user.com',
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Support ticket created! We will contact you shortly.');
        setFormData({ subject: '', message: '' }); // Clear form
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Support form error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Modern Navbar */}
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
            
            <div className="flex items-center gap-6">
              <Link href="/finance" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Finance News
              </Link>
              <Link href="/verify" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Verify
              </Link>
              <Link href="/reviews" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Reviews
              </Link>
              {user ? (
                <Button asChild className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">24/7 Support Center</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            How can we{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              help you?
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Search for answers, browse our guides, or get in touch with our support team.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: FAQs & Tutorials */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Tutorials */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 mr-3">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                Video Tutorials
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <a 
                  href="https://www.youtube.com/watch?v=MfzmgfHc-Bs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="glass border-border/50 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-pointer">
                    <div className="relative h-48 bg-gradient-to-br from-red-500/20 to-pink-500/20 w-full flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <PlayCircle className="h-16 w-16 text-red-600 group-hover:scale-110 transition-transform relative z-10" />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                        Watch Demo on YouTube
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </CardTitle>
                      <CardDescription>Complete platform walkthrough and demo</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
                
                <a 
                  href="https://www.github.com/HORRIDBEAST/DecDemo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="glass border-border/50 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-pointer">
                    <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-full flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <svg className="h-16 w-16 text-purple-600 group-hover:scale-110 transition-transform relative z-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                        View on GitHub
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </CardTitle>
                      <CardDescription>Explore the source code and documentation</CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              </div>
            </section>

            {/* FAQs */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 mr-3">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                Frequently Asked Questions
              </h2>
              <Card className="glass border-border/50 shadow-sm">
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-border/50">
                      <AccordionTrigger className="hover:text-primary transition-colors">
                        How long does AI processing take?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        Our multi-agent AI system typically processes a claim in 2-5 minutes. Complex claims requiring human review may take up to 24 hours.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-border/50">
                      <AccordionTrigger className="hover:text-primary transition-colors">
                        Is my data visible on the Blockchain?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        Only a cryptographic hash (proof) of your claim is stored on the public blockchain. Your personal documents and photos are stored in a secure, private database.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-border/50">
                      <AccordionTrigger className="hover:text-primary transition-colors">
                        What happens if my claim is rejected?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        If rejected, you will receive a detailed report explaining why. You can use the "Edit & Retry" feature in your dashboard to provide additional evidence.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4" className="border-border/50">
                      <AccordionTrigger className="hover:text-primary transition-colors">
                        How secure is my personal information?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        We use industry-standard encryption and secure cloud storage. Your data is never shared with third parties without your explicit consent.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <Card className="glass border-border/50 shadow-lg sticky top-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                Contact Support
              </CardTitle>
              <CardDescription>Can't find what you need? Message us.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground uppercase tracking-wide">
                    Subject
                  </label>
                  <Input 
                    placeholder="e.g. Claim #123 issue" 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required 
                    disabled={loading}
                    className="h-11 border-border/50 hover:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-muted-foreground uppercase tracking-wide">
                    Message
                  </label>
                  <Textarea 
                    placeholder="Describe your issue..." 
                    rows={5} 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required 
                    disabled={loading}
                    className="resize-none border-border/50 hover:border-primary/50 transition-colors"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>

              {/* Pro Tip */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-border/50">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Quick Response</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our support team typically responds within 2 hours during business hours.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}