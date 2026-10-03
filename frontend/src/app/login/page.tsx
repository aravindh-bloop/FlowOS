"use client";

import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@flowos.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/20 to-sky-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl mb-4 border border-teal-100 shadow-md">
            <Activity className="h-10 w-10 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FlowOS</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Hospital Operations & Command Portal</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-xs text-rose-700 font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-sm font-medium"
                placeholder="doctor@hospital.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-sm font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-bold bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all shadow-md ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Access Operations Portal'
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs font-medium text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} Flow Health Technologies. Secure Clinical Environment.
        </p>
      </div>
    </div>
  );
}
