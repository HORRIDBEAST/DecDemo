'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { Mail, MessageCircle, PlayCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function HelpPage() {
  const { user } = useAuth();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Support ticket created! We will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Universal Navbar Logic */}
      <div className="bg-white border-b py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="font-bold text-xl">DecentralizedClaim</Link>
        <div className="flex gap-4">
            {user ? (
            <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
            ) : (
            <Link href="/login"><Button variant="outline">Login</Button></Link>
            )}
        </div>
      </div>

      {/* Hero */}
      <div className="bg-blue-600 py-16 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
        <p className="text-blue-100 text-lg">Search for answers or browse our guides below.</p>
      </div>

      <div className="container mx-auto py-12 px-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: FAQs & Tutorials */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Tutorials */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <PlayCircle className="mr-2 text-blue-600" /> Video Tutorials
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="h-40 bg-slate-200 w-full rounded-t-lg flex items-center justify-center">
                            <PlayCircle className="h-12 w-12 text-slate-400" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-base">How to file a new claim</CardTitle>
                            <CardDescription>Step-by-step guide to using our AI forms.</CardDescription>
                        </CardHeader>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <div className="h-40 bg-slate-200 w-full rounded-t-lg flex items-center justify-center">
                            <PlayCircle className="h-12 w-12 text-slate-400" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-base">Understanding Blockchain Verification</CardTitle>
                            <CardDescription>Why your claim record is immutable.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* FAQs */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                    <FileText className="mr-2 text-blue-600" /> Frequently Asked Questions
                </h2>
                <Card>
                    <CardContent className="pt-6">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>How long does AI processing take?</AccordionTrigger>
                                <AccordionContent>
                                    Our multi-agent AI system typically processes a claim in 2-5 minutes. Complex claims requiring human review may take up to 24 hours.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Is my data visible on the Blockchain?</AccordionTrigger>
                                <AccordionContent>
                                    Only a cryptographic hash (proof) of your claim is stored on the public blockchain. Your personal documents and photos are stored in a secure, private database.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>What happens if my claim is rejected?</AccordionTrigger>
                                <AccordionContent>
                                    If rejected, you will receive a detailed report explaining why. You can use the "Edit & Retry" feature in your dashboard to provide additional evidence.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Mail className="mr-2 h-5 w-5 text-blue-600" /> Contact Support
                    </CardTitle>
                    <CardDescription>Can't find what you need? Message us.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Subject</label>
                            <Input placeholder="e.g. Claim #123 issue" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Message</label>
                            <Textarea placeholder="Describe your issue..." rows={4} required />
                        </div>
                        <Button type="submit" className="w-full">Send Message</Button>
                    </form>

                    <div className="mt-6 pt-6 border-t">
                        <Button variant="outline" className="w-full">
                            <MessageCircle className="mr-2 h-4 w-4" /> Start Live Chat
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}