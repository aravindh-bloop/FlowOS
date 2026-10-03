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
      case 'CRITICAL': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
      case 'HIGH': return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case 'MEDIUM': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>;
      case 'LOW': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="h-8 w-8 text-purple-500" />
        <h1 className="text-3xl font-bold tracking-tight">Intelligence Center</h1>
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="bg-gray-900 border border-gray-800 mb-6">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Predictions (Next 4 Hours)</h2>
            <Button onClick={handleGeneratePredictions} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Generate Predictions
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map(pred => (
              <Card key={pred.id} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-200">{pred.prediction_type ? pred.prediction_type.replace(/_/g, ' ') : 'PREDICTION'}</CardTitle>
                    {getSeverityBadge(pred.severity)}
                  </div>
                  <CardDescription className="text-gray-400">{pred.department_name || 'Hospital Wide'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Current</p>
                      <p className="text-xl font-bold text-gray-300">{pred.current_value ?? '-'}</p>
                    </div>
                    <ChevronRight className="text-gray-600 w-6 h-6" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Predicted</p>
                      <p className="text-xl font-bold text-purple-400">{pred.predicted_value}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Confidence</span>
                      <span className="text-gray-400">{Math.round((pred.confidence || 0) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((pred.confidence || 0) * 100)} className="h-1.5 bg-gray-800" />
                  </div>
                  <div className="mt-4 p-3 bg-gray-950 rounded-lg border border-gray-800 text-sm text-gray-400">
                    <p className="font-semibold text-gray-300 mb-1">Reasoning:</p>
                    {pred.reasoning}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Detected Bottlenecks</h2>
            <Button onClick={handleDetectBottlenecks} disabled={actionLoading} variant="outline" className="border-orange-700 text-orange-500 hover:bg-orange-900/20">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Scan for Bottlenecks
            </Button>
          </div>
          <div className="space-y-4">
            {bottlenecks.map(bot => (
              <Card key={bot.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                      <div>
                        <CardTitle className="text-lg text-gray-200">{bot.title}</CardTitle>
                        <CardDescription>{bot.department_name || 'System Wide'}</CardDescription>
                      </div>
                    </div>
                    {getSeverityBadge(bot.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{bot.description}</p>
                  <div className="flex items-center text-sm text-gray-400 bg-gray-950 p-3 rounded-lg border border-gray-800 inline-flex">
                    <span className="font-semibold text-gray-200 mr-2">Impact:</span> 
                    {bot.affected_patient_count || 0} patients affected
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-950/50 border-t border-gray-800 pt-4 flex justify-end">
                  <Button 
                    onClick={() => handleGetRecommendation(bot.id)} 
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Get AI Recommendations
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {bottlenecks.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
                No active bottlenecks detected.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <h2 className="text-xl font-semibold">Actionable Recommendations</h2>
          <div className="space-y-6">
            {recommendations.map(rec => (
              <Card key={rec.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                <div className={`h-1 w-full ${
                  rec.status === 'PENDING' ? 'bg-amber-500' :
                  rec.status === 'APPROVED' ? 'bg-blue-500' :
                  rec.status === 'EXECUTED' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-gray-200">{rec.title}</CardTitle>
                      <CardDescription className="mt-1">{rec.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className={
                      rec.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      rec.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      rec.status === 'EXECUTED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }>
                      {rec.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Reasoning</h4>
                    <p className="text-sm text-gray-300">{rec.reasoning}</p>
                  </div>
                  
                  {rec.proposed_actions && rec.proposed_actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Proposed Actions</h4>
                      <ul className="space-y-2">
                        {rec.proposed_actions.map((act: any, i: number) => (
                          <li key={i} className="flex items-start text-sm bg-gray-800/30 p-2 rounded">
                            <ChevronRight className="w-4 h-4 text-blue-500 mr-2 shrink-0 mt-0.5" />
                            <span className="text-gray-300">
                              {typeof act === 'string' ? act : (act.action_type ? `${act.action_type}: ${JSON.stringify(act.parameters || {})}` : JSON.stringify(act))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-950 border-t border-gray-800 pt-4 flex justify-end space-x-3">
                  {rec.status === 'PENDING' && (
                    <>
                      <Button variant="outline" className="border-red-900 text-red-500 hover:bg-red-950" onClick={() => { setSelectedRecId(rec.id); setDialogMode('reject'); }}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setSelectedRecId(rec.id); setDialogMode('approve'); }}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                    </>
                  )}
                  {rec.status === 'APPROVED' && (
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleExecute(rec.id)} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                      Execute Actions
                    </Button>
                  )}
                  {rec.status === 'EXECUTED' && (
                    <span className="text-sm text-green-500 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" /> Successfully Executed
                    </span>
                  )}
                </CardFooter>
              </Card>
            ))}
            {recommendations.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
                No active recommendations.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={dialogMode === 'reject'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Reject Recommendation</DialogTitle>
            <DialogDescription className="text-gray-400">Please provide a reason for rejecting this AI recommendation.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-gray-300">Reason</Label>
            <Textarea 
              id="reason" 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-gray-950 border-gray-800 mt-2"
              placeholder="e.g. Insufficient staff available..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} className="border-gray-700">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialogMode === 'approve'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Approve Recommendation</DialogTitle>
            <DialogDescription className="text-gray-400">Add any notes for execution (optional).</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="notes" className="text-gray-300">Approval Notes</Label>
            <Textarea 
              id="notes" 
              value={approveNotes} 
              onChange={(e) => setApproveNotes(e.target.value)}
              className="bg-gray-950 border-gray-800 mt-2"
              placeholder="e.g. Proceed with caution..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} className="border-gray-700">Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
