import { Bed } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function BedCard({ bed }: { bed: Bed }) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-900/30 border-emerald-700 text-emerald-400';
      case 'OCCUPIED': return 'bg-blue-900/30 border-blue-700 text-blue-400';
      case 'RESERVED': return 'bg-amber-900/30 border-amber-700 text-amber-400';
      case 'MAINTENANCE': return 'bg-gray-800 border-gray-700 text-gray-400';
      case 'UNAVAILABLE': return 'bg-red-900/30 border-red-700 text-red-400';
      default: return 'bg-gray-800 border-gray-700 text-gray-400';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`w-24 h-20 rounded-lg border flex flex-col items-center justify-center p-2 cursor-pointer transition-transform hover:scale-105 ${getStatusStyles(bed.status)}`}>
            <span className="font-bold text-lg mb-1">{bed.bed_number}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-current bg-transparent h-4 w-full justify-center overflow-hidden">
              {bed.bed_type}
            </Badge>
            {bed.status === 'OCCUPIED' && bed.patient_name && (
              <span className="text-[10px] mt-1 truncate w-full text-center text-gray-200 font-medium">
                {bed.patient_name.split(' ')[0]}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 border-gray-800 text-gray-200">
          <div className="space-y-1">
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
