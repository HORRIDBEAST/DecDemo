'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { Mail, MessageCircle, PlayCircle, FileText, Shield, HelpCircle, BookOpen, Video, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function HelpPage() {
  const { user } = useAuth();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Support ticket created! We will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
                DecentralizedClaim
              </span>
            </Link>
            <div className="flex gap-4">
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
                <Card className="glass border-border/50 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-purple-500/20 w-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <PlayCircle className="h-16 w-16 text-primary group-hover:scale-110 transition-transform relative z-10" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      How to file a new claim
                    </CardTitle>
                    <CardDescription>Step-by-step guide to using our AI forms.</CardDescription>
                  </CardHeader>
                </Card>
                
                <Card className="glass border-border/50 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <PlayCircle className="h-16 w-16 text-purple-600 group-hover:scale-110 transition-transform relative z-10" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      Understanding Blockchain Verification
                    </CardTitle>
                    <CardDescription>Why your claim record is immutable.</CardDescription>
                  </CardHeader>
                </Card>
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
                    required 
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
                    required 
                    className="resize-none border-border/50 hover:border-primary/50 transition-colors"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-border/50 hover:bg-muted/50"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> 
                  Start Live Chat
                </Button>
              </div>

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