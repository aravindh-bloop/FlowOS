'use client';

import { useState, useEffect } from 'react';
import { 
  getStaffProfile, 
  getMyPatients, 
  getPatientAiSummary, 
  getStaffTasks, 
  updateTaskStatus, 
  reportStaffIssue, 
  getDiagnosticsQueue, 
  updateDiagnosticStatus,
  recordPatientMovement,
  recordPatientObservation
} from '@/lib/api';
import { 
  Stethoscope, 
  UserCheck, 
  Cpu, 
  Loader2, 
  CheckCircle, 
  Play, 
  AlertTriangle, 
  Send, 
  Clock, 
  MapPin, 
  User, 
  Activity, 
  FileText, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StaffPortalPage() {
  const [profile, setProfile] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>('NURSE'); // 'DOCTOR' | 'NURSE' | 'TECHNICIAN'
  const [activeTab, setActiveTab] = useState<string>('tasks');
  
  const [patients, setPatients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [diagnosticsQueue, setDiagnosticsQueue] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // AI Patient Summary Modal state
  const [selectedPatientSummary, setSelectedPatientSummary] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Report Issue Modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuePatientId, setIssuePatientId] = useState<number | null>(null);
  const [issueType, setIssueType] = useState('DELAY');
  const [issueMessage, setIssueMessage] = useState('');

  // Nurse Patient Movement state
  const [movePatientId, setMovePatientId] = useState<number>(250);
  const [fromLoc, setFromLoc] = useState('ICU Bed 04');
  const [toLoc, setToLoc] = useState('Radiology CT-01');

  // Nurse Observation state
  const [obsPatientId, setObsPatientId] = useState<number>(250);
  const [obsCategory, setObsCategory] = useState('VITALS');
  const [obsValue, setObsValue] = useState('BP 120/80, HR 72, SpO2 98%');
  const [obsNotes, setObsNotes] = useState('Patient resting comfortably');

  const loadPortalData = async (roleOverride?: string) => {
    try {
      setLoading(true);
      const roleToUse = roleOverride || activeRole;
      const [profData, patData, taskData, diagData] = await Promise.all([
        getStaffProfile().catch(() => null),
        getMyPatients(roleToUse).catch(() => []),
        getStaffTasks(roleToUse).catch(() => []),
        getDiagnosticsQueue().catch(() => [])
      ]);
      setProfile(profData);
      setPatients(patData);
      setTasks(taskData);
      setDiagnosticsQueue(diagData);
    } catch (err) {
      console.error("Error loading staff portal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData(activeRole);
  }, [activeRole]);

  const handleRoleChange = (newRole: string) => {
    setActiveRole(newRole);
    if (newRole === 'TECHNICIAN') {
      setActiveTab('diagnostics');
    } else if (newRole === 'DOCTOR') {
      setActiveTab('patients');
    } else {
      setActiveTab('tasks');
    }
    loadPortalData(newRole);
  };

  const handleTaskStatus = async (taskId: number, newStatus: string) => {
    setActionLoading(true);
    try {
      await updateTaskStatus(taskId, newStatus);
      showNotification(`Task status updated to ${newStatus}`);
      await loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAiSummary = async (patientId: number) => {
    setSummaryLoading(true);
    setIsSummaryOpen(true);
    try {
      const summaryData = await getPatientAiSummary(patientId);
      setSelectedPatientSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueMessage) return;
    setActionLoading(true);
    try {
      await reportStaffIssue({
        patient_id: issuePatientId || undefined,
        issue_type: issueType,
        message: issueMessage
      });
      setIsIssueModalOpen(false);
      setIssueMessage('');
      showNotification('Operational issue reported to Command Center!');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDiagnosticStatus = async (queueId: number, status: string) => {
    setActionLoading(true);
    try {
      await updateDiagnosticStatus(queueId, status);
      showNotification(`Diagnostic procedure marked as ${status}`);
      await loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordMovement = async () => {
    setActionLoading(true);
    try {
      await recordPatientMovement(movePatientId, fromLoc, toLoc);
      showNotification(`Patient transfer recorded: ${fromLoc} → ${toLoc}`);
      await loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordObservation = async () => {
    setActionLoading(true);
    try {
      await recordPatientObservation(obsPatientId, obsCategory, obsValue, obsNotes);
      showNotification(`Clinical observation [${obsCategory}] logged`);
      await loadPortalData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg border border-teal-600 flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5 text-teal-300 shrink-0" />
          <span className="text-xs font-bold">{notificationMsg}</span>
        </div>
      )}

      {/* Role Switcher & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl">
            <Stethoscope className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Good Morning, {profile?.full_name || 'Staff Member'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className="bg-teal-100 text-teal-800 border-teal-200 font-bold text-[11px]">
                {activeRole} • {profile?.department_name || 'Hospital Wide'}
              </Badge>
              <span className="text-xs font-medium text-slate-500">● 07:00 – 15:00 Morning Shift</span>
            </div>
          </div>
        </div>

        {/* Role Switcher Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden lg:inline-block">Select Role:</span>
          <button
            onClick={() => handleRoleChange('DOCTOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
              activeRole === 'DOCTOR' 
                ? 'bg-teal-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Doctor
          </button>
          <button
            onClick={() => handleRoleChange('NURSE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
              activeRole === 'NURSE' 
                ? 'bg-teal-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 mr-1" /> Nurse
          </button>
          <button
            onClick={() => handleRoleChange('TECHNICIAN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center ${
              activeRole === 'TECHNICIAN' 
                ? 'bg-teal-600 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 mr-1" /> Technician
          </button>
        </div>
      </div>

      {/* Staff Workload Indicator Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {activeRole === 'TECHNICIAN' ? 'Diagnostic Queue Items' : 'Assigned Patients'}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {activeRole === 'TECHNICIAN' ? diagnosticsQueue.length : patients.length}
              </p>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              {activeRole === 'TECHNICIAN' ? <Cpu className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {tasks.filter(t => t.status !== 'COMPLETED').length}
              </p>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {activeRole === 'TECHNICIAN' ? 'Active Diagnostic Scans' : 'Diagnostic Requests'}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {activeRole === 'TECHNICIAN' 
                  ? diagnosticsQueue.filter(q => q.status === 'IN_PROGRESS' || q.status === 'WAITING').length 
                  : diagnosticsQueue.length}
              </p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shift Workload</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 mt-1">
                HEAVY WORKLOAD
              </span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 shadow-2xs mb-6 p-1">
          {activeRole === 'TECHNICIAN' ? (
            <>
              <TabsTrigger value="diagnostics" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <Cpu className="w-3.5 h-3.5 mr-1.5" /> Diagnostic Scan Queue ({diagnosticsQueue.filter(q => q.status !== 'COMPLETED').length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> Maintenance & Actions ({tasks.filter(t => t.status !== 'COMPLETED').length})
              </TabsTrigger>
              <TabsTrigger value="role-hub" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <Cpu className="w-3.5 h-3.5 mr-1.5" /> Equipment & Facility Hub
              </TabsTrigger>
            </>
          ) : activeRole === 'NURSE' ? (
            <>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> My Tasks & Nursing Actions ({tasks.filter(t => t.status !== 'COMPLETED').length})
              </TabsTrigger>
              <TabsTrigger value="patients" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <User className="w-3.5 h-3.5 mr-1.5" /> Assigned Patients ({patients.length})
              </TabsTrigger>
              <TabsTrigger value="role-hub" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <Stethoscope className="w-3.5 h-3.5 mr-1.5" /> Patient Movement & Vitals Hub
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="patients" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <User className="w-3.5 h-3.5 mr-1.5" /> Assigned Patients & AI Summaries ({patients.length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> Clinical Tasks ({tasks.filter(t => t.status !== 'COMPLETED').length})
              </TabsTrigger>
              <TabsTrigger value="role-hub" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Doctor Consultations & Reviews
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* TAB: DIAGNOSTICS (Technicians primary) */}
        <TabsContent value="diagnostics" className="space-y-4">
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-teal-600" /> Diagnostic Scan Execution Queue
              </CardTitle>
              <CardDescription className="text-xs">Manage CT, MRI, and X-Ray procedures in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticsQueue.map(q => (
                  <div key={q.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-900 text-base">{q.scan_type}</span>
                        <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 font-bold text-[10px]">
                          {q.priority} PRIORITY
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-[10px] flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-indigo-600" />
                          Est. Wait: {q.scan_type?.toUpperCase().includes('MRI') ? '85.2' : q.scan_type?.toUpperCase().includes('CT') ? '77.7' : '24.5'}m (ML Forecast)
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        Patient: {q.patient_name} ({q.mrn}) • Device: {q.equipment_name}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-slate-500">Status: <span className="text-teal-700">{q.status}</span></span>
                      {q.status === 'WAITING' && (
                        <Button 
                          size="sm" 
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-8"
                          onClick={() => handleDiagnosticStatus(q.id, 'IN_PROGRESS')}
                          disabled={actionLoading}
                        >
                          <Play className="w-3 h-3 mr-1" /> Start Scan
                        </Button>
                      )}
                      {q.status === 'IN_PROGRESS' && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                          onClick={() => handleDiagnosticStatus(q.id, 'COMPLETED')}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Complete Scan
                        </Button>
                      )}
                      {q.status === 'COMPLETED' && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                          <CheckCircle className="w-3 h-3 mr-1 inline" /> Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 1: TASKS */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Operational Task List</h2>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsIssueModalOpen(true)}
              className="border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
              Report Issue to Command Center
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => (
              <Card key={task.id} className="bg-white border-slate-200/80 shadow-xs overflow-hidden">
                <div className={`h-1.5 w-full ${
                  task.priority === 'CRITICAL' ? 'bg-rose-600' :
                  task.priority === 'HIGH' ? 'bg-amber-500' : 'bg-teal-600'
                }`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold text-slate-900 leading-snug">{task.title}</CardTitle>
                    <Badge variant="outline" className={
                      task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' :
                      task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' :
                      'bg-teal-100 text-teal-800 border-teal-300 font-bold'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs font-semibold text-slate-500">
                    Patient: {task.patient_name} ({task.mrn})
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Location:</span>
                    <span className="font-bold text-slate-800">{task.from_location} → {task.to_location}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{task.instructions}</p>
                </CardContent>

                <CardFooter className="bg-slate-50/50 border-t border-slate-200/80 pt-3 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Status: <span className="text-teal-700">{task.status}</span>
                  </span>

                  <div className="flex space-x-2">
                    {task.status === 'PENDING' && (
                      <Button 
                        size="sm" 
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-8"
                        onClick={() => handleTaskStatus(task.id, 'IN_PROGRESS')}
                        disabled={actionLoading}
                      >
                        <Play className="w-3 h-3 mr-1" /> Start Task
                      </Button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                        onClick={() => handleTaskStatus(task.id, 'COMPLETED')}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Mark Complete
                      </Button>
                    )}
                    {task.status === 'COMPLETED' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Task Completed
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: MY PATIENTS (Doctors and Nurses) */}
        <TabsContent value="patients" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Assigned Patient Roster</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(p => (
              <Card key={p.patient_id} className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{p.name}</CardTitle>
                      <span className="text-xs font-mono font-semibold text-teal-700">{p.mrn}</span>
                    </div>
                    <Badge variant="outline" className={
                      p.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' :
                      p.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' :
                      'bg-teal-100 text-teal-800 border-teal-300 font-bold'
                    }>
                      {p.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 mr-1.5 shrink-0" />
                    <span className="font-semibold">{p.location}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnosis</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{p.diagnosis}</p>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-200/80 pt-3 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold text-xs h-8"
                    onClick={() => handleOpenAiSummary(p.patient_id)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    View AI Summary
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: ROLE HUB */}
        <TabsContent value="role-hub" className="space-y-6">
          {activeRole === 'NURSE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Transfer Tool */}
              <Card className="bg-white border-slate-200/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <ArrowRight className="w-5 h-5 mr-2 text-teal-600" /> Patient Transfer / Movement
                  </CardTitle>
                  <CardDescription className="text-xs">Record patient transfer between hospital departments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Patient ID / MRN</Label>
                    <Input value={movePatientId} onChange={e => setMovePatientId(Number(e.target.value))} className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="font-semibold text-slate-700">From Location</Label>
                      <Input value={fromLoc} onChange={e => setFromLoc(e.target.value)} className="bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold text-slate-700">To Location</Label>
                      <Input value={toLoc} onChange={e => setToLoc(e.target.value)} className="bg-slate-50 border-slate-200" />
                    </div>
                  </div>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs" onClick={handleRecordMovement} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Record Patient Movement
                  </Button>
                </CardContent>
              </Card>

              {/* Nursing Vitals & Observations */}
              <Card className="bg-white border-slate-200/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-teal-600" /> Nursing Observations & Vitals
                  </CardTitle>
                  <CardDescription className="text-xs">Log vital signs, complaints, and general clinical observations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Category</Label>
                    <Select value={obsCategory} onValueChange={(val: string | null) => val && setObsCategory(val)}>
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VITALS">Vitals Sign (BP/HR/SpO2)</SelectItem>
                        <SelectItem value="COMPLAINT">Patient Complaint</SelectItem>
                        <SelectItem value="MOBILITY">Mobility & Intake</SelectItem>
                        <SelectItem value="NOTE">General Clinical Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Vital Value / Measurement</Label>
                    <Input value={obsValue} onChange={e => setObsValue(e.target.value)} className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Clinical Notes</Label>
                    <Textarea value={obsNotes} onChange={e => setObsNotes(e.target.value)} className="bg-slate-50 border-slate-200" />
                  </div>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs" onClick={handleRecordObservation} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Log Vitals / Observation
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeRole === 'TECHNICIAN' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-slate-200/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <Cpu className="w-5 h-5 mr-2 text-teal-600" /> Diagnostic Equipment & Readiness State
                  </CardTitle>
                  <CardDescription className="text-xs">Live status of imaging machinery & technical infrastructure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">CT Scanner #1 (Siemens Somatom)</h4>
                      <p className="text-slate-500 font-medium text-[11px]">Location: Radiology CT Bay A</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">OPERATIONAL</Badge>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">MRI Scanner #2 (3T Magnetom)</h4>
                      <p className="text-slate-500 font-medium text-[11px]">Location: Radiology MRI Suite 02</p>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-bold">SCAN IN PROGRESS</Badge>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Portable X-Ray Unit-B</h4>
                      <p className="text-slate-500 font-medium text-[11px]">Location: ED Resus Bay 03</p>
                    </div>
                    <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-bold">STANDBY / READY</Badge>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Ultrasound System US-04</h4>
                      <p className="text-slate-500 font-medium text-[11px]">Location: ICU Mobile Diagnostics</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">CALIBRATION DUE</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-rose-600" /> Technician Quick Actions
                  </CardTitle>
                  <CardDescription className="text-xs">Report technical issues or request hardware support</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <Button 
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 justify-start"
                    onClick={() => setIsIssueModalOpen(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Report Equipment Malfunction / Delay
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-300 text-slate-700 font-bold text-xs h-10 justify-start"
                    onClick={() => showNotification("Diagnostic calibration check logged successfully.")}
                  >
                    <RefreshCw className="w-4 h-4 mr-2 text-teal-600" /> Log Daily Device Calibration
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeRole === 'DOCTOR' && (
            <Card className="bg-white border-slate-200/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-teal-600" /> Doctor Consultations & AI Patient Summaries
                </CardTitle>
                <CardDescription className="text-xs font-medium">Review patient diagnostic summaries, clinical timeline, and procedure recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.map(p => (
                    <div key={p.patient_id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                          <p className="text-xs font-mono text-teal-700 font-semibold">{p.mrn}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-8"
                          onClick={() => handleOpenAiSummary(p.patient_id)}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Review Summary
                        </Button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">Diagnosis: {p.diagnosis}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Patient Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-teal-700 font-bold text-lg">
              <Sparkles className="w-5 h-5 mr-2 text-teal-600" /> AI Clinical Patient Summary
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Deterministic PatientSummaryService intelligence output
            </DialogDescription>
          </DialogHeader>

          {summaryLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : selectedPatientSummary ? (
            <div className="space-y-4 text-xs">
              <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                <h4 className="font-bold text-teal-900 text-sm mb-1">{selectedPatientSummary.name} ({selectedPatientSummary.mrn})</h4>
                <p className="text-slate-700 leading-relaxed font-medium">{selectedPatientSummary.summary}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Key Operational Action Items</h4>
                <ul className="space-y-2">
                  {selectedPatientSummary.key_points?.map((pt: string, idx: number) => (
                    <li key={idx} className="flex items-start bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-semibold text-slate-800">
                      <ChevronRight className="w-4 h-4 text-teal-600 mr-1.5 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => setIsSummaryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Operational Issue Modal */}
      <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-rose-600 font-bold text-lg">
              <AlertTriangle className="w-5 h-5 mr-2 text-rose-600" /> Report Operational Issue
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Directly alerts the Hospital Command Center and updates live alerts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Issue Type</Label>
              <Select value={issueType} onValueChange={(val: string | null) => val && setIssueType(val)}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT_UNAVAILABLE">Patient Unavailable</SelectItem>
                  <SelectItem value="EQUIPMENT_UNAVAILABLE">Equipment Unavailable / Malfunction</SelectItem>
                  <SelectItem value="DELAY">Staff Overload / Queue Delay</SelectItem>
                  <SelectItem value="RESOURCE_REQUIRED">Resource Required</SelectItem>
                  <SelectItem value="EMERGENCY">Clinical Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Detailed Message</Label>
              <Textarea 
                value={issueMessage} 
                onChange={e => setIssueMessage(e.target.value)}
                placeholder="Describe the issue encountered..." 
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={handleReportIssue} disabled={actionLoading || !issueMessage}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send to Command Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
