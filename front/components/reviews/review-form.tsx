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
        
        // 2. Fetch user's existing reviews
        const myReviews = await api.getMyReviews();
        const reviewedClaimIds = new Set(myReviews.map((r: any) => r.claim_id).filter(Boolean));
        
        // 3. Filter: Only Approved/Settled claims that haven't been reviewed yet
        if (claimsRes && Array.isArray(claimsRes.claims)) {
             const reviewable = claimsRes.claims.filter(c => 
                (c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.SETTLED) &&
                !reviewedClaimIds.has(c.id) // ✅ Exclude already reviewed claims
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

  if (loadingClaims) {
    return (
      <Card className="glass border-border/50 shadow-lg">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (claims.length === 0) {
      return (
          <Card className="glass border-dashed border-border/50 shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 pointer-events-none" />
              <CardContent className="py-12 text-center relative">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-4">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    You have no approved claims to review right now.
                  </p>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="glass border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader className="pb-4 relative">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 group-hover:from-primary/20 group-hover:to-purple-500/20 transition-colors">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Write a Review
                </span>
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative">
            
            {/* Claim Selector */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Select Claim
                </label>
                <Select value={selectedClaimId} onValueChange={setSelectedClaimId}>
                    <SelectTrigger className="h-11 border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Choose a claim..." />
                    </SelectTrigger>
                    <SelectContent>
                        {claims.map(claim => (
                            <SelectItem key={claim.id} value={claim.id}>
                                <span className="font-medium">{claim.type.toUpperCase()}</span> Claim - {new Date(claim.created_at).toLocaleDateString()} 
                                <span className="ml-2 text-primary font-semibold">${claim.approved_amount}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Star Rating */}
            <div className="space-y-3">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Rating
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-all hover:scale-125 ${
                          rating >= star 
                            ? 'text-yellow-400 drop-shadow-lg' 
                            : 'text-muted-foreground/30 hover:text-muted-foreground/50'
                        }`}
                    >
                        <Star className="w-9 h-9 fill-current" />
                    </button>
                    ))}
                </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Feedback (Optional)
                </label>
                <Textarea 
                    placeholder="Share your experience with our service..." 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="resize-none border-border/50 hover:border-primary/50 transition-colors"
                />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="w-full h-11 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Review
                  </>
                )}
            </Button>
        </CardContent>
    </Card>
  );
}