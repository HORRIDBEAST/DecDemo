'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Star, Loader2, Shield, Quote, TrendingUp, Users, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { ReviewForm } from '@/components/reviews/review-form';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Keep as is */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/50 transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
                DecentralizedClaim
              </span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/finance" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Finance News
              </Link>
              <Link href="/help" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Help Center
              </Link>
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

      {/* Hero Section with Gradient */}
      <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-b border-slate-100">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:30px_30px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-slate-700">Verified Customer Reviews</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
              Loved by <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Thousands</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
              Real stories from users who've transformed their insurance claims with our blockchain-powered platform
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {averageRating}
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-medium">Average Rating</p>
                <div className="flex gap-1 justify-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {reviews.length}
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-medium">Total Reviews</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-medium">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Customer Stories</h2>
              <div className="text-sm text-slate-500">{reviews.length} reviews</div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium mb-2">No reviews yet</p>
                <p className="text-sm text-slate-400">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Rating Distribution + Review Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Rating Distribution */}
           

            {/* Write Review CTA */}
            {user ? (
              <div className="sticky top-24">
                <ReviewForm onReviewSubmitted={fetchReviews} />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-blue-200/50 text-center shadow-sm sticky top-24">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Share Your Experience</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Help others make informed decisions by sharing your claim experience
                </p>
                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all">
                    Login to Write Review
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review, index }: any) {
  return (
    <div 
      className="group bg-white rounded-2xl border border-slate-200/50 p-6 hover:shadow-xl hover:border-blue-200/50 transition-all duration-300"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {(review.users?.display_name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-slate-900">{review.users?.display_name || 'Anonymous User'}</h4>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(review.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div className="relative">
        <Quote className="absolute -left-1 -top-1 w-8 h-8 text-blue-100" />
        <p className="text-slate-700 leading-relaxed pl-6 relative z-10">
          {review.comment}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs">
        {review.claims?.type && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {review.claims.type}
          </span>
        )}
        <button className="text-slate-400 hover:text-blue-600 transition-colors">👍 Helpful</button>
        <span className="text-slate-400">·</span>
        <span className="text-slate-400">Verified Purchase</span>
      </div>
    </div>
  );
}

// Animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}