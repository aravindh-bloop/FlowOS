'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Gauge, Brain, Sparkles, Users, Activity, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { predictWorkload } from '@/lib/api';

export default function WorkloadForecasterTab() {
  const [state, setState] = useState({
    hour: 14,
    day_of_week: 2,
    is_weekend: 0,
    er_arrivals: 12,
    admissions: 7,
    discharges: 5,
    patient_load: 105.0,
    icu_occupancy: 0.86,
    available_icu_beds: 3,
    ct_queue: 12,
    mri_queue: 5,
    active_emergencies: 2,
    pending_tasks: 45,
    available_staff: 28,
    staff_workload: 0.78,
    staff_workload_lag1: 0.76,
    staff_workload_lag24: 0.72,
    staff_workload_lag168: 0.70,
    staff_workload_rolling24: 0.73,
    patient_staff_ratio: 3.75,
    task_staff_ratio: 1.61,
    emergency_pressure: 0.071,
    diagnostic_pressure: 0.607,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (customState?: any) => {
    setLoading(true);
    try {
      const stateToUse = customState || state;
      const res = await predictWorkload(stateToUse);
      setResult(res);
    } catch (err) {
      console.error('Workload Forecast Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetType: 'peak' | 'normal' | 'low') => {
    let preset: any;
    if (presetType === 'peak') {
      preset = {
        ...state,
        patient_load: 140.0,
        active_emergencies: 5,
        pending_tasks: 70,
        available_staff: 18,
        staff_workload: 0.92,
        patient_staff_ratio: 6.5,
        task_staff_ratio: 3.8,
        emergency_pressure: 0.25,
      };
    } else if (presetType === 'normal') {
      preset = {
        ...state,
        patient_load: 105.0,
        active_emergencies: 2,
        pending_tasks: 45,
        available_staff: 28,
        staff_workload: 0.68,
        patient_staff_ratio: 3.75,
        task_staff_ratio: 1.61,
      };
    } else {
      preset = {
        ...state,
        hour: 4,
        patient_load: 60.0,
        active_emergencies: 0,
        pending_tasks: 15,
        available_staff: 25,
        staff_workload: 0.40,
        patient_staff_ratio: 2.4,
        task_staff_ratio: 0.6,
        emergency_pressure: 0.0,
        diagnostic_pressure: 0.15,
      };
    }
    setState(preset);
    handlePredict(preset);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <Badge className="bg-rose-600 text-white font-black text-xs px-3 py-1">CRITICAL (&ge; 90%)</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-600 text-white font-bold text-xs px-3 py-1">HIGH (75% - 89%)</Badge>;
      case 'MODERATE':
        return <Badge className="bg-teal-600 text-white font-bold text-xs px-3 py-1">MODERATE (50% - 74%)</Badge>;
      default:
        return <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">LOW (&lt; 50%)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Presets */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-teal-600" />
              Staff Workload Forecaster (v1.0)
            </h2>
            <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-bold text-[11px]">
              GradientBoostingRegressor • Operational Levels
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predicts nursing and clinical shift workload 1 hour ahead based on patient volume, emergency pressure, and task backlog.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-bold text-slate-600 mr-1">Presets:</span>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-xs"
            onClick={() => applyPreset('peak')}
          >
            Preset 1: Emergency Surge (CRITICAL)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs"
            onClick={() => applyPreset('normal')}
          >
            Preset 2: Day Shift (MODERATE)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs"
            onClick={() => applyPreset('low')}
          >
            Preset 3: Night Shift (LOW)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Input Form */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-teal-600" /> Staffing & Operational Inputs
            </CardTitle>
            <CardDescription className="text-xs">Adjust on-duty staff, task volume, and emergency pressure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Available On-Duty Staff</Label>
                <Input
                  type="number"
                  value={state.available_staff}
                  onChange={(e) => setState({ ...state, available_staff: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Patient Load</Label>
                <Input
                  type="number"
                  value={state.patient_load}
                  onChange={(e) => setState({ ...state, patient_load: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Pending Tasks</Label>
                <Input
                  type="number"
                  value={state.pending_tasks}
                  onChange={(e) => setState({ ...state, pending_tasks: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Active Emergencies</Label>
                <Input
                  type="number"
                  value={state.active_emergencies}
                  onChange={(e) => setState({ ...state, active_emergencies: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Patient-to-Staff Ratio</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={state.patient_staff_ratio}
                  onChange={(e) => setState({ ...state, patient_staff_ratio: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Current Workload Ratio (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={state.staff_workload}
                  onChange={(e) => setState({ ...state, staff_workload: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 mt-2"
              onClick={() => handlePredict()}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gauge className="w-4 h-4 mr-2" />}
              Forecast Staff Workload (POST /api/forecast/workload)
            </Button>
          </CardContent>
        </Card>

        {/* Live Model Output Display */}
        <Card className="bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-teal-600" /> ML Predicted Workload
                </CardTitle>
                <CardDescription className="text-xs">
                  Inference output from flowos_workload_forecaster_v1.pkl
                </CardDescription>
              </div>
              {result && getLevelBadge(result.workload_level)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {result ? (
              <div className="space-y-4">
                {/* Main Gauge / Percentage Display */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Forecasted 1-Hour Staff Workload
                  </span>
                  <div className="text-5xl font-black text-slate-900 font-mono tracking-tight">
                    {result.workload_percentage}%
                  </div>
                  <Progress
                    value={result.workload_percentage}
                    className={`h-3 max-w-xs mx-auto ${
                      result.workload_percentage >= 90
                        ? '[&>div]:bg-rose-600'
                        : result.workload_percentage >= 75
                        ? '[&>div]:bg-amber-600'
                        : '[&>div]:bg-teal-600'
                    }`}
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    Raw Regressor Output: {result.predicted_staff_workload} • Horizon: {result.forecast_horizon}
                  </p>
                </div>

                {/* Level Thresholds Reference */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className={`p-2 rounded-lg border ${result.workload_level === 'LOW' ? 'bg-emerald-100 border-emerald-300 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                    LOW<br />&lt; 50%
                  </div>
                  <div className={`p-2 rounded-lg border ${result.workload_level === 'MODERATE' ? 'bg-teal-100 border-teal-300 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                    MODERATE<br />50% - 74%
                  </div>
                  <div className={`p-2 rounded-lg border ${result.workload_level === 'HIGH' ? 'bg-amber-100 border-amber-300 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                    HIGH<br />75% - 89%
                  </div>
                  <div className={`p-2 rounded-lg border ${result.workload_level === 'CRITICAL' ? 'bg-rose-100 border-rose-300 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                    CRITICAL<br />&ge; 90%
                  </div>
                </div>

                {/* Operational Advisory */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-slate-700">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                    Nursing & Staffing Advisory:
                  </span>
                  <p className="font-medium text-xs">
                    {result.workload_level === 'CRITICAL' &&
                      'Immediate action required: Mobilize float pool nurses, defer routine clinical documentation, and alert nursing supervisor.'}
                    {result.workload_level === 'HIGH' &&
                      'High staffing pressure: Monitor nurse-to-patient ratios in ICU/ED. Prepare on-call team for handover surge.'}
                    {result.workload_level === 'MODERATE' &&
                      'Optimal operational balance: Shift capacity is healthy with adequate buffer for unexpected patient arrivals.'}
                    {result.workload_level === 'LOW' &&
                      'Low workload period: Ideal window for routine maintenance, staff breaks, and clinical audits.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Gauge className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">
                  Click "Forecast Staff Workload" or select a preset to compute predicted workload percentage
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
