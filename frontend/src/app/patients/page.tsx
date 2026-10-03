'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPatients } from '@/lib/api';
import { Patient } from '@/types';
import { Loader2, Search, AlertCircle } from 'lucide-react';
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
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-gray-950 text-gray-100">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Error Loading Patients</h2>
        <p className="text-gray-400">{error}</p>
        <Button onClick={fetchPatients} variant="outline" className="border-gray-700 hover:bg-gray-800">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-gray-100">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Patient List</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search MRN, Name..."
              className="pl-9 bg-gray-900 border-gray-800 w-full sm:w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No patients found matching your criteria.</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-950">
              <TableRow className="border-gray-800 hover:bg-gray-900">
                <TableHead className="text-gray-400">MRN</TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">DOB</TableHead>
                <TableHead className="text-gray-400">Gender</TableHead>
                <TableHead className="text-gray-400">Blood Type</TableHead>
                <TableHead className="text-gray-400">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow 
                  key={patient.id} 
                  className="border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/patients/${patient.id}`)}
                >
                  <TableCell className="font-mono text-xs">{patient.mrn}</TableCell>
                  <TableCell className="font-medium">{patient.first_name} {patient.last_name}</TableCell>
                  <TableCell>{patient.date_of_birth || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {patient.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{patient.blood_type || '-'}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{patient.contact_phone || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
