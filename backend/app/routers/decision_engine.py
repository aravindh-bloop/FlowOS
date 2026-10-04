"""FastAPI router for Flow OS Decision & Optimization Engines:
1. Staff Assignment (Multi-Objective Constraint Optimization)
2. Resource Allocation (Multi-Criteria Capacity Optimization)
3. Task Priority (Production Rules + Heuristic Search)
4. Alert Routing (Production Rules + RBAC)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.services.staff_assignment_optimizer import staff_optimizer
from app.services.resource_allocation_optimizer import resource_optimizer
from app.services.task_priority_engine import task_priority_engine
from app.services.alert_routing_engine import alert_routing_engine

router = APIRouter(prefix="/api/optimization", tags=["Operational Decision & Optimization"])


# ==========================================
# 1. Staff Assignment - Optimization
# ==========================================
class StaffAssignmentRequest(BaseModel):
    staff_roster: List[Dict[str, Any]] = Field(..., description="List of on-duty staff with id, name, role, specialization, workload")
    demand_slots: List[Dict[str, Any]] = Field(..., description="List of required staff demands with patient_id, required_role, priority, department")


@router.post("/staff-assignment")
def optimize_staff_assignment(payload: StaffAssignmentRequest):
    """Executes multi-objective constraint optimization to match on-duty staff to patient demands

    while balancing workload variance and adhering to safe nurse-to-patient ratios.
    """
    try:
        result = staff_optimizer.optimize_assignments(
            staff_roster=payload.staff_roster,
            demand_slots=payload.demand_slots,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Staff assignment optimization failed: {str(exc)}",
        ) from exc


# ==========================================
# 2. Resource Allocation - Optimization
# ==========================================
class ResourceAllocationRequest(BaseModel):
    available_resources: List[Dict[str, Any]] = Field(..., description="Available beds, scanners, theatres, ventilators")
    allocation_requests: List[Dict[str, Any]] = Field(..., description="Pending patient allocation requests with priority and type")
    preserve_buffer: bool = Field(True, description="Whether to retain emergency contingency buffers")


@router.post("/resource-allocation")
def optimize_resource_allocation(payload: ResourceAllocationRequest):
    """Executes multi-criteria capacity optimization to allocate hospital assets

    while enforcing emergency contingency buffers and maximizing clinical utility.
    """
    try:
        result = resource_optimizer.optimize_allocation(
            available_resources=payload.available_resources,
            allocation_requests=payload.allocation_requests,
            preserve_buffer=payload.preserve_buffer,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resource allocation optimization failed: {str(exc)}",
        ) from exc


# ==========================================
# 3. Task Priority - Rules + Heuristic Search
# ==========================================
class TaskPriorityRequest(BaseModel):
    tasks: List[Dict[str, Any]] = Field(..., description="List of operational/clinical tasks with title, priority, wait time, dependencies")


@router.post("/task-priority")
def prioritize_tasks(payload: TaskPriorityRequest):
    """Calculates dynamic task priority using clinical precedence rules (Code Blue, Stat Diagnostics)

    combined with lookahead heuristic search (f = g + h: wait cost + acuity + bottleneck relief).
    """
    try:
        result = task_priority_engine.prioritize_tasks(task_list=payload.tasks)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Task prioritization failed: {str(exc)}",
        ) from exc


# ==========================================
# 4. Alert Routing - Rules + RBAC
# ==========================================
class AlertRoutingRequest(BaseModel):
    alert: Dict[str, Any] = Field(..., description="Alert data including alert_type, severity, title, message, department_id")
    active_users: Optional[List[Dict[str, Any]]] = Field(None, description="Active user roster to filter authorized recipients")


@router.post("/alert-routing")
def route_alert(payload: AlertRoutingRequest):
    """Evaluates alerts using clinical routing rules and filters recipients through Role-Based Access Control (RBAC)

    with de-duplication and timed escalation policies.
    """
    try:
        result = alert_routing_engine.route_alert(
            alert=payload.alert,
            active_users=payload.active_users,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alert routing failed: {str(exc)}",
        ) from exc


@router.get("/alert-routing/rbac-matrix")
def get_rbac_routing_matrix():
    """Returns the operational RBAC matrix and escalation policies for hospital alert routing."""
    return {
        "rbac_routing_matrix": {
            cat: [r.value for r in roles]
            for cat, roles in alert_routing_engine.RBAC_ROUTING_MATRIX.items()
        },
        "escalation_sla_minutes": alert_routing_engine.ESCALATION_TIMEOUTS_MIN,
        "action_permissions": {
            action: [r.value for r in roles]
            for action, roles in alert_routing_engine.ACTION_PERMISSIONS.items()
        },
    }
