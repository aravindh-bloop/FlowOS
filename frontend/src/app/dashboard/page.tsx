'use client';

import { useState, useEffect } from 'react';
import { getDashboard, getEvents, getAlerts, acknowledgeAlert } from '@/lib/api';
import { DashboardOverview, HospitalEvent, Alert } from '@/types';
import { Activity, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { DepartmentOverview } from '@/components/dashboard/department-overview';
import { ActiveAlerts } from '@/components/dashboard/active-alerts';
import { BedOccupancyChart } from '@/components/dashboard/bed-occupancy-chart';
import { RecentEvents } from '@/components/dashboard/recent-events';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [events, setEvents] = useState<HospitalEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = async () => {
    try {
      const [dashData, eventsData, alertsData] = await Promise.all([
        getDashboard(),
        getEvents().catch(() => []),
        getAlerts().catch(() => [])
      ]);
      setData(dashData);
      setEvents(eventsData.slice(0, 15));
      setAlerts(alertsData.filter(a => a.is_active));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await acknowledgeAlert(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50 text-slate-900">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Error Loading Command Center</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchData} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
            <Activity className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Command Center</h1>
            <p className="text-xs font-medium text-slate-500">Real-time clinical operations and resource monitoring</p>
          </div>
        </div>
        <div className="text-sm font-semibold font-mono text-slate-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
          {currentTime.toLocaleTimeString()}
        </div>
      </header>

      <KPICards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <h2 className="text-lg font-bold mb-3 text-slate-800">Department Overview</h2>
          <DepartmentOverview departments={data.department_summaries || []} />
        </div>
        <div className="lg:col-span-4 flex flex-col h-full">
          <h2 className="text-lg font-bold mb-3 text-slate-800">Active Alerts</h2>
          <ActiveAlerts alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-8">
          <h2 className="text-lg font-bold mb-3 text-slate-800">Bed Occupancy by Department</h2>
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 h-[380px] shadow-xs">
             <BedOccupancyChart departments={data.department_summaries || []} />
          </div>
        </div>
        <div className="lg:col-span-4">
          <h2 className="text-lg font-bold mb-3 text-slate-800">Recent Events</h2>
          <RecentEvents events={events} />
        </div>
      </div>
    </div>
  );
}
