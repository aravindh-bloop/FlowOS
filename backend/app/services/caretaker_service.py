from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
from typing import Optional, List, Dict, Any
import uuid

from app.models.patient import Patient, Admission
from app.models.clinical import Procedure
from app.models.event import HospitalEvent, EventType
from app.schemas.caretaker import (
    PatientOverview,
    ComfortScore,
    Milestone,
    Telemetry,
    HydrationTelemetry,
    SleepTelemetry,
    LogCheckpoint,
    Observation,
    NextEvent,
    CareNotesResponse,
    HandoffInfo,
    SymptomNote,
    SymptomSeverity,
    SymptomAction,
    ProcedureNote,
    FieldNote,
    FieldNoteTag,
    PhotoNote,
    AttendingInfo,
    CreateQuickLogRequest,
    QuickLogResponse,
    CreateFieldNoteRequest,
    CreateSymptomRequest,
)

def _get_target_patient(db: Session, patient_id: Optional[int] = None) -> Optional[Patient]:
    if patient_id:
        return db.query(Patient).filter(Patient.id == patient_id).first()
    # Check if AkshayaSri (the primary mock patient) exists in database
    akshaya = db.query(Patient).filter(Patient.first_name.ilike('%Akshaya%')).first()
    if akshaya:
        return akshaya
    # Otherwise find active admitted patient first, fallback to first patient
    adm = db.query(Admission).order_by(Admission.admission_date.desc()).first()
    if adm and adm.patient:
        return adm.patient
    return db.query(Patient).first()

def get_caretaker_patient_overview(db: Session, patient_id: Optional[int] = None) -> PatientOverview:
    patient = _get_target_patient(db, patient_id)

    # Defaults if patient not in DB
    name = f"{patient.first_name} {patient.last_name}" if patient else "AkshayaSri"
    pid = str(patient.id) if patient else "pt-304b"
    
    # Calculate age
    age = 20
    if patient and patient.date_of_birth:
        today = date.today()
        dob = patient.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    # Admission & location
    room = "Room 304B"
    condition = "Orthopedic Recovery"
    day_of_stay = 2
    status = "Stable & Resting"
    assigned_nurse = "Murali Krishnan, RN"
    shift = "Shift 1"

    if patient and patient.admissions:
        latest_adm = sorted(patient.admissions, key=lambda a: a.admission_date, reverse=True)[0]
        dept_name = latest_adm.department.name if latest_adm.department else "General Ward"
        bed_num = latest_adm.bed.bed_number if latest_adm.bed else "304B"
        room = f"{dept_name} • Bed {bed_num}"
        condition = latest_adm.diagnosis or "Inpatient Care"
        day_of_stay = max(1, (datetime.now().date() - latest_adm.admission_date.date()).days + 1)
        status = latest_adm.status.value if hasattr(latest_adm.status, 'value') else str(latest_adm.status)
        if latest_adm.attending_doctor:
            assigned_nurse = f"Dr. {latest_adm.attending_doctor.first_name} {latest_adm.attending_doctor.last_name}"

    # Query recent caretaker events for this patient
    p_int_id = patient.id if patient else 0
    events = (
        db.query(HospitalEvent)
        .filter(HospitalEvent.patient_id == p_int_id)
        .order_by(HospitalEvent.timestamp.desc())
        .limit(20)
        .all()
    )

    # Find latest observation
    obs_text = "Patient resting comfortably. Room temperature adjusted, vitals within expected baseline."
    obs_author = "Sarah Jensen, RN"
    obs_time = "10:45 AM"

    for ev in events:
        meta = ev.metadata_ or {}
        if meta.get("category") == "observation" or "observation" in str(ev.source or "").lower() or meta.get("body"):
            obs_text = meta.get("body") or meta.get("note") or obs_text
            obs_author = meta.get("actor") or ev.source or obs_author
            if ev.timestamp:
                obs_time = ev.timestamp.strftime("%I:%M %p")
            break

    # Construct continuous logs from DB or realistic defaults
    default_logs = [
        LogCheckpoint(
            id="log-food",
            category="food",
            title="Food & Water",
            badge="85% Intake",
            summary="450ml water logged, scrambled eggs & fruit cup at breakfast",
        ),
        LogCheckpoint(
            id="log-pain",
            category="pain",
            title="Pain Check",
            badge="Pain 3/10",
            summary="Mild flank ache, described as dull and intermittent",
        ),
        LogCheckpoint(
            id="log-mobility",
            category="mobility",
            title="Mobility Walk",
            badge="35 Meters",
            summary="Assisted hallway stroll at 10:15 AM, walker used throughout",
        ),
        LogCheckpoint(
            id="log-med",
            category="medication",
            title="Analgesic Dose",
            badge="Given 09:30",
            summary="Oral relief administered with water, no adverse reaction",
        ),
    ]

    return PatientOverview(
        id=pid,
        name=name,
        age=age,
        room=room,
        condition=condition,
        dayOfStay=day_of_stay,
        status=status,
        assignedNurse=assigned_nurse,
        shift=shift,
        comfort=ComfortScore(label="Calm & Responsive", score=8.0, max=10.0),
        milestone=Milestone(
            title="PT stand-and-pivot completed unassisted with walker support",
            time="11:20 AM",
        ),
        logs=default_logs,
        telemetry=Telemetry(
            heartRate=72,
            heartRateTrend=[70, 71, 69, 76, 66, 74, 70, 75, 68, 72, 71],
            spo2=98,
            spo2Note="Optimal Room Air",
            hydration=HydrationTelemetry(current=1450, target=2000, note="Morning Goal Met"),
            sleep=SleepTelemetry(hours=6.5, quality="Deep Sleep", awakenings=0),
        ),
        observation=Observation(
            text=obs_text,
            author=obs_author,
            time=obs_time,
        ),
        nextEvent=NextEvent(time="12:30 PM", title="Lunch & Hydration Check"),
    )

