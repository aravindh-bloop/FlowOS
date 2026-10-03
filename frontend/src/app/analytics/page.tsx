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
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 p-6 text-gray-100">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full text-center p-6 space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl text-red-400">Unable to Load Analytics</CardTitle>
          <p className="text-sm text-gray-400">{error || 'Data is unavailable'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
          >
            Retry Connection
          </button>
        </Card>
      </div>
    );
  }

  const renderMetricCard = (title: string, value: string | number, trend: number, isGood: boolean) => (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-100 mb-1">{value}</div>
        <div className={`text-xs flex items-center ${isGood ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
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
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
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
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200">Bed Utilization by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200">Staff Utilization by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                />
                <Bar dataKey="utilization" radius={[4, 4, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
