import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl w-full text-center space-y-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
          Aventra Real Estate — Institutional Grade Management
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
          The Future of <br /> 
          <span className="text-indigo-400">Real Estate Assets</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Deterministic deal evaluation, professional property management, and lender-grade reporting. Built for the modern investor.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
          <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25">
            Get Started
          </button>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold backdrop-blur-sm transition-all">
            View Demo
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { title: 'Deterministic', desc: 'Repeatable financial models' },
            { title: 'Automated', desc: 'AI-driven screening loops' },
            { title: 'Secure', desc: 'Enterprise-grade RLS isolation' },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all text-left">
              <h3 className="text-lg font-semibold text-indigo-400 mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
      
      <footer className="absolute bottom-8 text-gray-500 text-sm">
        © 2026 Aventra Real Estate • TomorrowNow AI
      </footer>
    </main>
  );
}
