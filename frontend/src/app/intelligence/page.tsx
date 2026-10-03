'use client';

import { useState, useEffect } from 'react';
import { 
  getPredictions, generatePredictions, 
  getBottlenecks, detectBottlenecks, 
  getRecommendations, generateRecommendation, approveAction, rejectAction, executeAction 
} from '@/lib/api';
import { Prediction, Bottleneck, Recommendation } from '@/types';
import { Loader2, Brain, RefreshCw, AlertTriangle, Zap, CheckCircle, XCircle, Play, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { runAnomalyDetection } from '@/lib/api';
import { ShieldAlert } from 'lucide-react';

export default function IntelligencePage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // ML Anomaly Detection state
  const [anomalyState, setAnomalyState] = useState({
    hour: 14,
    day_of_week: 2,
    is_weekend: 0,
    er_arrivals: 8,
    admissions: 5,
    discharges: 4,
    er_queue: 5,
    bed_occupancy: 0.968,
    available_beds: 12,
    icu_occupancy: 0.995,
    available_icu_beds: 0,
    ct_queue: 8,
    mri_queue: 5,
    equipment_utilization: 0.82,
    avg_diagnostic_wait: 45,
    staff_workload: 0.77,
    active_emergencies: 1,
    avg_transfer_time: 20,
    pending_tasks: 30
  });

  const [anomalyResult, setAnomalyResult] = useState<any>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [selectedRecId, setSelectedRecId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null);

  const handleRunAnomalyDetection = async (customState?: any) => {
    setAnomalyLoading(true);
    try {
      const stateToUse = customState || anomalyState;
      const res = await runAnomalyDetection(stateToUse);
      setAnomalyResult(res);
    } catch (err) {
      console.error("Anomaly Detection Error:", err);
    } finally {
      setAnomalyLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [preds, bots, recs] = await Promise.all([
        getPredictions(),
        getBottlenecks(),
        getRecommendations()
      ]);
      setPredictions(preds);
      setBottlenecks(bots);
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGeneratePredictions = async () => {
    setActionLoading(true);
    await generatePredictions();
    await fetchData();
    setActionLoading(false);
  };

  const handleDetectBottlenecks = async () => {
    setActionLoading(true);
    await detectBottlenecks();
    await fetchData();
    setActionLoading(false);
  };

  const handleGetRecommendation = async (bottleneckId: number) => {
    setActionLoading(true);
    await generateRecommendation(bottleneckId);
    await fetchData();
    setActionLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedRecId) return;
    setActionLoading(true);
    await approveAction(selectedRecId, approveNotes);
    setSelectedRecId(null);
    setDialogMode(null);
    setApproveNotes('');
    await fetchData();
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedRecId) return;
    setActionLoading(true);
    await rejectAction(selectedRecId, rejectReason);
    setSelectedRecId(null);
    setDialogMode(null);
    setRejectReason('');
    await fetchData();
    setActionLoading(false);
  };

  const handleExecute = async (id: number) => {
    setActionLoading(true);
    await executeAction(id);
    await fetchData();
    setActionLoading(false);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold">Critical</Badge>;
      case 'HIGH': return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">High</Badge>;
      case 'MEDIUM': return <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-semibold">Medium</Badge>;
      case 'LOW': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">Low</Badge>;
      default: return <Badge variant="outline" className="border-slate-300 text-slate-700">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
          <Brain className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Intelligence & Predictive AI</h1>
          <p className="text-xs font-medium text-slate-500">Autonomous capacity forecasting, bottleneck detection, and clinical recommendations</p>
        </div>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="bg-white border border-slate-200 shadow-2xs mb-6 p-1">
          <TabsTrigger value="predictions" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold text-xs">Predictions</TabsTrigger>
          <TabsTrigger value="bottlenecks" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold text-xs">Bottlenecks</TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold text-xs">Recommendations</TabsTrigger>
          <TabsTrigger value="anomalies" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-bold text-xs flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> ML Anomaly Detector (v1.0.0)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">AI Predictions (Next 4 Hours)</h2>
            <Button onClick={handleGeneratePredictions} disabled={actionLoading} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate Predictions
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map(pred => (
              <Card key={pred.id} className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold text-slate-900">{pred.prediction_type ? pred.prediction_type.replace(/_/g, ' ') : 'PREDICTION'}</CardTitle>
                    {getSeverityBadge(pred.severity)}
                  </div>
                  <CardDescription className="text-xs font-medium text-slate-500">{pred.department_name || 'Hospital Wide'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Current</p>
                      <p className="text-xl font-bold text-slate-800">{pred.current_value ?? '-'}</p>
                    </div>
                    <ChevronRight className="text-slate-400 w-5 h-5" />
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase">Predicted</p>
                      <p className="text-xl font-bold text-indigo-600">{pred.predicted_value}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Confidence Score</span>
                      <span className="text-slate-700">{Math.round((pred.confidence || 0) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((pred.confidence || 0) * 100)} className="h-1.5 bg-slate-100 [&>div]:bg-teal-600" />
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 mb-1">Clinical Reasoning:</p>
                    {pred.reasoning}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Detected Bottlenecks</h2>
            <Button onClick={handleDetectBottlenecks} disabled={actionLoading} variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />}
              Scan for Bottlenecks
            </Button>
          </div>
          <div className="space-y-4">
            {bottlenecks.map(bot => (
              <Card key={bot.id} className="bg-white border-slate-200/80 shadow-xs">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900">{bot.title}</CardTitle>
                        <CardDescription className="text-xs text-slate-500">{bot.department_name || 'System Wide'}</CardDescription>
                      </div>
                    </div>
                    {getSeverityBadge(bot.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 text-sm mb-4">{bot.description}</p>
                  <div className="flex items-center text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 inline-flex">
                    <span className="font-bold text-slate-800 mr-2">Impacted:</span> 
                    {bot.affected_patient_count || 0} patients affected
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-200/80 pt-3 flex justify-end">
                  <Button 
                    onClick={() => handleGetRecommendation(bot.id)} 
                    disabled={actionLoading}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Get AI Recommendations
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {bottlenecks.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                No active bottlenecks detected.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Actionable Recommendations</h2>
          <div className="space-y-6">
            {recommendations.map(rec => (
              <Card key={rec.id} className="bg-white border-slate-200/80 shadow-xs overflow-hidden">
                <div className={`h-1.5 w-full ${
                  rec.status === 'PENDING' ? 'bg-amber-500' :
                  rec.status === 'APPROVED' ? 'bg-teal-600' :
                  rec.status === 'EXECUTED' ? 'bg-emerald-600' : 'bg-rose-500'
                }`} />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-slate-900 font-bold">{rec.title}</CardTitle>
                      <CardDescription className="mt-1 text-slate-600 font-medium text-xs">{rec.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className={
                      rec.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' :
                      rec.status === 'APPROVED' ? 'bg-teal-100 text-teal-800 border-teal-300 font-semibold' :
                      rec.status === 'EXECUTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' : 
                      'bg-rose-100 text-rose-800 border-rose-300 font-semibold'
                    }>
                      {rec.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Reasoning</h4>
                    <p className="text-sm text-slate-700 font-medium">{rec.reasoning}</p>
                  </div>
                  
                  {rec.proposed_actions && rec.proposed_actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proposed Actions</h4>
                      <ul className="space-y-2">
                        {rec.proposed_actions.map((act: any, i: number) => (
                          <li key={i} className="flex items-start text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                            <ChevronRight className="w-4 h-4 text-teal-600 mr-1.5 shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-semibold">
                              {typeof act === 'string' ? act : (act.action_type ? `${act.action_type}: ${JSON.stringify(act.parameters || {})}` : JSON.stringify(act))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t border-slate-200/80 pt-3 flex justify-end space-x-3">
                  {rec.status === 'PENDING' && (
                    <>
                      <Button variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs" onClick={() => { setSelectedRecId(rec.id); setDialogMode('reject'); }}>
                        <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Reject
                      </Button>
                      <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs" onClick={() => { setSelectedRecId(rec.id); setDialogMode('approve'); }}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    </>
                  )}
                  {rec.status === 'APPROVED' && (
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs" onClick={() => handleExecute(rec.id)} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                      Execute Actions
                    </Button>
                  )}
                  {rec.status === 'EXECUTED' && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Successfully Executed
                    </span>
                  )}
                </CardFooter>
              </Card>
            ))}
            {recommendations.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                No active recommendations.
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: ML ANOMALY DETECTOR (v1.0.0) */}
        <TabsContent value="anomalies" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-bold text-xs">
                  MODEL: flowos_anomaly_model.pkl (v1.0.0)
                </Badge>
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 font-bold text-xs">
                  IsolationForest + Hybrid Rule Engine
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Flow OS ML Anomaly Detection Engine</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Evaluates hospital operational telemetry against scikit-learn decision functions and operational safety rules in real time.
              </p>
            </div>

            {/* Scenario Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs"
                onClick={() => {
                  const state = {
                    hour: 10, day_of_week: 2, is_weekend: 0, er_arrivals: 5, admissions: 3, discharges: 4, er_queue: 3,
                    bed_occupancy: 0.75, available_beds: 35, icu_occupancy: 0.70, available_icu_beds: 6, ct_queue: 4,
                    mri_queue: 3, equipment_utilization: 0.65, avg_diagnostic_wait: 30, staff_workload: 0.60,
                    active_emergencies: 0, avg_transfer_time: 15, pending_tasks: 15
                  };
                  setAnomalyState(state);
                  handleRunAnomalyDetection(state);
                }}
              >
                Preset 1: Normal Baseline
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-xs"
                onClick={() => {
                  const state = {
                    hour: 14, day_of_week: 3, is_weekend: 0, er_arrivals: 8, admissions: 5, discharges: 2, er_queue: 5,
                    bed_occupancy: 0.90, available_beds: 10, icu_occupancy: 0.995, available_icu_beds: 0, ct_queue: 6,
                    mri_queue: 4, equipment_utilization: 0.75, avg_diagnostic_wait: 40, staff_workload: 0.80,
                    active_emergencies: 1, avg_transfer_time: 25, pending_tasks: 25
                  };
                  setAnomalyState(state);
                  handleRunAnomalyDetection(state);
                }}
              >
                Preset 2: ICU Pressure Surge
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs"
                onClick={() => {
                  const state = {
                    hour: 11, day_of_week: 1, is_weekend: 0, er_arrivals: 6, admissions: 4, discharges: 3, er_queue: 4,
                    bed_occupancy: 0.82, available_beds: 20, icu_occupancy: 0.80, available_icu_beds: 4, ct_queue: 25,
                    mri_queue: 8, equipment_utilization: 0.88, avg_diagnostic_wait: 95, staff_workload: 0.75,
                    active_emergencies: 0, avg_transfer_time: 20, pending_tasks: 20
                  };
                  setAnomalyState(state);
                  handleRunAnomalyDetection(state);
                }}
              >
                Preset 3: Diagnostic Bottleneck
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Telemetry Form */}
            <Card className="bg-white border-slate-200/80 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-indigo-600" /> Hospital Operational Inputs
                </CardTitle>
                <CardDescription className="text-xs">Adjust hospital metrics to test the ML anomaly decision boundary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">ICU Occupancy ({Math.round(anomalyState.icu_occupancy * 100)}%)</Label>
                    <input 
                      type="range" min="0" max="1" step="0.005"
                      value={anomalyState.icu_occupancy}
                      onChange={e => setAnomalyState({...anomalyState, icu_occupancy: parseFloat(e.target.value)})}
                      className="w-full accent-teal-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Available ICU Beds</Label>
                    <input 
                      type="number" min="0" max="50"
                      value={anomalyState.available_icu_beds}
                      onChange={e => setAnomalyState({...anomalyState, available_icu_beds: parseInt(e.target.value) || 0})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">CT Queue Size</Label>
                    <input 
                      type="number" min="0" max="100"
                      value={anomalyState.ct_queue}
                      onChange={e => setAnomalyState({...anomalyState, ct_queue: parseInt(e.target.value) || 0})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Avg Diagnostic Wait (min)</Label>
                    <input 
                      type="number" min="0" max="300"
                      value={anomalyState.avg_diagnostic_wait}
                      onChange={e => setAnomalyState({...anomalyState, avg_diagnostic_wait: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Staff Workload ({Math.round(anomalyState.staff_workload * 100)}%)</Label>
                    <input 
                      type="range" min="0" max="1" step="0.01"
                      value={anomalyState.staff_workload}
                      onChange={e => setAnomalyState({...anomalyState, staff_workload: parseFloat(e.target.value)})}
                      className="w-full accent-teal-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700">Pending Tasks Count</Label>
                    <input 
                      type="number" min="0" max="200"
                      value={anomalyState.pending_tasks}
                      onChange={e => setAnomalyState({...anomalyState, pending_tasks: parseInt(e.target.value) || 0})}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 mt-2"
                  onClick={() => handleRunAnomalyDetection()}
                  disabled={anomalyLoading}
                >
                  {anomalyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Run Hybrid ML Anomaly Evaluation (POST /api/intelligence/anomaly-detection)
                </Button>
              </CardContent>
            </Card>

            {/* Live Model Output Display */}
            <Card className="bg-white border-slate-200/80 shadow-xs flex flex-col justify-between">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-2 text-indigo-600" /> ML Model Evaluation Output
                    </CardTitle>
                    <CardDescription className="text-xs">Result returned from flowos_anomaly_model.pkl</CardDescription>
                  </div>
                  {anomalyResult && (
                    <Badge className={
                      anomalyResult.overall_severity === 'CRITICAL' ? 'bg-rose-600 text-white font-bold text-xs px-3 py-1' :
                      anomalyResult.overall_severity === 'HIGH' ? 'bg-amber-500 text-white font-bold text-xs px-3 py-1' :
                      anomalyResult.overall_severity === 'MEDIUM' ? 'bg-sky-600 text-white font-bold text-xs px-3 py-1' :
                      'bg-emerald-600 text-white font-bold text-xs px-3 py-1'
                    }>
                      OVERALL SEVERITY: {anomalyResult.overall_severity}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {anomalyResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Is Anomaly</span>
                        <span className={`text-base font-bold ${anomalyResult.is_anomaly ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {anomalyResult.is_anomaly ? 'TRUE' : 'FALSE'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ML Score</span>
                        <span className="text-base font-bold font-mono text-slate-800">{anomalyResult.ml_score}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model Version</span>
                        <span className="text-base font-bold text-teal-700">{anomalyResult.model_version}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Detected Operational & Statistical Anomalies</h4>
                      {anomalyResult.operational_anomalies?.length > 0 ? (
                        <div className="space-y-2">
                          {anomalyResult.operational_anomalies.map((ano: any, idx: number) => (
                            <div key={idx} className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-rose-900 uppercase tracking-wide text-[11px]">{ano.type}</span>
                                <Badge className="bg-rose-600 text-white font-bold text-[10px]">{ano.severity}</Badge>
                              </div>
                              <p className="text-rose-800 font-semibold leading-snug">{ano.reason}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center text-emerald-800 font-bold">
                          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                          No operational or statistical anomalies detected. Hospital running within baseline threshold.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <Zap className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">Click "Run Hybrid ML Anomaly Evaluation" or select a preset above to execute predictions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={dialogMode === 'reject'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Reject Recommendation</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Please provide a reason for rejecting this AI recommendation.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-slate-700 font-semibold">Reason</Label>
            <Textarea 
              id="reason" 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 mt-2"
              placeholder="e.g. Insufficient staff available..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} className="border-slate-300 text-slate-700">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialogMode === 'approve'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold">Approve Recommendation</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">Add any notes for execution (optional).</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="notes" className="text-slate-700 font-semibold">Approval Notes</Label>
            <Textarea 
              id="notes" 
              value={approveNotes} 
              onChange={(e) => setApproveNotes(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 mt-2"
              placeholder="e.g. Proceed with caution..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} className="border-slate-300 text-slate-700">Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
