import { Bed } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function BedCard({ bed, onSelect }: { bed: Bed; onSelect?: (bed: Bed) => void }) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/90 shadow-2xs hover:border-emerald-400';
      case 'OCCUPIED': return 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100/90 shadow-2xs hover:border-rose-400';
      case 'RESERVED': return 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/90 shadow-2xs hover:border-amber-400';
      case 'MAINTENANCE': return 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200/90';
      case 'UNAVAILABLE': return 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:bg-zinc-200/90 shadow-2xs hover:border-zinc-400';
      default: return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OCCUPIED': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'RESERVED': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MAINTENANCE': return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'UNAVAILABLE': return 'bg-zinc-200 text-zinc-700 border-zinc-300';
      default: return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  const isMockPatient = bed.bed_number === '304B' || (bed.patient_name && bed.patient_name.includes('Akshaya'));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={() => onSelect?.(bed)}
            className={`w-28 h-22 rounded-xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:scale-105 select-none relative ${getStatusStyles(bed.status)} ${
              isMockPatient ? 'ring-2 ring-teal-500/70 shadow-sm' : ''
            }`}
          >
            {isMockPatient && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-600"></span>
              </span>
            )}
            <span className="font-bold text-base leading-tight mb-1">{bed.bed_number}</span>
            <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 w-full justify-center overflow-hidden font-semibold ${getBadgeStyle(bed.status)}`}>
              {bed.bed_type}
            </Badge>
            {bed.status === 'OCCUPIED' && bed.patient_name ? (
              <span className="text-[10px] mt-1 truncate w-full text-center font-bold text-slate-800">
                {bed.patient_name.split(' ')[0]}
              </span>
            ) : (
              <span className="text-[9px] mt-1 text-slate-400 font-medium">
                {bed.status === 'AVAILABLE' ? 'Click to assign' : bed.status.toLowerCase()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-slate-200 text-slate-900 shadow-md">
          <div className="space-y-1 text-xs">
            <p><strong>Bed:</strong> {bed.bed_number} {bed.room_number ? `(Room ${bed.room_number})` : ''}</p>
            <p><strong>Status:</strong> {bed.status}</p>
            <p><strong>Type:</strong> {bed.bed_type}</p>
            {bed.department_name && <p><strong>Dept:</strong> {bed.department_name}</p>}
            {bed.patient_name && (
              <p>
                <strong>Patient:</strong> {bed.patient_name} {bed.patient_mrn ? `(${bed.patient_mrn})` : ''}
              </p>
            )}
            <p className="text-[10px] text-teal-600 font-medium pt-1">Click to manage bed allocation</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
