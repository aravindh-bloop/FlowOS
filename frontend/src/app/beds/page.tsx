'use client';

import { useState, useEffect } from 'react';
import { getBeds, getPatients, assignMockPatientBed, scanRfidBed } from '@/lib/api';
import { Bed, Patient } from '@/types';
import {
  Loader2,
  AlertCircle,
  BedDouble,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Radio,
  Wifi,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BedGrid } from '@/components/beds/bed-grid';
import { BedActionModal } from '@/components/beds/bed-action-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncingMock, setSyncingMock] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // RFID Simulator State
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);
  const [rfidUserId, setRfidUserId] = useState<string>('261');
  const [rfidBedId, setRfidBedId] = useState<string>('193');
  const [rfidSubmitting, setRfidSubmitting] = useState(false);
  const [rfidFeedback, setRfidFeedback] = useState<string | null>(null);

  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [bedsData, patientsData] = await Promise.all([
        getBeds(),
        getPatients().catch(() => [] as Patient[]),
      ]);
      setBeds(bedsData);
      setPatients(patientsData);
      setError(null);
    } catch (err: any) {
      console.warn('[FlowOS Beds] Poll error:', err.message || err);
      if (!silent) setError(err.message || 'Failed to fetch bed data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Live polling: updates automatically every 1.5 seconds when RFID reader triggers
    const interval = setInterval(() => {
      fetchData(true);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSyncMockPatient = async () => {
    try {
      setSyncingMock(true);
      setSyncSuccessMsg(null);
      await assignMockPatientBed();
      setSyncSuccessMsg('AkshayaSri successfully linked to Bed 304B (Room 304B)!');
      await fetchData(true);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to sync mock patient bed');
    } finally {
      setSyncingMock(false);
    }
  };

  const handleSelectBed = (bed: Bed) => {
    setSelectedBed(bed);
    setIsModalOpen(true);
  };

  const handleSimulateRfidScan = async () => {
    try {
      setRfidSubmitting(true);
      setRfidFeedback(null);
      const res = await scanRfidBed({
        user_id: rfidUserId,
        bed_id: rfidBedId,
        reader_id: 'RFID-READER-DESK-01',
      });
      setRfidFeedback(res.message || `Bed ${res.bed?.bed_number} updated to ${res.bed?.status}!`);
      await fetchData(true);
    } catch (err: any) {
      setRfidFeedback(err.response?.data?.detail || err.message || 'RFID scan failed');
    } finally {
      setRfidSubmitting(false);
    }
  };

  const mockBed = beds.find((b) => b.bed_number === '304B');
  const isMockBedOccupiedByAkshaya =
    mockBed?.status === 'OCCUPIED' &&
    mockBed?.patient_name?.toLowerCase().includes('akshaya');

  const summary = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
    reserved: beds.filter((b) => b.status === 'RESERVED').length,
    maintenance: beds.filter((b) => b.status === 'MAINTENANCE').length,
    unavailable: beds.filter((b) => b.status === 'UNAVAILABLE').length,
  };

  const filteredBeds = beds.filter((bed) => {
    if (deptFilter !== 'ALL' && (bed.department_name || '') !== deptFilter) return false;
    if (statusFilter !== 'ALL' && bed.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && bed.bed_type !== typeFilter) return false;
    return true;
  });

  const groupedBeds = filteredBeds.reduce((acc, bed) => {
    const dept = bed.department_name || 'General Medicine';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(bed);
    return acc;
  }, {} as Record<string, Bed[]>);

  if (loading && beds.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error && beds.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50 text-slate-900">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Error Loading Beds</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={() => fetchData()} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl shadow-xs">
            <BedDouble className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bed Management</h1>
            <p className="text-xs font-medium text-slate-500">
              Interactive bed allocation, clinical transfers, and real-time RFID sensor sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live RFID Sync Pill */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800 shadow-2xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="hidden sm:inline">Live RFID Stream:</span> Active
          </div>

          {/* Simulate RFID Scan Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRfidFeedback(null);
              setIsRfidModalOpen(true);
            }}
            className="border-slate-200 text-teal-700 bg-white hover:bg-teal-50 font-semibold gap-1.5 shadow-2xs"
          >
            <Radio className="w-4 h-4 text-teal-600" />
            Simulate RFID Tap
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mock Patient Bed Banner */}
      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-200/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2 bg-teal-600 text-white rounded-lg shrink-0 mt-0.5 md:mt-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">
                CareTaker App Mock Patient: AkshayaSri S
              </span>
              {isMockBedOccupiedByAkshaya ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[11px] gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Assigned (Room 304B • Bed 304B)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[11px]">
                  Unassigned / Disconnected
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Assigned Bed ID: <strong>{mockBed?.id || 193}</strong> • Bed 304B (General Medicine) • Real-time RFID badge & CareTaker telemetry sync.
            </p>
            {syncSuccessMsg && (
              <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {syncSuccessMsg}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSyncMockPatient}
          disabled={syncingMock}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 shadow-xs"
        >
          {syncingMock ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1.5" />
          )}
          {isMockBedOccupiedByAkshaya ? 'Re-sync Bed 304B' : 'Assign Bed 304B to AkshayaSri'}
        </Button>
      </div>

      {/* Bed Summary Statistics */}
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
          <p className="text-2xl font-bold text-rose-600">{summary.occupied}</p>
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
          <p className="text-2xl font-bold text-zinc-600">{summary.unavailable}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={deptFilter} onValueChange={(val: string | null) => val && setDeptFilter(val)}>
          <SelectTrigger className="w-[200px] bg-white border-slate-200 text-slate-800">
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

      {/* Grid */}
      {Object.keys(groupedBeds).length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-400 shadow-xs">
          No beds found matching selected filters.
        </div>
      ) : (
        <BedGrid groupedBeds={groupedBeds} onSelectBed={handleSelectBed} />
      )}

      {/* Interactive Bed Allocation Dialog */}
      <BedActionModal
        bed={selectedBed}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBed(null);
        }}
        onSuccess={() => fetchData(true)}
        availableBeds={beds}
        patients={patients}
      />

      {/* RFID Reader Simulation Modal */}
      <Dialog open={isRfidModalOpen} onOpenChange={setIsRfidModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 border border-teal-100 rounded-lg">
                <Wifi className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Simulate RFID Reader Tap
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Simulates hardware RFID scans sent to <code>POST /api/rfid/scan</code>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {rfidFeedback && (
            <div className="bg-teal-50 border border-teal-200 text-teal-900 rounded-lg p-3 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
              <span>{rfidFeedback}</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                User / Patient Identifier (user_id)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 261, MRN-304B01, or AkshayaSri"
                  value={rfidUserId}
                  onChange={(e) => setRfidUserId(e.target.value)}
                  className="bg-white border-slate-200 text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRfidUserId('261')}
                  className="text-[11px] shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  Akshaya (261)
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Accepts Patient ID, User ID, MRN, or Name string.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Bed Identifier (bed_id)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 193 or 304B"
                  value={rfidBedId}
                  onChange={(e) => setRfidBedId(e.target.value)}
                  className="bg-white border-slate-200 text-xs font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRfidBedId('193')}
                  className="text-[11px] shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  Bed 304B (193)
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Accepts Bed database ID (e.g. 193) or Bed number (e.g. 304B).</p>
            </div>

            {/* Live Toggle Status Box */}
            {(() => {
              const targetBed = beds.find(
                (b) => String(b.id) === String(rfidBedId).trim() || b.bed_number.toLowerCase() === rfidBedId.toLowerCase()
              );
              const isCurrentlyOccupied = targetBed?.status === 'OCCUPIED';
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Current Bed State:</span>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-bold ${
                        isCurrentlyOccupied
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {targetBed ? targetBed.status : 'Unknown'}
                    </Badge>
                  </div>
                  {targetBed?.patient_name && (
                    <p className="text-xs text-slate-500">
                      Occupant: <strong className="text-slate-800">{targetBed.patient_name}</strong>
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500">Next Tap Action:</span>
                    <span className={`font-bold ${isCurrentlyOccupied ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isCurrentlyOccupied ? '→ Mark UNOCCUPIED (AVAILABLE)' : '→ Mark OCCUPIED'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <Button
              onClick={handleSimulateRfidScan}
              disabled={rfidSubmitting || !rfidBedId}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 shadow-xs"
            >
              {rfidSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Radio className="w-4 h-4 mr-1.5" />}
              Tap RFID Badge (Toggle Bed Status)
            </Button>
            <p className="text-[10px] text-center text-slate-400">
              Payload sent: <code>{`{ "user_id": ${rfidUserId || 'null'}, "bed_id": ${rfidBedId || 'null'} }`}</code>
            </p>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRfidModalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
