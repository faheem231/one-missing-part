"""Unit tests for recommendation explanation generation and decision approval workflow."""

import pytest
from backend.data.sample_scenario import get_sample_scenario
from backend.models.decisions import (
    DecisionApprovalAction,
    DecisionApprovalRequest,
    DecisionApprovalStatus,
    ScoringWeights,
)
from backend.services.approval_service import DecisionApprovalStore, approval_store
from backend.services.explanation_service import generate_recommendation_explanation


@pytest.fixture(autouse=True)
def reset_store():
    """Ensure in-memory approval store is reset before and after every test."""
    approval_store.reset()
    yield
    approval_store.reset()


def test_recommendation_explanation_uses_real_engine_results():
    """Verify recommendation explanation accurately embeds decision engine outputs."""
    scenario = get_sample_scenario()
    weights = ScoringWeights(weight_delivery=0.5, weight_cost=0.3, weight_ops=0.2)

    explanation = generate_recommendation_explanation(scenario, weights)

    assert explanation.scenario_id == scenario.scenario_id
    assert explanation.recommended_strategy_id == "STRAT-EXPEDITED-SUPPLY"
    assert explanation.recommended_strategy_name == "Expedited Supplier Procurement"
    assert explanation.is_feasible is True
    assert explanation.supporting_metrics["feasible_production_units"] == 350
    assert explanation.supporting_metrics["fulfillment_rate_pct"] == 100.0
    assert explanation.supporting_metrics["incremental_cost_usd"] == 5625.0

    # Ensure lower ranked strategies are explained accurately
    lower_ids = [opt.strategy_id for opt in explanation.lower_ranked_strategies_comparison]
    assert "STRAT-PARTIAL-PROD" in lower_ids
    assert "STRAT-SUBSTITUTION" in lower_ids
    assert "STRAT-SCHEDULE-SWAP" in lower_ids

    # Check data limitations exist
    assert len(explanation.data_limitations) >= 3
    assert any("Supplier lead time" in limit for limit in explanation.data_limitations)


def test_approve_valid_feasible_strategy():
    """Verify a valid feasible strategy (e.g. STRAT-EXPEDITED-SUPPLY) can be approved."""
    scenario = get_sample_scenario()
    request = DecisionApprovalRequest(
        strategy_id="STRAT-EXPEDITED-SUPPLY",
        action=DecisionApprovalAction.APPROVE,
        reviewer_note="Approved due to 100% on-time order fulfillment.",
    )

    record = approval_store.record_decision(request, scenario)

    assert record.selected_strategy_id == "STRAT-EXPEDITED-SUPPLY"
    assert record.status == DecisionApprovalStatus.APPROVED
    assert record.is_feasible is True
    assert record.reviewer_note == "Approved due to 100% on-time order fulfillment."
    assert record.version == 1
    assert "Initial decision record created" in record.policy_notes


def test_reject_feasible_strategy():
    """Verify a feasible strategy can be rejected by a reviewer."""
    scenario = get_sample_scenario()
    request = DecisionApprovalRequest(
        strategy_id="STRAT-PARTIAL-PROD",
        action=DecisionApprovalAction.REJECT,
        reviewer_note="Rejected partial production due to customer SLA concerns.",
    )

    record = approval_store.record_decision(request, scenario)

    assert record.selected_strategy_id == "STRAT-PARTIAL-PROD"
    assert record.status == DecisionApprovalStatus.REJECTED
    assert record.is_feasible is True
    assert record.reviewer_note == "Rejected partial production due to customer SLA concerns."


def test_reject_unknown_strategy_id():
    """Verify attempting to act on an unknown strategy ID raises ValueError."""
    scenario = get_sample_scenario()
    request = DecisionApprovalRequest(
        strategy_id="STRAT-NONEXISTENT-999",
        action=DecisionApprovalAction.APPROVE,
    )

    with pytest.raises(ValueError) as exc_info:
        approval_store.record_decision(request, scenario)

    assert "Unknown strategy ID 'STRAT-NONEXISTENT-999'" in str(exc_info.value)


def test_cannot_approve_infeasible_strategy():
    """Verify attempting to approve an infeasible strategy (STRAT-SCHEDULE-SWAP) raises ValueError."""
    scenario = get_sample_scenario()
    request = DecisionApprovalRequest(
        strategy_id="STRAT-SCHEDULE-SWAP",
        action=DecisionApprovalAction.APPROVE,
        reviewer_note="Trying to approve schedule swap",
    )

    with pytest.raises(ValueError) as exc_info:
        approval_store.record_decision(request, scenario)

    assert "Cannot approve infeasible strategy 'STRAT-SCHEDULE-SWAP'" in str(exc_info.value)


def test_can_reject_infeasible_strategy():
    """Verify an infeasible strategy CAN be explicitly rejected by reviewer."""
    scenario = get_sample_scenario()
    request = DecisionApprovalRequest(
        strategy_id="STRAT-SCHEDULE-SWAP",
        action=DecisionApprovalAction.REJECT,
        reviewer_note="Confirming rejection of infeasible option.",
    )

    record = approval_store.record_decision(request, scenario)
    assert record.selected_strategy_id == "STRAT-SCHEDULE-SWAP"
    assert record.status == DecisionApprovalStatus.REJECTED
    assert record.is_feasible is False


def test_repeated_action_policy():
    """Verify state transition and repeated approval policy rules."""
    scenario = get_sample_scenario()

    # Step 1: Initial approval of STRAT-EXPEDITED-SUPPLY
    req1 = DecisionApprovalRequest(
        strategy_id="STRAT-EXPEDITED-SUPPLY",
        action=DecisionApprovalAction.APPROVE,
        reviewer_note="Initial approval",
    )
    rec1 = approval_store.record_decision(req1, scenario)
    assert rec1.version == 1
    assert rec1.status == DecisionApprovalStatus.APPROVED

    # Step 2: Repeat exact approval of same strategy -> retains version 1, updates timestamp/note
    req2 = DecisionApprovalRequest(
        strategy_id="STRAT-EXPEDITED-SUPPLY",
        action=DecisionApprovalAction.APPROVE,
        reviewer_note="Refreshed approval note",
    )
    rec2 = approval_store.record_decision(req2, scenario)
    assert rec2.version == 1
    assert rec2.reviewer_note == "Refreshed approval note"
    assert "Refreshed active decision record" in rec2.policy_notes

    # Step 3: Transition decision state to REJECT -> increments audit version to 2
    req3 = DecisionApprovalRequest(
        strategy_id="STRAT-EXPEDITED-SUPPLY",
        action=DecisionApprovalAction.REJECT,
        reviewer_note="Revoking approval due to budget cap",
    )
    rec3 = approval_store.record_decision(req3, scenario)
    assert rec3.version == 2
    assert rec3.status == DecisionApprovalStatus.REJECTED
    assert "Transitioned decision state from 'approved'" in rec3.policy_notes
