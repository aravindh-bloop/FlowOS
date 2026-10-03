import { Alert } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActiveAlerts({ alerts, onAcknowledge }: { alerts: Alert[], onAcknowledge: (id: number) => void }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'LOW': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityMap: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return (severityMap[b.severity] || 0) - (severityMap[a.severity] || 0);
  });

  if (alerts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl flex-1 flex items-center justify-center text-gray-500 min-h-[300px]">
        No active alerts
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl flex-1 overflow-hidden">
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          {sortedAlerts.map(alert => (
            <div key={alert.id} className="bg-gray-950 border border-gray-800 rounded-lg p-3 flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-200">{alert.title}</h4>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">{alert.department_name || 'Hospital Wide'}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs text-gray-400 hover:text-green-400 hover:bg-green-400/10"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
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
