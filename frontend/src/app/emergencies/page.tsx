'use client';

import { useState, useEffect } from 'react';
import { getEmergencies, declareEmergency, respondToEmergency } from '@/lib/api';
import { Loader2, Siren, AlertTriangle, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmergenciesPage() {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [type, setType] = useState('CODE_RED');
  const [severity, setSeverity] = useState('CRITICAL');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const data = await getEmergencies();
      setEmergencies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDeclareEmergency = async () => {
    setActionLoading(true);
    try {
      await declareEmergency({ type, severity, description, departmentId });
      setIsDialogOpen(false);
      // Reset form
      setType('CODE_RED');
      setSeverity('CRITICAL');
      setDescription('');
      setDepartmentId('');
      await fetchEmergencies();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (id: any) => {
    setActionLoading(true);
    try {
      await respondToEmergency(id);
      await fetchEmergencies();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && emergencies.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
            <Siren className="h-7 w-7 text-rose-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Emergency Protocol Center</h1>
            <p className="text-xs font-medium text-slate-500">Critical incident response and hospital-wide emergency dispatch</p>
          </div>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => setIsDialogOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 px-6 shadow-md border-2 border-rose-500 rounded-xl"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          DECLARE EMERGENCY
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[500px] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center text-xl font-bold">
              <Siren className="w-5 h-5 mr-2 text-rose-600" /> Declare Hospital Emergency
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              This will trigger immediate hospital-wide alerts and AI protocol generation. Use only in actual emergencies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Emergency Type</Label>
              <Select value={type} onValueChange={(val: string | null) => val && setType(val)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="CODE_RED">Code Red (Fire)</SelectItem>
                  <SelectItem value="CODE_BLUE">Code Blue (Cardiac Arrest)</SelectItem>
                  <SelectItem value="CODE_BLACK">Code Black (Bomb Threat)</SelectItem>
                  <SelectItem value="MASS_CASUALTY">Mass Casualty Incident</SelectItem>
                  <SelectItem value="SYSTEM_FAILURE">Critical System Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Severity</Label>
              <Select value={severity} onValueChange={(val: string | null) => val && setSeverity(val)}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Department (Optional)</Label>
              <Input 
                value={departmentId} 
                onChange={e => setDepartmentId(e.target.value)} 
                className="bg-slate-50 border-slate-200 text-slate-900" 
                placeholder="e.g. ER, ICU"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Description</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="bg-slate-50 border-slate-200 text-slate-900"
                placeholder="Briefly describe the situation..."
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold" onClick={handleDeclareEmergency} disabled={actionLoading || !description}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              DECLARE NOW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-lg font-bold text-slate-800">Active Emergencies</h2>
        {emergencies.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-xs">
            <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Active Emergencies</h3>
            <p className="text-slate-500 text-sm mt-1">Hospital operations are running normally.</p>
          </div>
        ) : (
          emergencies.map((em, idx) => (
            <Card key={em.id || idx} className="bg-rose-50/50 border-rose-200 shadow-sm overflow-hidden">
              <div className="h-1.5 w-full bg-rose-600" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-rose-700 flex items-center font-bold">
                      <AlertTriangle className="w-6 h-6 mr-2 text-rose-600" />
                      {em.type ? em.type.replace(/_/g, ' ') : 'EMERGENCY'}
                    </CardTitle>
                    <div className="flex items-center mt-2 space-x-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Declared: {em.created_at || em.declaredAt ? new Date(em.created_at || em.declaredAt).toLocaleTimeString() : 'Recent'}
                      </span>
                      {em.departmentId && <span>Location: {em.departmentId}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 text-xs py-1 px-3 font-bold">
                    {em.severity || em.status || 'ACTIVE'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-800 text-base font-semibold">{em.title || em.description || em.message}</p>
                
                {em.aiResponsePlan && Array.isArray(em.aiResponsePlan) && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                    <h4 className="text-xs font-bold text-teal-700 mb-3 uppercase tracking-wider">AI Generated Clinical Response Plan</h4>
                    <ul className="space-y-3">
                      {em.aiResponsePlan.map((step: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="bg-teal-100 text-teal-800 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 shrink-0 border border-teal-200">
                            {i+1}
                          </span>
                          <span className="text-slate-700 text-sm font-medium">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-white/80 border-t border-slate-200/80 pt-4 flex justify-end">
                {em.status !== 'RESOLVED' && (
                  <Button 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold" 
                    onClick={() => handleRespond(em.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Mark as Responding'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
