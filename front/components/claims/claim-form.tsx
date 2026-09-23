'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, MapPin } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// The backend's weather-fraud check geocodes this field as a place name
// (AI-Agents/src/agents/fraud_agent.py -> verify_historical_weather), so raw
// "lat, lng" would silently break that check. Reverse-geocode first, and only
// fall back to coordinates - with a warning - if that lookup fails.
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

// Schema WITHOUT transformation - keep everything as strings in the form
const claimFormSchema = z.object({
  type: z.nativeEnum(ClaimType, {
    message: "Please select a claim type.",
  }),
  // Keep as string - we'll convert manually before API call
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


// Simple hook to persist form data
function usePersistForm(key: string, form: any) {
  useEffect(() => {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      form.reset(parsed); // Populate form with saved data
    }
  }, [key, form]);

  useEffect(() => {
    const subscription = form.watch((value: any) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [key, form]);
}

export function ClaimForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      type: '' as any,
      requestedAmount: '',
      description: '',
      incidentDate: '',
      location: '',
    },
  });

  usePersistForm('claim-draft', form);

  async function useCurrentLocation() {
    setIsLocating(true);
    try {
      let lat: number, lng: number;

      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          toast.error('Location is not available on this browser.');
          return;
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      const address = await reverseGeocode(lat, lng);
      if (address) {
        form.setValue('location', address, { shouldValidate: true });
      } else {
        // Fraud-check geocoding will likely fail on this, but it's better than
        // leaving the field empty - the red flag it produces is honest, not silent.
        form.setValue('location', `${lat.toFixed(5)}, ${lng.toFixed(5)}`, { shouldValidate: true });
        toast.warning("Couldn't resolve an address - filled in raw coordinates instead. Please edit to add a place name.");
      }
    } catch (error: any) {
      toast.error(error?.message?.includes('denied') ? 'Location permission denied.' : 'Could not get your location.');
    } finally {
      setIsLocating(false);
    }
  }

  // Convert string to number manually before sending to API
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
           localStorage.removeItem('claim-draft');
      router.push(`/claims/${newClaim.id}`); 
      
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to create draft: ${error.message}`);
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
                <Input 
                  type="number" 
                  placeholder="1500" 
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
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="123 Main St, Springfield" {...field} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" disabled={isLocating} onClick={useCurrentLocation}>
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                </Button>
              </div>
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
                <Textarea placeholder="Describe what happened..." rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
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
  );
}