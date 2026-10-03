import { HospitalEvent } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecentEvents({ events }: { events: HospitalEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 h-[400px] flex items-center justify-center text-slate-400 text-sm shadow-xs">
        No recent activity logged
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden h-[400px] shadow-xs">
      <ScrollArea className="h-full">
        <div className="p-4 relative">
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200" />
          <div className="space-y-5">
            {events.map((event, i) => (
              <div key={event.id || i} className="relative flex items-start pl-8">
                <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white shadow-xs" />
                <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-800">{event.event_type ? event.event_type.replace(/_/g, ' ') : 'EVENT'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                  {event.source && (
                    <span className="text-xs text-slate-600 font-medium">Source: {event.source}</span>
                  )}
                  {event.patient_name && (
                    <span className="text-xs text-teal-700 font-semibold mt-1">Patient: {event.patient_name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
