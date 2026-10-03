'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPatients, registerPatientIntake, getAvailableDoctors } from '@/lib/api';
import { Patient } from '@/types';
import { 
  Loader2, 
  Search, 
  AlertCircle, 
  Users, 
  UserPlus, 
  Stethoscope, 
  Sparkles, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Printer, 
  ChevronRight,
  Activity,
  Heart,
  Brain,
  Bone,
  Baby,
  Thermometer,
  ShieldAlert
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DISCOMFORT_PRESETS = [
  { label: "Chest Pain / Heart", category: "Severe chest pain with heart palpitations", icon: Heart, dept: "Cardiology" },
  { label: "Severe Migraine / Neuro", category: "Severe migraine headache with sudden dizziness", icon: Brain, dept: "Neurology" },
  { label: "Fracture / Joint Sprain", category: "Fractured limb with bone deformity and joint swelling", icon: Bone, dept: "Orthopedics" },
  { label: "Fever & Viral Flu", category: "High fever, viral chills, body ache and severe fatigue", icon: Thermometer, dept: "General Medicine" },
  { label: "Stomach / Abdominal Ache", category: "Acute abdominal pain with persistent nausea", icon: Activity, dept: "Surgery / GI" },
  { label: "Pediatric Wellness Check", category: "Pediatric wellness checkup and routine child vaccination", icon: Baby, dept: "Pediatrics" },
];

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Intake Modal State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeSuccessResult, setIntakeSuccessResult] = useState<any | null>(null);

  // Doctors list for manual override
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [allocationMode, setAllocationMode] = useState<'AUTO' | 'MANUAL'>('AUTO');

  // Intake Form fields
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '1992-06-15',
    gender: 'MALE',
    contact_phone: '+1-555-0182',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: 'Metropolitan District',
    insurance_id: '',
    discomfort_type: 'Severe chest pain with heart palpitations',
    symptoms_description: '',
    priority: 'MEDIUM',
    preferred_doctor_id: ''
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let result = patients;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        return fullName.includes(q) || (p.mrn && p.mrn.toLowerCase().includes(q));
      });
    }
    setFilteredPatients(result);
  }, [search, patients]);

  const handleOpenIntakeModal = async () => {
    setIsIntakeOpen(true);
    setIntakeSuccessResult(null);
    try {
      const docs = await getAvailableDoctors();
      setDoctorsList(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePresetSelect = (preset: typeof DISCOMFORT_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      discomfort_type: preset.category,
      symptoms_description: `Initial triage: Patient presents with ${preset.label.toLowerCase()} symptoms.`
    }));
  };

  const handleSubmitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.discomfort_type) {
      alert("Please enter patient name and discomfort.");
      return;
    }

    setIntakeLoading(true);
    try {
      const payload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        contact_phone: formData.contact_phone || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        address: formData.address || undefined,
        insurance_id: formData.insurance_id || undefined,
        discomfort_type: formData.discomfort_type,
        symptoms_description: formData.symptoms_description || undefined,
        priority: formData.priority,
      };

      if (allocationMode === 'MANUAL' && formData.preferred_doctor_id) {
        payload.preferred_doctor_id = parseInt(formData.preferred_doctor_id);
      }

      const res = await registerPatientIntake(payload);
      setIntakeSuccessResult(res);
      // Refresh patient roster in background
      fetchPatients();
    } catch (err: any) {
      console.error("Intake Error:", err);
      alert(err.response?.data?.detail || "Failed to complete patient intake. Please try again.");
    } finally {
      setIntakeLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '1992-06-15',
      gender: 'MALE',
      contact_phone: '+1-555-0182',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      address: 'Metropolitan District',
      insurance_id: '',
      discomfort_type: 'Severe chest pain with heart palpitations',
      symptoms_description: '',
      priority: 'MEDIUM',
      preferred_doctor_id: ''
    });
    setIntakeSuccessResult(null);
  };

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
        <h2 className="text-xl font-bold">Error Loading Patients</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchPatients} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      {/* Header and Intake Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl">
            <Users className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Directory & Intake</h1>
            <p className="text-xs font-medium text-slate-500">Live roster of admitted inpatients and registered outpatient consultations</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search MRN, Name..."
              className="pl-9 bg-slate-50 border-slate-200 text-slate-900 w-full text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleOpenIntakeModal}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 shadow-xs"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Outpatient Intake & Doctor Mapping
          </Button>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 text-sm">Active Patient Directory</span>
            <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-bold text-xs">
              {filteredPatients.length} Records
            </Badge>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click any row to inspect clinical timeline & summaries</span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p>No patients found matching your search.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-600 font-bold text-xs">MRN</TableHead>
                <TableHead className="text-slate-600 font-bold text-xs">Patient Name</TableHead>
                <TableHead className="text-slate-600 font-bold text-xs">Date of Birth</TableHead>
                <TableHead className="text-slate-600 font-bold text-xs">Gender</TableHead>
                <TableHead className="text-slate-600 font-bold text-xs">Blood Group</TableHead>
                <TableHead className="text-slate-600 font-bold text-xs">Phone Contact</TableHead>
                <TableHead className="text-slate-600 font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow 
                  key={patient.id} 
                  className="border-slate-200/80 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-teal-700">{patient.mrn}</TableCell>
                  <TableCell className="font-bold text-slate-900">{patient.first_name} {patient.last_name}</TableCell>
                  <TableCell className="text-slate-600 font-medium text-xs">{patient.date_of_birth || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-semibold text-xs">
                      {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">{patient.blood_type || 'O+'}</TableCell>
                  <TableCell className="text-slate-600 text-xs font-medium">{patient.contact_phone || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50">
                      View Profile <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ADMIN INTAKE & SMART DOCTOR MAPPING MODAL */}
      <Dialog open={isIntakeOpen} onOpenChange={setIsIntakeOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl max-h-[90vh] overflow-y-auto">
          {!intakeSuccessResult ? (
            <form onSubmit={handleSubmitIntake} className="space-y-5">
              <DialogHeader>
                <div className="flex items-center space-x-2 text-teal-700">
                  <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
                    <UserPlus className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900">
                      Outpatient Intake & Doctor Scheduling
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Logs new walk-in outpatients and automatically maps them to available specialized doctors.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* SECTION 1: QUICK DISCOMFORT PRESETS */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Quick Discomfort / Presentation:
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DISCOMFORT_PRESETS.map((p, idx) => {
                    const IconComp = p.icon;
                    const isSelected = formData.discomfort_type === p.category;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(p)}
                        className={`p-2.5 rounded-xl border text-left flex items-start space-x-2 transition-all text-xs ${
                          isSelected 
                            ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-200 font-bold'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="leading-tight">{p.label}</div>
                          <span className="text-[10px] text-teal-700 font-semibold">{p.dept}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: CLINICAL DISCOMFORT DETAILS */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700 text-xs">Primary Discomfort / Chief Complaint</Label>
                  <Input 
                    value={formData.discomfort_type}
                    onChange={e => setFormData({...formData, discomfort_type: e.target.value})}
                    placeholder="e.g. Chest tightness, joint swelling, dizziness..."
                    className="bg-white border-slate-200 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">Clinical Triage Priority</Label>
                    <Select value={formData.priority} onValueChange={val => val && setFormData({...formData, priority: val})}>
                      <SelectTrigger className="bg-white border-slate-200 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low (Routine Checkup)</SelectItem>
                        <SelectItem value="MEDIUM">Medium (Standard Outpatient)</SelectItem>
                        <SelectItem value="HIGH">High (Urgent Consultation)</SelectItem>
                        <SelectItem value="CRITICAL">Critical (Stat Emergency Review)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">Doctor Allocation Strategy</Label>
                    <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setAllocationMode('AUTO')}
                        className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all flex items-center justify-center ${
                          allocationMode === 'AUTO' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Smart AI Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocationMode('MANUAL')}
                        className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all flex items-center justify-center ${
                          allocationMode === 'MANUAL' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Manual Selection
                      </button>
                    </div>
                  </div>
                </div>

                {allocationMode === 'MANUAL' && (
                  <div className="space-y-1 pt-1">
                    <Label className="font-semibold text-slate-700 text-xs">Select Attending Doctor</Label>
                    <Select 
                      value={formData.preferred_doctor_id} 
                      onValueChange={val => setFormData({...formData, preferred_doctor_id: val || ''})}
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-xs">
                        <SelectValue placeholder="Choose a doctor on duty..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {doctorsList.map(doc => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>
                            {doc.name} • {doc.department_name} ({doc.room}) — {doc.active_queue} in queue
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="font-semibold text-slate-700 text-xs">Symptoms Description / Triage Notes (Optional)</Label>
                  <Textarea 
                    value={formData.symptoms_description}
                    onChange={e => setFormData({...formData, symptoms_description: e.target.value})}
                    placeholder="Onset time, severity, previous medical history..."
                    className="bg-white border-slate-200 text-xs h-16"
                  />
                </div>
              </div>

              {/* SECTION 3: PATIENT DEMOGRAPHICS */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Patient Demographics
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">First Name</Label>
                    <Input 
                      value={formData.first_name}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                      placeholder="e.g. John"
                      className="bg-slate-50 border-slate-200 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">Last Name</Label>
                    <Input 
                      value={formData.last_name}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                      placeholder="e.g. Doe"
                      className="bg-slate-50 border-slate-200 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">Date of Birth</Label>
                    <Input 
                      type="date"
                      value={formData.date_of_birth}
                      onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                      className="bg-slate-50 border-slate-200 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">Gender</Label>
                    <Select value={formData.gender} onValueChange={val => val && setFormData({...formData, gender: val})}>
                      <SelectTrigger className="bg-slate-50 border-slate-200 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-xs">Contact Phone</Label>
                    <Input 
                      value={formData.contact_phone}
                      onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                      placeholder="+1-555-..."
                      className="bg-slate-50 border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsIntakeOpen(false)}
                  className="border-slate-300 text-slate-700 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={intakeLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  {intakeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Evaluating Schedule & Mapping Doctor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Register Outpatient & Allocate Doctor
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* INTAKE CONFIRMATION & CONSULTATION TICKET SLIP */
            <div className="space-y-5 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-300">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Outpatient Intake Confirmed!</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Patient registered and mapped to attending doctor schedule.
                </p>
              </div>

              {/* TICKET CARD */}
              <div className="bg-slate-50 border-2 border-dashed border-teal-300 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Token</span>
                    <span className="text-2xl font-black text-teal-800 font-mono tracking-tight">
                      {intakeSuccessResult.consultation.token_number}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-bold text-xs">
                      {intakeSuccessResult.consultation.priority} PRIORITY
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500 block mt-1 font-semibold">
                      MRN: {intakeSuccessResult.mrn}
                    </span>
                  </div>
                </div>

                {/* DOCTOR CARD */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-600">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Attending Doctor</p>
                      <h4 className="text-base font-bold text-slate-900">{intakeSuccessResult.assigned_doctor.name}</h4>
                      <p className="text-xs font-semibold text-teal-700">
                        {intakeSuccessResult.assigned_doctor.specialization} ({intakeSuccessResult.assigned_doctor.department_name})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-teal-600" />
                      {intakeSuccessResult.assigned_doctor.room_number}
                    </span>
                  </div>
                </div>

                {/* SCHEDULE TIMING & QUEUE */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Queue Position</span>
                    <span className="text-base font-bold text-slate-900">
                      #{intakeSuccessResult.consultation.queue_position} in line
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Wait</span>
                    <span className="text-base font-bold text-teal-700">
                      ~{intakeSuccessResult.consultation.estimated_wait_minutes} mins
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slot Estimate</span>
                    <span className="text-base font-bold text-slate-900">
                      {intakeSuccessResult.consultation.estimated_start_time}
                    </span>
                  </div>
                </div>

                {/* AI MAPPING REASON */}
                <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100 text-xs text-teal-900 space-y-1">
                  <span className="font-bold flex items-center text-teal-800 text-[11px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" /> System Allocation Logic
                  </span>
                  <p className="font-medium text-slate-700">{intakeSuccessResult.mapping_reason}</p>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 text-xs font-semibold"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Consultation Slip
                </Button>
                <Button 
                  variant="outline"
                  className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 text-xs font-bold"
                  onClick={resetForm}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Intake Another Patient
                </Button>
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                  onClick={() => setIsIntakeOpen(false)}
                >
                  Done & Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
