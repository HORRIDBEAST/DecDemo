"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Menu, X, ArrowRight, Sparkles, Zap, Brain, Lock, 
  Clock, BarChart3, Shield, Mic, Globe, CheckCircle2, 
  Github, Twitter, Linkedin, TrendingUp 
} from "lucide-react"

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: Brain,
      title: "Multi-Agent AI Core",
      description: "Four specialized AI agents debate and verify every claim document, reducing bias and ensuring 99.9% accuracy.",
    },
    {
      icon: Mic,
      title: "Voice-First Intake",
      description: "Powered by Vapi.ai, users can file complex claims simply by speaking naturally. No tedious forms required.",
    },
    {
      icon: Lock,
      title: "Blockchain Immutable",
      description: "Every approval is cryptographically hashed on Polygon. Zero-trust transparency for auditors and users.",
    },
    {
      icon: Globe,
      title: "Financial Intelligence",
      description: "Integrated real-time market news and crypto trends via Tavily API to give context to asset claims.",
    },
    {
      icon: Shield,
      title: "Fraud Pattern Detection",
      description: "Computer vision analyzes damage photos against metadata to flag inconsistencies instantly.",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      description: "Smart contracts execute payouts immediately upon approval. From weeks to seconds.",
    },
  ]

  const steps = [
    { number: "01", title: "Voice or Upload", desc: "Describe incident via voice or upload photos." },
    { number: "02", title: "AI Analysis", desc: "Agents verify docs & detect fraud patterns." },
    { number: "03", title: "Chain Record", desc: "Decision is hashed on Polygon blockchain." },
    { number: "04", title: "Instant Payout", desc: "Funds released to your wallet immediately." },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight hover:text-primary transition-colors">
                DecentralizedClaim
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/finance" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
                Finance News
              </Link>
              <Link href="/verify" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
                Verify
              </Link>
              <Link href="/reviews" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
                Testimonials
              </Link>
              <Link href="/help" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors">
                Help Center
              </Link>
              <div className="h-4 w-px bg-border" />
              
              {/* Conditional rendering based on auth state */}
              {!loading && (
                user ? (
                  <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                    <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
                      Log In
                    </Link>
                    <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  </>
                )
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4 animate-in slide-in-from-top-5">
            <Link href="/finance" className="block text-sm font-medium text-foreground/80 py-2">Finance News</Link>
            <Link href="/verify" className="block text-sm font-medium text-foreground/80 py-2">Verify</Link>
            <Link href="/reviews" className="block text-sm font-medium text-foreground/80 py-2">Reviews</Link>
            <Link href="/help" className="block text-sm font-medium text-foreground/80 py-2">Help Center</Link>
            <div className="pt-4 flex flex-col gap-3">
              
              {/* Conditional rendering for mobile based on auth state */}
              {!loading && (
                user ? (
                  <Button asChild className="w-full justify-center rounded-full">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full justify-center rounded-full">
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild className="w-full justify-center rounded-full">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  </>
                )
              )}
              
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full  bg-primary/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Agents + Blockchain Transparency</span>
            </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-balance leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Insurance Claims <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Reimagined.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 text-balance leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Stop waiting weeks for a payout. Our Multi-Agent AI processes claims in minutes, verified forever on the Polygon blockchain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
              <Link href="/signup">
                Start Your Claim <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-24 bg-white dark:bg-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 border-2 border-black border-dashed p-6 md:p-4 rounded-lg bg-white/70 dark:bg-slate-100/70">
            {[
              { value: "< 2 Mins", label: "Processing Time", icon: Clock },
              { value: "$2.4M+", label: "Claims Settled", icon: TrendingUp },
              { value: "99.9%", label: "AI Accuracy", icon: Brain },
              { value: "4.9/5", label: "User Rating", icon: CheckCircle2 },
            ].map((stat, index) => (
              <div 
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300  p-6 bg-white/50 dark:bg-slate-100/50"
              >
                <div className="mb-4 inline-flex items-center justify-center">
                  <stat.icon className="w-12 h-12 md:w-16 md:h-16 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <div className="text-4xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                  {stat.value}
                </div>
                <div className="text-sm md:text-lg text-slate-700 dark:text-slate-600 uppercase tracking-widest font-bold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS / LOGOS SECTION --- */}
      <section className="py-12 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Powered by Next-Gen Technology
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Tech Stack Placeholders - Replace with SVGs if you have them */}
            <span className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5"/> Polygon</span>
            <span className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5"/> OpenAI</span>
            <span className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5"/> Vapi.ai</span>
            <span className="text-xl font-bold flex items-center gap-2"><Lock className="w-5 h-5"/> Supabase</span>
            <span className="text-xl font-bold flex items-center gap-2"><Search className="w-5 h-5" /> Tavily</span>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Built for the{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                Future of Insurance
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              We replaced the manual "black box" process with a transparent, automated pipeline that works for you, not against you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="group relative overflow-hidden p-8 border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
              >
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon - Centered horizontally */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {/* Icon container */}
                      <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 group-hover:border-primary/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <feature.icon className="w-10 h-10 text-primary group-hover:text-accent transition-colors duration-500" />
                      </div>
                    </div>
                  </div>

                  {/* Title - Centered */}
                  <h3 className="text-xl font-bold mb-4 text-center group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description - Centered */}
                  <p className="text-muted-foreground leading-relaxed text-center text-sm">
                    {feature.description}
                  </p>

                  {/* Subtle hover indicator */}
                  {/* <div className="mt-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform duration-300" />
                  </div> */}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24 bg-slate-950 text-white relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                From Accident to <br />
                <span className="text-blue-400">Approval in Minutes</span>
              </h2>
              <p className="text-lg text-slate-400">
                Our workflow is designed to minimize stress. Just tell us what happened, and our agents handle the paperwork, verification, and settlement.
              </p>
              
              <div className="space-y-6">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center font-bold text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-1 group-hover:text-blue-300 transition-colors">{step.title}</h4>
                      <p className="text-slate-400 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="relative">
                {/* Abstract visual representation of the app */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-30 animate-pulse" />
                <Card className="relative bg-slate-900 border-slate-800 p-8 rounded-2xl shadow-2xl">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="text-xs font-mono text-slate-500">AI_AGENT_LOGS.EXE</div>
                  </div>
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex gap-2">
                      <span className="text-green-400">➜</span>
                      <span className="text-slate-300">Initializing Document Analysis Agent...</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-400">➜</span>
                      <span className="text-slate-300">Scanning uploaded invoice.pdf...</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400">ℹ</span>
                      <span className="text-blue-300">Confidence Score: 98.5%</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-400">➜</span>
                      <span className="text-slate-300">Cross-referencing with Policy #8832...</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-400">⚡</span>
                      <span className="text-purple-300">Blockchain Hash Generated: 0x7f...3a2</span>
                    </div>
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-center font-bold">
                      CLAIM APPROVED
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 mesh-gradient opacity-50" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Ready to Transform?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join the insurance revolution. Experience the speed of AI and the trust of Blockchain today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && !user && (
              <Button asChild size="lg" className="h-14 px-10 text-lg rounded-full shadow-2xl hover:scale-105 transition-transform">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="lg" className="h-14 px-10 text-lg text-white rounded-full hover:bg-gray-500 bg-gray-800 border">
              <Link href={user ? "/dashboard" : "/login"}>Access Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-background border-t border-border pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">DecentralClaim</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building the future of transparent, automated insurance on the Polygon network.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="/finance" className="hover:text-primary">Finance Hub</Link></li>
                <li><Link href="/reviews" className="hover:text-primary">Reviews</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-primary">Help Center</Link></li>
                <li><Link href="/help" className="hover:text-primary">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-primary">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © 2025 DecentralizedClaim. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-5 h-5"/></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5"/></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-5 h-5"/></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}