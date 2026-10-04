from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_optional_current_user
from app.schemas.hospital import RfidBedScanRequest, RfidBedScanResponse
from app.services.resource_service import process_rfid_bed_scan

router = APIRouter(prefix="/api/rfid", tags=["rfid"])

@router.post("/scan", response_model=RfidBedScanResponse)
def rfid_scan_event(
    req: RfidBedScanRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_optional_current_user),
):
    """
    Primary endpoint for RFID badge/bed reader hardware.
    Accepts:
      - user_id: Patient ID, MRN, user ID, or badge identifier
      - bed_id: Bed integer ID or bed number string (e.g. 193 or '304B')
      - action (optional): 'assign', 'release', 'toggle', 'checkin', 'checkout'
      - status (optional): 'OCCUPIED', 'AVAILABLE', etc.
      - reader_id (optional): RFID reader hardware MAC/device name
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

@router.post("/bed-status", response_model=RfidBedScanResponse)
def rfid_bed_status_update(
    req: RfidBedScanRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_optional_current_user),
):
    """Alias for rfid scan to update bed status directly."""
    return rfid_scan_event(req=req, db=db, current_user=current_user)
