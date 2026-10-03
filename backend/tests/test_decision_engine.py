"""Comprehensive Test Suite for Flow OS Operational Decision & Optimization Engines:
1. Staff Assignment (Multi-Objective Constraint Optimization)
2. Resource Allocation (Multi-Criteria Capacity Optimization)
3. Task Priority (Production Rules + Heuristic Search)
4. Alert Routing (Production Rules + RBAC)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.staff_assignment_optimizer import staff_optimizer
from app.services.resource_allocation_optimizer import resource_optimizer
from app.services.task_priority_engine import task_priority_engine
from app.services.alert_routing_engine import alert_routing_engine

client = TestClient(app)


# ==========================================
# 1. Staff Assignment (Optimization) Tests
# ==========================================
def test_staff_assignment_optimization():
    staff_roster = [
        {"id": 1, "name": "Dr. Sarah Chen", "role": "DOCTOR", "specialization": "Cardiology", "current_workload": 0.3, "active_assignments": 1},
        {"id": 2, "name": "Dr. James Wilson", "role": "DOCTOR", "specialization": "Neurology", "current_workload": 0.8, "active_assignments": 3},
        {"id": 3, "name": "Nurse Emily Davis", "role": "NURSE", "department_name": "ICU", "department_type": "ICU", "current_workload": 0.4, "active_assignments": 1},
        {"id": 4, "name": "Nurse John Miller", "role": "NURSE", "department_name": "ICU", "department_type": "ICU", "current_workload": 0.9, "active_assignments": 2}, # At ICU limit (2)
    ]

    demand_slots = [
        {"id": 101, "patient_id": 501, "patient_name": "Cardiac Patient", "required_role": "DOCTOR", "discomfort_type": "Cardiology", "priority": "HIGH"},
        {"id": 102, "patient_id": 502, "patient_name": "ICU Patient", "required_role": "NURSE", "department_name": "ICU", "department_type": "ICU", "priority": "CRITICAL"},
    ]

    res = staff_optimizer.optimize_assignments(staff_roster, demand_slots)
    assert res["success"] is True
    assert len(res["assignments"]) == 2

    # Dr. Sarah Chen should be chosen over Dr. James Wilson due to lower workload and Cardiology match
    doc_assign = next(a for a in res["assignments"] if a["demand_id"] == 101)
    assert doc_assign["assigned_staff_id"] == 1
    assert "Sarah Chen" in doc_assign["assigned_staff_name"]

    # Nurse Emily Davis should be chosen over John Miller because John is at ICU capacity limit (2)
    nurse_assign = next(a for a in res["assignments"] if a["demand_id"] == 102)
    assert nurse_assign["assigned_staff_id"] == 3
    assert nurse_assign["ratio_compliant"] is True


def test_staff_assignment_api_endpoint():
    payload = {
        "staff_roster": [
            {"id": 10, "name": "Nurse Alpha", "role": "NURSE", "current_workload": 0.2, "active_assignments": 0},
            {"id": 11, "name": "Tech Beta", "role": "TECHNICIAN", "current_workload": 0.5, "active_assignments": 1},
        ],
        "demand_slots": [
            {"slot_id": 1, "patient_id": 1001, "required_role": "NURSE", "priority": "HIGH"},
            {"slot_id": 2, "patient_id": 1002, "required_role": "TECHNICIAN", "priority": "MEDIUM"},
        ],
    }
    response = client.post("/api/optimization/staff-assignment", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["metrics"]["fulfilled_count"] == 2


# ==========================================
# 2. Resource Allocation (Optimization) Tests
# ==========================================
def test_resource_allocation_optimization_with_buffer():
    available_resources = [
        {"id": 1, "resource_type": "ICU_BED", "name": "ICU Bed 01", "status": "AVAILABLE", "turnaround_minutes": 20},
        {"id": 2, "resource_type": "ICU_BED", "name": "ICU Bed 02", "status": "AVAILABLE", "turnaround_minutes": 20},
        {"id": 3, "resource_type": "GENERAL_BED", "name": "General Bed 12", "status": "AVAILABLE", "turnaround_minutes": 30},
    ]

    # Requests: One Routine Medium, One Critical Emergency
    allocation_requests = [
        {"request_id": 201, "patient_id": 801, "resource_type": "ICU_BED", "priority": "MEDIUM", "wait_minutes": 10},
        {"request_id": 202, "patient_id": 802, "resource_type": "ICU_BED", "priority": "CRITICAL", "wait_minutes": 5},
        {"request_id": 203, "patient_id": 803, "resource_type": "ICU_BED", "priority": "LOW", "wait_minutes": 15},
    ]

    # With ICU buffer = 1, only 1 of the 2 ICU beds should be allocated to non-critical.
    # The CRITICAL patient gets an ICU bed. The other ICU bed is preserved as safety buffer for trauma.
    res = resource_optimizer.optimize_allocation(available_resources, allocation_requests, preserve_buffer=True)
    assert res["success"] is True
    assert len(res["allocations"]) >= 1

    # CRITICAL request must be allocated
    crit_alloc = next((a for a in res["allocations"] if a["request_id"] == 202), None)
    assert crit_alloc is not None
    assert crit_alloc["priority"] == "CRITICAL"


def test_resource_allocation_api_endpoint():
    payload = {
        "available_resources": [
            {"id": 101, "resource_type": "CT_SCANNER", "name": "Siemens Somatom CT", "status": "AVAILABLE"},
            {"id": 102, "resource_type": "MRI", "name": "3T Magnetom MRI", "status": "AVAILABLE"},
        ],
        "allocation_requests": [
            {"request_id": 1, "patient_id": 901, "resource_type": "CT_SCANNER", "priority": "EMERGENCY", "wait_minutes": 12},
        ],
        "preserve_buffer": True,
    }
    response = client.post("/api/optimization/resource-allocation", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["allocations"]) == 1
    assert body["allocations"][0]["resource_type"] == "CT_SCANNER"


# ==========================================
# 3. Task Priority (Rules + Heuristic Search) Tests
# ==========================================
def test_task_priority_rules_and_heuristic():
    tasks = [
        {"id": 1, "title": "Routine vitals check", "task_type": "GENERAL", "priority": "LOW", "elapsed_minutes": 10},
        {"id": 2, "title": "CODE BLUE: Resuscitation ED Bay 2", "task_type": "EMERGENCY", "priority": "EMERGENCY", "elapsed_minutes": 1},
        {"id": 3, "title": "Stat CT Angiography Stroke Protocol", "task_type": "DIAGNOSTIC", "priority": "HIGH", "elapsed_minutes": 15},
        {"id": 4, "title": "Prepare Patient Discharge Lounge", "task_type": "PATIENT_DISCHARGE", "priority": "MEDIUM", "elapsed_minutes": 45},
        {"id": 5, "title": "Surgical procedure transfer", "task_type": "PROCEDURE", "priority": "HIGH", "dependencies": ["Lab Consent"], "dependencies_met": False},
    ]

    res = task_priority_engine.prioritize_tasks(tasks)
    assert res["success"] is True
    ranked = res["prioritized_tasks"]

    # Rank 1 must be Code Blue override (score 100.0)
    assert ranked[0]["task_id"] == 2
    assert ranked[0]["active_rule"] == "RULE_CODE_BLUE"
    assert ranked[0]["priority_score"] == 100.0

    # Rank 2 must be Stat Stroke Protocol override (score 95.0)
    assert ranked[1]["task_id"] == 3
    assert ranked[1]["active_rule"] == "RULE_STAT_DIAGNOSTIC"
    assert ranked[1]["priority_score"] == 95.0

    # Discharge task gets heuristic bottleneck relief bonus
    discharge_task = next(t for t in ranked if t["task_id"] == 4)
    assert discharge_task["heuristic_breakdown"]["h_lookahead"] >= 25.0

    # Blocked task must be marked as is_blocked=True
    blocked_task = next(t for t in ranked if t["task_id"] == 5)
    assert blocked_task["is_blocked"] is True
    assert blocked_task["priority_score"] == 10.0


def test_task_priority_api_endpoint():
    payload = {
        "tasks": [
            {"id": 1, "title": "Routine dressing change", "priority": "LOW", "elapsed_minutes": 5},
            {"id": 2, "title": "Code Blue cardiac alert", "priority": "EMERGENCY", "elapsed_minutes": 0},
        ]
    }
    response = client.post("/api/optimization/task-priority", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["metrics"]["emergency_rule_overrides"] >= 1
    assert body["prioritized_tasks"][0]["dynamic_rank"] == 1


# ==========================================
# 4. Alert Routing (Rules + RBAC) Tests
# ==========================================
def test_alert_routing_rules_and_rbac():
    alert = {
        "id": 9001,
        "alert_type": "EMERGENCY",
        "severity": "CRITICAL",
        "title": "Severe trauma arrival bay 3",
        "department_id": 1,
        "check_dedup": False,
    }

    active_users = [
        {"id": 1, "full_name": "Dr. House", "role": "DOCTOR", "department_id": 1},
        {"id": 2, "full_name": "Nurse Jackie", "role": "NURSE", "department_id": 1},
        {"id": 3, "full_name": "Tech Bob", "role": "TECHNICIAN", "department_id": 10},
        {"id": 4, "full_name": "Admin Director", "role": "ADMIN", "department_id": 1},
    ]

    res = alert_routing_engine.route_alert(alert, active_users=active_users)
    assert res["success"] is True
    assert res["status"] == "ROUTED"
    assert "DOCTOR" in res["rbac_authorized_roles"]
    assert "NURSE" in res["rbac_authorized_roles"]
    assert "ADMIN" in res["rbac_authorized_roles"]

    # Delivery channels for CRITICAL must include audible alarm and broadcast
    assert "AUDIBLE_ALARM" in res["delivery_channels"]
    assert "EMERGENCY_BROADCAST" in res["delivery_channels"]

    # Escalation deadline exists
    assert res["escalation_policy"]["timeout_minutes"] == 3

    # Technician Bob should not receive EMERGENCY alert under RBAC
    recipient_names = [r["name"] for r in res["routed_recipients"]]
    assert "Dr. House" in recipient_names
    assert "Nurse Jackie" in recipient_names
    assert "Admin Director" in recipient_names
    assert "Tech Bob" not in recipient_names


def test_alert_deduplication():
    alert = {
        "alert_type": "BED_SHORTAGE",
        "severity": "HIGH",
        "title": "General ward beds at 95%",
        "department_id": 2,
        "check_dedup": True,
    }

    # First send is routed
    res1 = alert_routing_engine.route_alert(alert)
    assert res1["status"] == "ROUTED"

    # Immediate second identical send is suppressed to prevent alert fatigue
    res2 = alert_routing_engine.route_alert(alert)
    assert res2["status"] == "SUPPRESSED"
    assert "prevent alert fatigue" in res2["reason"]


def test_alert_routing_api_endpoint():
    payload = {
        "alert": {
            "alert_type": "EQUIPMENT_MALFUNCTION",
            "severity": "HIGH",
            "title": "CT Scanner tube temperature alert",
            "department_id": 10,
            "check_dedup": False,
        },
        "active_users": [
            {"id": 20, "name": "Imaging Tech Lisa", "role": "TECHNICIAN", "department_id": 10},
            {"id": 21, "name": "Nurse Greg", "role": "NURSE", "department_id": 2},
        ],
    }
    response = client.post("/api/optimization/alert-routing", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ROUTED"
    assert "TECHNICIAN" in body["rbac_authorized_roles"]

    # Lisa receives the alert, Greg does not
    recipients = [r["name"] for r in body["routed_recipients"]]
    assert "Imaging Tech Lisa" in recipients
    assert "Nurse Greg" not in recipients


def test_rbac_matrix_api_endpoint():
    response = client.get("/api/optimization/alert-routing/rbac-matrix")
    assert response.status_code == 200
    body = response.json()
    assert "rbac_routing_matrix" in body
    assert "escalation_sla_minutes" in body
    assert "action_permissions" in body
