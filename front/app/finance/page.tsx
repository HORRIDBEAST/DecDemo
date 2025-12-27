'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { Search, Loader2, TrendingUp, Wallet, Briefcase, Globe, ExternalLink, Shield } from 'lucide-react';

// ✅ Define Categories with Sub-topics
const CATEGORIES = [
  { 
    id: 'markets', 
    label: 'Markets', 
    icon: TrendingUp,
    subtopics: [
        { label: 'All', query: 'latest stock market crypto commodities news' },
        { label: 'Stocks', query: 'stock market analysis earnings IPOs' },
        { label: 'Crypto', query: 'cryptocurrency blockchain bitcoin ethereum DeFi news' },
        { label: 'Forex', query: 'forex trading currency commodities gold oil news' },
        { label: 'ETFs', query: 'mutual funds ETFs investment strategies' }
    ]
  },
  { 
    id: 'personal', 
    label: 'Personal Finance', 
    icon: Wallet,
    subtopics: [
        { label: 'All', query: 'personal finance tips news' },
        { label: 'Budgeting', query: 'budgeting saving money tips' },
        { label: 'Loans', query: 'credit cards personal loans debt management' },
        { label: 'Retirement', query: 'retirement planning 401k pension news' },
        { label: 'Insurance', query: 'insurance guides health auto life' }
    ]
  },
  { 
    id: 'business', 
    label: 'Business', 
    icon: Briefcase,
    subtopics: [
        { label: 'All', query: 'corporate finance news' },
        { label: 'Startups', query: 'startups venture capital funding news' },
        { label: 'M&A', query: 'mergers and acquisitions corporate news' },
        { label: 'Risk', query: 'corporate risk management compliance' }
    ]
  },
  { 
    id: 'global', 
    label: 'Global Economy', 
    icon: Globe,
    subtopics: [
        { label: 'All', query: 'global economy news' },
        { label: 'Macro', query: 'inflation interest rates GDP monetary policy' },
        { label: 'Trade', query: 'international trade tariffs global markets' },
        { label: 'Policy', query: 'government fiscal policy taxation news' }
    ]
  },
];

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('markets');
  const [activeSubtopic, setActiveSubtopic] = useState('All'); // ✅ New State
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch news when Tab or Subtopic changes
  useEffect(() => {
    const category = CATEGORIES.find(c => c.id === activeTab);
    if (category) {
        // Find the query for the selected subtopic
        const subtopicObj = category.subtopics.find(s => s.label === activeSubtopic) || category.subtopics[0];
        fetchNews(subtopicObj.query);
    }
  }, [activeTab, activeSubtopic]);

  const fetchNews = async (query: string) => {
    setLoading(true);
    try {
      const data = await api.getFinanceNews(query);
      setArticles(data || []);
    } catch (e) {
      console.error(e);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset subtopic when main tab changes
  const handleTabChange = (val: string) => {
      setActiveTab(val);
      setActiveSubtopic('All');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchNews(searchQuery + " finance news");
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <div className="bg-white border-b py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
            DecentralizedClaim
          </span>
        </Link>
        <div className="flex gap-4">
          <Link href="/reviews" className="text-sm font-medium text-slate-600 hover:text-blue-600 pt-2">
            Reviews
          </Link>
          <Link href="/help" className="text-sm font-medium text-slate-600 hover:text-blue-600 pt-2">
            Help Center
          </Link>
          {user ? (
            <Link href="/dashboard"><Button>Dashboard</Button></Link>
          ) : (
            <Link href="/login"><Button variant="outline">Login</Button></Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Financial Insights Hub</h1>
            <p className="text-slate-300 mb-8">Stay updated with the latest trends in markets, crypto, and personal finance.</p>
            
            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Search topics (e.g. 'Bitcoin ETFs', 'Tax saving tips')..." 
                        className="pl-10 bg-white text-slate-900 placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button type="submit">Search</Button>
            </form>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-10 px-4">
        
        {/* Main Tabs */}
        <Tabs defaultValue="markets" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 mb-6 bg-transparent">
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <TabsTrigger 
                            key={cat.id} 
                            value={cat.id} 
                            className="flex items-center gap-2 bg-white border-2 border-slate-300 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:border-slate-800"
                        >
                            <Icon className="h-4 w-4" /> {cat.label}
                        </TabsTrigger>
                    )
                })}
            </TabsList>

            {/* ✅ Subtopic Pills */}
            <div className="flex flex-wrap gap-3 mb-8">
                {currentCategory?.subtopics.map((sub) => (
                    <button
                        key={sub.label}
                        onClick={() => setActiveSubtopic(sub.label)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            activeSubtopic === sub.label 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                        }`}
                    >
                        {sub.label}
                    </button>
                ))}
            </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
              <p className="text-slate-500">Curating latest insights...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No articles found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <Card key={i} className="flex flex-col hover:shadow-lg transition-shadow h-full">
                  {/* Image */}
                  <div className="h-48 bg-slate-200 rounded-t-lg overflow-hidden relative">
                    {article.image_url ? (
                      <img 
                        src={article.image_url} 
                        alt={article.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <TrendingUp className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-slate-800 text-xs">
                        {activeTab.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg leading-snug line-clamp-2">
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-blue-600"
                      >
                        {article.title}
                      </a>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <p className="text-slate-600 text-sm line-clamp-3">
                      {article.content}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="border-t pt-4 flex justify-between items-center text-xs text-slate-500">
                    <span>
                      Source: {new URL(article.url).hostname.replace('www.', '')}
                    </span>
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-8">
                        Read More <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}