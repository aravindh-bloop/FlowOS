"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Command Center';
    const firstPart = parts[0];
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 z-10 shadow-2xs">
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{getPageTitle()}</h1>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ● Live Operations
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/70 tabular-nums">
          {time ? time.toLocaleString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }) : ''}
        </div>

        <div className="relative cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white ring-2 ring-white">
            3
          </span>
        </div>

        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden md:inline-block">
            {user?.full_name || 'Staff User'}
          </span>
        </div>
      </div>
    </header>
  );
}
