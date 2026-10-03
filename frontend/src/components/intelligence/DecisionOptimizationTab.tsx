'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, Users, Layers, AlertOctagon, Bell, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { optimizeStaffAssignment, optimizeResourceAllocation, prioritizeTasks, routeAlert } from '@/lib/api';

export default function DecisionOptimizationTab() {
  const [activeEngine, setActiveEngine] = useState<'staff' | 'resource' | 'task' | 'alert'>('staff');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Run Staff Assignment Optimization
  const handleRunStaffAssignment = async () => {
    setLoading(true);
    try {
      const payload = {
        staff_roster: [
          { id: 1, name: "Dr. Sarah Chen", role: "DOCTOR", specialization: "Cardiology", current_workload: 0.35, active_assignments: 1 },
          { id: 2, name: "Dr. Marcus Bell", role: "DOCTOR", specialization: "Neurology", current_workload: 0.75, active_assignments: 3 },
          { id: 3, name: "Nurse Emily Davis", role: "NURSE", department_name: "ICU", department_type: "ICU", current_workload: 0.40, active_assignments: 1 },
          { id: 4, name: "Nurse John Miller", role: "NURSE", department_name: "ICU", department_type: "ICU", current_workload: 0.85, active_assignments: 2 },
          { id: 5, name: "Tech Lisa Wong", role: "TECHNICIAN", specialization: "CT/MRI", current_workload: 0.30, active_assignments: 1 },
        ],
        demand_slots: [
          { slot_id: 101, patient_id: 501, patient_name: "Marcus Vance", required_role: "DOCTOR", discomfort_type: "Cardiology", priority: "HIGH" },
          { slot_id: 102, patient_id: 502, patient_name: "Elena Rostova", required_role: "NURSE", department_name: "ICU", department_type: "ICU", priority: "CRITICAL" },
          { slot_id: 103, patient_id: 503, patient_name: "David Kim", required_role: "TECHNICIAN", department_name: "Radiology", priority: "MEDIUM" },
        ],
      };
      const res = await optimizeStaffAssignment(payload);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Run Resource Allocation Optimization
  const handleRunResourceAllocation = async () => {
    setLoading(true);
    try {
      const payload = {
        available_resources: [
          { id: 1, resource_type: "ICU_BED", name: "ICU Bed 01", status: "AVAILABLE", turnaround_minutes: 20 },
          { id: 2, resource_type: "ICU_BED", name: "ICU Bed 02 (Reserve)", status: "AVAILABLE", turnaround_minutes: 20 },
          { id: 3, resource_type: "CT_SCANNER", name: "Siemens Somatom CT", status: "AVAILABLE", turnaround_minutes: 15 },
          { id: 4, resource_type: "GENERAL_BED", name: "Ward Bed 14", status: "AVAILABLE", turnaround_minutes: 30 },
        ],
        allocation_requests: [
          { request_id: 201, patient_id: 701, patient_name: "Trauma Code Blue", resource_type: "ICU_BED", priority: "CRITICAL", wait_minutes: 5 },
          { request_id: 202, patient_id: 702, patient_name: "Observation Inpatient", resource_type: "ICU_BED", priority: "MEDIUM", wait_minutes: 25 },
          { request_id: 203, patient_id: 703, patient_name: "Suspected Stroke", resource_type: "CT_SCANNER", priority: "EMERGENCY", wait_minutes: 12 },
        ],
        preserve_buffer: true,
      };
      const res = await optimizeResourceAllocation(payload);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Run Task Priority Engine (Rules + Heuristic Search)
  const handleRunTaskPriority = async () => {
    setLoading(true);
    try {
      const payload = {
        tasks: [
          { id: 1, title: "Routine vitals check - Bed 08", task_type: "GENERAL", priority: "LOW", elapsed_minutes: 10 },
          { id: 2, title: "CODE BLUE: Resuscitation ED Bay 2", task_type: "EMERGENCY", priority: "EMERGENCY", elapsed_minutes: 2 },
          { id: 3, title: "Stat CT Angiography Stroke Protocol", task_type: "DIAGNOSTIC", priority: "HIGH", elapsed_minutes: 18 },
          { id: 4, title: "Prepare Patient Discharge Lounge", task_type: "PATIENT_DISCHARGE", priority: "MEDIUM", elapsed_minutes: 45 },
          { id: 5, title: "Surgical Suite Transfer", task_type: "PROCEDURE", priority: "HIGH", dependencies: ["Pre-op Labs"], dependencies_met: false },
        ],
      };
      const res = await prioritizeTasks(payload);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Run Alert Routing Engine (Rules + RBAC)
  const handleRunAlertRouting = async () => {
    setLoading(true);
    try {
      const payload = {
        alert: {
          id: 9001,
          alert_type: "EMERGENCY",
          severity: "CRITICAL",
          title: "Multi-trauma resuscitation required in ED Bay 01",
          department_id: 1,
          check_dedup: false,
        },
        active_users: [
          { id: 1, full_name: "Dr. Gregory House", role: "DOCTOR", department_id: 1 },
          { id: 2, full_name: "Nurse Jackie Peyton", role: "NURSE", department_id: 1 },
          { id: 3, full_name: "Tech Bob Martin", role: "TECHNICIAN", department_id: 10 },
          { id: 4, full_name: "Director Lisa Cuddy", role: "ADMIN", department_id: 1 },
        ],
      };
      const res = await routeAlert(payload);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-900 text-sm">Select Decision Engine Methodology:</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeEngine === 'staff' ? 'default' : 'outline'}
            className={activeEngine === 'staff' ? 'bg-teal-600 text-white font-bold text-xs' : 'text-slate-700 text-xs'}
            onClick={() => {
              setActiveEngine('staff');
              setResult(null);
            }}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" /> Staff Assignment (Optimization)
          </Button>

          <Button
            size="sm"
            variant={activeEngine === 'resource' ? 'default' : 'outline'}
            className={activeEngine === 'resource' ? 'bg-indigo-600 text-white font-bold text-xs' : 'text-slate-700 text-xs'}
            onClick={() => {
              setActiveEngine('resource');
              setResult(null);
            }}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" /> Resource Allocation (Optimization)
          </Button>

          <Button
            size="sm"
            variant={activeEngine === 'task' ? 'default' : 'outline'}
            className={activeEngine === 'task' ? 'bg-amber-600 text-white font-bold text-xs' : 'text-slate-700 text-xs'}
            onClick={() => {
              setActiveEngine('task');
              setResult(null);
            }}
          >
            <AlertOctagon className="w-3.5 h-3.5 mr-1.5" /> Task Priority (Rules + A* Heuristic)
          </Button>

          <Button
            size="sm"
            variant={activeEngine === 'alert' ? 'default' : 'outline'}
            className={activeEngine === 'alert' ? 'bg-rose-600 text-white font-bold text-xs' : 'text-slate-700 text-xs'}
            onClick={() => {
              setActiveEngine('alert');
              setResult(null);
            }}
          >
            <Bell className="w-3.5 h-3.5 mr-1.5" /> Alert Routing (Rules + RBAC)
          </Button>
        </div>
      </div>

      {/* Engine Description & Action Banner */}
      <Card className="bg-white border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                {activeEngine === 'staff' && '1. Staff Assignment: Multi-Objective Constraint Optimization'}
                {activeEngine === 'resource' && '2. Resource Allocation: Multi-Criteria Capacity Optimization (Knapsack & Buffer)'}
                {activeEngine === 'task' && '3. Task Prioritization: Precedence Rules + Lookahead Heuristic Search (f = g + h)'}
                {activeEngine === 'alert' && '4. Alert Routing: Production Rule Engine + Role-Based Access Control (RBAC)'}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {activeEngine === 'staff' &&
                  'Bipartite matching algorithm that minimizes shift workload variance, maximizes skill affinity, and strictly enforces mandatory nurse-to-patient safety ratios (ICU 1:2, General 1:5).'}
                {activeEngine === 'resource' &&
                  'Multi-criteria capacity knapsack solver that matches clinical acuity to beds and diagnostic scanners while retaining safety contingency buffers for incoming trauma.'}
                {activeEngine === 'task' &&
                  'A* priority function evaluating elapsed wait cost g(n) and clinical lookahead heuristic h(n) with hard precedence overrides for Code Blue and Stat Stroke protocols.'}
                {activeEngine === 'alert' &&
                  'Production rule engine that matches alert categories to authorized recipient roles (Doctor, Nurse, Technician, Admin) with flapping de-duplication and timed escalation SLAs.'}
              </CardDescription>
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 shrink-0"
              onClick={
                activeEngine === 'staff'
                  ? handleRunStaffAssignment
                  : activeEngine === 'resource'
                  ? handleRunResourceAllocation
                  : activeEngine === 'task'
                  ? handleRunTaskPriority
                  : handleRunAlertRouting
              }
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 text-amber-400" />}
              Execute {activeEngine.toUpperCase()} Engine
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Methodology Executed:</span>
                  <Badge className="bg-slate-200 text-slate-800 font-bold">{result.methodology}</Badge>
                </div>
                {result.metrics && (
                  <div className="text-slate-600 font-semibold space-x-3">
                    {Object.entries(result.metrics).map(([k, v]: [string, any]) => (
                      <span key={k}>
                        {k.replace(/_/g, ' ')}: <strong className="text-slate-900">{typeof v === 'object' ? JSON.stringify(v) : v}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Engine 1: Staff Output Table */}
              {activeEngine === 'staff' && result.assignments && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Optimized Assignment Matches ({result.assignments.length}):
                  </h4>
                  <div className="space-y-2">
                    {result.assignments.map((a: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{a.patient_name}</span>
                            <Badge className="bg-slate-200 text-slate-800 font-bold">{a.priority}</Badge>
                            <Badge className="bg-teal-100 text-teal-800 font-bold">Match Score: {a.match_score}%</Badge>
                          </div>
                          <p className="text-slate-600 text-xs mt-1">
                            Assigned Staff: <strong className="text-teal-700">{a.assigned_staff_name}</strong> ({a.role} • {a.specialization || 'General'})
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-100 text-emerald-800 font-bold">Safe Ratio: {a.safe_ratio_limit}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engine 2: Resource Allocation Table */}
              {activeEngine === 'resource' && result.allocations && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Optimized Asset Allocations ({result.allocations.length}):
                  </h4>
                  <div className="space-y-2">
                    {result.allocations.map((a: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{a.patient_name}</span>
                            <Badge className="bg-rose-100 text-rose-800 font-bold">{a.priority}</Badge>
                            <span className="text-slate-500 font-semibold">Allocated:</span>
                            <strong className="text-indigo-700">{a.resource_name}</strong>
                          </div>
                          <p className="text-slate-600 text-xs mt-1">
                            Location: {a.location} • Turnaround Time: ~{a.estimated_turnaround_minutes} mins
                          </p>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-800 font-bold">
                          Utility Score: {a.clinical_utility_score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engine 3: Task Priority Queue Table */}
              {activeEngine === 'task' && result.prioritized_tasks && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Dynamic Prioritized Task Queue ({result.prioritized_tasks.length}):
                  </h4>
                  <div className="space-y-2">
                    {result.prioritized_tasks.map((t: any) => (
                      <div key={t.task_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-slate-900 text-white font-mono font-bold">#{t.dynamic_rank}</Badge>
                            <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                            <Badge className={t.priority_score >= 90 ? 'bg-rose-600 text-white font-bold' : 'bg-slate-200 text-slate-800'}>
                              Score: {t.priority_score}
                            </Badge>
                            {t.active_rule !== 'HEURISTIC_SEARCH_A_STAR' && (
                              <Badge className="bg-amber-100 text-amber-800 font-bold">{t.active_rule}</Badge>
                            )}
                          </div>
                          <p className="text-slate-600 text-xs mt-1">{t.clinical_operational_rationale}</p>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-500">
                          f={t.heuristic_breakdown.f_total_priority} (g={t.heuristic_breakdown.g_wait_cost} + h={t.heuristic_breakdown.h_lookahead})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engine 4: Alert Routing Details */}
              {activeEngine === 'alert' && result.alert && (
                <div className="space-y-3">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 text-sm">{result.alert.title}</span>
                      <Badge className="bg-rose-600 text-white font-bold">{result.alert.severity}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="font-bold text-slate-700">RBAC Target Roles:</span>
                      {result.rbac_authorized_roles?.map((r: string) => (
                        <Badge key={r} className="bg-slate-200 text-slate-800 font-bold">{r}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="font-bold text-slate-700">Delivery Channels:</span>
                      {result.delivery_channels?.map((c: string) => (
                        <Badge key={c} variant="outline" className="border-rose-300 text-rose-800">{c}</Badge>
                      ))}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Authorized Dispatched Personnel ({result.routed_recipients?.length || 0}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {result.routed_recipients?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{rec.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{rec.role}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">AUTHORIZED</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Zap className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">
                Click "Execute {activeEngine.toUpperCase()} Engine" to run this operational optimization algorithm
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