def get_caretaker_notes(db: Session, patient_id: Optional[int] = None) -> CareNotesResponse:
    patient = _get_target_patient(db, patient_id)
    p_int_id = patient.id if patient else 0
    pid = str(patient.id) if patient else "pt-304b"

    # Attending doctor
    attending_name = "Dr. M. Alvarez"
    if patient and patient.admissions:
        adm = patient.admissions[0]
        if adm.attending_doctor:
            attending_name = f"Dr. {adm.attending_doctor.first_name} {adm.attending_doctor.last_name}"

    # Procedures from DB
    procedures: List[ProcedureNote] = []
    if patient:
        db_procs = db.query(Procedure).filter(Procedure.patient_id == patient.id).all()
        for p in db_procs:
            state = "done" if "COMPLETED" in str(p.status) else "waiting" if "IN_PROGRESS" in str(p.status) else "scheduled"
            badge = p.status.value if hasattr(p.status, 'value') else str(p.status)
            detail = f"{p.procedure_type.value if hasattr(p.procedure_type, 'value') else p.procedure_type} • Attending Team"
            procedures.append(
                ProcedureNote(
                    id=f"proc-{p.id}",
                    title=p.name,
                    state=state,
                    badge=badge,
                    detail=detail,
                    meta="Clinical Schedule",
                    link=None,
                )
            )

    if not procedures:
        procedures = [
            ProcedureNote(
                id="proc-ultrasound",
                title="Post-Op Ultrasound",
                state="done",
                badge="Done 09:15 AM",
                detail="Radiology Team A • Dr. Vance",
                meta="View Scan (PDF)",
                link="scan.pdf",
            ),
            ProcedureNote(
                id="proc-pt",
                title="Afternoon Physical Therapy",
                state="waiting",
                badge="Waiting Pickup",
                detail="Scheduled for 02:00 PM (PT Gym 2)",
                meta="Gurney Ordered",
            ),
            ProcedureNote(
                id="proc-wound",
                title="Wound Dressing Inspection",
                state="scheduled",
                badge="04:30 PM",
                detail="Wound Ostomy Continence Specialist",
                meta="Bedside",
            ),
        ]

    # Symptoms
    symptoms = [
        SymptomNote(
            id="sym-incision",
            title="Incision Site Tightness",
            severity=SymptomSeverity(score=3, max=10),
            status="monitoring",
            intensity="Monitoring",
            reportedAt="10:45 AM",
            reportedBy="Nurse Lin",
            action=SymptomAction(
                kind="intervention",
                label="Intervention Protocol",
                text="Ice pack placed • Under observation for 30m re-check.",
            ),
        ),
        SymptomNote(
            id="sym-appetite",
            title="Appetite Check",
            severity=None,
            status="resolved",
            intensity="Mild",
            reportedAt="08:30 AM",
            reportedBy="Breakfast intake",
            action=SymptomAction(
                kind="resolution",
                label="Resolution",
                text="Resolved with 180ml warm broth. Nausea subsided without antiemetics.",
            ),
        ),
    ]

    # Field notes from events
    field_notes: List[FieldNote] = []
    events = (
        db.query(HospitalEvent)
        .filter(HospitalEvent.patient_id == p_int_id)
        .order_by(HospitalEvent.timestamp.desc())
        .limit(10)
        .all()
    )

    for ev in events:
        meta = ev.metadata_ or {}
        if meta.get("quote") or meta.get("body") or meta.get("note"):
            quote = meta.get("quote") or meta.get("body") or meta.get("note")
            author = meta.get("author") or meta.get("actor") or ev.source or "Caregiver"
            time_str = ev.timestamp.strftime("%I:%M %p") if ev.timestamp else "Just now"
            source = meta.get("source") or "Voice to Text"
            field_notes.append(
                FieldNote(
                    id=f"fn-{ev.id}",
                    author=author,
                    time=time_str,
                    source=source,
                    audioSeconds=meta.get("audioSeconds", 30),
                    quote=quote,
                    tags=[
                        FieldNoteTag(label="Care Observation", icon="emoticon-happy-outline", color="#E6B63E")
                    ],
                    acks=1,
                )
            )

    if not field_notes:
        field_notes = [
            FieldNote(
                id="fn-1",
                author="Nurse Sarah Miller, RN",
                time="11:12 AM",
                source="Voice to Text",
                audioSeconds=42,
                quote="Patient expressed genuine excitement about visiting grandchildren tomorrow afternoon. Requested warm encouragement during 2 PM hallway walking.",
                tags=[
                    FieldNoteTag(label="Spirits High", icon="emoticon-happy-outline", color="#E6B63E"),
                    FieldNoteTag(label="Mobility Plan", icon="walk", color="#F2508A"),
                ],
                acks=3,
            )
        ]

    # Photo notes
    photo_notes = [
        PhotoNote(
            id="ph-1",
            title="Morning Dressing Photo",
            time="08:45 AM",
            caption="Clean margins, zero drainage",
        )
    ]

    return CareNotesResponse(
        patient_id=pid,
        handoff=HandoffInfo(
            shift="Shift 1",
            completion=98,
            observations=6 + len(field_notes),
            fluidsMl=1450,
            milestones=1,
        ),
        symptoms=symptoms,
        procedures=procedures,
        fieldNotes=field_notes,
        photoNotes=photo_notes,
        attending=AttendingInfo(name=attending_name),
    )

