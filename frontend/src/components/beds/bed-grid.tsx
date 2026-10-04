import { Bed } from '@/types';
import { BedCard } from '@/components/beds/bed-card';
import { Separator } from '@/components/ui/separator';

export function BedGrid({
  groupedBeds,
  onSelectBed,
}: {
  groupedBeds: Record<string, Bed[]>;
  onSelectBed?: (bed: Bed) => void;
}) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedBeds).map(([department, beds]) => (
        <div key={department} className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">{department}</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">{beds.length} Beds</span>
          </div>
          <Separator className="bg-slate-200 mb-6" />
          <div className="flex flex-wrap gap-4">
            {beds.map(bed => (
              <BedCard key={bed.id} bed={bed} onSelect={onSelectBed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
