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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
export const getStaff = (params?: any): Promise<Staff[]> => api.get('/staff', { params }).then((res) => res.data);
export const getStaffDetail = (id: number | string): Promise<Staff> => api.get(`/staff/${id}`).then((res) => res.data);
export const getResources = (): Promise<Equipment[]> => api.get('/resources').then((res) => res.data);
export const getOperatingTheatres = (): Promise<OperatingTheatre[]> => api.get('/resources/operating-theatres').then((res) => res.data);
export const getEvents = (params?: any): Promise<HospitalEvent[]> => api.get('/events', { params }).then((res) => res.data);
export const getAlerts = (params?: any): Promise<Alert[]> => api.get('/alerts', { params }).then((res) => res.data);
export const acknowledgeAlert = (id: number | string): Promise<void> => api.post(`/alerts/${id}/acknowledge`).then((res) => res.data);
export const getNotifications = (): Promise<Notification[]> => api.get('/notifications').then((res) => res.data);
export const getPredictions = (): Promise<Prediction[]> => api.get('/predictions').then((res) => res.data);
export const generatePredictions = (): Promise<Prediction[]> => api.post('/predictions/generate').then((res) => res.data);
export const getBottlenecks = (): Promise<Bottleneck[]> => api.get('/bottlenecks').then((res) => res.data);
export const getBottleneckDetail = (id: number | string): Promise<Bottleneck> => api.get(`/bottlenecks/${id}`).then((res) => res.data);
export const detectBottlenecks = (): Promise<Bottleneck[]> => api.post('/bottlenecks/detect').then((res) => res.data);
export const getRecommendations = (): Promise<Recommendation[]> => api.get('/orchestration/recommendations').then((res) => res.data);
export const getRecommendation = (id: number | string): Promise<Recommendation> => api.get(`/orchestration/recommendations/${id}`).then((res) => res.data);
export const generateRecommendation = (bottleneckId?: number | string): Promise<Recommendation> => api.post(`/orchestration/recommend${bottleneckId ? `?bottleneck_id=${bottleneckId}` : ''}`).then((res) => res.data);
export const approveAction = (id: number | string, notes?: string): Promise<any> => api.post(`/orchestration/actions/${id}/approve`, { notes }).then((res) => res.data);
export const rejectAction = (id: number | string, reason?: string): Promise<any> => api.post(`/orchestration/actions/${id}/reject`, { reason }).then((res) => res.data);
export const executeAction = (id: number | string): Promise<any> => api.post(`/orchestration/actions/${id}/execute`).then((res) => res.data);
export const declareEmergency = (data: any): Promise<any> => api.post('/emergencies', data).then((res) => res.data);
export const getEmergencies = (): Promise<any[]> => api.get('/emergencies').then((res) => res.data);
export const getEmergencyDetail = (id: number | string): Promise<any> => api.get(`/emergencies/${id}`).then((res) => res.data);
export const respondToEmergency = (id: number | string): Promise<any> => api.post(`/emergencies/${id}/respond`).then((res) => res.data);
export const getAnalytics = (): Promise<Analytics> => api.get('/analytics').then((res) => res.data);
export const getDepartmentAnalytics = (id: number | string): Promise<DepartmentAnalytics> => api.get(`/analytics/department/${id}`).then((res) => res.data);

export default api;
