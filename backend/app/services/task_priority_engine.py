"""Flow OS Dynamic Task Prioritization Engine.

Methodology: Production Rules + Heuristic Search (A* Priority Function f = g + h).
Dynamically calculates operational and clinical task priorities using precedence rules
(Code Blue, Stat Diagnostics, Sepsis, Dependencies) combined with lookahead heuristic search
(acuity risk, bottleneck relief, and wait time penalties).
"""

from typing import Dict, Any, List, Optional
import math
from datetime import datetime, timezone


class TaskPriorityEngine:
    """Combines hard medical precedence rules with heuristic search scoring

    f(n) = g(n) + h(n) to prioritize hospital tasks.
    """

    # Baseline acuity heuristic coefficients
    ACUITY_MULTIPLIER = {
        "CRITICAL": 50.0,
        "HIGH": 30.0,
        "MEDIUM": 15.0,
        "LOW": 5.0,
    }

    # Downstream bottleneck relief bonuses
    BOTTLENECK_RELIEF_BONUSES = {
        "PATIENT_DISCHARGE": 25.0,     # Frees general or ICU bed
        "PATIENT_TRANSFER": 20.0,      # Relieves step-down / ICU pressure
        "DIAGNOSTIC_COMPLETION": 15.0, # Frees CT/MRI scanner queue
        "MEDICATION_ADMIN": 10.0,      # Prevents patient condition relapse
    }

    def __init__(self, wait_penalty_per_min: float = 0.5):
        self.wait_penalty = wait_penalty_per_min

    def evaluate_precedence_rules(self, task: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Evaluates hard clinical precedence rules.

        Returns rule details if a rule overrides standard heuristic scoring.
        """
        task_type = str(task.get("task_type", task.get("type", ""))).upper()
        title = str(task.get("title", "")).upper()
        instructions = str(task.get("instructions", "")).upper()
        priority_label = str(task.get("priority", "MEDIUM")).upper()

        # RULE 1: Code Blue / Resuscitation Emergency
        if "CODE BLUE" in title or "CARDIAC ARREST" in title or priority_label == "EMERGENCY":
            return {
                "rule_name": "RULE_CODE_BLUE",
                "override_priority": 100.0,
                "tier": "EMERGENCY_OVERRIDE",
                "explanation": "Immediate life-threat code emergency. Preempts all routine clinical tasks.",
            }

        # RULE 2: Stat Stroke / STEMI Diagnostic Window
        if "STAT" in title or "STROKE" in title or "STEMI" in title or "TRAUMA" in title:
            return {
                "rule_name": "RULE_STAT_DIAGNOSTIC",
                "override_priority": 95.0,
                "tier": "TIME_CRITICAL_STAT",
                "explanation": "Stat critical diagnostic window (< 25 min door-to-needle/scan target).",
            }

        # RULE 3: Sepsis / Deteriorating Vitals Alert
        if "SEPSIS" in title or "CRITICAL VITALS" in title or priority_label == "CRITICAL":
            return {
                "rule_name": "RULE_SEPSIS_DETERIORATION",
                "override_priority": 90.0,
                "tier": "CLINICAL_DETERIORATION",
                "explanation": "Clinical deterioration threshold breached. Rapid escalation protocol engaged.",
            }

        # RULE 4: Blocked Dependency
        dependencies = task.get("dependencies", [])
        if dependencies and not task.get("dependencies_met", False):
            return {
                "rule_name": "RULE_PREREQUISITE_DEPENDENCY",
                "override_priority": 10.0,
                "tier": "DEPENDENCY_BLOCKED",
                "explanation": f"Blocked pending completion of upstream dependencies: {dependencies}",
            }

        return None

    def compute_heuristic_score(self, task: Dict[str, Any]) -> Dict[str, float]:
        """Calculates f(n) = g(n) + h(n):

        g(n): Elapsed wait time penalty and SLA deficit.
        h(n): Heuristic estimate of clinical deterioration risk and downstream bottleneck relief.
        """
        # g(n): Cost incurred so far (wait time in minutes)
        elapsed_min = float(task.get("elapsed_minutes", task.get("wait_minutes", 0.0)))
        g_cost = min(40.0, elapsed_min * self.wait_penalty)

        # h(n): Lookahead heuristic
        priority_label = str(task.get("priority", "MEDIUM")).upper()
        acuity_heuristic = self.ACUITY_MULTIPLIER.get(priority_label, 15.0)

        task_type = str(task.get("task_type", task.get("type", "GENERAL"))).upper()
        bottleneck_bonus = self.BOTTLENECK_RELIEF_BONUSES.get(task_type, 5.0)

        # SLA deadline urgency
        sla_remaining = float(task.get("sla_remaining_minutes", 60.0))
        sla_urgency = max(0.0, (60.0 - sla_remaining) * 0.25)

        h_lookahead = acuity_heuristic + bottleneck_bonus + sla_urgency
        f_total = g_cost + h_lookahead

        return {
            "g_wait_cost": round(g_cost, 2),
            "h_lookahead": round(h_lookahead, 2),
            "f_total_priority": round(f_total, 2),
        }

    def prioritize_tasks(self, task_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Runs the hybrid rule + heuristic prioritization engine on a list of operational tasks."""
        if not task_list:
            return {
                "success": True,
                "methodology": "Production Rules + Heuristic Search (A* f = g + h)",
                "prioritized_tasks": [],
                "metrics": {"total_tasks": 0, "emergency_overrides": 0},
            }

        scored_tasks = []
        rule_overrides_count = 0

        for t in task_list:
            task_copy = dict(t)
            rule_match = self.evaluate_precedence_rules(task_copy)

            if rule_match:
                rule_overrides_count += 1
                f_score = rule_match["override_priority"]
                score_breakdown = {
                    "g_wait_cost": 0.0,
                    "h_lookahead": f_score,
                    "f_total_priority": f_score,
                }
                active_rule = rule_match["rule_name"]
                tier = rule_match["tier"]
                explanation = rule_match["explanation"]
                is_blocked = (active_rule == "RULE_PREREQUISITE_DEPENDENCY")
            else:
                score_breakdown = self.compute_heuristic_score(task_copy)
                f_score = score_breakdown["f_total_priority"]
                active_rule = "HEURISTIC_SEARCH_A_STAR"
                tier = "HIGH" if f_score >= 60.0 else ("MEDIUM" if f_score >= 35.0 else "LOW")
                explanation = f"Prioritized via lookahead heuristic: Acuity + Bottleneck relief ({score_breakdown['h_lookahead']}) + Wait penalty ({score_breakdown['g_wait_cost']})."
                is_blocked = False

            scored_tasks.append({
                "task_id": task_copy.get("id", task_copy.get("task_id")),
                "title": task_copy.get("title", "Clinical Task"),
                "task_type": task_copy.get("task_type", task_copy.get("type", "ROUTINE")),
                "patient_id": task_copy.get("patient_id"),
                "patient_name": task_copy.get("patient_name", "Assigned Patient"),
                "department": task_copy.get("department_name", "Hospital"),
                "priority_score": round(f_score, 2),
                "priority_tier": tier,
                "active_rule": active_rule,
                "is_blocked": is_blocked,
                "heuristic_breakdown": score_breakdown,
                "clinical_operational_rationale": explanation,
            })

        # Rank tasks by final priority score descending
        ranked_tasks = sorted(scored_tasks, key=lambda x: x["priority_score"], reverse=True)

        # Assign final 1-based dynamic queue ranking
        for rank, item in enumerate(ranked_tasks, start=1):
            item["dynamic_rank"] = rank

        return {
            "success": True,
            "methodology": "Production Rules + Heuristic Search (A* f = g + h)",
            "prioritized_tasks": ranked_tasks,
            "metrics": {
                "total_tasks": len(ranked_tasks),
                "emergency_rule_overrides": rule_overrides_count,
                "highest_priority_task": ranked_tasks[0]["title"] if ranked_tasks else None,
                "highest_priority_score": ranked_tasks[0]["priority_score"] if ranked_tasks else 0.0,
            },
        }


# Global engine instance
task_priority_engine = TaskPriorityEngine()
