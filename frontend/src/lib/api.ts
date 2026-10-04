import axios from 'axios';
import {
  LoginRequest,
  TokenResponse,
  DashboardOverview,
  Patient,
  PatientDetail,
  Bed,
  Staff,
  Equipment,
  OperatingTheatre,
  HospitalEvent,
  Alert,
  Notification,
  Prediction,
  Bottleneck,
  Recommendation,
  Analytics,
  DepartmentAnalytics
} from '../types';
import { getToken, removeToken } from './auth';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://flowos-a6te.onrender.com/api').replace(/\/+$/, '');
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      removeToken();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = (data: LoginRequest): Promise<TokenResponse> => api.post('/auth/login', data).then((res) => res.data);
export const getDashboard = (): Promise<DashboardOverview> => api.get('/dashboard/overview').then((res) => res.data);
export const getPatients = (params?: any): Promise<Patient[]> => api.get('/patients', { params }).then((res) => res.data);
export const getPatient = (id: number | string): Promise<PatientDetail> => api.get(`/patients/${id}`).then((res) => res.data);
export const getBeds = (params?: any): Promise<Bed[]> => api.get('/beds', { params }).then((res) => res.data);
export const getBedSummary = (): Promise<any> => api.get('/beds/summary').then((res) => res.data);
export const assignBed = (bedId: number | string, data: { patient_id: number; notes?: string }): Promise<Bed> => api.post(`/beds/${bedId}/assign`, data).then((res) => res.data);
export const releaseBed = (bedId: number | string): Promise<Bed> => api.post(`/beds/${bedId}/release`, {}).then((res) => res.data);
export const transferBed = (bedId: number | string, data: { to_bed_id: number; reason?: string }): Promise<Bed> => api.post(`/beds/${bedId}/transfer`, data).then((res) => res.data);
export const assignMockPatientBed = (): Promise<Bed> => api.post('/beds/assign-mock-patient', {}).then((res) => res.data);
export const scanRfidBed = (data: {
  user_id?: number | string;
  bed_id: number | string;
  action?: string;
  status?: string;
  reader_id?: string;
  notes?: string;
}): Promise<any> => api.post('/rfid/scan', data).then((res) => res.data);
export const getStaff = (params?: any): Promise<Staff[]> => api.get('/staff', { params }).then((res) => res.data);
export const getStaffDetail = (id: number | string): Promise<Staff> => api.get(`/staff/${id}`).then((res) => res.data);
export const getResources = (): Promise<Equipment[]> => api.get('/resources').then((res) => res.data);
export const getOperatingTheatres = (): Promise<OperatingTheatre[]> => api.get('/resources/operating-theatres').then((res) => res.data);
export const getEvents = (params?: any): Promise<HospitalEvent[]> => api.get('/events', { params }).then((res) => res.data);
export const getAlerts = (params?: any): Promise<Alert[]> => api.get('/alerts', { params }).then((res) => res.data);
export const acknowledgeAlert = (id: number | string): Promise<void> => api.post(`/alerts/${id}/acknowledge`, {}).then((res) => res.data);
export const getNotifications = (): Promise<Notification[]> => api.get('/notifications').then((res) => res.data);
export const getPredictions = (): Promise<Prediction[]> => api.get('/predictions').then((res) => res.data);
export const generatePredictions = (): Promise<Prediction[]> => api.post('/predictions/generate', {}).then((res) => res.data);
export const getBottlenecks = (): Promise<Bottleneck[]> => api.get('/bottlenecks').then((res) => res.data);
export const getBottleneckDetail = (id: number | string): Promise<Bottleneck> => api.get(`/bottlenecks/${id}`).then((res) => res.data);
export const detectBottlenecks = (): Promise<Bottleneck[]> => api.post('/bottlenecks/detect', {}).then((res) => res.data);
export const getRecommendations = (): Promise<Recommendation[]> => api.get('/orchestration/recommendations').then((res) => res.data);
export const getRecommendation = (id: number | string): Promise<Recommendation> => api.get(`/orchestration/recommendations/${id}`).then((res) => res.data);
export const generateRecommendation = (bottleneckId?: number | string): Promise<Recommendation> => api.post(`/orchestration/recommend${bottleneckId ? `?bottleneck_id=${bottleneckId}` : ''}`, {}).then((res) => res.data);
export const approveAction = (id: number | string, notes?: string): Promise<any> => api.post(`/orchestration/actions/${id}/approve`, { notes: notes || '' }).then((res) => res.data);
export const rejectAction = (id: number | string, reason?: string): Promise<any> => api.post(`/orchestration/actions/${id}/reject`, { reason: reason || '', notes: reason || '' }).then((res) => res.data);
export const executeAction = (id: number | string): Promise<any> => api.post(`/orchestration/actions/${id}/execute`, {}).then((res) => res.data);
export const declareEmergency = (data: any): Promise<any> => api.post('/emergencies', data).then((res) => res.data);
export const getEmergencies = (): Promise<any[]> => api.get('/emergencies').then((res) => res.data);
export const getEmergencyDetail = (id: number | string): Promise<any> => api.get(`/emergencies/${id}`).then((res) => res.data);
export const respondToEmergency = (id: number | string): Promise<any> => api.post(`/emergencies/${id}/respond`, {}).then((res) => res.data);
export const getAnalytics = (): Promise<Analytics> => api.get('/analytics').then((res) => res.data);
export const getDepartmentAnalytics = (id: number | string): Promise<DepartmentAnalytics> => api.get(`/analytics/department/${id}`).then((res) => res.data);

