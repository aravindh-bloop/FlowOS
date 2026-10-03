import { Alert } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActiveAlerts({ alerts, onAcknowledge }: { alerts: Alert[], onAcknowledge: (id: number) => void }) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'HIGH': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'MEDIUM': return 'bg-sky-50 border-sky-200 text-sky-800';
      case 'LOW': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityMap: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0);
  });

  if (alerts.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px] shadow-xs">
        <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
        <p className="font-semibold text-slate-700">All Systems Normal</p>
        <p className="text-xs text-slate-400">No active alerts requiring attention.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl flex-1 overflow-hidden shadow-xs">
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {sortedAlerts.map(alert => (
            <div key={alert.id} className={`border rounded-xl p-3.5 flex flex-col space-y-2 shadow-2xs ${getSeverityStyle(alert.severity)}`}>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider ${getBadgeStyle(alert.severity)}`}>
                  {alert.severity}
                </Badge>
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <Clock className="w-3 h-3 mr-1 text-slate-400" />
                  {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{alert.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2">{alert.message}</p>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500">{alert.department_name || 'Hospital Wide'}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs font-semibold bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                  Acknowledge
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
