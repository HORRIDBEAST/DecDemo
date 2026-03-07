'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShieldCheck, ExternalLink, Loader2, AlertCircle, Sparkles, Lock, CheckCircle2, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { toast } from 'sonner';

export default function VerifyClaimPage() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // Clean the search query (remove 0x prefix if present)
      const cleanQuery = searchQuery.trim().replace(/^0x/i, '');

      // Try multiple search strategies
      let data = null;
      let queryError = null;

      // Strategy 1: Try searching by blockchain_tx_hash
      const { data: hashResult, error: hashError } = await supabase
        .from('claims')
        .select('id, type, status, incident_date, created_at, blockchain_tx_hash')
        .eq('blockchain_tx_hash', cleanQuery)
        .maybeSingle();

      if (hashResult) {
        data = hashResult;
      }

      // Strategy 2: If not found, try by id (UUID)
      if (!data && !hashError) {
        const { data: idResult, error: idError } = await supabase
          .from('claims')
          .select('id, type, status, incident_date, created_at, blockchain_tx_hash')
          .eq('id', searchQuery.trim())
          .maybeSingle();

        if (idResult) {
          data = idResult;
        }
        queryError = idError;
      }

      if (!data) {
        throw new Error('Claim not found. Please check the ID/hash and try again.');
      }

      // ONLY SHOW IF IT HAS A BLOCKCHAIN HASH
      if (!data.blockchain_tx_hash) {
        throw new Error('Claim found, but it is not yet anchored on the blockchain.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHash = (hash: string) => hash.startsWith('0x') ? hash : `0x${hash}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-yellow-50/30" />
        
        {/* Floating orbs animation */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-pulse delay-1000" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-200/20 rounded-full blur-3xl animate-pulse delay-2000" style={{ animationDelay: '2s' }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Clean Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/60 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded-xl group-hover:shadow-md transition-all duration-300 border border-green-100">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hover:text-green-600 transition-colors">
                DecentralizedClaim
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/finance" className="text-sm font-medium text-gray-600 hover:text-yellow-600 transition-colors">
                Finance News
              </Link>
              <Link href="/help" className="text-sm font-medium text-gray-600 hover:text-yellow-600 transition-colors">
                Help Center
              </Link>
              <Link href="/reviews" className="text-sm font-medium text-gray-600 hover:text-yellow-600 transition-colors">
                Reviews
              </Link>
              
              {!loading && (
                user ? (
                  <Button asChild className="rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-300">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                ) : (
                   <Button asChild variant="outline" className="rounded-full border-gray-300 hover:border-green-500 hover:text-green-600">
                  <Link href="/login">Login</Link>
                </Button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto py-20 px-4 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-400 blur-3xl opacity-10 animate-pulse" />
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-200 shadow-xl">
              <ShieldCheck className="w-16 h-16 text-green-600 mx-auto" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Blockchain
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 bg-clip-text text-transparent animate-pulse">
                Verification
              </span>
            </h1>
            
            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Experience <span className="text-yellow-600 font-semibold">zero-trust transparency</span>. 
              Verify any claim's authenticity through the immutable Polygon Blockchain with instant, cryptographic proof.
            </p>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <div className="group px-5 py-2.5 rounded-full bg-white border-2 border-green-200 text-sm text-gray-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md hover:border-green-400 transition-all duration-300">
              <Lock className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
              Cryptographically Secure
            </div>
            <div className="group px-5 py-2.5 rounded-full bg-white border-2 border-yellow-200 text-sm text-gray-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md hover:border-yellow-400 transition-all duration-300">
              <Sparkles className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform" />
              Public Access
            </div>
            <div className="group px-5 py-2.5 rounded-full bg-white border-2 border-gray-200 text-sm text-gray-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-300">
              <CheckCircle2 className="w-4 h-4 text-gray-600 group-hover:scale-110 transition-transform" />
              Instant Verification
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="border-2 border-gray-200 bg-white shadow-2xl shadow-gray-200/50 hover:shadow-3xl hover:border-yellow-300 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200 rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-yellow-400 to-green-400 animate-pulse" />
          <CardContent className="pt-10 pb-10 px-8">
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Enter Claim ID (UUID) or Blockchain Hash" 
                  className="h-14 pl-12 text-base bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100 rounded-2xl transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-14 px-10 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 transition-all duration-300 font-semibold text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Verify on Blockchain
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-3 shadow-lg shadow-red-100">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            </div>
            <div>
              <p className="font-semibold text-red-900 mb-1">Verification Failed</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <Card className="animate-in slide-in-from-bottom-5 fade-in duration-700 border-2 border-green-300 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 shadow-2xl shadow-green-200/50 overflow-hidden rounded-3xl">
            {/* Success header bar */}
            <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400" />
            
            <CardHeader className="relative border-b-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50/50">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-green-700 flex items-center gap-3 text-3xl mb-2">
                    <div className="p-2.5 bg-white rounded-xl shadow-md border border-green-200">
                      <ShieldCheck className="w-7 h-7 text-green-600" />
                    </div>
                    Cryptographically Verified
                  </CardTitle>
                  <p className="text-green-600 text-sm font-medium ml-14">
                    ✓ This claim has been verified on the Polygon blockchain
                  </p>
                </div>
                <div className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                  VERIFIED
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative pt-10 pb-8 space-y-8">
              {/* Claim Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Claim ID */}
                <div className="md:col-span-2 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        Claim ID
                      </p>
                      <p className="text-sm font-mono font-semibold break-all text-gray-900">{result.id}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg shrink-0"
                      onClick={() => copyToClipboard(result.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Claim Type */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all duration-300">
                  <p className="text-xs text-yellow-700 mb-4 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    Claim Type
                  </p>
                  <p className="text-3xl font-bold uppercase text-yellow-900">
                    {result.type}
                  </p>
                </div>

                {/* Status */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all duration-300">
                  <p className="text-xs text-green-700 mb-4 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Status
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${result.status === 'APPROVED' ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-yellow-500'}`} />
                    <p className="text-3xl font-bold uppercase text-green-900">
                      {result.status}
                    </p>
                  </div>
                </div>

                {/* Filed On */}
                <div className="p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300">
                  <p className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Filed On
                  </p>
                  <p className="text-xl font-bold text-gray-900">{new Date(result.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                {/* Incident Date */}
                <div className="p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300">
                  <p className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Incident Date
                  </p>
                  <p className="text-xl font-bold text-gray-900">{new Date(result.incident_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Blockchain Hash */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border-2 border-gray-300 hover:border-green-400 shadow-xl hover:shadow-2xl transition-all duration-500 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-md border border-green-200">
                    <ExternalLink className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 font-bold uppercase tracking-wider">Blockchain Transaction Hash</p>
                    <p className="text-xs text-gray-500 mt-0.5">Immutable proof on Polygon Amoy</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-start gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <p className="font-mono text-sm break-all text-gray-700 flex-1 leading-relaxed">
                    {formatHash(result.blockchain_tx_hash)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg shrink-0"
                    onClick={() => copyToClipboard(formatHash(result.blockchain_tx_hash))}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <a 
                  href={`https://amoy.polygonscan.com/tx/${formatHash(result.blockchain_tx_hash)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 text-base">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    View on PolygonScan
                  </Button>
                </a>
              </div>

              {/* Privacy Notice */}
              <div className="p-5 rounded-2xl bg-yellow-50 border-2 border-yellow-200 hover:border-yellow-300 transition-all duration-300">
                <p className="text-sm text-center text-yellow-900 leading-relaxed font-medium flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-600 shrink-0" />
                  For privacy protection, personal details, uploaded documents, and claim descriptions are hidden from public view.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
