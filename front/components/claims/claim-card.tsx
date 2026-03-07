// components/claims/claim-card.tsx
import Link from 'next/link';
import { Claim } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClaimStatusBadge } from './claim-status-badge';
import { ArrowRight, Car, Home, Heart, Calendar, MapPin } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
}

export function ClaimCard({ claim }: ClaimCardProps) {
  const typeIcons = {
    auto: { icon: Car, color: 'from-blue-500/10 to-blue-500/5 text-blue-600' },
    home: { icon: Home, color: 'from-green-500/10 to-green-500/5 text-green-600' },
    health: { icon: Heart, color: 'from-red-500/10 to-red-500/5 text-red-600' },
  };

  const TypeIcon = typeIcons[claim.type as keyof typeof typeIcons]?.icon || Car;
  const iconColor = typeIcons[claim.type as keyof typeof typeIcons]?.color || typeIcons.auto.color;

  return (
    <Card className="glass border-border/50 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group overflow-hidden relative">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconColor} transition-transform group-hover:scale-110`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg capitalize font-bold">{claim.type} Claim</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(claim.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </CardDescription>
            </div>
          </div>
          <ClaimStatusBadge status={claim.status} />
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-3">
        <div>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            ${claim.requested_amount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Requested Amount</p>
        </div>
        
        <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
          {claim.description}
        </p>
        
        {claim.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {claim.location}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="relative">
        <Button 
          asChild 
          variant="ghost" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
        >
          <Link href={`/claims/${claim.id}`}>
            View Details 
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}