from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.dependencies import get_current_user, get_optional_current_user
from app.schemas.caretaker import (
    PatientOverview,
    CareNotesResponse,
    CreateQuickLogRequest,
    QuickLogResponse,
    CreateFieldNoteRequest,
    FieldNote,
)
from app.schemas.patient_timeline import (
    UnifiedTimelineResponse,
    UnifiedTimelineItem,
    PostTimelineUpdateRequest,
)
from app.services.caretaker_service import (
    get_caretaker_patient_overview,
    get_caretaker_notes,
    record_quick_log,
    get_quick_logs,
    add_field_note,
)
from app.services.patient_timeline_service import (
    get_unified_patient_timeline,
    add_patient_timeline_update,
)

base_router = APIRouter()

# --- Overview Endpoints (Home screen) ---

@base_router.get("/overview", response_model=PatientOverview)
def read_current_patient_overview(
    db: Session = Depends(get_db),
    current_user = Depends(get_optional_current_user),
):
    """
    Returns the comprehensive patient overview for the caretaker home screen,
    including telemetry, continuous log checkpoints, comfort score, and milestones.
    """
    return get_caretaker_patient_overview(db)

@base_router.get("/patient/{patient_id}/overview", response_model=PatientOverview)
def read_patient_overview_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    overview = get_caretaker_patient_overview(db, patient_id=patient_id)
    if not overview:
        raise HTTPException(status_code=404, detail="Patient not found")
    return overview


# --- Notes & Clinical Handoff Endpoints (Notes screen) ---

@base_router.get("/notes", response_model=CareNotesResponse)
def read_current_patient_notes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Returns shift handoff totals, symptom status, upcoming/completed procedures,
    and voice/field notes for the Care Notes screen.
    """
    return get_caretaker_notes(db)

@base_router.get("/patient/{patient_id}/notes", response_model=CareNotesResponse)
def read_patient_notes_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return get_caretaker_notes(db, patient_id=patient_id)

@base_router.post("/notes", response_model=FieldNote, status_code=status.HTTP_201_CREATED)
def create_field_note_current(
    req: CreateFieldNoteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", None)
    return add_field_note(db, req, patient_id=None, current_user_name=user_name)

@base_router.post("/patient/{patient_id}/notes", response_model=FieldNote, status_code=status.HTTP_201_CREATED)
def create_field_note_for_patient(
    patient_id: int,
    req: CreateFieldNoteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", None)
    return add_field_note(db, req, patient_id=patient_id, current_user_name=user_name)


# --- Quick Logs & Continuous Journal Endpoints (Log screen) ---

@base_router.post("/logs", response_model=QuickLogResponse, status_code=status.HTTP_201_CREATED)
def create_caretaker_quick_log(
    req: CreateQuickLogRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Records a caretaker quick log (food, hydration, pain, mobility walk, medication, etc.)
    directly into the patient's continuous clinical journal.
    """
    try:
        user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", None)
        return record_quick_log(db, req, current_user_name=user_name)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record quick log: {str(e)}")

@base_router.get("/logs", response_model=List[QuickLogResponse])
def read_caretaker_quick_logs(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return get_quick_logs(db, patient_id=patient_id)


# --- Unified Multidisciplinary Timeline Endpoints (Timeline screen) ---

@base_router.get("/timeline", response_model=UnifiedTimelineResponse)
def read_current_timeline(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    overview = get_caretaker_patient_overview(db)
    pid = int(overview.id) if overview.id.isdigit() else 261
    timeline = get_unified_patient_timeline(db, pid)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    return timeline

@base_router.post("/timeline", response_model=UnifiedTimelineItem, status_code=status.HTTP_201_CREATED)
def post_timeline_update_current(
    req: PostTimelineUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    overview = get_caretaker_patient_overview(db)
    pid = int(overview.id) if overview.id.isdigit() else 261
    user_name = getattr(current_user, "full_name", None) or getattr(current_user, "email", None)
    return add_patient_timeline_update(db, pid, req, current_user_name=user_name)


# Export both /api/caretaker (standard) and /caretaker (compatibility) routers
router = APIRouter(prefix="/api/caretaker", tags=["caretaker"])
router.include_router(base_router)

compat_router = APIRouter(prefix="/caretaker", tags=["caretaker-compat"])
compat_router.include_router(base_router)
