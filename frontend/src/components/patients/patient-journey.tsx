import { HospitalEvent } from '@/types';
import { Activity, MapPin, Scissors, UserPlus, LogOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PatientJourney({ events }: { events: HospitalEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">
        No clinical events logged
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PATIENT_ADMITTED': return <UserPlus className="w-3.5 h-3.5 text-teal-600" />;
      case 'PATIENT_MOVED': return <MapPin className="w-3.5 h-3.5 text-indigo-600" />;
      case 'PROCEDURE_STARTED': return <Scissors className="w-3.5 h-3.5 text-amber-600" />;
      case 'PROCEDURE_COMPLETED': return <Scissors className="w-3.5 h-3.5 text-emerald-600" />;
      case 'BED_ASSIGNED': return <Activity className="w-3.5 h-3.5 text-sky-600" />;
      case 'BED_RELEASED': return <LogOut className="w-3.5 h-3.5 text-slate-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'PATIENT_ADMITTED': return 'bg-teal-50 border-teal-300';
      case 'PATIENT_MOVED': return 'bg-indigo-50 border-indigo-300';
      case 'PROCEDURE_STARTED': return 'bg-amber-50 border-amber-300';
      case 'PROCEDURE_COMPLETED': return 'bg-emerald-50 border-emerald-300';
      case 'BED_ASSIGNED': return 'bg-sky-50 border-sky-300';
      case 'BED_RELEASED': return 'bg-slate-100 border-slate-300';
      default: return 'bg-teal-50 border-teal-300';
    }
  };

  return (
    <ScrollArea className="h-[550px] pr-3">
      <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 pb-4">
        {events.map((event, i) => (
          <div key={event.id || i} className="relative pl-6">
            <div className={`absolute -left-[15px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border ${getEventColor(event.event_type)} shadow-2xs`}>
              {getEventIcon(event.event_type)}
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-800">{event.event_type ? event.event_type.replace(/_/g, ' ') : 'EVENT'}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {event.timestamp ? new Date(event.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600">Source: {event.source}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
