import { DashboardOverview } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, BedDouble, Heart, Stethoscope, Scissors, Cpu, UserCog, AlertTriangle } from 'lucide-react';

export function KPICards({ data }: { data: DashboardOverview }) {
  const getOccupancyColor = (rate: number) => {
    if (rate < 70) return 'text-green-500';
    if (rate <= 85) return 'text-amber-500';
    return 'text-red-500';
  };

  const bedOccupancyRate = Math.round((data.bed_occupancy.occupancy_rate || 0) * 100);
  const icuOccupancyRate = Math.round((data.icu_occupancy.occupancy_rate || 0) * 100);

  const criticalAlertsCount = (data.active_alerts || []).filter(a => a.severity === 'CRITICAL').length;
  const totalAlertsCount = (data.active_alerts || []).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Active Patients</CardTitle>
          <Users className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-100">{data.total_patients}</div>
          <p className="text-xs text-gray-500 mt-1">{data.total_active_admissions} active admissions</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Bed Occupancy</CardTitle>
          <BedDouble className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getOccupancyColor(bedOccupancyRate)}`}>
            {bedOccupancyRate}%
          </div>
          <Progress value={bedOccupancyRate} className="h-2 mt-3 bg-gray-800" />
          <p className="text-xs text-gray-500 mt-2">{data.bed_occupancy.occupied} / {data.bed_occupancy.total} beds</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">ICU Occupancy</CardTitle>
          <Heart className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getOccupancyColor(icuOccupancyRate)}`}>
            {icuOccupancyRate}%
          </div>
          <Progress value={icuOccupancyRate} className="h-2 mt-3 bg-gray-800" />
          <p className="text-xs text-gray-500 mt-2">{data.icu_occupancy.occupied} / {data.icu_occupancy.total} beds</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">ER Load</CardTitle>
          <Stethoscope className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-100">{data.er_load.current_patients} ER Patients</div>
          <p className="text-xs text-gray-500 mt-1">{data.er_load.waiting} waiting ({data.er_load.avg_wait_minutes} min avg wait)</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">OT Status</CardTitle>
          <Scissors className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-100">{data.ot_status.in_use} / {data.ot_status.total} In Use</div>
          <p className="text-xs text-gray-500 mt-1">{data.ot_status.available} available</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Equipment Available</CardTitle>
          <Cpu className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-100">{data.equipment_status.available}</div>
          <p className="text-xs text-gray-500 mt-1">{data.equipment_status.total} total equipment</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Staff on Duty</CardTitle>
          <UserCog className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-100">{data.staff_on_duty.total} On Duty</div>
          <p className="text-xs text-gray-500 mt-1">{data.staff_on_duty.doctors} doctors, {data.staff_on_duty.nurses} nurses</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Active Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{criticalAlertsCount} Critical</div>
          <p className="text-xs text-gray-500 mt-1">{totalAlertsCount} total alerts</p>
        </CardContent>
      </Card>
    </div>
  );
}
