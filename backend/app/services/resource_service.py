from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from fastapi import HTTPException
from typing import Optional, Any, Dict
import time

from app.models.resource import Equipment, OperatingTheatre
from app.models.hospital import Bed, BedStatus
from app.models.patient import Patient, Admission, PatientTransfer, TransferStatus
from app.models.event import HospitalEvent, EventType
from app.websocket_manager import broadcast_sync

_beds_cache: Dict[str, Any] = {"data": None, "timestamp": 0.0}
BEDS_CACHE_TTL_SECONDS = 3.0

def invalidate_beds_cache():
    global _beds_cache
    _beds_cache["data"] = None
    _beds_cache["timestamp"] = 0.0

def _enrich_bed(db: Session, b: Bed) -> Bed:
    if b.department:
        setattr(b, "department_name", b.department.name)
    if b.room:
        setattr(b, "room_number", b.room.room_number)
    if b.patient_id:
        pt = db.query(Patient).filter(Patient.id == b.patient_id).first()
        if pt:
            setattr(b, "patient_name", f"{pt.first_name} {pt.last_name}".strip())
            setattr(b, "patient_mrn", pt.mrn)
        adm = (
            db.query(Admission)
            .filter(Admission.patient_id == b.patient_id)
            .order_by(Admission.admission_date.desc())
            .first()
        )
        if adm:
            setattr(b, "admission_id", adm.id)
    return b

def get_equipment(db: Session):
    return db.query(Equipment).all()

def get_beds(db: Session, force_refresh: bool = False):
    global _beds_cache
    now = time.time()
    if not force_refresh and _beds_cache["data"] is not None and (now - _beds_cache["timestamp"]) < BEDS_CACHE_TTL_SECONDS:
        return _beds_cache["data"]

    # Eagerly load department and room with single JOIN query (avoids N+1 lazy queries)
    beds = (
        db.query(Bed)
        .options(joinedload(Bed.department), joinedload(Bed.room))
        .order_by(Bed.department_id, Bed.id)
        .all()
    )

    # Batch load all patients and active admissions for occupied beds in 2 fast queries
    patient_ids = list({b.patient_id for b in beds if b.patient_id})
    patients_map = {}
    admissions_map = {}
    if patient_ids:
        pts = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
        patients_map = {p.id: p for p in pts}
        adms = (
            db.query(Admission)
            .filter(Admission.patient_id.in_(patient_ids))
            .order_by(Admission.admission_date.asc())
            .all()
        )
        for adm in adms:
            admissions_map[adm.patient_id] = adm.id

    for b in beds:
        if b.department:
            setattr(b, "department_name", b.department.name)
        if b.room:
            setattr(b, "room_number", b.room.room_number)
        if b.patient_id:
            pt = patients_map.get(b.patient_id)
            if pt:
                setattr(b, "patient_name", f"{pt.first_name} {pt.last_name}".strip())
                setattr(b, "patient_mrn", pt.mrn)
            adm_id = admissions_map.get(b.patient_id)
            if adm_id:
                setattr(b, "admission_id", adm_id)

    _beds_cache["data"] = beds
    _beds_cache["timestamp"] = now
    return beds

def get_bed_summary_by_department(db: Session, department_id: int):
    beds = db.query(Bed).filter(Bed.department_id == department_id).all()
    total = len(beds)
    available = sum(1 for b in beds if b.status == BedStatus.AVAILABLE)
    occupied = sum(1 for b in beds if b.status == BedStatus.OCCUPIED)
    reserved = sum(1 for b in beds if b.status == BedStatus.RESERVED)
    maintenance = sum(1 for b in beds if b.status == BedStatus.MAINTENANCE)
    utilization_rate = (occupied / total * 100) if total > 0 else 0
    return {
        "total_beds": total,
        "available_beds": available,
        "occupied_beds": occupied,
        "reserved_beds": reserved,
        "maintenance_beds": maintenance,
        "utilization_rate": utilization_rate
    }

