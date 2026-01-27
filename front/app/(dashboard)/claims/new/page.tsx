'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { ClaimType } from '@/lib/types';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, FileText, DollarSign, Calendar, MapPin, Mic, Sparkles, ArrowRight, X } from 'lucide-react';
import { VoiceClaimAssistant } from '@/components/claims/voice-assistant';
import { SupportBot } from '@/components/layout/support-bot';

// 1. Define the form schema
const claimFormSchema = z.object({
  type: z.nativeEnum(ClaimType, {
    message: "Please select a claim type.",
  }),
  requestedAmount: z.string()
    .min(1, "Please enter an amount.")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a valid number greater than 0.",
    }),
  description: z.string().min(20, "Please provide a detailed description (at least 20 characters)."),
  incidentDate: z.string().min(1, "Please select an incident date."),
  location: z.string().min(5, "Please provide a location (at least 5 characters)."),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export default function NewClaimPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftingBot, setShowDraftingBot] = useState(false);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      type: undefined,
      requestedAmount: '',
      description: '',
      incidentDate: '',
      location: '',
    },
  });

  // ✅ NEW: Handler for Voice AI Data
  const handleVoiceData = (data: any) => {
    console.log("Filling form with:", data);

    // 1. Map the AI's JSON keys to your Form's keys
    // Force lowercase for claimType to match your Enum
    if (data.claimType) {
      form.setValue('type', data.claimType.toLowerCase());
    }
    
    if (data.requestedAmount) {
      form.setValue('requestedAmount', data.requestedAmount.toString());
    }
    if (data.description) {
      form.setValue('description', data.description);
    }
    if (data.incidentDate) {
      form.setValue('incidentDate', data.incidentDate);
    }
    
    // ✅ FIX 2: Add Location Mapping
    if (data.location) {
      form.setValue('location', data.location);
    }

    // 2. Force validation
    form.trigger();
    toast.success('Form filled by AI! Please review and upload documents.');
  };

  // 2. Define the submit handler
  async function onSubmit(data: ClaimFormValues) {
    setIsSubmitting(true);
    toast.loading('Creating claim draft...');

    try {
      // Convert requestedAmount from string to number
      const claimData = {
        ...data,
        requestedAmount: Number(data.requestedAmount),
      };
      
      const newClaim = await api.createClaim(claimData);
      
      toast.dismiss();
      toast.success('Claim draft created successfully!');
      router.push(`/claims/${newClaim.id}`);      
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to create draft: ${error.message}`);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            File a New Claim
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Use our AI-powered voice assistant or fill out the form manually
          </p>
        </div>

        {/* ✅ VOICE ASSISTANT SECTION */}
        <Card className="glass border-border/50 shadow-lg overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <Mic className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Voice Assistant
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <CardDescription>Speak naturally, and AI will fill the form for you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <VoiceClaimAssistant onFormFill={handleVoiceData} />
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative animate-in fade-in duration-700 delay-200">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 py-1 text-muted-foreground font-semibold tracking-wider">
              Or fill manually
            </span>
          </div>
        </div>

        {/* FORM CARD */}
        <Card className="glass border-border/50 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Claim Details
            </CardTitle>
            <CardDescription>Provide detailed information about your claim</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Grid Layout for Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Claim Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-border/50 hover:border-primary/50 transition-colors">
                              <SelectValue placeholder="Select a claim type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ClaimType.AUTO}>🚗 Auto</SelectItem>
                            <SelectItem value={ClaimType.HOME}>🏠 Home</SelectItem>
                            <SelectItem value={ClaimType.HEALTH}>🏥 Health</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Requested Amount
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1500" 
                            className="h-11 border-border/50 hover:border-primary/50 transition-colors"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Incident Date
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-11 border-border/50 hover:border-primary/50 transition-colors"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Incident Location
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main St, Springfield" 
                            className="h-11 border-border/50 hover:border-primary/50 transition-colors"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Full Width Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Detailed Description
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-7 text-xs gap-1"
                          onClick={() => setShowDraftingBot(true)}
                        >
                          <Sparkles className="h-3 w-3" />
                          AI Help
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what happened in detail..."
                          rows={6}
                          className="resize-none border-border/50 hover:border-primary/50 transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Drafting Assistant Bot (Contextual) */}
                {showDraftingBot && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md">
                      {/* Close button for modal wrapper */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-12 right-0 text-white hover:bg-white/20 h-10 w-10"
                        onClick={() => setShowDraftingBot(false)}
                      >
                        <X className="h-6 w-6" />
                      </Button>

                      {/* ✅ Inline Bot Component */}
                      <SupportBot
                        type="inline"
                        defaultOpen={true}
                        onInsertText={(text) => {
                          form.setValue('description', text);
                          setShowDraftingBot(false);
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Draft...
                      </>
                    ) : (
                      <>
                        Create Draft & Continue to Uploads
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="glass border-border/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 animate-in fade-in duration-700 delay-400">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Pro Tip</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After creating your draft, you'll be able to upload supporting documents, photos, and evidence. 
                  Our AI will analyze everything to expedite your claim processing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