def record_quick_log(
    db: Session,
    req: CreateQuickLogRequest,
    current_user_name: Optional[str] = None
) -> QuickLogResponse:
    # Resolve target patient
    target_patient = None
    if req.patientId and req.patientId.isdigit():
        target_patient = db.query(Patient).filter(Patient.id == int(req.patientId)).first()
    if not target_patient:
        target_patient = _get_target_patient(db)

    pid = target_patient.id if target_patient else 1
    actor = req.loggedBy or current_user_name or "Sarah Jensen, RN"
    recorded_at = req.recordedAt or datetime.now(timezone.utc).isoformat()
    log_id = f"ql-{uuid.uuid4().hex[:8]}"

    metadata_dict = {
        "id": log_id,
        "role": req.role or "CARETAKER",
        "actor": actor,
        "actor_title": req.actorTitle or "Patient Support Caretaker",
        "customTitle": req.customTitle,
        "stream": req.stream,
        "amount": req.amount.model_dump() if req.amount else None,
        "scale": req.scale,
        "items": req.items,
        "note": req.note,
        "body": req.note or f"{req.stream.capitalize()} update recorded.",
        "category": req.stream,
    }

    event = HospitalEvent(
        event_type=EventType.STAFF_ASSIGNED,
        patient_id=pid,
        source=f"CARETAKER: {actor}",
        metadata_=metadata_dict,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return QuickLogResponse(
        id=log_id,
        patientId=str(pid),
        stream=req.stream,
        recordedAt=recorded_at,
        loggedBy=actor,
        role=req.role or "CARETAKER",
        actorTitle=req.actorTitle,
        customTitle=req.customTitle,
        amount=req.amount,
        scale=req.scale,
        items=req.items,
        note=req.note or "",
    )

def get_quick_logs(db: Session, patient_id: Optional[int] = None) -> List[QuickLogResponse]:
    target_patient = _get_target_patient(db, patient_id)
    if not target_patient:
        return []

    events = (
        db.query(HospitalEvent)
        .filter(HospitalEvent.patient_id == target_patient.id)
        .order_by(HospitalEvent.timestamp.desc())
        .limit(50)
        .all()
    )

    results: List[QuickLogResponse] = []
    for ev in events:
        meta = ev.metadata_ or {}
        stream = meta.get("stream")
        if stream:
            amount_data = meta.get("amount")
            amount_info = None
            if amount_data and isinstance(amount_data, dict):
                amount_info = amount_data

            results.append(
                QuickLogResponse(
                    id=meta.get("id") or f"ql-{ev.id}",
                    patientId=str(target_patient.id),
                    stream=stream,
                    recordedAt=ev.timestamp.isoformat() if ev.timestamp else datetime.now(timezone.utc).isoformat(),
                    loggedBy=meta.get("actor") or ev.source or "Caregiver",
                    role=meta.get("role") or "CARETAKER",
                    actorTitle=meta.get("actor_title"),
                    customTitle=meta.get("customTitle") or meta.get("title"),
                    amount=amount_info,
                    scale=meta.get("scale"),
                    items=meta.get("items") or [],
                    note=meta.get("note") or meta.get("body") or "",
                )
            )

    return results

def add_field_note(
    db: Session,
    req: CreateFieldNoteRequest,
    patient_id: Optional[int] = None,
    current_user_name: Optional[str] = None
) -> FieldNote:
    target_patient = _get_target_patient(db, patient_id)
    pid = target_patient.id if target_patient else 1
    author = req.author or current_user_name or "Sarah Jensen, RN"
    time_str = datetime.now().strftime("%I:%M %p")

    event = HospitalEvent(
        event_type=EventType.STAFF_ASSIGNED,
        patient_id=pid,
        source=f"VOICE_NOTE: {author}",
        metadata_={
            "quote": req.quote,
            "author": author,
            "source": req.source,
            "audioSeconds": req.audioSeconds,
            "category": "voice_note",
            "body": req.quote,
            "role": "CARETAKER",
        },
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return FieldNote(
        id=f"fn-{event.id}",
        author=author,
        time=time_str,
        source=req.source or "Voice to Text",
        audioSeconds=req.audioSeconds,
        quote=req.quote,
        tags=req.tags or [FieldNoteTag(label="Voice Log", icon="microphone", color="#1F9487")],
        acks=0,
    )
