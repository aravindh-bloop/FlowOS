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
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-950 text-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-gray-400">{error}</p>
        <Button onClick={fetchData} variant="outline" className="border-gray-700 hover:bg-gray-800">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">Hospital Command Center</h1>
        </div>
        <div className="text-xl font-mono text-gray-400 bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
          {currentTime.toLocaleTimeString()}
        </div>
      </header>

      <KPICards data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Department Overview</h2>
          <DepartmentOverview departments={data.department_summaries || []} />
        </div>
        <div className="lg:col-span-4 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Active Alerts</h2>
          <ActiveAlerts alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        <div className="lg:col-span-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Bed Occupancy by Department</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-[400px]">
             <BedOccupancyChart departments={data.department_summaries || []} />
          </div>
        </div>
        <div className="lg:col-span-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent Events</h2>
          <RecentEvents events={events} />
        </div>
      </div>
    </div>
  );
}
