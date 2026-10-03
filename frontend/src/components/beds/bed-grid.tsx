import { Bed } from '@/types';
import { BedCard } from '@/components/beds/bed-card';
import { Separator } from '@/components/ui/separator';

export function BedGrid({ groupedBeds }: { groupedBeds: Record<string, Bed[]> }) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedBeds).map(([department, beds]) => (
        <div key={department} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">{department}</h2>
            <span className="text-sm text-gray-500">{beds.length} Beds</span>
          </div>
          <Separator className="bg-gray-800 mb-6" />
          <div className="flex flex-wrap gap-4">
            {beds.map(bed => (
              <BedCard key={bed.id} bed={bed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
