import { HospitalEvent } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecentEvents({ events }: { events: HospitalEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-[400px] flex items-center justify-center text-gray-500">
        No recent events
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-[400px]">
      <ScrollArea className="h-full">
        <div className="p-4 relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-800" />
          <div className="space-y-6">
            {events.map((event, i) => (
              <div key={event.id || i} className="relative flex items-start pl-8">
                <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-gray-900" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-mono mb-1">
                    {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                  <span className="text-sm text-gray-200">{event.event_type}</span>
                  {event.patient_name && (
                    <span className="text-xs text-gray-400 mt-1">Patient: {event.patient_name}</span>
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
