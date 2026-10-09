"""Backend calculation and domain services package."""

from backend.services.decision_engine import (
    evaluate_all_decisions,
    evaluate_expedited_supply,
    evaluate_partial_production,
    evaluate_schedule_swap,
    evaluate_substitution,
    score_and_rank_strategies,
)
from backend.services.approval_service import DecisionApprovalStore, approval_store
from backend.services.explanation_service import generate_recommendation_explanation
from backend.services.shortage_engine import (
    analyze_scenario_shortage,
    calculate_component_demand,
    calculate_component_shortages,
    calculate_feasible_production,
    calculate_usable_stock,
)

__all__ = [
    "analyze_scenario_shortage",
    "calculate_usable_stock",
    "calculate_component_demand",
    "calculate_component_shortages",
    "calculate_feasible_production",
    "evaluate_all_decisions",
    "evaluate_partial_production",
    "evaluate_schedule_swap",
    "evaluate_substitution",
    "evaluate_expedited_supply",
    "score_and_rank_strategies",
    "DecisionApprovalStore",
    "approval_store",
    "generate_recommendation_explanation",
]