def assign_bed(
    db: Session,
    bed_id: int,
    patient_id: int,
    notes: Optional[str] = None,
    user_name: Optional[str] = None
) -> Bed:
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # If patient already has another occupied bed, release that old bed
    old_bed = db.query(Bed).filter(Bed.patient_id == patient_id, Bed.id != bed_id).first()
    if old_bed:
        old_bed.patient_id = None
        old_bed.status = BedStatus.AVAILABLE

    bed.patient_id = patient_id
    bed.status = BedStatus.OCCUPIED

    # Update active admission
    adm = (
        db.query(Admission)
        .filter(Admission.patient_id == patient_id)
        .order_by(Admission.admission_date.desc())
        .first()
    )
    if adm:
        adm.bed_id = bed_id
        adm.department_id = bed.department_id

    # Create HospitalEvent
    dept_name = bed.department.name if bed.department else "Ward"
    pt_name = f"{patient.first_name} {patient.last_name}".strip()
    event = HospitalEvent(
        event_type=EventType.BED_ASSIGNED,
        patient_id=patient_id,
        resource_type="BED",
        resource_id=bed_id,
        department_id=bed.department_id,
        source=f"BED_ALLOCATION: {user_name or 'System'}",
        metadata_={
            "role": "NURSE",
            "title": f"Bed Assigned — {bed.bed_number}",
            "body": f"Patient {pt_name} assigned to Bed {bed.bed_number} ({dept_name}). {notes or ''}".strip(),
            "bed_number": bed.bed_number,
            "department_name": dept_name,
        },
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(bed)
    invalidate_beds_cache()
    broadcast_sync({"type": "BEDS_UPDATED", "action": "ASSIGN", "bed_id": bed_id})
    return _enrich_bed(db, bed)

def release_bed(db: Session, bed_id: int, user_name: Optional[str] = None) -> Bed:
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    old_pid = bed.patient_id
    old_pt_name = "Patient"
    if old_pid:
        pt = db.query(Patient).filter(Patient.id == old_pid).first()
        if pt:
            old_pt_name = f"{pt.first_name} {pt.last_name}".strip()

    bed.patient_id = None
    bed.status = BedStatus.AVAILABLE

    if old_pid:
        adm = (
            db.query(Admission)
            .filter(Admission.patient_id == old_pid)
            .order_by(Admission.admission_date.desc())
            .first()
        )
        if adm and adm.bed_id == bed_id:
            adm.bed_id = None

        ev = HospitalEvent(
            event_type=EventType.BED_RELEASED,
            patient_id=old_pid,
            resource_type="BED",
            resource_id=bed_id,
            department_id=bed.department_id,
            source=f"BED_ALLOCATION: {user_name or 'System'}",
            metadata_={
                "role": "NURSE",
                "title": f"Bed Released — {bed.bed_number}",
                "body": f"Bed {bed.bed_number} released from {old_pt_name}. Sanitization and turnover initiated.",
                "bed_number": bed.bed_number,
            },
            timestamp=datetime.now(timezone.utc),
        )
        db.add(ev)

    db.commit()
    db.refresh(bed)
    invalidate_beds_cache()
    broadcast_sync({"type": "BEDS_UPDATED", "action": "RELEASE", "bed_id": bed_id})
    return _enrich_bed(db, bed)

def transfer_bed(
    db: Session,
    from_bed_id: int,
    to_bed_id: int,
    reason: Optional[str] = None,
    user_name: Optional[str] = None
) -> Bed:
    from_bed = db.query(Bed).filter(Bed.id == from_bed_id).first()
    to_bed = db.query(Bed).filter(Bed.id == to_bed_id).first()
    if not from_bed or not to_bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    if not from_bed.patient_id:
        raise HTTPException(status_code=400, detail="Source bed is not occupied")
    if to_bed.status == BedStatus.OCCUPIED and to_bed.patient_id:
        raise HTTPException(status_code=400, detail="Target bed is already occupied")

    patient_id = from_bed.patient_id
    pt = db.query(Patient).filter(Patient.id == patient_id).first()
    pt_name = f"{pt.first_name} {pt.last_name}".strip() if pt else "Patient"

    # Clear old bed
    from_bed.patient_id = None
    from_bed.status = BedStatus.AVAILABLE

    # Set new bed
    to_bed.patient_id = patient_id
    to_bed.status = BedStatus.OCCUPIED

    # Update admission
    adm = (
        db.query(Admission)
        .filter(Admission.patient_id == patient_id)
        .order_by(Admission.admission_date.desc())
        .first()
    )
    if adm:
        adm.bed_id = to_bed_id
        adm.department_id = to_bed.department_id

    # Record transfer in patient_transfers
    transfer = PatientTransfer(
        admission_id=adm.id if adm else 0,
        patient_id=patient_id,
        from_department_id=from_bed.department_id,
        to_department_id=to_bed.department_id,
        from_bed_id=from_bed_id,
        to_bed_id=to_bed_id,
        transfer_time=datetime.now(timezone.utc),
        reason=reason or "Clinical bed reallocation",
        status=TransferStatus.COMPLETED,
    )
    db.add(transfer)

    # Record event
    ev = HospitalEvent(
        event_type=EventType.PATIENT_MOVED,
        patient_id=patient_id,
        source=f"BED_TRANSFER: {user_name or 'System'}",
        metadata_={
            "role": "NURSE",
            "title": f"Bed Transfer: Bed {from_bed.bed_number} -> Bed {to_bed.bed_number}",
            "body": f"{pt_name} transferred from Bed {from_bed.bed_number} to Bed {to_bed.bed_number}. Reason: {reason or 'Clinical bed reallocation'}.",
            "from_bed": from_bed.bed_number,
            "to_bed": to_bed.bed_number,
        },
        timestamp=datetime.now(timezone.utc),
    )
    db.add(ev)

    db.commit()
    db.refresh(to_bed)
    invalidate_beds_cache()
    broadcast_sync({"type": "BEDS_UPDATED", "action": "TRANSFER", "from_bed_id": from_bed_id, "to_bed_id": to_bed_id})
    return _enrich_bed(db, to_bed)

def ensure_mock_patient_bed_assigned(db: Session) -> Optional[Bed]:
    akshaya = db.query(Patient).filter(Patient.first_name.ilike('%Akshaya%')).first()
    if not akshaya:
        from app.seed.seed_mock_patient import seed_akshayasri_patient
        seed_akshayasri_patient()
        akshaya = db.query(Patient).filter(Patient.first_name.ilike('%Akshaya%')).first()

    bed_304b = db.query(Bed).filter(Bed.bed_number == "304B").first()
    if bed_304b and akshaya:
        bed_304b.patient_id = akshaya.id
        bed_304b.status = BedStatus.OCCUPIED
        adm = db.query(Admission).filter(Admission.patient_id == akshaya.id).first()
        if adm:
            adm.bed_id = bed_304b.id
        db.commit()
        db.refresh(bed_304b)
        invalidate_beds_cache()
        broadcast_sync({"type": "BEDS_UPDATED", "action": "MOCK_SYNC"})
        return _enrich_bed(db, bed_304b)
    return None

def process_rfid_bed_scan(
    db: Session,
    bed_id_val: Any,
    user_id_val: Optional[Any] = None,
    action: Optional[str] = None,
    target_status: Optional[str] = None,
    reader_id: Optional[str] = None,
    notes: Optional[str] = None,
    user_name: Optional[str] = "RFID_Reader"
) -> Dict[str, Any]:
    """
    Processes scan events from an RFID reader / hardware node.
    Receives user_id (patient/staff badge ID or MRN) and bed_id (ID or bed_number),
    and updates bed occupancy and status immediately in database and clinical timeline.
    """
    # 1. Locate Bed
    bed = None
    try:
        b_int = int(bed_id_val)
        bed = db.query(Bed).filter(Bed.id == b_int).first()
    except (ValueError, TypeError):
        pass

    if not bed:
        bed = db.query(Bed).filter(Bed.bed_number.ilike(str(bed_id_val).strip())).first()

    if not bed:
        raise HTTPException(status_code=404, detail=f"Bed '{bed_id_val}' not found")

    # 2. Locate Patient
    patient = None
    if user_id_val is not None and str(user_id_val).strip() != "":
        # Try patient ID as integer
        try:
            p_int = int(user_id_val)
            patient = db.query(Patient).filter(Patient.id == p_int).first()
        except (ValueError, TypeError):
            pass

        if not patient:
            # Try by MRN
            patient = db.query(Patient).filter(Patient.mrn.ilike(str(user_id_val).strip())).first()

        if not patient:
            # Try by patient name
            patient = db.query(Patient).filter(
                (Patient.first_name.ilike(f"%{user_id_val}%")) |
                (Patient.last_name.ilike(f"%{user_id_val}%"))
            ).first()

        if not patient:
            # Check User table by ID or email
            from app.models.user import User
            u = None
            try:
                u_int = int(user_id_val)
                u = db.query(User).filter(User.id == u_int).first()
            except (ValueError, TypeError):
                u = db.query(User).filter(User.email.ilike(str(user_id_val).strip())).first()
            if u:
                patient = db.query(Patient).filter(
                    Patient.first_name.ilike(f"%{u.full_name.split()[0]}%")
                ).first()

    # 3. Determine whether to release or assign (Toggle mechanism by default)
    normalized_action = (action or "").strip().lower()
    normalized_status = (target_status or "").strip().upper()

    if normalized_action in ["release", "checkout", "vacate", "discharge"] or normalized_status == "AVAILABLE":
        should_release = True
    elif normalized_action in ["assign", "checkin", "occupy"] or normalized_status == "OCCUPIED":
        should_release = False
    else:
        # Toggle mechanism:
        # If the bed is currently OCCUPIED, scanning again marks it UNOCCUPIED (AVAILABLE).
        # If the bed is currently AVAILABLE (unoccupied), scanning marks it OCCUPIED.
        should_release = (bed.status == BedStatus.OCCUPIED)

    if should_release:
        old_pid = bed.patient_id
        old_pt_name = "Patient"
        if old_pid:
            old_pt = db.query(Patient).filter(Patient.id == old_pid).first()
            if old_pt:
                old_pt_name = f"{old_pt.first_name} {old_pt.last_name}".strip()
        elif patient:
            old_pt_name = f"{patient.first_name} {patient.last_name}".strip()

        bed.patient_id = None
        bed.status = BedStatus.AVAILABLE

        if old_pid:
            adm = db.query(Admission).filter(Admission.patient_id == old_pid).order_by(Admission.admission_date.desc()).first()
            if adm and adm.bed_id == bed.id:
                adm.bed_id = None

        # Log event
        ev = HospitalEvent(
            event_type=EventType.BED_RELEASED,
            patient_id=old_pid or (patient.id if patient else None),
            resource_type="BED",
            resource_id=bed.id,
            department_id=bed.department_id,
            source=f"RFID_SCAN: {reader_id or user_name or 'Reader'}",
            metadata_={
                "role": "NURSE",
                "title": f"RFID Tap-Out — Bed {bed.bed_number} Marked Unoccupied",
                "body": f"RFID badge scanned again at Bed {bed.bed_number}. Bed toggled to UNOCCUPIED (AVAILABLE).",
                "bed_number": bed.bed_number,
                "reader_id": reader_id,
            },
            timestamp=datetime.now(timezone.utc),
        )
        db.add(ev)
        db.commit()
        db.refresh(bed)
        invalidate_beds_cache()
        broadcast_sync({"type": "BEDS_UPDATED", "action": "RFID_TAP_OUT", "bed_number": bed.bed_number})

        return {
            "success": True,
            "message": f"Bed {bed.bed_number} toggled to UNOCCUPIED (AVAILABLE) via RFID scan.",
            "action": "UNOCCUPIED",
            "bed": _enrich_bed(db, bed),
            "patient": None,
        }

    # Otherwise ASSIGN / OCCUPY
    if not patient:
        # Default fallback for Bed 304B or general patient if no user found
        if str(bed.bed_number).upper() == "304B":
            patient = db.query(Patient).filter(Patient.first_name.ilike('%Akshaya%')).first()
        if not patient:
            patient = db.query(Patient).first()

    if not patient:
        raise HTTPException(status_code=400, detail="Cannot assign bed without a valid patient/user identifier.")

    pt_name = f"{patient.first_name} {patient.last_name}".strip()

    # Clear previous bed if patient was assigned elsewhere
    prev_bed = db.query(Bed).filter(Bed.patient_id == patient.id, Bed.id != bed.id).first()
    if prev_bed:
        prev_bed.patient_id = None
        prev_bed.status = BedStatus.AVAILABLE

    bed.patient_id = patient.id
    bed.status = BedStatus.OCCUPIED

    # Update active admission
    adm = db.query(Admission).filter(Admission.patient_id == patient.id).order_by(Admission.admission_date.desc()).first()
    if adm:
        adm.bed_id = bed.id
        adm.department_id = bed.department_id

    # Create event
    dept_name = bed.department.name if bed.department else "General Medicine"
    ev = HospitalEvent(
        event_type=EventType.BED_ASSIGNED,
        patient_id=patient.id,
        resource_type="BED",
        resource_id=bed.id,
        department_id=bed.department_id,
        source=f"RFID_SCAN: {reader_id or user_name or 'Reader'}",
        metadata_={
            "role": "NURSE",
            "title": f"RFID Check-in — Bed {bed.bed_number} Assigned",
            "body": f"RFID badge scanned for {pt_name} (MRN: {patient.mrn}). Bed {bed.bed_number} ({dept_name}) marked OCCUPIED. {notes or ''}".strip(),
            "bed_number": bed.bed_number,
            "department_name": dept_name,
            "reader_id": reader_id,
        },
        timestamp=datetime.now(timezone.utc),
    )
    db.add(ev)
    db.commit()
    db.refresh(bed)
    invalidate_beds_cache()
    broadcast_sync({"type": "BEDS_UPDATED", "action": "RFID_CHECK_IN", "bed_number": bed.bed_number})

    return {
        "success": True,
        "message": f"Bed {bed.bed_number} marked OCCUPIED by {pt_name} (MRN: {patient.mrn}) via RFID scan.",
        "action": "OCCUPIED",
        "bed": _enrich_bed(db, bed),
        "patient": {
            "id": patient.id,
            "name": pt_name,
            "mrn": patient.mrn,
        },
    }

def get_operating_theatres(db: Session):
    return db.query(OperatingTheatre).all()
