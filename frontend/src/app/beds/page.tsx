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
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-950 text-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Beds</h2>
        <p className="text-gray-400">{error}</p>
        <Button onClick={fetchData} variant="outline" className="border-gray-700 hover:bg-gray-800">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <BedDouble className="mr-3 text-blue-500" /> Bed Management
        </h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap gap-6 items-center justify-around">
        <div className="text-center">
          <p className="text-sm text-gray-400">Total Beds</p>
          <p className="text-2xl font-bold text-gray-200">{summary.total}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Available</p>
          <p className="text-2xl font-bold text-emerald-500">{summary.available}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Occupied</p>
          <p className="text-2xl font-bold text-blue-500">{summary.occupied}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Reserved</p>
          <p className="text-2xl font-bold text-amber-500">{summary.reserved}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Maintenance</p>
          <p className="text-2xl font-bold text-gray-500">{summary.maintenance}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Unavailable</p>
          <p className="text-2xl font-bold text-red-500">{summary.unavailable}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={deptFilter} onValueChange={(val: string | null) => val && setDeptFilter(val)}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
            <SelectItem value="ICU">ICU</SelectItem>
            <SelectItem value="Cardiology">Cardiology</SelectItem>
            <SelectItem value="Neurology">Neurology</SelectItem>
            <SelectItem value="General Medicine">General Medicine</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val: string | null) => val && setStatusFilter(val)}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(val: string | null) => val && setTypeFilter(val)}>
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800">
            <SelectValue placeholder="Bed Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="REGULAR">Regular</SelectItem>
            <SelectItem value="ICU">ICU</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
            <SelectItem value="RECOVERY">Recovery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groupedBeds).length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
          No beds found matching filters
        </div>
      ) : (
        <BedGrid groupedBeds={groupedBeds} />
      )}
    </div>
  );
}
