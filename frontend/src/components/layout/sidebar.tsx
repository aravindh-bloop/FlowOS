"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
  Activity, 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  UserCog, 
  Cpu, 
  Brain, 
  Siren, 
  BarChart3,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Beds', href: '/beds', icon: BedDouble },
  { name: 'Staff', href: '/staff', icon: UserCog },
  { name: 'Resources', href: '/resources', icon: Cpu },
  { name: 'Intelligence', href: '/intelligence', icon: Brain },
  { name: 'Emergencies', href: '/emergencies', icon: Siren },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col z-20 shadow-xs">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/80 bg-white">
        <div className="p-1.5 rounded-lg bg-teal-50 border border-teal-100 mr-3">
          <Activity className="h-6 w-6 text-teal-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">FlowOS</span>
          <span className="text-[10px] font-medium text-teal-600 tracking-wider uppercase mt-0.5">Clinical Suite</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clinical Operations</span>
        </div>
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold border-r-4 border-teal-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-200/80 p-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="h-9 w-9 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || 'User'}</span>
              <span className="text-xs text-slate-500 font-medium">{user?.role || 'Medical Staff'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
