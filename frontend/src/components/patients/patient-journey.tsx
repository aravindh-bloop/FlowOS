import { HospitalEvent } from '@/types';
import { Activity, MapPin, Pill, Scissors, FileText, UserPlus, LogOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PatientJourney({ events }: { events: HospitalEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No events recorded
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PATIENT_ADMITTED': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'PATIENT_MOVED': return <MapPin className="w-4 h-4 text-purple-500" />;
      case 'PROCEDURE_STARTED': return <Scissors className="w-4 h-4 text-orange-500" />;
      case 'PROCEDURE_COMPLETED': return <Scissors className="w-4 h-4 text-green-500" />;
      case 'BED_ASSIGNED': return <Activity className="w-4 h-4 text-amber-500" />;
      case 'BED_RELEASED': return <LogOut className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'PATIENT_ADMITTED': return 'bg-blue-500/20 border-blue-500';
      case 'PATIENT_MOVED': return 'bg-purple-500/20 border-purple-500';
      case 'PROCEDURE_STARTED': return 'bg-orange-500/20 border-orange-500';
      case 'PROCEDURE_COMPLETED': return 'bg-green-500/20 border-green-500';
      case 'BED_ASSIGNED': return 'bg-amber-500/20 border-amber-500';
      case 'BED_RELEASED': return 'bg-gray-500/20 border-gray-500';
      default: return 'bg-blue-500/20 border-blue-500';
    }
  };

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="relative border-l border-gray-800 ml-3 space-y-6 pb-4">
        {events.map((event, i) => (
          <div key={event.id || i} className="relative pl-6">
            <div className={`absolute -left-3.5 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-gray-900 ${getEventColor(event.event_type)}`}>
              {getEventIcon(event.event_type)}
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-gray-200">{event.event_type ? event.event_type.replace(/_/g, ' ') : 'EVENT'}</span>
                <span className="text-xs text-gray-500 font-mono">
                  {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-sm text-gray-400">Source: {event.source}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
