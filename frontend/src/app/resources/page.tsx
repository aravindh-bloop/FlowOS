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
      case 'AVAILABLE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_USE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'MAINTENANCE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'UNAVAILABLE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-950 text-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Resources</h2>
        <p className="text-gray-400">{error}</p>
        <Button onClick={fetchResources} variant="outline" className="border-gray-700 hover:bg-gray-800">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <h1 className="text-2xl font-bold flex items-center">
        <Cpu className="mr-3 text-blue-500" /> Equipment & Facilities
      </h1>

      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="bg-gray-900 border border-gray-800 mb-6">
          <TabsTrigger value="equipment" className="data-[state=active]:bg-gray-800 data-[state=active]:text-gray-100">
            <Cpu className="w-4 h-4 mr-2" /> Equipment ({equipment.length})
          </TabsTrigger>
          <TabsTrigger value="ots" className="data-[state=active]:bg-gray-800 data-[state=active]:text-gray-100">
            <Scissors className="w-4 h-4 mr-2" /> Operating Theatres ({ots.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipment.map(item => (
              <Card key={item.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-200">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.department_name || 'Hospital Wide'}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(item.status)}>
                      {item.status ? item.status.replace(/_/g, ' ') : 'UNKNOWN'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 bg-gray-950 px-2 py-1 rounded border border-gray-800 text-xs">
                      {item.type}
                    </span>
                  </div>
                  {item.current_patient_id && (
                    <div className="pt-2 border-t border-gray-800 mt-2">
                      <p className="text-xs text-gray-500">In use by patient: <span className="text-gray-300">{item.current_patient_id}</span></p>
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
              <Card key={ot.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center mr-3 border border-blue-800/50">
                        <Scissors className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-200 text-lg">{ot.name}</h3>
                        <p className="text-sm text-gray-500">{ot.department_name || 'Surgical Dept'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(ot.status)}>
                      {ot.status ? ot.status.replace(/_/g, ' ') : 'UNKNOWN'}
                    </Badge>
                  </div>
                  
                  <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Current Status</p>
                    {ot.status === 'IN_USE' ? (
                      <p className="text-sm text-gray-200 font-medium">Procedure ongoing</p>
                    ) : ot.status === 'CLEANING' || ot.status === 'MAINTENANCE' ? (
                      <p className="text-sm text-amber-500 font-medium">Cleaning / Maintenance</p>
                    ) : (
                      <p className="text-sm text-emerald-500 font-medium">Ready for use</p>
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
