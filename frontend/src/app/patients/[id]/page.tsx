'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPatient } from '@/lib/api';
import { PatientDetail } from '@/types';
import { Loader2, AlertCircle, ChevronLeft, User, Activity, MapPin, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientJourney } from '@/components/patients/patient-journey';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      const data = await getPatient(id);
      setPatient(data);
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

  const currentAdm = patient.current_admission || (patient.admissions && patient.admissions[0]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="border-slate-300 text-slate-700 bg-white hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
          {patient.first_name} {patient.last_name}
          <span className="text-xs font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full font-bold">MRN: {patient.mrn}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center text-base font-bold text-slate-900">
                <User className="w-5 h-5 mr-2 text-teal-600" />
                Patient Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</p>
                  <p className="font-bold text-slate-800">{patient.date_of_birth || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Gender</p>
                  <p className="font-bold text-slate-800">{patient.gender || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Blood Type</p>
                  <p className="font-bold text-slate-800">{patient.blood_type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Contact Phone</p>
                  <p className="font-bold text-slate-800">{patient.contact_phone || 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center text-base font-bold text-slate-900">
                <Activity className="w-5 h-5 mr-2 text-teal-600" />
                Active Clinical Admission
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAdm ? (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1"><MapPin className="w-3.5 h-3.5 mr-1 text-teal-600"/> Assigned Location</p>
                    <p className="font-bold text-slate-900">{currentAdm.department_name || 'Department'} - Bed {currentAdm.bed_number || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                    <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 font-semibold">{currentAdm.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Triage Priority</p>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-semibold">{currentAdm.priority}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase flex items-center mb-1"><Calendar className="w-3.5 h-3.5 mr-1 text-teal-600"/> Admission Date</p>
                    <p className="font-bold text-slate-800">{currentAdm.admission_date ? new Date(currentAdm.admission_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60 mt-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admitting Diagnosis</p>
                    <p className="text-slate-800 text-sm font-semibold">{currentAdm.diagnosis || 'Pending evaluation'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No active admission recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

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
    </div>
  );
}
