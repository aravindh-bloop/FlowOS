'use client';

import { useState, useEffect } from 'react';
import { getResources, getOperatingTheatres } from '@/lib/api';
import { Equipment, OperatingTheatre } from '@/types';
import { Loader2, AlertCircle, Cpu, Scissors } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ResourcesPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [ots, setOts] = useState<OperatingTheatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const [eqData, otData] = await Promise.all([
        getResources(),
        getOperatingTheatres().catch(() => [])
      ]);
      setEquipment(eqData);
      setOts(otData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'IN_USE': return 'bg-teal-50 text-teal-800 border-teal-300 font-semibold';
      case 'MAINTENANCE': return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'UNAVAILABLE': return 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      default: return 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50 text-slate-900">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Error Loading Resources</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchResources} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
          <Cpu className="h-7 w-7 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Equipment & Facilities</h1>
          <p className="text-xs font-medium text-slate-500">Monitor medical equipment, diagnostic tools, and operating theatres</p>
        </div>
      </div>

      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="bg-white border border-slate-200 shadow-2xs mb-6">
          <TabsTrigger value="equipment" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold">
            <Cpu className="w-4 h-4 mr-2 text-teal-600" /> Equipment ({equipment.length})
          </TabsTrigger>
          <TabsTrigger value="ots" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 font-semibold">
            <Scissors className="w-4 h-4 mr-2 text-teal-600" /> Operating Theatres ({ots.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipment.map(item => (
              <Card key={item.id} className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h3>
                      <p className="text-xs font-medium text-slate-500">{item.department_name || 'Hospital Wide'}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status ? item.status.replace(/_/g, ' ') : 'UNKNOWN'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {item.type}
                    </span>
                  </div>
                  {item.current_patient_id && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <p className="text-xs text-slate-500 font-medium">In use by patient: <span className="text-slate-800 font-bold">{item.current_patient_id}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ots">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ots.map(ot => (
              <Card key={ot.id} className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mr-3 border border-teal-100">
                        <Scissors className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{ot.name}</h3>
                        <p className="text-xs font-medium text-slate-500">{ot.department_name || 'Surgical Dept'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(ot.status)}>
                      {ot.status ? ot.status.replace(/_/g, ' ') : 'UNKNOWN'}
                    </Badge>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Current Status</p>
                    {ot.status === 'IN_USE' ? (
                      <p className="text-xs text-teal-700 font-bold">Procedure Ongoing</p>
                    ) : ot.status === 'CLEANING' || ot.status === 'MAINTENANCE' ? (
                      <p className="text-xs text-amber-700 font-bold">Sanitization / Maintenance</p>
                    ) : (
                      <p className="text-xs text-emerald-700 font-bold">Ready for Surgery</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
