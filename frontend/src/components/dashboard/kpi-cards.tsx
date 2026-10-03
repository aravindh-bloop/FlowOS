import { DashboardOverview } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, BedDouble, Heart, Stethoscope, Scissors, Cpu, UserCog, AlertTriangle } from 'lucide-react';

export function KPICards({ data }: { data: DashboardOverview }) {
  const getOccupancyColor = (rate: number) => {
    if (rate < 70) return 'text-emerald-600';
    if (rate <= 85) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressIndicator = (rate: number) => {
    if (rate < 70) return '[&>div]:bg-emerald-500';
    if (rate <= 85) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-rose-500';
  };

  const bedOccupancyRate = Math.round((data.bed_occupancy.occupancy_rate || 0) * 100);
  const icuOccupancyRate = Math.round((data.icu_occupancy.occupancy_rate || 0) * 100);

  const criticalAlertsCount = (data.active_alerts || []).filter(a => a.severity === 'CRITICAL').length;
  const totalAlertsCount = (data.active_alerts || []).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Patients</CardTitle>
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{data.total_patients}</div>
          <p className="text-xs font-medium text-slate-500 mt-1">{data.total_active_admissions} active admissions</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bed Occupancy</CardTitle>
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <BedDouble className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getOccupancyColor(bedOccupancyRate)}`}>
            {bedOccupancyRate}%
          </div>
          <Progress value={bedOccupancyRate} className={`h-2 mt-3 bg-slate-100 ${getProgressIndicator(bedOccupancyRate)}`} />
          <p className="text-xs font-medium text-slate-500 mt-2">{data.bed_occupancy.occupied} / {data.bed_occupancy.total} beds in use</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ICU Capacity</CardTitle>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Heart className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getOccupancyColor(icuOccupancyRate)}`}>
            {icuOccupancyRate}%
          </div>
          <Progress value={icuOccupancyRate} className={`h-2 mt-3 bg-slate-100 ${getProgressIndicator(icuOccupancyRate)}`} />
          <p className="text-xs font-medium text-slate-500 mt-2">{data.icu_occupancy.occupied} / {data.icu_occupancy.total} ICU beds</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ER Load</CardTitle>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Stethoscope className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{data.er_load.current_patients} ER Patients</div>
          <p className="text-xs font-medium text-slate-500 mt-1">{data.er_load.waiting} waiting ({data.er_load.avg_wait_minutes} min avg wait)</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OT Status</CardTitle>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Scissors className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{data.ot_status.in_use} / {data.ot_status.total} In Use</div>
          <p className="text-xs font-medium text-slate-500 mt-1">{data.ot_status.available} suites available</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment Available</CardTitle>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Cpu className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{data.equipment_status.available}</div>
          <p className="text-xs font-medium text-slate-500 mt-1">{data.equipment_status.total} total devices online</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff On Duty</CardTitle>
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <UserCog className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{data.staff_on_duty.total} On Duty</div>
          <p className="text-xs font-medium text-slate-500 mt-1">{data.staff_on_duty.doctors} doctors, {data.staff_on_duty.nurses} nurses</p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Alerts</CardTitle>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">{criticalAlertsCount} Critical</div>
          <p className="text-xs font-medium text-slate-500 mt-1">{totalAlertsCount} total active alerts</p>
        </CardContent>
      </Card>
    </div>
  );
}
