'use client';

import { useState, useEffect } from 'react';
import { getBeds } from '@/lib/api';
import { Bed } from '@/types';
import { Loader2, AlertCircle, BedDouble } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BedGrid } from '@/components/beds/bed-grid';

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const bedsData = await getBeds();
      setBeds(bedsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bed data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = {
    total: beds.length,
    available: beds.filter(b => b.status === 'AVAILABLE').length,
    occupied: beds.filter(b => b.status === 'OCCUPIED').length,
    reserved: beds.filter(b => b.status === 'RESERVED').length,
    maintenance: beds.filter(b => b.status === 'MAINTENANCE').length,
    unavailable: beds.filter(b => b.status === 'UNAVAILABLE').length,
  };

  const filteredBeds = beds.filter(bed => {
    if (deptFilter !== 'ALL' && (bed.department_name || '') !== deptFilter) return false;
    if (statusFilter !== 'ALL' && bed.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && bed.bed_type !== typeFilter) return false;
    return true;
  });

  const groupedBeds = filteredBeds.reduce((acc, bed) => {
    const dept = bed.department_name || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(bed);
    return acc;
  }, {} as Record<string, Bed[]>);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50 text-slate-900">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Error Loading Beds</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchData} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
            <BedDouble className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bed Management</h1>
            <p className="text-xs font-medium text-slate-500">Real-time bed allocation and ward occupancy grid</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-wrap gap-6 items-center justify-around shadow-xs">
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Beds</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.available}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Occupied</p>
          <p className="text-2xl font-bold text-teal-600">{summary.occupied}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reserved</p>
          <p className="text-2xl font-bold text-amber-600">{summary.reserved}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maintenance</p>
          <p className="text-2xl font-bold text-slate-600">{summary.maintenance}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unavailable</p>
          <p className="text-2xl font-bold text-rose-600">{summary.unavailable}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={deptFilter} onValueChange={(val: string | null) => val && setDeptFilter(val)}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-800">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-800">
            <SelectItem value="ALL">All Departments</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
            <SelectItem value="ICU">ICU</SelectItem>
            <SelectItem value="Cardiology">Cardiology</SelectItem>
            <SelectItem value="Neurology">Neurology</SelectItem>
            <SelectItem value="General Medicine">General Medicine</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val: string | null) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-800">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-800">
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(val: string | null) => val && setTypeFilter(val)}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-800">
            <SelectValue placeholder="Bed Type" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-800">
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="REGULAR">Regular</SelectItem>
            <SelectItem value="ICU">ICU</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
            <SelectItem value="RECOVERY">Recovery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedBeds).length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-400 shadow-xs">
          No beds found matching selected filters.
        </div>
      ) : (
        <BedGrid groupedBeds={groupedBeds} />
      )}
    </div>
  );
}
