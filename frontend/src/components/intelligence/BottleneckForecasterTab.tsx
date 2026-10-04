'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Brain, CheckCircle2, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { predictBottleneck } from '@/lib/api';

export default function BottleneckForecasterTab() {
  const [state, setState] = useState({
    hour: 14,
    day_of_week: 2,
    is_weekend: 0,
    er_arrivals: 12,
    admissions: 8,
    discharges: 2,
    er_queue: 15,
    bed_occupancy: 0.92,
    available_beds: 8,
    icu_occupancy: 0.98,
    available_icu_beds: 1,
    ct_queue: 5,
    mri_queue: 3,
    ct_utilization: 0.85,
    mri_utilization: 0.80,
    equipment_utilization: 0.82,
    avg_diagnostic_wait: 35.0,
    staff_workload: 0.91,
    active_emergencies: 4,
    avg_transfer_time: 25.0,
    pending_tasks: 40,
    ct_pressure: 15.0,
    mri_pressure: 10.0,
    er_pressure: 20.0,
    icu_pressure: 45.0,
    bed_pressure: 25.0,
    staff_pressure: 30.0,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (customState?: any) => {
    setLoading(true);
    try {
      const stateToUse = customState || state;
      const res = await predictBottleneck(stateToUse);
      setResult(res);
    } catch (err) {
      console.error('Bottleneck Forecast Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetType: 'icu' | 'mri' | 'none') => {
    let preset: any;
    if (presetType === 'icu') {
      preset = {
        ...state,
        bed_occupancy: 0.95,
        icu_occupancy: 0.99,
        available_icu_beds: 0,
        icu_pressure: 50.0,
        er_queue: 18,
        active_emergencies: 5,
      };
    } else if (presetType === 'mri') {
      preset = {
        ...state,
        mri_queue: 28,
        mri_utilization: 0.99,
        mri_pressure: 45.0,
        avg_diagnostic_wait: 60.0,
      };
    } else {
      preset = {
        ...state,
        bed_occupancy: 0.72,
        icu_occupancy: 0.65,
        available_beds: 35,
        available_icu_beds: 8,
        ct_queue: 2,
        mri_queue: 1,
        ct_utilization: 0.50,
        mri_utilization: 0.45,
        equipment_utilization: 0.55,
        staff_workload: 0.60,
        active_emergencies: 0,
        ct_pressure: 5.0,
        mri_pressure: 4.0,
        er_pressure: 8.0,
        icu_pressure: 10.0,
        bed_pressure: 10.0,
        staff_pressure: 12.0,
      };
    }
    setState(preset);
    handlePredict(preset);
  };

  return (
    <div className="space-y-6">
      {/* Header & Presets */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
              Operational Bottleneck Forecaster (v2.0)
            </h2>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[11px]">
              RandomForestClassifier • Threshold: 0.24
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predicts department-level hospital bottlenecks 1 hour into the future across 27 operational metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-bold text-slate-600 mr-1">Presets:</span>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs"
            onClick={() => applyPreset('icu')}
          >
            Preset 1: Severe ICU Strain
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-bold text-xs"
            onClick={() => applyPreset('mri')}
          >
            Preset 2: MRI Diagnostic Backlog
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs"
            onClick={() => applyPreset('none')}
          >
            Preset 3: Nominal Flow (NONE)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Input Form */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-teal-600" /> Operational Telemetry (27 Features)
            </CardTitle>
            <CardDescription className="text-xs">
              Live hospital pressure indicators and departmental capacity metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Hour (0-23)</Label>
                <Input
                  type="number"
                  value={state.hour}
                  onChange={(e) => setState({ ...state, hour: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Day of Week (0-6)</Label>
                <Input
                  type="number"
                  value={state.day_of_week}
                  onChange={(e) => setState({ ...state, day_of_week: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Is Weekend (0/1)</Label>
                <Input
                  type="number"
                  value={state.is_weekend}
                  onChange={(e) => setState({ ...state, is_weekend: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Bed Occupancy (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={state.bed_occupancy}
                  onChange={(e) => setState({ ...state, bed_occupancy: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">ICU Occupancy (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={state.icu_occupancy}
                  onChange={(e) => setState({ ...state, icu_occupancy: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Staff Workload (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={state.staff_workload}
                  onChange={(e) => setState({ ...state, staff_workload: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">ER Queue</Label>
                <Input
                  type="number"
                  value={state.er_queue}
                  onChange={(e) => setState({ ...state, er_queue: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">CT Queue</Label>
                <Input
                  type="number"
                  value={state.ct_queue}
                  onChange={(e) => setState({ ...state, ct_queue: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">MRI Queue</Label>
                <Input
                  type="number"
                  value={state.mri_queue}
                  onChange={(e) => setState({ ...state, mri_queue: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">ICU Pressure</Label>
                <Input
                  type="number"
                  value={state.icu_pressure}
                  onChange={(e) => setState({ ...state, icu_pressure: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">MRI Pressure</Label>
                <Input
                  type="number"
                  value={state.mri_pressure}
                  onChange={(e) => setState({ ...state, mri_pressure: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Staff Pressure</Label>
                <Input
                  type="number"
                  value={state.staff_pressure}
                  onChange={(e) => setState({ ...state, staff_pressure: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 mt-2"
              onClick={() => handlePredict()}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Forecast Operational Bottleneck (POST /api/forecast/bottleneck)
            </Button>
          </CardContent>
        </Card>

        {/* Live Model Output Display */}
        <Card className="bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" /> ML Predicted Bottleneck
                </CardTitle>
                <CardDescription className="text-xs">
                  Inference output from flowos_bottleneck_forecaster_v2.pkl
                </CardDescription>
              </div>
              {result && (
                <Badge className="bg-amber-600 text-white font-bold text-xs px-3 py-1">
                  HORIZON: {result.forecast_horizon}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {result ? (
              <div className="space-y-4">
                {/* Main Prediction Banner */}
                <div
                  className={`p-6 rounded-2xl border text-center space-y-1.5 ${
                    result.prediction === 'NONE'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-300'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider block text-slate-600">
                    Predicted 1-Hour Hospital Bottleneck
                  </span>
                  <div
                    className={`text-4xl font-black font-mono tracking-tight ${
                      result.prediction === 'NONE' ? 'text-emerald-700' : 'text-amber-900'
                    }`}
                  >
                    {result.prediction === 'NONE' ? '✅ NO BOTTLENECK' : `⚠️ ${result.prediction} CAPACITY`}
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Confidence: {(result.confidence * 100).toFixed(1)}% • Decision Threshold: {(result.threshold * 100).toFixed(0)}%
                  </p>
                </div>

                {/* 7-Class Probability Distribution */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      7-Class Probability Distribution:
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700">
                      Threshold Line: 24.0%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(result.probabilities || {}).map(([cls, prob]: [string, any]) => {
                      const probNum = Number(prob);
                      const isWinner = cls === result.prediction;
                      const exceedsThreshold = probNum >= result.threshold && cls !== 'NONE';

                      return (
                        <div key={cls} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className={isWinner ? 'text-amber-900 font-bold' : 'text-slate-600'}>
                              {cls} {isWinner && '★'}
                            </span>
                            <span className={exceedsThreshold ? 'text-amber-800 font-bold' : 'text-slate-700'}>
                              {(probNum * 100).toFixed(2)}%
                            </span>
                          </div>
                          <Progress
                            value={probNum * 100}
                            className={`h-2 bg-slate-200 ${
                              isWinner ? '[&>div]:bg-amber-600' : '[&>div]:bg-slate-400'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Mitigation Advisory */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-slate-700">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                    Operational Advisory:
                  </span>
                  <p className="font-medium text-xs">
                    {result.prediction === 'ICU' &&
                      'Initiate step-down ward transfers for stable ICU patients. Alert on-call intensivist for triage.'}
                    {result.prediction === 'MRI' &&
                      'MRI bay backlog detected. Redirect routine scans to CT or postpone non-urgent outpatient imaging.'}
                    {result.prediction === 'BED' &&
                      'Inpatient general ward bed shortage impending. Expedite discharge lounge processing.'}
                    {result.prediction === 'NONE' &&
                      'All hospital operational queues and capacity margins are functioning within safe limits.'}
                    {!['ICU', 'MRI', 'BED', 'NONE'].includes(result.prediction) &&
                      `Automated capacity alerts dispatched for ${result.prediction} department.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <AlertTriangle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">
                  Click "Forecast Operational Bottleneck" or pick a preset above to run ML inference
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
