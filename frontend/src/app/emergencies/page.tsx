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
    const interval = setInterval(fetchEmergencies, 15000); // Check every 15s
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
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Siren className="h-8 w-8 text-red-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight">Emergency Management</h1>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => setIsDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-900/50 border-2 border-red-500"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          DECLARE EMERGENCY
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-red-900 text-gray-100 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center text-xl">
              <Siren className="w-5 h-5 mr-2" /> Declare Hospital Emergency
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will trigger immediate hospital-wide alerts and AI protocol generation. Use only in actual emergencies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Emergency Type</Label>
              <Select value={type} onValueChange={(val: string | null) => val && setType(val)}>
                <SelectTrigger className="bg-gray-950 border-gray-800">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CODE_RED">Code Red (Fire)</SelectItem>
                  <SelectItem value="CODE_BLUE">Code Blue (Cardiac Arrest)</SelectItem>
                  <SelectItem value="CODE_BLACK">Code Black (Bomb Threat)</SelectItem>
                  <SelectItem value="MASS_CASUALTY">Mass Casualty Incident</SelectItem>
                  <SelectItem value="SYSTEM_FAILURE">Critical System Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(val: string | null) => val && setSeverity(val)}>
                <SelectTrigger className="bg-gray-950 border-gray-800">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Department (Optional)</Label>
              <Input 
                value={departmentId} 
                onChange={e => setDepartmentId(e.target.value)} 
                className="bg-gray-950 border-gray-800" 
                placeholder="e.g. ER, ICU"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="bg-gray-950 border-gray-800"
                placeholder="Briefly describe the situation..."
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" className="border-gray-700" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleDeclareEmergency} disabled={actionLoading || !description}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              DECLARE NOW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-xl font-semibold">Active Emergencies</h2>
        {emergencies.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-200">No Active Emergencies</h3>
            <p className="text-gray-500 mt-2">Hospital operations are running normally.</p>
          </div>
        ) : (
          emergencies.map((em, idx) => (
            <Card key={em.id || idx} className="bg-red-950/20 border-red-900/50">
              <div className="h-1 w-full bg-red-600" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-red-400 flex items-center">
                      <AlertTriangle className="w-6 h-6 mr-2" />
                      {em.type ? em.type.replace(/_/g, ' ') : 'EMERGENCY'}
                    </CardTitle>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> Declared: {em.created_at || em.declaredAt ? new Date(em.created_at || em.declaredAt).toLocaleTimeString() : 'Recent'}
                      </span>
                      {em.departmentId && <span>Location: {em.departmentId}</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-lg py-1 px-3">
                    {em.severity || em.status || 'ACTIVE'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-200 text-lg">{em.title || em.description || em.message}</p>
                
                {em.aiResponsePlan && Array.isArray(em.aiResponsePlan) && (
                  <div className="bg-gray-900/80 p-5 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wider">AI Generated Response Plan</h4>
                    <ul className="space-y-3">
                      {em.aiResponsePlan.map((step: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="bg-blue-900/50 text-blue-400 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 shrink-0">
                            {i+1}
                          </span>
                          <span className="text-gray-300">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-900/50 border-t border-gray-800 pt-4 flex justify-end">
                {em.status !== 'RESOLVED' && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
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
