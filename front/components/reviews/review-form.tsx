'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Claim, ClaimStatus } from '@/lib/types';

export function ReviewForm({ onReviewSubmitted }: { onReviewSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // ✅ FIX: Improved fetch logic with proper error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Claims
        const claimsRes = await api.getClaims(1, 100);
        
        // 2. Fetch Existing Reviews by this user (You need a new endpoint for this, or just filter client side if list is small)
        // For now, let's assume we fetch all public reviews and check
        // Ideally: const myReviews = await api.getMyReviews(); 
        
        // Quick Fix: Filter only Approved/Settled
        if (claimsRes && Array.isArray(claimsRes.claims)) {
             // Logic: We can't easily check if *this* user reviewed *this* claim without a new API endpoint.
             // For the demo, the "Local Remove" is fine. 
             // If you want persistence, add `api.getUserReviews()` and filter against that list.
             
             const reviewable = claimsRes.claims.filter(c => 
                c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.SETTLED
             );
             setClaims(reviewable);
        } else {
            setClaims([]);
        }
      } catch (e) {
        console.error("Failed to fetch claims for review", e);
        setClaims([]); // Fail gracefully
      } finally {
        setLoadingClaims(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedClaimId) {
        toast.error('Please select a claim to review');
        return;
    }
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.createReview({ rating, comment, claimId: selectedClaimId });
      toast.success('Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setComment('');
      setSelectedClaimId('');
      
      // Remove the reviewed claim from the list locally
      setClaims(prev => prev.filter(c => c.id !== selectedClaimId));
      
      onReviewSubmitted(); // Refresh parent list
    } catch (e) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingClaims) return <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />;

  if (claims.length === 0) {
      return (
          <Card className="bg-slate-50 border-dashed">
              <CardContent className="py-8 text-center text-slate-500 text-sm">
                  You have no approved claims to review right now.
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
                <Send className="w-4 h-4 mr-2 text-blue-600" /> Write a Review
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            
            {/* Claim Selector */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Select Claim</label>
                <Select value={selectedClaimId} onValueChange={setSelectedClaimId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose a claim..." />
                    </SelectTrigger>
                    <SelectContent>
                        {claims.map(claim => (
                            <SelectItem key={claim.id} value={claim.id}>
                                {claim.type.toUpperCase()} Claim - {new Date(claim.created_at).toLocaleDateString()} (${claim.approved_amount})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Star Rating */}
            <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-all hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-200'}`}
                    >
                        <Star className="w-8 h-8 fill-current" />
                    </button>
                    ))}
                </div>
            </div>

            {/* Comment */}
            <Textarea 
                placeholder="How was your experience? (Optional)" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
            />

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Submit Review'}
            </Button>
        </CardContent>
    </Card>
  );
}