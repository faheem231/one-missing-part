"""Data models for manufacturing shortage decision strategies and ranking."""

from datetime import date as dt_date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

from backend.models.production import OrderPriority


class StrategyType(str, Enum):
    """Categorization of shortage mitigation approaches."""

    PARTIAL_PRODUCTION = "PARTIAL_PRODUCTION"
    SCHEDULE_SWAP = "SCHEDULE_SWAP"
    SUBSTITUTION = "SUBSTITUTION"
    EXPEDITED_SUPPLY = "EXPEDITED_SUPPLY"


class StrategyOrderImpact(BaseModel):
    """Order-level fulfillment and schedule outcome under a specific strategy."""

    order_id: str = Field(..., description="Order identifier")
    customer_name: str = Field(..., description="Customer name")
    product_id: str = Field(..., description="Finished product identifier")
    order_quantity: int = Field(..., description="Ordered finished goods units")
    priority: OrderPriority = Field(..., description="Order priority level")
    scheduled_date: dt_date = Field(..., description="Planned production date")
    due_date: dt_date = Field(..., description="Contractual delivery due date")
    allocated_quantity: int = Field(..., description="Units fulfilled under this strategy")
    unfulfilled_quantity: int = Field(..., description="Units remaining unfulfilled")
    is_fulfilled: bool = Field(..., description="True if allocated_quantity == order_quantity")
    estimated_completion_date: Optional[dt_date] = Field(
        default=None, description="Projected completion date under strategy, or None"
    )
    estimated_delay_days: Optional[int] = Field(
        default=None, description="Calculated delay beyond due date, or None if unavailable"
    )
    delay_status: str = Field(
        ..., description="Delay classification: 'ON_TIME', 'DELAYED', or 'UNAVAILABLE'"
    )
    explanation: str = Field(..., description="Order-specific outcome narrative")


class CustomerDeliveryImpact(BaseModel):
    """Aggregated delivery performance metrics under a strategy."""

    total_demand_units: int = Field(..., description="Total units demanded across horizon")
    fulfilled_units: int = Field(..., description="Units fulfilled by this strategy")
    unfulfilled_units: int = Field(..., description="Units unfulfilled by this strategy")
    fulfillment_rate_pct: float = Field(..., description="Percentage of total demand fulfilled")
    on_time_orders_count: int = Field(..., description="Count of orders fulfilled on or before due date")
    delayed_orders_count: int = Field(..., description="Count of orders completing past due date")
    unfulfilled_orders_count: int = Field(..., description="Count of orders with unfulfilled units")


class ScoringMetrics(BaseModel):
    """Detailed score components enabling explainable transparent ranking."""

    delivery_score: float = Field(..., ge=0.0, le=1.0, description="Normalized delivery score (0-1)")
    cost_score: float = Field(..., ge=0.0, le=1.0, description="Normalized cost score (0-1)")
    operational_score: float = Field(..., ge=0.0, le=1.0, description="Normalized operational feasibility score (0-1)")
    composite_score: float = Field(..., ge=0.0, le=1.0, description="Weighted composite score")


class ScoringWeights(BaseModel):
    """Configurable weights for decision ranking."""

    weight_delivery: float = Field(default=0.50, ge=0.0, le=1.0, description="Weight for customer delivery impact")
    weight_cost: float = Field(default=0.30, ge=0.0, le=1.0, description="Weight for incremental cost")
    weight_ops: float = Field(default=0.20, ge=0.0, le=1.0, description="Weight for operational feasibility")


class DecisionOption(BaseModel):
    """Evaluated decision strategy response option."""

    strategy_id: str = Field(..., description="Unique strategy code, e.g. STRAT-EXPEDITED-SUPPLY")
    name: str = Field(..., description="Human-readable strategy name")
    strategy_type: StrategyType = Field(..., description="Strategy classification")
    is_feasible: bool = Field(..., description="Whether the strategy is operationally feasible")
    feasibility_notes: str = Field(..., description="Detailed feasibility status explanation")
    feasible_production_units: int = Field(..., description="Total finished units producible")
    incremental_cost: float = Field(..., description="Additional cost in USD beyond baseline inventory")
    delivery_impact: CustomerDeliveryImpact = Field(..., description="Customer delivery performance metrics")
    orders_impact: list[StrategyOrderImpact] = Field(..., description="Impact on individual customer orders")
    risks: list[str] = Field(default_factory=list, description="Key operational and supply risks")
    assumptions: list[str] = Field(default_factory=list, description="Strategy-specific assumptions")
    scoring: ScoringMetrics = Field(..., description="Score breakdown for transparent ranking")
    rank: int = Field(..., ge=1, description="Ranking position (1 = recommended, infeasible ranked lowest)")
    is_recommended: bool = Field(default=False, description="True if this is the top-ranked feasible option")


