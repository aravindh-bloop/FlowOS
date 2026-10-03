import { Bed } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function BedCard({ bed }: { bed: Bed }) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/80 shadow-2xs';
      case 'OCCUPIED': return 'bg-teal-50 border-teal-300 text-teal-900 hover:bg-teal-100/80 shadow-2xs';
      case 'RESERVED': return 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/80 shadow-2xs';
      case 'MAINTENANCE': return 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200/80';
      case 'UNAVAILABLE': return 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100/80 shadow-2xs';
      default: return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OCCUPIED': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'RESERVED': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MAINTENANCE': return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'UNAVAILABLE': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`w-24 h-20 rounded-xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:scale-105 ${getStatusStyles(bed.status)}`}>
            <span className="font-bold text-lg leading-tight mb-1">{bed.bed_number}</span>
            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 w-full justify-center overflow-hidden font-semibold ${getBadgeStyle(bed.status)}`}>
              {bed.bed_type}
            </Badge>
            {bed.status === 'OCCUPIED' && bed.patient_name && (
              <span className="text-[10px] mt-1 truncate w-full text-center font-bold text-slate-800">
                {bed.patient_name.split(' ')[0]}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-slate-200 text-slate-900 shadow-md">
          <div className="space-y-1 text-xs">
            <p><strong>Bed:</strong> {bed.bed_number}</p>
            <p><strong>Status:</strong> {bed.status}</p>
            <p><strong>Type:</strong> {bed.bed_type}</p>
            {bed.patient_name && <p><strong>Patient:</strong> {bed.patient_name}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
