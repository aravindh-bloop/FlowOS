'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPatient, getBeds, assignBed, assignMockPatientBed } from '@/lib/api';
import { PatientDetail, Bed } from '@/types';
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  User,
  Activity,
  MapPin,
  Calendar,
  Clock,
  BedDouble,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientJourney } from '@/components/patients/patient-journey';
import { BedActionModal } from '@/components/beds/bed-action-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bed modal states
  const [selectedBedForAction, setSelectedBedForAction] = useState<Bed | null>(null);
  const [isBedActionOpen, setIsBedActionOpen] = useState(false);

  // New bed assignment dialog state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [targetBedId, setTargetBedId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [assigningBed, setAssigningBed] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchPatientData = async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      const [ptData, bedsData] = await Promise.all([
        getPatient(id),
        getBeds().catch(() => [] as Bed[]),
      ]);
      setPatient(ptData);
      setBeds(bedsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient details');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50 text-slate-900">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Patient Not Found</h2>
        <p className="text-slate-500">{error || 'Could not load patient details.'}</p>
        <Button onClick={() => router.push('/patients')} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Back to Patients
        </Button>
      </div>
    );
  }

  const currentAdm = patient.current_admission || (patient.admissions && patient.admissions.length > 0 ? patient.admissions[0] : null);
  const isMockPatient = patient.mrn === 'MRN-304B01' || patient.first_name.toLowerCase().includes('akshaya');
  
  // Find current bed object from beds list
  const currentBed = currentAdm?.bed_id
    ? beds.find((b) => b.id === currentAdm.bed_id) || {
        id: currentAdm.bed_id,
        bed_number: currentAdm.bed_number || 'Unknown',
        room_id: 0,
        ward_id: 0,
        department_id: currentAdm.department_id,
        bed_type: 'REGULAR',
        status: 'OCCUPIED',
        patient_id: patient.id,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        patient_mrn: patient.mrn,
        department_name: currentAdm.department_name,
      } as Bed
    : null;

  const handleOpenBedAction = () => {
    if (currentBed) {
      setSelectedBedForAction(currentBed);
      setIsBedActionOpen(true);
    } else {
      setIsAssignDialogOpen(true);
    }
  };

  const handleDirectAssignBed = async () => {
    if (!targetBedId) {
      setAssignError('Please select a bed');
      return;
    }
    try {
      setAssigningBed(true);
      setAssignError(null);
      await assignBed(Number(targetBedId), {
        patient_id: patient.id,
        notes: assignNotes || undefined,
      });
      setIsAssignDialogOpen(false);
      await fetchPatientData(true);
    } catch (err: any) {
      setAssignError(err.response?.data?.detail || err.message || 'Failed to assign bed');
    } finally {
      setAssigningBed(false);
    }
  };

  const handleQuickAssignMock = async () => {
    try {
      setAssigningBed(true);
      setAssignError(null);
      await assignMockPatientBed();
      setIsAssignDialogOpen(false);
      await fetchPatientData(true);
    } catch (err: any) {
      setAssignError(err.response?.data?.detail || err.message || 'Failed to assign mock bed');
    } finally {
      setAssigningBed(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/patients')}
            className="border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                MRN: {patient.mrn}
              </Badge>
              {isMockPatient && (
                <Badge className="bg-teal-50 text-teal-800 border-teal-200 text-xs gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  CareTaker Linked (Bed 304B)
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">Comprehensive patient journey, clinical telemetry, and bed association</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Details Card */}
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center text-base font-bold text-slate-900">
                <User className="w-5 h-5 mr-2 text-teal-600" />
                Demographics & Clinical Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Gender</p>
                  <p className="font-bold text-slate-800">{patient.gender || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</p>
                  <p className="font-bold text-slate-800">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Blood Group</p>
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-bold mt-1">
                    {patient.blood_type || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Emergency Contact</p>
                  <p className="font-bold text-slate-800">{patient.contact_phone || 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Clinical Admission & Bed Association */}
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center text-base font-bold text-slate-900">
                <Activity className="w-5 h-5 mr-2 text-teal-600" />
                Active Clinical Admission & Bed Association
              </CardTitle>
              {currentAdm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenBedAction}
                  className="border-teal-200 text-teal-700 hover:bg-teal-50 text-xs font-semibold gap-1.5"
                >
                  <BedDouble className="w-4 h-4 text-teal-600" />
                  {currentAdm.bed_id ? 'Manage / Transfer Bed' : 'Allocate Bed'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {currentAdm ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-teal-600" /> Department
                      </p>
                      <p className="font-bold text-slate-900">{currentAdm.department_name || 'General Medicine'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1">
                        <BedDouble className="w-3.5 h-3.5 mr-1 text-teal-600" /> Inpatient Bed
                      </p>
                      {currentAdm.bed_number ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-teal-800 text-sm">Bed {currentAdm.bed_number}</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                            Assigned
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                          Unassigned
                        </Badge>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                      <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 font-semibold">
                        {currentAdm.status}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Triage Priority</p>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold">
                        {currentAdm.priority}
                      </Badge>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-teal-600" /> Admission Date
                      </p>
                      <p className="font-bold text-slate-800">
                        {currentAdm.admission_date ? new Date(currentAdm.admission_date).toLocaleString() : '-'}
                      </p>
                    </div>

                    {currentAdm.attending_doctor_name && (
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Attending Physician</p>
                        <p className="font-bold text-slate-800">{currentAdm.attending_doctor_name}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admitting Diagnosis</p>
                    <p className="text-slate-800 text-sm font-semibold">{currentAdm.diagnosis || 'Pending clinical evaluation'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-sm">No active admission recorded for this patient.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-slate-200/80 h-full shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center text-base font-bold text-slate-900">
                <Clock className="w-5 h-5 mr-2 text-teal-600" />
                Patient Journey Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientJourney
                events={patient.events || []}
                patientId={patient.id}
                onRefresh={() => fetchPatientData(true)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bed Action Modal (Transfer / Release for currently assigned bed) */}
      <BedActionModal
        bed={selectedBedForAction}
        isOpen={isBedActionOpen}
        onClose={() => {
          setIsBedActionOpen(false);
          setSelectedBedForAction(null);
        }}
        onSuccess={() => fetchPatientData(true)}
        availableBeds={beds}
        patients={[patient]}
      />

      {/* Direct Bed Assignment Dialog (When patient doesn't currently have a bed) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 border border-teal-100 rounded-lg">
                <BedDouble className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Assign Bed to {patient.first_name} {patient.last_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select an available inpatient bed or room
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {assignError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{assignError}</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {isMockPatient && (
              <div className="bg-teal-50 border border-teal-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Caretaker Default: Bed 304B
                </div>
                <p className="text-xs text-teal-700">
                  Directly bind AkshayaSri to Room 304B • Bed 304B in General Medicine.
                </p>
                <Button
                  onClick={handleQuickAssignMock}
                  disabled={assigningBed}
                  size="sm"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  {assigningBed ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                  Assign to Bed 304B
                </Button>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Select Available Bed</label>
              <Select value={targetBedId} onValueChange={(val: string | null) => val && setTargetBedId(val)}>
                <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800 text-xs">
                  <SelectValue placeholder="Choose an available bed" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-800 max-h-56">
                  {beds
                    .filter((b) => b.status === 'AVAILABLE')
                    .map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        Bed {b.bed_number} ({b.department_name || 'General'}, {b.bed_type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Notes (Optional)</label>
              <Input
                placeholder="Clinical reason or admission notes"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="bg-white border-slate-200 text-xs"
              />
            </div>

            <Button
              onClick={handleDirectAssignBed}
              disabled={assigningBed || !targetBedId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              {assigningBed ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Confirm Allocation
            </Button>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAssignDialogOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