class DecisionOptionsResponse(BaseModel):
    """Complete response payload for GET /api/decisions/options."""

    scenario_id: str = Field(..., description="Scenario identifier")
    analysis_date: dt_date = Field(..., description="Effective analysis date")
    weights_applied: ScoringWeights = Field(..., description="Weights used for ranking")
    options: list[DecisionOption] = Field(..., description="All evaluated strategies sorted by rank")
    recommended_option: Optional[DecisionOption] = Field(
        default=None, description="Top-ranked feasible strategy, or None if all are infeasible"
    )
    recommendation_summary: str = Field(..., description="Executive summary of the recommended strategy")
    tradeoff_analysis: str = Field(..., description="Comparative analysis of the tradeoffs between strategies")


class DecisionApprovalStatus(str, Enum):
    """Approval status for decision recommendation workflow."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DecisionApprovalAction(str, Enum):
    """Action taken in decision review."""

    APPROVE = "approve"
    REJECT = "reject"


class DecisionApprovalRequest(BaseModel):
    """Payload for POST /api/decisions/approve."""

    strategy_id: str = Field(..., description="Target strategy ID, e.g., STRAT-EXPEDITED-SUPPLY")
    action: DecisionApprovalAction = Field(..., description="Review action: 'approve' or 'reject'")
    reviewer_note: Optional[str] = Field(default=None, description="Optional note or rationale from reviewer")


class DecisionRecord(BaseModel):
    """Audit record of a decision approval action."""

    decision_id: str = Field(..., description="Unique decision audit record ID")
    scenario_id: str = Field(..., description="Scenario identifier")
    selected_strategy_id: str = Field(..., description="Selected strategy ID")
    strategy_name: str = Field(..., description="Human-readable strategy name")
    status: DecisionApprovalStatus = Field(..., description="Approval status: pending, approved, or rejected")
    is_feasible: bool = Field(..., description="Feasibility flag of the evaluated strategy")
    reviewer_note: Optional[str] = Field(default=None, description="Reviewer note")
    created_at: str = Field(..., description="ISO 8601 timestamp when decision record was created")
    decided_at: Optional[str] = Field(default=None, description="ISO 8601 timestamp when action was recorded")
    version: int = Field(default=1, ge=1, description="Audit iteration version number for repeated actions")
    policy_notes: str = Field(..., description="Documented policy applied to this decision transition")


class CurrentDecisionResponse(BaseModel):
    """Response payload for GET /api/decisions/current."""

    has_decision: bool = Field(..., description="True if an explicit decision has been recorded")
    status: DecisionApprovalStatus = Field(..., description="Current status: pending, approved, or rejected")
    decision: Optional[DecisionRecord] = Field(default=None, description="Active decision record if created, else None")
    message: str = Field(..., description="Summary status message")


class LowerRankedStrategyExplanation(BaseModel):
    """Explanation of why a candidate strategy ranked lower than the top recommendation."""

    strategy_id: str = Field(..., description="Strategy identifier")
    name: str = Field(..., description="Strategy name")
    rank: int = Field(..., description="Rank position")
    is_feasible: bool = Field(..., description="Whether the strategy is operationally feasible")
    score: float = Field(..., description="Composite score achieved")
    reasons: list[str] = Field(..., description="Specific factors explaining lower ranking")


class RecommendationExplanationResponse(BaseModel):
    """Structured explanation of the shortage decision recommendation."""

    scenario_id: str = Field(..., description="Scenario ID")
    recommended_strategy_id: str = Field(..., description="ID of top-ranked feasible strategy")
    recommended_strategy_name: str = Field(..., description="Name of top-ranked feasible strategy")
    is_feasible: bool = Field(..., description="Feasibility flag")
    selection_rationale: str = Field(..., description="Narrative explaining selection rationale")
    supporting_metrics: dict[str, float | int | str] = Field(..., description="Key metrics supporting selection")
    cost_and_delivery_impact: str = Field(..., description="Detailed narrative on cost and delivery performance")
    key_assumptions: list[str] = Field(..., description="Key operational assumptions")
    key_risks: list[str] = Field(..., description="Key operational and supply risks")
    lower_ranked_strategies_comparison: list[LowerRankedStrategyExplanation] = Field(
        ..., description="Comparative analysis of lower-ranked options"
    )
    data_limitations: list[str] = Field(
        ..., description="Data uncertainties and missing inputs impacting confidence"
    )

