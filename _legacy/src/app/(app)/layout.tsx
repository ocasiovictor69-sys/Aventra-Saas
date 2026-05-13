'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Aventra ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] px-8">
          <div className="max-w-md text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">⚠</span>
            </div>
            <h2 className="text-lg font-bold text-black mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">{this.state.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
  ),
  Properties: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Units: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
  ),
  Maintenance: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  Compliance: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
};

export default function AventraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const links = [
    { name: 'Dashboard',   href: '/dashboard',              icon: Icons.Dashboard },
    { name: 'Properties',  href: '/dashboard/properties',   icon: Icons.Properties },
    { name: 'Units',       href: '/dashboard/units',        icon: Icons.Units },
    { name: 'Maintenance', href: '/dashboard/maintenance',  icon: Icons.Maintenance },
    { name: 'Compliance',  href: '/dashboard/compliance',   icon: Icons.Compliance },
    { name: 'Settings',    href: '/dashboard/settings',     icon: Icons.Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col justify-between shadow-sm">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
              Av
            </div>
            <span className="text-xl font-bold text-zinc-900 tracking-tight">AVENTRA</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  <span className="shrink-0"><link.icon /></span>
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email || 'admin@aventra.re'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center px-8 z-10">
          <span className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Aventra Real Estate</span>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto bg-transparent pb-16 md:pb-0 z-10">
          <div className="p-6 md:p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 flex items-center justify-around px-2 py-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-brand-primary' : 'text-zinc-500'
              }`}
            >
              <span className="shrink-0"><link.icon /></span>
              <span className="text-[10px] font-semibold">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
