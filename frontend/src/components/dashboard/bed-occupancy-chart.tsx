'use client';

import { DepartmentSummary } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function BedOccupancyChart({ departments }: { departments: DepartmentSummary[] }) {
  const data = departments.map(dept => {
    const rate = Math.round((dept.bed_occupancy_rate || 0) * 100);
    return {
      name: dept.name,
      occupancyRate: rate,
      patients: dept.patient_count,
    };
  });

  const getBarColor = (rate: number) => {
    if (rate >= 85) return '#ef4444'; // red-500
    if (rate >= 70) return '#f59e0b'; // amber-500
    return '#22c55e'; // green-500
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
        <Tooltip
          cursor={{ fill: '#374151', opacity: 0.4 }}
          contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
          formatter={(value: any) => [`${value}%`, 'Occupancy Rate']}
        />
        <Bar dataKey="occupancyRate" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
