// Enums as union types
export type UserRole = 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'NURSE' | 'TECHNICIAN';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'UNAVAILABLE';
export type BedType = 'REGULAR' | 'ICU' | 'EMERGENCY' | 'RECOVERY' | 'PEDIATRIC' | 'MATERNITY';
export type AdmissionStatus = 'ADMITTED' | 'IN_TREATMENT' | 'AWAITING_TRANSFER' | 'AWAITING_DISCHARGE' | 'DISCHARGED' | 'TRANSFERRED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type StaffRole = 'DOCTOR' | 'NURSE' | 'SURGEON' | 'TECHNICIAN' | 'SPECIALIST' | 'RESIDENT';
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE' | 'RESERVED';
export type OTStatus = 'AVAILABLE' | 'IN_USE' | 'CLEANING' | 'MAINTENANCE' | 'RESERVED';
export type AlertType = 'ICU_CAPACITY' | 'BED_SHORTAGE' | 'STAFF_OVERLOAD' | 'EQUIPMENT_FAILURE' | 'EMERGENCY' | 'QUEUE_DELAY' | 'OT_PRESSURE' | 'PATIENT_CRITICAL' | 'DIAGNOSTIC_DELAY' | 'RESOURCE_UNAVAILABLE';
export type BottleneckType = 'ICU_CAPACITY' | 'BED_SHORTAGE' | 'DIAGNOSTIC_QUEUE' | 'OT_UTILIZATION' | 'STAFF_OVERLOAD' | 'EQUIPMENT_SHORTAGE' | 'EMERGENCY_OVERLOAD';
export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'MODIFIED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED';
export type ActionStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface User { id: number; email: string; full_name: string; role: UserRole; is_active: boolean; }
export interface Department { id: number; name: string; code: string; type: string; floor: number; description: string; is_active: boolean; }
export interface Bed { id: number; bed_number: string; room_id: number; ward_id: number; department_id: number; bed_type: BedType; status: BedStatus; patient_id: number | null; department_name?: string; ward_name?: string; room_number?: string; patient_name?: string; patient_mrn?: string; admission_id?: number; }
export interface Patient { id: number; mrn: string; first_name: string; last_name: string; date_of_birth: string; gender: string; blood_type: string; contact_phone: string; }
export interface Admission { id: number; patient_id: number; department_id: number; bed_id: number | null; admission_date: string; discharge_date: string | null; status: AdmissionStatus; admission_type: string; priority: Priority; diagnosis: string; department_name?: string; attending_doctor_name?: string; bed_number?: string; patient_name?: string; }
export interface PatientDetail extends Patient { admissions: Admission[]; events: HospitalEvent[]; current_admission?: Admission; current_location?: string; }
export interface Staff { id: number; employee_id: string; first_name: string; last_name: string; role: StaffRole; specialization: string; department_id: number; department_name?: string; is_active: boolean; contact_phone?: string; email?: string; current_assignment?: string; }
export interface Equipment { id: number; name: string; type: string; department_id: number; status: EquipmentStatus; location: string; department_name?: string; current_patient_id: number | null; model_name?: string; }
export interface OperatingTheatre { id: number; name: string; theatre_number: string; status: OTStatus; theatre_type: string; department_name?: string; current_procedure_id: number | null; }
export interface HospitalEvent { id: number; event_type: string; patient_id: number | null; staff_id: number | null; department_id: number | null; timestamp: string; source: string; metadata: any; patient_name?: string; department_name?: string; }
export interface Alert { id: number; alert_type: AlertType; severity: Severity; title: string; message: string; department_id: number | null; is_active: boolean; is_acknowledged: boolean; created_at: string; department_name?: string; }
export interface Notification { id: number; title: string; message: string; notification_type: string; is_read: boolean; created_at: string; }
export interface Prediction { id: number; prediction_type: string; current_value: number; predicted_value: number; confidence: number; severity: Severity; reasoning: string; recommended_action: string; time_horizon_hours: number; department_name?: string; valid_from: string; valid_until: string; }
export interface Bottleneck { id: number; bottleneck_type: BottleneckType; severity: Severity; title: string; description: string; affected_patient_count: number; affected_patients: any[]; contributing_factors: any; status: string; department_name?: string; detected_at: string; }
export interface Recommendation { id: number; bottleneck_id: number | null; prediction_id: number | null; recommendation_type: string; title: string; description: string; reasoning: string; impact_assessment: string; priority: Priority; status: RecommendationStatus; proposed_actions: any[]; decided_by: number | null; decided_at: string | null; created_at: string; }
export interface OrchestrationAction { id: number; recommendation_id: number; action_type: string; target_type: string; target_id: number | null; parameters: any; status: ActionStatus; executed_at: string | null; result: any; }
export interface DashboardOverview { total_patients: number; total_active_admissions: number; bed_occupancy: { total: number; occupied: number; available: number; reserved: number; maintenance: number; occupancy_rate: number; }; icu_occupancy: { total: number; occupied: number; available: number; occupancy_rate: number; }; er_load: { current_patients: number; waiting: number; avg_wait_minutes: number; }; ot_status: { total: number; in_use: number; available: number; cleaning: number; }; equipment_status: { total: number; available: number; in_use: number; maintenance: number; }; staff_on_duty: { doctors: number; nurses: number; technicians: number; total: number; }; active_alerts: Alert[]; active_emergencies: number; department_summaries: DepartmentSummary[]; }
export interface DepartmentSummary { id: number; name: string; type: string; bed_occupancy_rate: number; patient_count: number; staff_on_duty: number; active_alerts: number; }
export interface Analytics { avg_waiting_time_minutes: number; admission_to_bed_minutes: number; bed_utilization: number; icu_utilization: number; ot_utilization: number; diagnostic_turnaround_minutes: number; staff_utilization: number; emergency_response_minutes: number; resource_idle_rate: number; department_analytics: DepartmentAnalytics[]; }
export interface DepartmentAnalytics { department_id: number; department_name: string; bed_utilization: number; avg_wait_minutes: number; patient_count: number; staff_utilization: number; }
export interface LoginRequest { email: string; password: string; }
export interface TokenResponse { access_token: string; token_type: string; user: User; }
