'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { ReviewForm } from '@/components/reviews/review-form'; // ✅ Import new component

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchReviews = async () => {
    try {
      const data = await api.getReviews();
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="font-bold text-xl">DecentralizedClaim</Link>
        {user ? (
          <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
        ) : (
          <Link href="/login"><Button>Login</Button></Link>
        )}
      </div>

      <div className="container mx-auto py-10 px-4">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Testimonials List */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Testimonials</h1>
                    <p className="text-slate-500 mt-2">See what our community says about their experience.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
                ) : reviews.length === 0 ? (
                    <p className="text-slate-500">No reviews yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Write Review Form (Sticky) */}
            <div className="lg:col-span-1">
                {user ? (
                    <div className="sticky top-24">
                        <ReviewForm onReviewSubmitted={fetchReviews} />
                    </div>
                ) : (
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="py-8 text-center">
                            <p className="text-blue-800 font-medium mb-4">Have you filed a claim recently?</p>
                            <Link href="/login">
                                <Button className="w-full">Login to Write a Review</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

// ... ReviewCard component remains the same ...
function ReviewCard({ review }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">{review.users?.display_name || 'Anonymous User'}</p>
          <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex mb-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
            />
          ))}
        </div>
        <p className="text-slate-600 text-sm italic">"{review.comment}"</p>
      </CardContent>
    </Card>
  );
}