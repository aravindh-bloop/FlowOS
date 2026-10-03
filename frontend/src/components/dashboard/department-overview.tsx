import { DepartmentSummary } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, UserCog, AlertCircle } from 'lucide-react';

export function DepartmentOverview({ departments }: { departments: DepartmentSummary[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {departments.map((dept) => {
        const occupancyRate = Math.round((dept.bed_occupancy_rate || 0) * 100);
        
        return (
          <Card key={dept.id} className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                {dept.active_alerts > 0 && (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-semibold">
                    <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                    {dept.active_alerts} Alerts
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Bed Occupancy</span>
                    <span className={occupancyRate >= 85 ? 'text-rose-600 font-bold' : 'text-slate-700'}>{occupancyRate}%</span>
                  </div>
                  <Progress 
                    value={occupancyRate} 
                    className={`h-2 bg-slate-100 ${occupancyRate >= 85 ? '[&>div]:bg-rose-500' : occupancyRate >= 70 ? '[&>div]:bg-amber-500' : '[&>div]:bg-teal-600'}`} 
                  />
                </div>
                
                <div className="flex justify-between text-xs font-medium text-slate-600 pt-1">
                  <div className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                    <span>{dept.patient_count} Patients</span>
                  </div>
                  <div className="flex items-center">
                    <UserCog className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                    <span>{dept.staff_on_duty} Staff</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
