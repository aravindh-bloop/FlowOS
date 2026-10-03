'use client';

import { useState } from 'react';
import { HospitalEvent } from '@/types';
import {
  Activity,
  MapPin,
  Scissors,
  UserPlus,
  LogOut,
  Stethoscope,
  HeartPulse,
  HeartHandshake,
  Building2,
  Plus,
  Send,
  Loader2,
  Calendar,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { postPatientTimelineUpdate } from '@/lib/api';

type CareRole = 'ALL' | 'DOCTOR' | 'NURSE' | 'CARETAKER' | 'ADMISSION';

interface UnifiedEventDisplay {
  id: string | number;
  role: 'DOCTOR' | 'NURSE' | 'CARETAKER' | 'ADMISSION';
  actor: string;
  actorTitle?: string;
  title: string;
  body: string;
  timestamp: string;
  category?: string;
  tone?: string;
}

export function PatientJourney({
  events,
  patientId,
  onRefresh,
}: {
  events: HospitalEvent[];
  patientId?: number | string;
  onRefresh?: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<CareRole>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formRole, setFormRole] = useState<'DOCTOR' | 'NURSE' | 'CARETAKER'>('NURSE');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formActor, setFormActor] = useState('');

  // Normalize events into unified multidisciplinary representation
  const normalizedEvents: UnifiedEventDisplay[] = (events || []).map((ev, idx) => {
    const meta = ev.metadata || {};
    let role: 'DOCTOR' | 'NURSE' | 'CARETAKER' | 'ADMISSION' = meta.role || 'NURSE';
    const evType = ev.event_type ? String(ev.event_type).toUpperCase() : '';
    const src = ev.source ? String(ev.source).toUpperCase() : '';

    if (!meta.role) {
      if (evType.includes('ADMIT') || evType === 'PATIENT_ADMITTED') {
        role = 'ADMISSION';
      } else if (evType.includes('PROCEDURE') || src.includes('DOCTOR')) {
        role = 'DOCTOR';
      } else if (src.includes('CARETAKER')) {
        role = 'CARETAKER';
      } else {
        role = 'NURSE';
      }
    }

    const defaultActor =
      role === 'DOCTOR'
        ? 'Dr. Robert Vance, MD'
        : role === 'NURSE'
        ? 'Maya Lin, RN'
        : role === 'CARETAKER'
        ? 'Sarah Jensen'
        : 'Admissions Desk';

    const defaultTitle =
      ev.event_type ? ev.event_type.replace(/_/g, ' ') : 'Clinical Event';

    return {
      id: ev.id || `ev-${idx}`,
      role,
      actor: meta.actor || ev.source || defaultActor,
      actorTitle: meta.actor_title,
      title: meta.title || defaultTitle,
      body: meta.body || meta.note || (ev.source ? `Logged by: ${ev.source}` : 'Clinical observation logged.'),
      timestamp: ev.timestamp || new Date().toISOString(),
      category: meta.category,
      tone: meta.tone,
    };
  });

  // Filter events by role
  const filteredEvents =
    selectedRole === 'ALL'
      ? normalizedEvents
      : normalizedEvents.filter((e) => e.role === selectedRole);

  // Counts
  const counts = {
    ALL: normalizedEvents.length,
    DOCTOR: normalizedEvents.filter((e) => e.role === 'DOCTOR').length,
    NURSE: normalizedEvents.filter((e) => e.role === 'NURSE').length,
    CARETAKER: normalizedEvents.filter((e) => e.role === 'CARETAKER').length,
    ADMISSION: normalizedEvents.filter((e) => e.role === 'ADMISSION').length,
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'NURSE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CARETAKER':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ADMISSION':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />;
      case 'NURSE':
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />;
      case 'CARETAKER':
        return <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />;
      case 'ADMISSION':
        return <Building2 className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  const handlePostUpdate = async () => {
    if (!patientId || !formTitle.trim() || !formBody.trim()) return;
    try {
      setIsSubmitting(true);
      await postPatientTimelineUpdate(patientId, {
        role: formRole,
        title: formTitle.trim(),
        body: formBody.trim(),
        actor: formActor.trim() || undefined,
      });
      setFormTitle('');
      setFormBody('');
      setFormActor('');
      setIsDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to post timeline update:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Care Team Header & Post Action */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Multidisciplinary Care Stream
          </h4>
          <p className="text-[11px] text-slate-400">
            Real-time synchronization across doctors, nurses & caretakers
          </p>
        </div>

        {patientId && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs">
                <Plus className="w-3.5 h-3.5" />
                Post Update
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Post Care Team Update
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5 py-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Care Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['DOCTOR', 'NURSE', 'CARETAKER'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormRole(r)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                          formRole === r
                            ? r === 'DOCTOR'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : r === 'NURSE'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r === 'DOCTOR' ? '🩺 Doctor' : r === 'NURSE' ? '🫀 Nurse' : '🤝 Caretaker'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Author / Staff Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formRole === 'DOCTOR'
                        ? 'e.g. Dr. Robert Vance, MD'
                        : formRole === 'NURSE'
                        ? 'e.g. Maya Lin, RN'
                        : 'e.g. Sarah Jensen'
                    }
                    value={formActor}
                    onChange={(e) => setFormActor(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Update Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Post-Op Rounds & Wound Inspection"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Clinical Notes & Observations *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed clinical observation, vitals telemetry, or bedside log..."
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmitting || !formTitle.trim() || !formBody.trim()}
                    onClick={handlePostUpdate}
                    className="text-xs h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Publish Update
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(['ALL', 'DOCTOR', 'NURSE', 'CARETAKER', 'ADMISSION'] as CareRole[]).map((role) => {
          const isActive = selectedRole === role;
          const count = counts[role];
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                isActive
                  ? role === 'DOCTOR'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : role === 'NURSE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : role === 'CARETAKER'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : role === 'ADMISSION'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                    : 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {role === 'ALL'
                ? `All Roles (${count})`
                : role === 'DOCTOR'
                ? `Doctor (${count})`
                : role === 'NURSE'
                ? `Nurse (${count})`
                : role === 'CARETAKER'
                ? `Caretaker (${count})`
                : `Admission (${count})`}
            </button>
          );
        })}
      </div>

      {/* Event Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-44 text-slate-400 text-xs">
          <Calendar className="w-6 h-6 mb-1 text-slate-300" />
          No events logged for {selectedRole.toLowerCase()} role.
        </div>
      ) : (
        <ScrollArea className="h-[520px] pr-2">
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pb-4 pt-1">
            {filteredEvents.map((event) => (
              <div key={event.id} className="relative pl-6">
                {/* Node icon */}
                <div
                  className={`absolute -left-[15px] top-1 w-7 h-7 rounded-full flex items-center justify-center border bg-white shadow-2xs ${getRoleBadgeStyle(
                    event.role
                  )}`}
                >
                  {getRoleIcon(event.role)}
                </div>

                {/* Event Card */}
                <div className="bg-slate-50/80 hover:bg-slate-50 transition-colors border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(
                          event.role
                        )}`}
                      >
                        {event.role}
                      </Badge>
                      <span className="text-xs font-bold text-slate-900">
                        {event.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  {/* Actor details */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {event.actor}
                    </span>
                    {event.actorTitle && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-500">{event.actorTitle}</span>
                      </>
                    )}
                    {event.category && (
                      <span className="bg-slate-200/70 text-slate-700 text-[10px] px-1.5 py-0.2 rounded">
                        {event.category}
                      </span>
                    )}
                  </div>

                  {/* Event Note Body */}
                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5 font-normal">
                    {event.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
