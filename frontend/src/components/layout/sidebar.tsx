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
    <div className="fixed top-0 left-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-20">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Activity className="h-8 w-8 text-blue-500 mr-3" />
        <span className="text-xl font-bold text-gray-100 tracking-tight">Flow OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-200 truncate">{user?.full_name || 'User'}</span>
            <span className="text-xs text-gray-500">{user?.role || 'Staff'}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
