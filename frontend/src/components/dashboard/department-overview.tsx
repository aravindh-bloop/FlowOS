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
          <Card key={dept.id} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-200">{dept.name}</h3>
                {dept.active_alerts > 0 && (
                  <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-red-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {dept.active_alerts} Alerts
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Bed Occupancy</span>
                    <span>{occupancyRate}%</span>
                  </div>
                  <Progress value={occupancyRate} className="h-1.5 bg-gray-800" />
                </div>
                
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{dept.patient_count} Patients</span>
                  </div>
                  <div className="flex items-center">
                    <UserCog className="w-4 h-4 mr-2 text-gray-500" />
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
