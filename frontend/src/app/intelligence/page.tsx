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

export default function IntelligencePage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [selectedRecId, setSelectedRecId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null);

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
        <TabsList className="bg-white border border-slate-200 shadow-2xs mb-6">
          <TabsTrigger value="predictions" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold">Predictions</TabsTrigger>
          <TabsTrigger value="bottlenecks" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold">Bottlenecks</TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold">Recommendations</TabsTrigger>
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
