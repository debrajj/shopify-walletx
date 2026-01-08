import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, TrendingUp, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">ShopWallet</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Install App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-white"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6 border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            New: WhatsApp OTP Integration
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Turn Customer Balance <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Into Repeat Revenue
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one Store Wallet & Coins solution for Shopify. Enable refunds to wallet, 
            loyalty cashback, and secure payments with OTP verification.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
            >
              View Demo
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            14-day free trial • No credit card required • Installs in seconds
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="border-y border-slate-100 bg-slate-50/50 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by over 2,000+ merchants</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {['FashionNova', 'GymShark', 'AllBirds', 'Huel'].map((brand) => (
                <div key={brand} className="text-xl font-bold text-slate-800">{brand}</div>
             ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to run a loyalty wallet</h2>
            <p className="text-lg text-slate-600">
              Stop losing money on refunds. Keep cash in your ecosystem and reward loyal customers automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Bank-Grade Security",
                desc: "Every transaction is verified via SMS or WhatsApp OTP to prevent fraud and unauthorized usage."
              },
              {
                icon: TrendingUp,
                title: "Increase Retention",
                desc: "Customers with wallet balances return 3x more often. Automate expiry reminders to drive urgency."
              },
              {
                icon: Zap,
                title: "Instant Refunds",
                desc: "Process refunds directly to store wallet instantly. Improve customer satisfaction and cash flow."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
                <div className="h-12 w-12 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-slate-900 px-6 py-16 sm:px-16 sm:py-20 text-center overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20">
               <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad)" />
                 <defs>
                   <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" style={{stopColor: '#10b981', stopOpacity:1}} />
                     <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity:1}} />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to grow your store?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Join thousands of merchants using ShopWallet to power their loyalty and refund programs.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  to="/login"
                  className="rounded-full bg-emerald-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Get Started for Free
                </Link>
              </div>
              <div className="mt-6 flex justify-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> 14-day trial</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> 24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white">
                <Wallet className="h-3 w-3" />
              </div>
              <span className="font-bold text-slate-900">ShopWallet</span>
           </div>
           <div className="text-sm text-slate-500">
              © 2024 ShopWallet App. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;