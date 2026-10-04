from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.hospital import (
    BedResponse,
    BedSummary,
    AssignBedRequest,
    TransferBedRequest,
    RfidBedScanRequest,
    RfidBedScanResponse,
)
from app.services.resource_service import (
    get_beds,
    get_bed_summary_by_department,
    assign_bed,
    release_bed,
    transfer_bed,
    ensure_mock_patient_bed_assigned,
    process_rfid_bed_scan,
)
from app.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/beds", tags=["beds"])

@router.get("", response_model=List[BedResponse])
def read_beds(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    beds = get_beds(db)
    if department_id:
        beds = [b for b in beds if b.department_id == department_id]
    return beds

@router.get("/summary", response_model=BedSummary)
def read_bed_summary(
    department_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_bed_summary_by_department(db, department_id)

@router.post("/assign-mock-patient", response_model=BedResponse)
def assign_mock_user_bed(
    db: Session = Depends(get_db),
    current_user = Depends(get_optional_current_user)
):
    """
    Ensures the mock patient (AkshayaSri, Room 304B) is actively assigned to Bed 304B.
    """
    bed = ensure_mock_patient_bed_assigned(db)
    if not bed:
        raise HTTPException(status_code=500, detail="Failed to assign Bed 304B to AkshayaSri")
    return bed

@router.post("/{id}/assign", response_model=BedResponse)
def assign_patient_to_bed(
    id: int,
    req: AssignBedRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Assigns a bed to a patient, updates the patient's active admission,
    and logs a BED_ASSIGNED event in the clinical journey.
    """
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "Staff")
    return assign_bed(db, bed_id=id, patient_id=req.patient_id, notes=req.notes, user_name=user_name)

@router.post("/{id}/release", response_model=BedResponse)
def release_patient_bed(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Releases an occupied bed, clears the patient assignment, and logs a BED_RELEASED event.
    """
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "Staff")
    return release_bed(db, bed_id=id, user_name=user_name)

@router.post("/{id}/transfer", response_model=BedResponse)
def transfer_patient_to_new_bed(
    id: int,
    req: TransferBedRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Transfers a patient from source bed to target bed, records PatientTransfer entry,
    and logs a PATIENT_MOVED event in the timeline.
    """
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "Staff")
    return transfer_bed(db, from_bed_id=id, to_bed_id=req.to_bed_id, reason=req.reason, user_name=user_name)

@router.post("/rfid-scan", response_model=RfidBedScanResponse)
def handle_rfid_bed_scan(
    req: RfidBedScanRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_optional_current_user),
):
    """
    Endpoint for RFID readers to report badge and bed scans.
    Updates bed occupancy status (OCCUPIED / AVAILABLE) in real-time.
    Payload sends user_id and bed_id (with optional action/status).
    """
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", "RFID_Reader")
    return process_rfid_bed_scan(
        db,
        bed_id_val=req.bed_id,
        user_id_val=req.user_id,
        action=req.action,
        target_status=req.status,
        reader_id=req.reader_id,
        notes=req.notes,
        user_name=user_name,
    )
