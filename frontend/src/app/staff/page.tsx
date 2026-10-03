'use client';

import { useState, useEffect } from 'react';
import { getStaff } from '@/lib/api';
import { Staff } from '@/types';
import { Loader2, Search, AlertCircle, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const data = await getStaff();
      setStaff(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const filteredStaff = staff.filter(s => {
    if (search) {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DOCTOR': return 'bg-teal-50 text-teal-800 border-teal-200 font-semibold';
      case 'NURSE': return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
      case 'SURGEON': return 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold';
      case 'TECHNICIAN': return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50 text-slate-900">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Error Loading Staff</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchStaffData} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
            <UserCog className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Management</h1>
            <p className="text-xs font-medium text-slate-500">Personnel Roster, Shift Allocations & Clinical Staffing</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search Name..."
            className="pl-9 bg-white border-slate-200 text-slate-900 shadow-2xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {filteredStaff.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No staff members found matching criteria.</div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-600 font-bold">Employee ID</TableHead>
                <TableHead className="text-slate-600 font-bold">Name</TableHead>
                <TableHead className="text-slate-600 font-bold">Role</TableHead>
                <TableHead className="text-slate-600 font-bold">Specialization</TableHead>
                <TableHead className="text-slate-600 font-bold">Department</TableHead>
                <TableHead className="text-slate-600 font-bold">Status</TableHead>
                <TableHead className="text-slate-600 font-bold">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((person) => (
                <TableRow key={person.id} className="border-slate-200/80 hover:bg-slate-50/80">
                  <TableCell className="font-mono text-xs font-semibold text-slate-500">{person.employee_id}</TableCell>
                  <TableCell className="font-bold text-slate-900">{person.first_name} {person.last_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(person.role)}>
                      {person.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs font-medium">{person.specialization || '-'}</TableCell>
                  <TableCell className="text-slate-700 font-medium text-xs">{person.department_name || 'Hospital Wide'}</TableCell>
                  <TableCell>
                    <span className={`flex items-center text-xs font-semibold ${person.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${person.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {person.is_active ? 'On Duty' : 'Off Duty'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs font-medium">{person.contact_phone || person.email || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
