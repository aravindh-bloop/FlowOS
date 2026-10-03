'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col flex-grow ml-64 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 mt-16 bg-slate-50/80">
          {children}
        </main>
      </div>
    </div>
  );
}
