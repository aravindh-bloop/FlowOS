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

  useEffect(() => {
    if (!id) return;
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const data = await getPatient(id);
        setPatient(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch patient details');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-950 text-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Patient Not Found</h2>
        <p className="text-gray-400">{error || 'Could not load patient details.'}</p>
        <Button onClick={() => router.push('/patients')} variant="outline" className="border-gray-700 hover:bg-gray-800">
          Back to Patients
        </Button>
      </div>
    );
  }

  const currentAdm = patient.current_admission || (patient.admissions && patient.admissions[0]);

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-400 hover:text-gray-100 hover:bg-gray-900">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          {patient.first_name} {patient.last_name}
          <span className="text-sm font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">MRN: {patient.mrn}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-gray-200">
                <User className="w-5 h-5 mr-2 text-blue-400" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-200">{patient.date_of_birth || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium text-gray-200">{patient.gender || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Blood Type</p>
                  <p className="font-medium text-gray-200">{patient.blood_type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium text-gray-200">{patient.contact_phone || 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-gray-200">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Current Admission
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAdm ? (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center mb-1"><MapPin className="w-3 h-3 mr-1"/> Location</p>
                    <p className="font-medium text-gray-200">{currentAdm.department_name || 'Department'} - Bed {currentAdm.bed_number || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{currentAdm.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">{currentAdm.priority}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center mb-1"><Calendar className="w-3 h-3 mr-1"/> Admission Date</p>
                    <p className="font-medium text-gray-200">{currentAdm.admission_date ? new Date(currentAdm.admission_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="col-span-2 bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <p className="text-sm text-gray-500 mb-2">Diagnosis</p>
                    <p className="text-gray-200">{currentAdm.diagnosis || 'Pending evaluation'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No active admission recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-gray-200">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Patient Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientJourney events={patient.events || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
