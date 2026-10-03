'use client';

import { useState, useEffect } from 'react';
import { getAnalytics } from '@/lib/api';
import { Analytics } from '@/types';
import { Loader2, BarChart3, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await getAnalytics();
        setData(result);
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        setError(err?.response?.data?.detail || err?.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <Card className="bg-white border-slate-200 shadow-md max-w-md w-full text-center p-6 space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-rose-500" />
          </div>
          <CardTitle className="text-xl text-rose-600 font-bold">Unable to Load Analytics</CardTitle>
          <p className="text-sm text-slate-500">{error || 'Data is unavailable'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition"
          >
            Retry Connection
          </button>
        </Card>
      </div>
    );
  }

  const renderMetricCard = (title: string, value: string | number, trend: number, isGood: boolean) => (
    <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
        <div className={`text-xs font-semibold flex items-center ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
          {Math.abs(trend)}% from last week
        </div>
      </CardContent>
    </Card>
  );

  const deptAnalytics = data.department_analytics || [];

  const chartData = deptAnalytics.map(dept => ({
    name: dept.department_name,
    utilization: Math.round((dept.bed_utilization || 0) * 100)
  }));

  const staffData = deptAnalytics.map(dept => ({
    name: dept.department_name,
    utilization: Math.round((dept.staff_utilization || 0) * 100)
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
          <BarChart3 className="h-7 w-7 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics & Insights</h1>
          <p className="text-xs font-medium text-slate-500">Hospital throughput, resource utilization, and efficiency metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {renderMetricCard("Overall Bed Occupancy", `${Math.round((data.bed_utilization || 0) * 100)}%`, 4, true)}
        {renderMetricCard("ICU Utilization", `${Math.round((data.icu_utilization || 0) * 100)}%`, 8, false)}
        {renderMetricCard("Avg Wait Time", `${data.avg_waiting_time_minutes || 0} mins`, -5, true)}
        {renderMetricCard("Diagnostic Turnaround", `${data.diagnostic_turnaround_minutes || 0} mins`, -12, true)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {renderMetricCard("Admission to Bed Time", `${data.admission_to_bed_minutes || 0} mins`, -3, true)}
        {renderMetricCard("Staff Utilization Rate", `${Math.round((data.staff_utilization || 0) * 100)}%`, 2, true)}
        {renderMetricCard("OT Utilization", `${Math.round((data.ot_utilization || 0) * 100)}%`, 5, true)}
        {renderMetricCard("Resource Idle Rate", `${Math.round((data.resource_idle_rate || 0) * 100)}%`, -4, true)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Bed Utilization by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="utilization" radius={[6, 6, 0, 0]} fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Staff Utilization by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="utilization" radius={[6, 6, 0, 0]} fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
