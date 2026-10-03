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
    if (parts.length === 0) return 'Dashboard';
    const firstPart = parts[0];
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-10">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-100">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm font-medium text-gray-400 tabular-nums">
          {time ? time.toLocaleString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }) : ''}
        </div>

        <div className="relative cursor-pointer">
          <Bell className="h-5 w-5 text-gray-400 hover:text-gray-200 transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white border-2 border-gray-900">
            3
          </span>
        </div>

        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
