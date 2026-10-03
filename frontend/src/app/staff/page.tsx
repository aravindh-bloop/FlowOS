'use client';

import { useState, useEffect } from 'react';
import { getStaff } from '@/lib/api';
import { Staff } from '@/types';
import { Loader2, Search, AlertCircle, Users } from 'lucide-react';
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
      case 'DOCTOR': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'NURSE': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'SURGEON': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TECHNICIAN': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-950 text-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Staff</h2>
        <p className="text-gray-400">{error}</p>
        <Button onClick={fetchStaffData} variant="outline" className="border-gray-700 hover:bg-gray-800">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <Users className="mr-3 text-blue-500" /> Staff Management
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search Name..."
            className="pl-9 bg-gray-900 border-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No staff members found matching criteria.</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-950">
              <TableRow className="border-gray-800 hover:bg-gray-900">
                <TableHead className="text-gray-400">Employee ID</TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Specialization</TableHead>
                <TableHead className="text-gray-400">Department</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((person) => (
                <TableRow key={person.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell className="font-mono text-xs text-gray-400">{person.employee_id}</TableCell>
                  <TableCell className="font-medium text-gray-200">{person.first_name} {person.last_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(person.role)}>
                      {person.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">{person.specialization || '-'}</TableCell>
                  <TableCell className="text-gray-300">{person.department_name || 'Hospital Wide'}</TableCell>
                  <TableCell>
                    <span className={`flex items-center text-sm font-medium ${person.is_active ? 'text-emerald-500' : 'text-gray-500'}`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${person.is_active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                      {person.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400">{person.contact_phone || person.email || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
