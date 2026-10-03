from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from app.models.patient import Patient, Admission
from app.models.event import HospitalEvent, EventType
from app.models.clinical import Procedure
from app.schemas.patient_timeline import (
    UnifiedTimelineItem,
    PostTimelineUpdateRequest,
    UnifiedTimelineResponse,
)

def get_unified_patient_timeline(db: Session, patient_id: int) -> Optional[UnifiedTimelineResponse]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None

    patient_name = f"{patient.first_name} {patient.last_name}"
    
    # Active/latest admission
    latest_adm = (
        db.query(Admission)
        .filter(Admission.patient_id == patient_id)
        .order_by(Admission.admission_date.desc())
        .first()
    )
    
    room_or_bed = None
    if latest_adm:
        dept = latest_adm.department.name if latest_adm.department else "General"
        bed = f"Bed {latest_adm.bed.bed_number}" if latest_adm.bed else "Bay TBD"
        room_or_bed = f"{dept} • {bed}"
    
    events: List[UnifiedTimelineItem] = []

    # 1. Admission records
    admissions = db.query(Admission).filter(Admission.patient_id == patient_id).all()
    for adm in admissions:
        dept_name = adm.department.name if adm.department else "Hospital"
        bed_num = adm.bed.bed_number if adm.bed else "Unassigned"
        dr_name = (
            f"Dr. {adm.attending_doctor.first_name} {adm.attending_doctor.last_name}"
            if adm.attending_doctor
            else "Attending Physician"
        )
        body = (
            f"Admitted via {adm.admission_type.value if hasattr(adm.admission_type, 'value') else adm.admission_type} "
            f"to {dept_name} (Bed {bed_num}). Priority: {adm.priority.value if hasattr(adm.priority, 'value') else adm.priority}. "
            f"Admitting diagnosis: {adm.diagnosis or 'Under evaluation'}. Attending: {dr_name}."
        )
        events.append(
            UnifiedTimelineItem(
                id=f"adm-{adm.id}",
                patient_id=patient_id,
                role="ADMISSION",
                actor="Hospital Admissions Desk",
                actor_title="Patient Intake & Triage",
                title=f"Inpatient Admission — {dept_name}",
                body=body,
                timestamp=adm.admission_date,
                tone="teal",
                category="Intake & Triage",
                metadata={"admission_id": adm.id, "diagnosis": adm.diagnosis, "priority": str(adm.priority)},
            )
        )

    # 2. Clinical Procedures
    procedures = db.query(Procedure).filter(Procedure.patient_id == patient_id).all()
    for proc in procedures:
        ts = getattr(proc, 'scheduled_start', None) or getattr(proc, 'actual_start', None) or proc.created_at or datetime.now(timezone.utc)
        events.append(
            UnifiedTimelineItem(
                id=f"proc-{proc.id}",
                patient_id=patient_id,
                role="DOCTOR",
                actor="Surgical Team",
                actor_title="Attending Surgical Specialist",
                title=f"Procedure: {proc.name}",
                body=f"Type: {proc.procedure_type.value if hasattr(proc.procedure_type, 'value') else proc.procedure_type}. Status: {proc.status.value if hasattr(proc.status, 'value') else proc.status}.",
                timestamp=ts,
                tone="navy",
                category="Surgical",
                metadata={"procedure_id": proc.id, "status": str(proc.status)},
            )
        )

    # 3. Hospital Events (including Caretaker logs, Nurse rounds, Doctor notes)
    hosp_events = (
        db.query(HospitalEvent)
        .filter(HospitalEvent.patient_id == patient_id)
        .order_by(HospitalEvent.timestamp.desc())
        .all()
    )

    for ev in hosp_events:
        meta = ev.metadata_ or {}
        role = meta.get("role")
        actor = meta.get("actor")
        actor_title = meta.get("actor_title")
        title = meta.get("title")
        body = meta.get("body")
        tone = meta.get("tone")
        category = meta.get("category")

        # Infer role if not explicitly in metadata
        if not role:
            ev_type_str = ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type)
            if "ADMITTED" in ev_type_str:
                role = "ADMISSION"
                actor = actor or "Admissions Staff"
                actor_title = actor_title or "Triage Reception"
                tone = tone or "teal"
                title = title or "Patient Admitted"
                category = category or "Intake"
            elif "PROCEDURE" in ev_type_str or "DOCTOR" in (ev.source or "").upper():
                role = "DOCTOR"
                actor = actor or (ev.source if "DOCTOR" in (ev.source or "").upper() else "Attending Physician")
                actor_title = actor_title or "Attending Physician"
                tone = tone or "navy"
                title = title or "Clinical Procedure Order"
                category = category or "Doctor Rounds"
            elif "BED" in ev_type_str or "NURSE" in (ev.source or "").upper() or "DIAGNOSTIC" in ev_type_str:
                role = "NURSE"
                actor = actor or (ev.source if "NURSE" in (ev.source or "").upper() else "Ward Staff Nurse")
                actor_title = actor_title or "Registered Nurse (RN)"
                tone = tone or "emerald"
                title = title or ("Bed Management Update" if "BED" in ev_type_str else "Nurse Bedside Check")
                category = category or "Nursing Care"
            elif "CARETAKER" in (ev.source or "").upper():
                role = "CARETAKER"
                actor = actor or "Primary Caretaker"
                actor_title = actor_title or "Bedside Support"
                tone = tone or "amber"
                title = title or "Caretaker Observation"
                category = category or "Bedside Comfort"
            else:
                role = "NURSE"
                actor = actor or ev.source or "Clinical Team"
                tone = tone or "teal"
                title = title or ev_type_str.replace("_", " ")

        if not body:
            body = meta.get("note") or meta.get("reason") or ev.source or "Clinical event recorded in system."

        events.append(
            UnifiedTimelineItem(
                id=f"he-{ev.id}",
                patient_id=patient_id,
                role=role,
                actor=actor or "Care Team Member",
                actor_title=actor_title,
                title=title or "Care Update",
                body=body,
                timestamp=ev.timestamp or ev.created_at or datetime.now(timezone.utc),
                tone=tone or "teal",
                category=category,
                metadata=meta,
            )
        )

    # Sort all events chronologically (most recent first)
    events.sort(key=lambda x: x.timestamp, reverse=True)

    return UnifiedTimelineResponse(
        patient_id=patient_id,
        patient_name=patient_name,
        mrn=patient.mrn,
        room_or_bed=room_or_bed,
        events=events,
    )

