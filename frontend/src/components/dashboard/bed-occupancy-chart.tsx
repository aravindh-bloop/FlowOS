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
    if (rate >= 85) return '#e11d48'; // rose-600
    if (rate >= 70) return '#d97706'; // amber-600
    return '#0d9488'; // teal-600
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
        <Tooltip
          cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
          contentStyle={{ 
            backgroundColor: '#ffffff', 
            borderColor: '#cbd5e1', 
            color: '#0f172a',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value: any) => [`${value}%`, 'Occupancy Rate']}
        />
        <Bar dataKey="occupancyRate" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
