import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Lock, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-white">DecentralizedClaim</div>
        <div className="space-x-4 flex items-center">
          {/* ✅ NEW: Reviews Link */}
          <Link href="/reviews" className="text-slate-300 hover:text-white transition-colors">
            Reviews
          </Link>
          
          <Link href="/login">
            <Button variant="ghost" className="text-white">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          AI-Powered Insurance Claims
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Process insurance claims in minutes with AI agents and blockchain verification.
          Transparent, fast, and fraud-proof.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Your Claim <Zap className="ml-2" />
          </Button>
        </Link>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Zap className="w-10 h-10" />}
            title="AI Processing"
            description="Multi-agent AI system processes claims in minutes"
          />
          <FeatureCard
            icon={<Lock className="w-10 h-10" />}
            title="Blockchain Verified"
            description="Immutable records on Polygon blockchain"
          />
          <FeatureCard
            icon={<Shield className="w-10 h-10" />}
            title="Fraud Detection"
            description="Advanced AI fraud detection algorithms"
          />
          <FeatureCard
            icon={<TrendingUp className="w-10 h-10" />}
            title="95% Faster"
            description="From weeks to hours for claim processing"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}