def add_patient_timeline_update(
    db: Session,
    patient_id: int,
    req: PostTimelineUpdateRequest,
    current_user_name: Optional[str] = None
) -> UnifiedTimelineItem:
    role = req.role.upper().strip()
    if role not in ["DOCTOR", "NURSE", "CARETAKER", "ADMISSION"]:
        role = "CARETAKER"

    actor = req.actor or current_user_name or (
        "Dr. Robert Vance, MD" if role == "DOCTOR"
        else "Maya Lin, RN" if role == "NURSE"
        else "Sarah Jensen (Caretaker)"
    )
    actor_title = req.actor_title or (
        "Attending Orthopedic Surgeon" if role == "DOCTOR"
        else "Lead Staff Nurse" if role == "NURSE"
        else "Patient Bedside Support"
    )
    tone = req.tone or (
        "navy" if role == "DOCTOR"
        else "emerald" if role == "NURSE"
        else "amber" if role == "CARETAKER"
        else "teal"
    )
    category = req.category or (
        "Doctor Orders & Rounds" if role == "DOCTOR"
        else "Nursing Assessment" if role == "NURSE"
        else "Bedside Observation"
    )

    metadata_dict = {
        "role": role,
        "actor": actor,
        "actor_title": actor_title,
        "title": req.title,
        "body": req.body,
        "tone": tone,
        "category": category,
        **(req.metadata or {}),
    }

    event = HospitalEvent(
        event_type=EventType.STAFF_ASSIGNED,
        patient_id=patient_id,
        source=f"{role}: {actor}",
        metadata_=metadata_dict,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return UnifiedTimelineItem(
        id=f"he-{event.id}",
        patient_id=patient_id,
        role=role,
        actor=actor,
        actor_title=actor_title,
        title=req.title,
        body=req.body,
        timestamp=event.timestamp,
        tone=tone,
        category=category,
        metadata=metadata_dict,
    )
