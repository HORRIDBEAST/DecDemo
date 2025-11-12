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

// 1. Define the form schema
const claimFormSchema = z.object({
  type: z.nativeEnum(ClaimType, {
    required_error: "Please select a claim type.",
  }),
  requestedAmount: z.coerce.number().min(1, "Amount must be greater than 0."),
  description: z.string().min(20, "Please provide a detailed description."),
  incidentDate: z.string().min(1, "Please select an incident date."),
  location: z.string().min(5, "Please provide a location."),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export default function NewClaimPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      description: "",
      location: "",
    },
  });

  // 2. Define the submit handler
  async function onSubmit(data: ClaimFormValues) {
    setIsSubmitting(true);
    toast.loading('Creating claim draft...');

    try {
      // 3. Call the API to create the draft
      const newClaim = await api.createClaim(data);
      
      toast.dismiss();
      toast.success('Claim draft created successfully!');
      
      // 4. Redirect to the file upload page
      router.push(`/claims/${newClaim.id}/upload`); // <-- THIS IS THE NEW PAGE WE NEED TO BUILD
      
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
/*
// app/(dashboard)/claims/new/page.tsx
'use client';

import { ClaimForm } from '@/components/claims/claim-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewClaimPage() {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>File a New Claim</CardTitle>
        <CardDescription>
          Step 1: Fill out the claim details. You will upload documents on the next step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClaimForm />
      </CardContent>
    </Card>
  );
}
*/