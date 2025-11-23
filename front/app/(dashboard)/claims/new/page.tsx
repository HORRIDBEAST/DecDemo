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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { VoiceClaimAssistant } from '@/components/claims/voice-assistant';

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
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>File a New Claim</CardTitle>
      </CardHeader>
      <CardContent>
        
        {/* ✅ ADD VOICE ASSISTANT HERE */}
        <div className="mb-8 p-4 border border-blue-100 bg-blue-50 rounded-lg">
          <VoiceClaimAssistant onFormFill={handleVoiceData} />
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or fill manually</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a claim type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ClaimType.AUTO}>Auto</SelectItem>
                      <SelectItem value={ClaimType.HOME}>Home</SelectItem>
                      <SelectItem value={ClaimType.HEALTH}>Health</SelectItem>
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
                  <FormLabel>Requested Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1500" {...field} />
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
                  <FormLabel>Incident Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Incident Location</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Springfield" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what happened in detail..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Draft...
                </>
              ) : (
                'Create Draft & Continue to Uploads'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
