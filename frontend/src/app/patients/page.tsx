'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPatients } from '@/lib/api';
import { Patient } from '@/types';
import { Loader2, Search, AlertCircle, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let result = patients;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        return fullName.includes(q) || (p.mrn && p.mrn.toLowerCase().includes(q));
      });
    }
    setFilteredPatients(result);
  }, [search, patients]);

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
        <h2 className="text-xl font-bold">Error Loading Patients</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={fetchPatients} variant="outline" className="border-slate-300 hover:bg-slate-100">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 space-y-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl">
            <Users className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Directory</h1>
            <p className="text-xs font-medium text-slate-500">Search and manage admitted hospital patients and records</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search MRN, Name..."
              className="pl-9 bg-white border-slate-200 text-slate-900 w-full sm:w-[260px] shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No patients found matching your criteria.</div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-600 font-bold">MRN</TableHead>
                <TableHead className="text-slate-600 font-bold">Name</TableHead>
                <TableHead className="text-slate-600 font-bold">DOB</TableHead>
                <TableHead className="text-slate-600 font-bold">Gender</TableHead>
                <TableHead className="text-slate-600 font-bold">Blood Type</TableHead>
                <TableHead className="text-slate-600 font-bold">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow 
                  key={patient.id} 
                  className="border-slate-200/80 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-teal-700">{patient.mrn}</TableCell>
                  <TableCell className="font-bold text-slate-900">{patient.first_name} {patient.last_name}</TableCell>
                  <TableCell className="text-slate-600 font-medium text-xs">{patient.date_of_birth || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-semibold text-xs">
                      {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-700">{patient.blood_type || '-'}</TableCell>
                  <TableCell className="text-slate-600 text-xs font-medium">{patient.contact_phone || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
