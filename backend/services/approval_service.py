"""In-memory decision approval and audit tracking service for One Missing Part MVP."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from backend.models.decisions import (
    CurrentDecisionResponse,
    DecisionApprovalAction,
    DecisionApprovalRequest,
    DecisionApprovalStatus,
    DecisionRecord,
)
from backend.models.scenario import PlanningScenario
from backend.services.decision_engine import evaluate_all_decisions


class DecisionApprovalStore:
    """In-memory repository managing decision approval states and audit records."""

    def __init__(self) -> None:
        self._current_decision: Optional[DecisionRecord] = None

    def get_current_decision(self) -> CurrentDecisionResponse:
        """Retrieve active decision status."""
        if self._current_decision is None:
            return CurrentDecisionResponse(
                has_decision=False,
                status=DecisionApprovalStatus.PENDING,
                decision=None,
                message="No decision action has been recorded yet for scenario SCENARIO-2026-W42.",
            )

        return CurrentDecisionResponse(
            has_decision=True,
            status=self._current_decision.status,
            decision=self._current_decision,
            message=(
                f"Active decision recorded: {self._current_decision.status.value.upper()} "
                f"for strategy '{self._current_decision.selected_strategy_id}'."
            ),
        )

    def record_decision(
        self, request: DecisionApprovalRequest, scenario: PlanningScenario
    ) -> DecisionRecord:
        """Validate and record an approval or rejection decision."""
        # 1. Evaluate strategies to inspect actual target option
        evaluated = evaluate_all_decisions(scenario)
        target_option = next(
            (opt for opt in evaluated.options if opt.strategy_id == request.strategy_id), None
        )

        # 2. Reject unknown strategy IDs
        if target_option is None:
            valid_ids = ", ".join([opt.strategy_id for opt in evaluated.options])
            raise ValueError(
                f"Unknown strategy ID '{request.strategy_id}'. Valid strategy IDs are: {valid_ids}."
            )

        # 3. Prevent approval of infeasible strategies
        if request.action == DecisionApprovalAction.APPROVE and not target_option.is_feasible:
            raise ValueError(
                f"Cannot approve infeasible strategy '{request.strategy_id}'. "
                f"Operationally infeasible strategies cannot be approved for execution."
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        new_status = (
            DecisionApprovalStatus.APPROVED
            if request.action == DecisionApprovalAction.APPROVE
            else DecisionApprovalStatus.REJECTED
        )

        # 4. Apply documented repeated action & transition policy
        if self._current_decision is not None:
            same_strategy = self._current_decision.selected_strategy_id == request.strategy_id
            same_status = self._current_decision.status == new_status

            if same_strategy and same_status:
                # Same strategy & action: refresh note and decision timestamp without incrementing version
                version = self._current_decision.version
                created_at = self._current_decision.created_at
                policy_notes = (
                    f"Refreshed active decision record for '{request.strategy_id}' with status "
                    f"'{new_status.value}'. Audit version retained at v{version}."
                )
            else:
                # Transition or change in strategy/status: increment audit version
                version = self._current_decision.version + 1
                created_at = self._current_decision.created_at
                policy_notes = (
                    f"Transitioned decision state from '{self._current_decision.status.value}' "
                    f"({self._current_decision.selected_strategy_id}) to '{new_status.value}' "
                    f"({request.strategy_id}) at audit version v{version}."
                )
        else:
            # First decision record
            version = 1
            created_at = now_iso
            policy_notes = (
                f"Initial decision record created with status '{new_status.value}' "
                f"for strategy '{request.strategy_id}' at audit version v1."
            )

        decision_record = DecisionRecord(
            decision_id=f"DEC-{uuid4().hex[:8].upper()}",
            scenario_id=scenario.scenario_id,
            selected_strategy_id=target_option.strategy_id,
            strategy_name=target_option.name,
            status=new_status,
            is_feasible=target_option.is_feasible,
            reviewer_note=request.reviewer_note,
            created_at=created_at,
            decided_at=now_iso,
            version=version,
            policy_notes=policy_notes,
        )

        self._current_decision = decision_record
        return decision_record

    def reset(self) -> None:
        """Reset in-memory decision store for testing."""
        self._current_decision = None


# Global singleton instance for in-memory MVP lifecycle
approval_store = DecisionApprovalStore()
