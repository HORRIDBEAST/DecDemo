'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { ClaimType } from '@/lib/types';
import { toast } from 'sonner';
import { useClaim } from '@/hooks/use-claims';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const claimFormSchema = z.object({
  type: z.nativeEnum(ClaimType),
  requestedAmount: z.string().min(1),
  description: z.string().min(20),
  incidentDate: z.string().min(1),
  location: z.string().min(5),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export default function EditClaimPage() {
  const router = useRouter();
  const params = useParams();
  const { claim, isLoading } = useClaim(params.id as string);
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

  // Populate form when data loads
  useEffect(() => {
    if (claim) {
      form.reset({
        type: claim.type,
        requestedAmount: claim.requested_amount.toString(),
        description: claim.description,
        incidentDate: claim.incident_date.split('T')[0], // Format for date input
        location: claim.location,
      });
    }
  }, [claim, form]);

  async function onSubmit(data: ClaimFormValues) {
    setIsSubmitting(true);
    try {
      // Call update endpoint
      await api.updateClaim(params.id as string, {
        ...data,
        requestedAmount: Number(data.requestedAmount),
        // Reset status to DRAFT so user can re-upload docs if needed
        status: 'draft' 
      });
      
      toast.success('Claim updated! You can now modify documents.');
      router.push(`/claims/${params.id}`); 
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Loader2 className="animate-spin mx-auto mt-10" />;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Claim Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Re-use the same form fields from new/page.tsx here */}
            {/* For brevity, I'm assuming you copy the FormField blocks for type, amount, description, date, location */}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Update if needed)</FormLabel>
                  <FormControl><Textarea rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... other fields ... */}

            <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : 'Save & Continue'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}