"""Flow OS Intelligent Alert Routing Engine.

Methodology: Production Rule Engine + Role-Based Access Control (RBAC).
Routes hospital alerts to authorized personnel based on clinical rules,
severity tiers, department affinity, and RBAC matrix while preventing alert fatigue
through de-duplication and timed escalation paths.
"""

from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone, timedelta
from app.models.user import UserRole


class AlertRoutingEngine:
    """Evaluates incoming hospital events, applies clinical/operational routing rules,

    and filters recipients using strict Role-Based Access Control (RBAC).
    """

    # RBAC Routing Matrix: maps alert category to authorized recipient roles
    RBAC_ROUTING_MATRIX: Dict[str, List[UserRole]] = {
        "EMERGENCY": [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN],
        "CODE_BLUE": [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN],
        "PATIENT_CRITICAL": [UserRole.DOCTOR, UserRole.NURSE],
        "VITALS_ANOMALY": [UserRole.NURSE, UserRole.DOCTOR],
        "DIAGNOSTIC_DELAY": [UserRole.TECHNICIAN, UserRole.DOCTOR, UserRole.MANAGER],
        "EQUIPMENT_MALFUNCTION": [UserRole.TECHNICIAN, UserRole.MANAGER],
        "ICU_CAPACITY": [UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR],
        "BED_SHORTAGE": [UserRole.ADMIN, UserRole.MANAGER, UserRole.NURSE],
        "STAFF_OVERLOAD": [UserRole.ADMIN, UserRole.MANAGER],
        "QUEUE_DELAY": [UserRole.MANAGER, UserRole.ADMIN],
        "GENERAL": [UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR, UserRole.NURSE, UserRole.TECHNICIAN],
    }

    # Action Permission Matrix
    ACTION_PERMISSIONS: Dict[str, Set[UserRole]] = {
        "ACKNOWLEDGE": {UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR, UserRole.NURSE, UserRole.TECHNICIAN},
        "RESOLVE": {UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR},
        "ESCALATE": {UserRole.ADMIN, UserRole.MANAGER, UserRole.DOCTOR, UserRole.NURSE},
        "OVERRIDE_CAPACITY": {UserRole.ADMIN, UserRole.MANAGER},
    }

    # Timed escalation SLA in minutes by severity
    ESCALATION_TIMEOUTS_MIN = {
        "CRITICAL": 3,
        "HIGH": 10,
        "MEDIUM": 30,
        "LOW": 60,
    }

    def __init__(self, deduplication_window_seconds: int = 180):
        self.dedup_window = deduplication_window_seconds
        # In-memory alert cache for suppression of duplicates
        self._recent_alert_cache: Dict[str, datetime] = {}

    def is_duplicate(self, alert_signature: str) -> bool:
        """Suppresses duplicate flapping alerts within the deduplication window."""
        now = datetime.now(timezone.utc)
        if alert_signature in self._recent_alert_cache:
            last_seen = self._recent_alert_cache[alert_signature]
            if (now - last_seen).total_seconds() < self.dedup_window:
                return True
        self._recent_alert_cache[alert_signature] = now
        return False

    def route_alert(
        self,
        alert: Dict[str, Any],
        active_users: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Applies routing rules and RBAC permissions to route an alert to the correct recipients.

        Args:
            alert: Dictionary with alert_type, severity, title, message, department_id, patient_id.
            active_users: Optional list of active user objects with id, full_name, role, department_id.

        Returns:
            Routed alert packet with authorized roles, targeted recipients, escalation deadline, and delivery channels.
        """
        category = str(alert.get("alert_type", "GENERAL")).upper()
        severity = str(alert.get("severity", "MEDIUM")).upper()
        title = alert.get("title", "Hospital Alert")
        dept_id = alert.get("department_id")

        # 1. Rule Evaluation: Deduplication check
        signature = f"{category}:{dept_id}:{title}"
        if alert.get("check_dedup", True) and self.is_duplicate(signature):
            return {
                "success": True,
                "status": "SUPPRESSED",
                "reason": f"Duplicate alert suppressed within {self.dedup_window}s window to prevent alert fatigue.",
                "signature": signature,
                "routed_recipients": [],
            }

        # 2. RBAC Matching: Lookup authorized recipient roles
        authorized_roles = self.RBAC_ROUTING_MATRIX.get(category, self.RBAC_ROUTING_MATRIX["GENERAL"])
        authorized_role_strings = [r.value if hasattr(r, "value") else str(r) for r in authorized_roles]

        # 3. Rule: Escalation SLA
        sla_min = self.ESCALATION_TIMEOUTS_MIN.get(severity, 30)
        escalation_deadline = (datetime.now(timezone.utc) + timedelta(minutes=sla_min)).isoformat()

        # 4. Delivery Channels rule
        channels = ["IN_APP_BANNER", "NOTIFICATION_BELL"]
        if severity == "CRITICAL":
            channels.extend(["AUDIBLE_ALARM", "EMERGENCY_BROADCAST", "PUSH_NOTIFICATION"])
        elif severity == "HIGH":
            channels.extend(["PUSH_NOTIFICATION"])

        # 5. Filter recipients by RBAC and Department affinity
        recipients = []
        if active_users:
            for u in active_users:
                u_role = str(u.get("role", "")).upper()
                if u_role in authorized_role_strings:
                    # Prefer users in matching department for localized alerts
                    u_dept = u.get("department_id")
                    matches_dept = (dept_id is None) or (u_dept is None) or (u_dept == dept_id)
                    is_admin_or_manager = u_role in ("ADMIN", "MANAGER")

                    if matches_dept or is_admin_or_manager or severity == "CRITICAL":
                        recipients.append({
                            "user_id": u.get("id"),
                            "name": u.get("full_name", u.get("name", "Staff Member")),
                            "role": u_role,
                            "department_id": u_dept,
                            "channel": "DIRECT_DISPATCH",
                        })

        return {
            "success": True,
            "status": "ROUTED",
            "methodology": "Production Rule Engine + RBAC",
            "alert": {
                "alert_id": alert.get("id", alert.get("alert_id")),
                "alert_type": category,
                "severity": severity,
                "title": title,
                "department_id": dept_id,
                "patient_id": alert.get("patient_id"),
            },
            "rbac_authorized_roles": authorized_role_strings,
            "escalation_policy": {
                "timeout_minutes": sla_min,
                "escalation_deadline": escalation_deadline,
                "escalation_target_role": "ADMIN" if severity == "CRITICAL" else "MANAGER",
            },
            "delivery_channels": channels,
            "routed_recipients_count": len(recipients),
            "routed_recipients": recipients,
        }

    def check_user_permission(self, user_role: str, action: str) -> bool:
        """RBAC permission check for operational action execution."""
        act_upper = action.upper()
        allowed_roles = self.ACTION_PERMISSIONS.get(act_upper, set())
        allowed_role_strings = {r.value if hasattr(r, "value") else str(r) for r in allowed_roles}
        return user_role.upper() in allowed_role_strings


# Global alert routing engine instance
alert_routing_engine = AlertRoutingEngine()
