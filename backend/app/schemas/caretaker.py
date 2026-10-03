from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Caretaker Overview Schemas (mock-patient.ts) ---

class LogCheckpoint(BaseModel):
    id: str
    category: str  # 'food' | 'pain' | 'mobility' | 'medication'
    title: str
    badge: str
    summary: str

class ComfortScore(BaseModel):
    label: str
    score: float
    max: float = 10.0

class Milestone(BaseModel):
    title: str
    time: str

class HydrationTelemetry(BaseModel):
    current: float
    target: float
    note: str

class SleepTelemetry(BaseModel):
    hours: float
    quality: str
    awakenings: int

class Telemetry(BaseModel):
    heartRate: int
    heartRateTrend: List[int]
    spo2: int
    spo2Note: str
    hydration: HydrationTelemetry
    sleep: SleepTelemetry

class Observation(BaseModel):
    text: str
    author: str
    time: str

class NextEvent(BaseModel):
    time: str
    title: str

class PatientOverview(BaseModel):
    id: str
    name: str
    age: int
    room: str
    condition: str
    dayOfStay: int
    status: str
    assignedNurse: str
    shift: str
    comfort: ComfortScore
    milestone: Milestone
    logs: List[LogCheckpoint]
    telemetry: Telemetry
    observation: Observation
    nextEvent: NextEvent


# --- Care Notes Schemas (mock-notes.ts) ---

class SymptomSeverity(BaseModel):
    score: int
    max: int = 10

class SymptomAction(BaseModel):
    kind: str  # 'intervention' | 'resolution'
    label: str
    text: str

class SymptomNote(BaseModel):
    id: str
    title: str
    severity: Optional[SymptomSeverity] = None
    status: str  # 'monitoring' | 'resolved' | 'escalated'
    intensity: str
    reportedAt: str
    reportedBy: str
    action: SymptomAction

class ProcedureNote(BaseModel):
    id: str
    title: str
    state: str  # 'done' | 'waiting' | 'scheduled'
    badge: str
    detail: str
    meta: str
    link: Optional[str] = None

class FieldNoteTag(BaseModel):
    label: str
    icon: str
    color: str

class FieldNote(BaseModel):
    id: str
    author: str
    time: str
    source: str
    audioSeconds: Optional[int] = None
    quote: str
    tags: List[FieldNoteTag] = []
    acks: int = 0

class PhotoNote(BaseModel):
    id: str
    title: str
    time: str
    caption: str

class HandoffInfo(BaseModel):
    shift: str
    completion: int
    observations: int
    fluidsMl: int
    milestones: int

class AttendingInfo(BaseModel):
    name: str

class CareNotesResponse(BaseModel):
    patient_id: str
    handoff: HandoffInfo
    symptoms: List[SymptomNote]
    procedures: List[ProcedureNote]
    fieldNotes: List[FieldNote]
    photoNotes: List[PhotoNote]
    attending: AttendingInfo


# --- Quick Log & Mutations Schemas (journal-store.ts / log.tsx) ---

class AmountInfo(BaseModel):
    value: float
    unit: str
    outcome: str

class CreateQuickLogRequest(BaseModel):
    patientId: Optional[str] = None
    stream: str  # 'food' | 'pain' | 'mobility' | 'medication' | 'procedure' | 'status' | 'observation'
    recordedAt: Optional[str] = None
    loggedBy: Optional[str] = None
    role: Optional[str] = "CARETAKER"
    actorTitle: Optional[str] = None
    customTitle: Optional[str] = None
    amount: Optional[AmountInfo] = None
    scale: Optional[str] = None
    items: List[str] = []
    note: Optional[str] = None

class QuickLogResponse(BaseModel):
    id: str
    patientId: str
    stream: str
    recordedAt: str
    loggedBy: str
    role: str
    actorTitle: Optional[str] = None
    customTitle: Optional[str] = None
    amount: Optional[AmountInfo] = None
    scale: Optional[str] = None
    items: List[str] = []
    note: str

class CreateFieldNoteRequest(BaseModel):
    author: Optional[str] = None
    quote: str
    source: Optional[str] = "Voice to Text"
    audioSeconds: Optional[int] = None
    tags: Optional[List[FieldNoteTag]] = None

class CreateSymptomRequest(BaseModel):
    title: str
    intensity: str
    status: Optional[str] = "monitoring"
    severity_score: Optional[int] = None
    reportedBy: Optional[str] = None
    action_label: Optional[str] = "Intervention Protocol"
    action_text: Optional[str] = None