// Staff Portal Endpoints (Portal 2)
export const getStaffProfile = (): Promise<any> => api.get('/staff-portal/me').then((res) => res.data);
export const getMyPatients = (role?: string, department_id?: number): Promise<any[]> => api.get('/staff-portal/my-patients', { params: { role, department_id } }).then((res) => res.data);
export const getPatientAiSummary = (patient_id: number | string): Promise<any> => api.get(`/staff-portal/patient-summary/${patient_id}`).then((res) => res.data);
export const getStaffTasks = (role?: string): Promise<any[]> => api.get('/staff-portal/tasks', { params: { role } }).then((res) => res.data);
export const updateTaskStatus = (task_id: number, status: string): Promise<any> => api.post(`/staff-portal/tasks/${task_id}/status`, { status }).then((res) => res.data);
export const reportStaffIssue = (payload: { patient_id?: number; issue_type: string; message: string }): Promise<any> => api.post('/staff-portal/report-issue', payload).then((res) => res.data);
export const getDiagnosticsQueue = (): Promise<any[]> => api.get('/staff-portal/diagnostics/queue').then((res) => res.data);
export const updateDiagnosticStatus = (queue_id: number, status: string): Promise<any> => api.post(`/staff-portal/diagnostics/${queue_id}/status`, { status }).then((res) => res.data);
export const recordPatientMovement = (patient_id: number, from_location: string, to_location: string): Promise<any> => api.post(`/staff-portal/patients/${patient_id}/movement`, { from_location, to_location }).then((res) => res.data);
export const recordPatientObservation = (patient_id: number, category: string, value: string, notes?: string): Promise<any> => api.post(`/staff-portal/patients/${patient_id}/observations`, { category, value, notes }).then((res) => res.data);

// ML Hybrid Anomaly Detection Endpoints
export const runAnomalyDetection = (hospitalState: any): Promise<any> => api.post('/intelligence/anomaly-detection', hospitalState).then((res) => res.data);
export const getLiveAnomalies = (): Promise<any> => api.get('/anomalies/live').then((res) => res.data);

// Outpatient Intake & Smart Doctor Allocation
export const registerPatientIntake = (payload: any): Promise<any> => api.post('/patients/intake', payload).then((res) => res.data);
export const getAvailableDoctors = (department_id?: number): Promise<any[]> => api.get('/patients/available-doctors', { params: { department_id } }).then((res) => res.data);

// Unified Multidisciplinary Patient Timeline
export const getPatientTimeline = (patient_id: number | string): Promise<any> => api.get(`/patients/${patient_id}/timeline`).then((res) => res.data);
export const postPatientTimelineUpdate = (patient_id: number | string, data: any): Promise<any> => api.post(`/patients/${patient_id}/timeline`, data).then((res) => res.data);

// ML Waiting Time Prediction Endpoint
export const predictWaitingTime = (hospitalState: any): Promise<any> => api.post('/intelligence/waiting-time', hospitalState).then((res) => res.data);

// ML Operational Forecasting Endpoints (Bottleneck, Demand, Workload)
export const predictBottleneck = (state: any): Promise<any> => api.post('/forecast/bottleneck', state).then((res) => res.data);
export const predictDemand = (state: any): Promise<any> => api.post('/forecast/demand', state).then((res) => res.data);
export const predictWorkload = (state: any): Promise<any> => api.post('/forecast/workload', state).then((res) => res.data);

// Operational Decision & Optimization Engines
export const optimizeStaffAssignment = (payload: any): Promise<any> => api.post('/optimization/staff-assignment', payload).then((res) => res.data);
export const optimizeResourceAllocation = (payload: any): Promise<any> => api.post('/optimization/resource-allocation', payload).then((res) => res.data);
export const prioritizeTasks = (payload: any): Promise<any> => api.post('/optimization/task-priority', payload).then((res) => res.data);
export const routeAlert = (payload: any): Promise<any> => api.post('/optimization/alert-routing', payload).then((res) => res.data);
export const getRbacRoutingMatrix = (): Promise<any> => api.get('/optimization/alert-routing/rbac-matrix').then((res) => res.data);

export default api;

