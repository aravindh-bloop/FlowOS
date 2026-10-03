'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, Brain, Sparkles, Activity, Bed, Users, ShieldAlert } from 'lucide-react';
import { predictDemand } from '@/lib/api';

export default function DemandForecasterTab() {
  const [state, setState] = useState({
    hour: 14,
    day_of_week: 2,
    is_weekend: 0,
    er_arrivals: 10,
    admissions: 6,
    discharges: 5,
    ct_demand: 6,
    mri_demand: 3,
    bed_demand: 19,
    icu_demand: 4,

    er_arrivals_lag1: 10,
    er_arrivals_lag24: 11,
    er_arrivals_lag168: 9,
    er_arrivals_rolling24: 10.2,

    admissions_lag1: 6,
    admissions_lag24: 7,
    admissions_lag168: 6,
    admissions_rolling24: 6.5,

    discharges_lag1: 5,
    discharges_lag24: 6,
    discharges_lag168: 6,
    discharges_rolling24: 6.1,

    ct_demand_lag1: 6,
    ct_demand_lag24: 5,
    ct_demand_lag168: 5,
    ct_demand_rolling24: 5.4,

    mri_demand_lag1: 3,
    mri_demand_lag24: 4,
    mri_demand_lag168: 3,
    mri_demand_rolling24: 3.5,

    bed_demand_lag1: 19,
    bed_demand_lag24: 18,
    bed_demand_lag168: 20,
    bed_demand_rolling24: 19.1,

    icu_demand_lag1: 4,
    icu_demand_lag24: 4,
    icu_demand_lag168: 4,
    icu_demand_rolling24: 4.2,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (customState?: any) => {
    setLoading(true);
    try {
      const stateToUse = customState || state;
      const res = await predictDemand(stateToUse);
      setResult(res);
    } catch (err) {
      console.error('Demand Forecast Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetType: 'surge' | 'evening' | 'baseline') => {
    let preset: any;
    if (presetType === 'surge') {
      preset = {
        ...state,
        er_arrivals: 16,
        admissions: 11,
        discharges: 3,
        ct_demand: 12,
        mri_demand: 7,
        bed_demand: 28,
        icu_demand: 8,
      };
    } else if (presetType === 'evening') {
      preset = {
        ...state,
        hour: 19,
        er_arrivals: 14,
        admissions: 8,
        discharges: 2,
        ct_demand: 9,
        mri_demand: 5,
        bed_demand: 22,
        icu_demand: 6,
      };
    } else {
      preset = {
        ...state,
        hour: 3,
        er_arrivals: 3,
        admissions: 2,
        discharges: 1,
        ct_demand: 2,
        mri_demand: 1,
        bed_demand: 8,
        icu_demand: 2,
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
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              Departmental Demand Forecaster (v1.0)
            </h2>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-bold text-[11px]">
              MultiOutputRegressor • 7 Target Metrics
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predicts 1-hour ahead hospital admissions, discharges, ER influx, scan counts, and bed demand across 38 lag and rolling telemetry features.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-bold text-slate-600 mr-1">Presets:</span>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-bold text-xs"
            onClick={() => applyPreset('surge')}
          >
            Preset 1: Inpatient Influx Surge
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs"
            onClick={() => applyPreset('evening')}
          >
            Preset 2: Evening Trauma Rush
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs"
            onClick={() => applyPreset('baseline')}
          >
            Preset 3: Night Off-Peak
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (5 columns) */}
        <Card className="lg:col-span-5 bg-white border-slate-200/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-teal-600" /> Current & Lag Telemetry
            </CardTitle>
            <CardDescription className="text-xs">Adjust current arrivals, imaging queues, and 24h rolling baselines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">ER Arrivals (Current)</Label>
                <Input
                  type="number"
                  value={state.er_arrivals}
                  onChange={(e) => setState({ ...state, er_arrivals: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Admissions (Current)</Label>
                <Input
                  type="number"
                  value={state.admissions}
                  onChange={(e) => setState({ ...state, admissions: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Discharges (Current)</Label>
                <Input
                  type="number"
                  value={state.discharges}
                  onChange={(e) => setState({ ...state, discharges: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Bed Demand (Current)</Label>
                <Input
                  type="number"
                  value={state.bed_demand}
                  onChange={(e) => setState({ ...state, bed_demand: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">ICU Demand</Label>
                <Input
                  type="number"
                  value={state.icu_demand}
                  onChange={(e) => setState({ ...state, icu_demand: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">CT Demand</Label>
                <Input
                  type="number"
                  value={state.ct_demand}
                  onChange={(e) => setState({ ...state, ct_demand: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">MRI Demand</Label>
                <Input
                  type="number"
                  value={state.mri_demand}
                  onChange={(e) => setState({ ...state, mri_demand: Number(e.target.value) })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 mt-2"
              onClick={() => handlePredict()}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Forecast Demand (POST /api/forecast/demand)
            </Button>
          </CardContent>
        </Card>

        {/* 7-Target Forecast Results (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> 1-Hour Ahead Multi-Target Predictions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gradient Boosting Multi-Output Regressor Output
                  </CardDescription>
                </div>
                {result && (
                  <Badge className="bg-indigo-600 text-white font-bold text-xs px-3 py-1">
                    HORIZON: {result.forecast_horizon}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result?.predictions ? (
                <div className="space-y-4">
                  {/* Grid of 7 Prediction Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🚑 Future ER Arrivals
                      </span>
                      <div className="text-3xl font-black text-slate-900 font-mono">
                        {result.predictions.future_er_arrivals}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">per hour</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🏥 Future Admissions
                      </span>
                      <div className="text-3xl font-black text-teal-700 font-mono">
                        {result.predictions.future_admissions}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">inpatient beds needed</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🚪 Future Discharges
                      </span>
                      <div className="text-3xl font-black text-emerald-700 font-mono">
                        {result.predictions.future_discharges}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">beds liberating</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🩻 Future CT Scans
                      </span>
                      <div className="text-3xl font-black text-indigo-700 font-mono">
                        {result.predictions.future_ct_demand}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">scan slots</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🧲 Future MRI Scans
                      </span>
                      <div className="text-3xl font-black text-purple-700 font-mono">
                        {result.predictions.future_mri_demand}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">imaging slots</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        🛏️ Total Bed Demand
                      </span>
                      <div className="text-3xl font-black text-amber-700 font-mono">
                        {result.predictions.future_bed_demand}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">general ward beds</span>
                    </div>
                  </div>

                  {/* ICU Highlight Banner */}
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-rose-900 text-sm flex items-center">
                        <Activity className="w-4 h-4 mr-1.5 text-rose-600" />
                        Predicted Critical ICU Demand: {result.predictions.future_icu_demand} Intensive Beds
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5 font-medium">
                        Net Inpatient Flow: {result.predictions.future_admissions - result.predictions.future_discharges > 0 ? '+' : ''}
                        {result.predictions.future_admissions - result.predictions.future_discharges} net beds per hour
                      </p>
                    </div>
                    <Badge className="bg-rose-600 text-white font-bold text-xs">
                      {result.predictions.future_icu_demand >= 5 ? 'CAPACITY ALERT' : 'NORMAL INFLOW'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <TrendingUp className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">
                    Click "Forecast Demand" or pick a preset to forecast all 7 operational metrics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
