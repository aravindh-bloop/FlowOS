'use client';

import { useState } from 'react';
import { Bed, Patient } from '@/types';
import { assignBed, releaseBed, transferBed, assignMockPatientBed } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRightLeft, UserMinus, UserCheck, BedDouble, AlertCircle, Sparkles } from 'lucide-react';

interface BedActionModalProps {
  bed: Bed | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBeds?: Bed[];
  patients?: Patient[];
}

export function BedActionModal({
  bed,
  isOpen,
  onClose,
  onSuccess,
  availableBeds = [],
  patients = [],
}: BedActionModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'assign' | 'transfer' | 'release'>('details');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [targetBedId, setTargetBedId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!bed) return null;

  const isOccupied = bed.status === 'OCCUPIED';
  const isAvailable = bed.status === 'AVAILABLE';
  const isMockBed = bed.bed_number === '304B';

  const resetForm = () => {
    setSelectedPatientId('');
    setTargetBedId('');
    setNotes('');
    setTransferReason('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAssign = async (patientIdOverride?: number) => {
    const pid = patientIdOverride ?? Number(selectedPatientId);
    if (!pid) {
      setErrorMsg('Please select a patient to assign');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await assignBed(bed.id, { patient_id: pid, notes });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to assign bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAssignMock = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await assignMockPatientBed();
      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to sync mock patient bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await releaseBed(bed.id);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to release bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!targetBedId) {
      setErrorMsg('Please select a destination bed');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await transferBed(bed.id, {
        to_bed_id: Number(targetBedId),
        reason: transferReason || 'Clinical ward transfer',
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to transfer patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 border border-teal-100 rounded-lg">
                <BedDouble className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Bed {bed.bed_number}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {bed.department_name || 'General Medicine'} {bed.room_number ? `• Room ${bed.room_number}` : ''}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 font-bold ${
                isOccupied
                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {bed.status}
            </Badge>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* OCCUPIED BED ACTIONS */}
        {isOccupied ? (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Occupant</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 text-base">{bed.patient_name || 'Unknown Patient'}</p>
                  <p className="text-xs text-slate-500">MRN: {bed.patient_mrn || 'N/A'}</p>
                </div>
                {bed.patient_id && (
                  <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 text-[10px]">
                    ID #{bed.patient_id}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Action Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeTab === 'transfer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(activeTab === 'transfer' ? 'details' : 'transfer')}
                className={activeTab === 'transfer' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'border-slate-200 text-slate-700'}
              >
                <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                Transfer Patient
              </Button>
              <Button
                variant={activeTab === 'release' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(activeTab === 'release' ? 'details' : 'release')}
                className={activeTab === 'release' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'border-slate-200 text-rose-600 hover:bg-rose-50'}
              >
                <UserMinus className="w-4 h-4 mr-1.5" />
                Release Bed
              </Button>
            </div>

            {/* Transfer Sub-form */}
            {activeTab === 'transfer' && (
              <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-teal-900">Transfer Patient to Another Bed</p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Destination Bed</label>
                  <Select value={targetBedId} onValueChange={(val: string | null) => val && setTargetBedId(val)}>
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-xs">
                      <SelectValue placeholder="Select available destination bed" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-800 max-h-48">
                      {availableBeds
                        .filter((b) => b.id !== bed.id && b.status === 'AVAILABLE')
                        .map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            Bed {b.bed_number} ({b.department_name || 'General'}, {b.bed_type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Transfer Reason</label>
                  <Input
                    placeholder="e.g. Upgraded to ICU, Step-down to general ward"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="bg-white border-slate-200 text-xs"
                  />
                </div>
                <Button
                  onClick={handleTransfer}
                  disabled={submitting || !targetBedId}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ArrowRightLeft className="w-4 h-4 mr-1.5" />}
                  Confirm Bed Transfer
                </Button>
              </div>
            )}

            {/* Release Sub-form */}
            {activeTab === 'release' && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-rose-900">Confirm Bed Discharge & Release</p>
                <p className="text-xs text-rose-700">
                  This will unassign {bed.patient_name} and set Bed {bed.bed_number} to <strong>AVAILABLE</strong> for sanitization and turnover.
                </p>
                <Button
                  onClick={handleRelease}
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <UserMinus className="w-4 h-4 mr-1.5" />}
                  Confirm Bed Release
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* AVAILABLE OR OTHER BED ACTIONS */
          <div className="space-y-4 pt-2">
            {/* Quick 1-click mock patient assign */}
            {isMockBed && (
              <div className="bg-teal-50 border border-teal-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Primary Mock Patient Match
                </div>
                <p className="text-xs text-teal-700">
                  Bed 304B corresponds to <strong>AkshayaSri S</strong> (Room 304B) in the CareTaker mobile app.
                </p>
                <Button
                  onClick={handleQuickAssignMock}
                  disabled={submitting}
                  size="sm"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <UserCheck className="w-4 h-4 mr-1.5" />}
                  Assign AkshayaSri to Bed 304B
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Assign Patient</label>
                <Select value={selectedPatientId} onValueChange={(val: string | null) => val && setSelectedPatientId(val)}>
                  <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-xs">
                    <SelectValue placeholder="Select patient to admit to this bed" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-800 max-h-56">
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.first_name} {p.last_name} ({p.mrn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Clinical Notes (Optional)</label>
                <Input
                  placeholder="e.g. Direct transfer from Emergency, Day 1 post-op"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white border-slate-200 text-xs"
                />
              </div>

              <Button
                onClick={() => handleAssign()}
                disabled={submitting || !selectedPatientId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <UserCheck className="w-4 h-4 mr-1.5" />}
                Assign Bed
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-slate-500 hover:text-slate-800">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
