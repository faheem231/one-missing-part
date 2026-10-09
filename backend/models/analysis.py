"""Data models for shortage analysis, inventory allocation, and production feasibility."""

from datetime import date as dt_date
from typing import Optional
from pydantic import BaseModel, Field

from backend.models.production import OrderPriority


class ComponentShortageDetail(BaseModel):
    """Detailed shortage breakdown for a specific component."""

    component_id: str = Field(..., description="Unique component ID")
    component_name: str = Field(..., description="Component name")
    quantity_on_hand: int = Field(..., ge=0, description="Total physical inventory in warehouse")
    reserved_quantity: int = Field(..., ge=0, description="Reserved or committed inventory")
    usable_stock: int = Field(..., ge=0, description="Usable stock (on_hand - reserved)")
    required_quantity: int = Field(..., ge=0, description="Total demand across the planning horizon")
    shortage_quantity: int = Field(..., ge=0, description="Deficit quantity (required - usable, min 0)")
    unit_cost: float = Field(..., ge=0.0, description="Unit cost in USD")
    shortage_cost: float = Field(..., ge=0.0, description="Financial value of the shortage deficit in USD")
    affected_order_ids: list[str] = Field(
        default_factory=list, description="Order IDs unable to be fulfilled due to this component"
    )


class OrderAllocationImpact(BaseModel):
    """Allocation result and shortage impact for an individual production order."""

    order_id: str = Field(..., description="Production order ID")
    customer_name: str = Field(..., description="Customer organization name")
    product_id: str = Field(..., description="Finished product ID")
    order_quantity: int = Field(..., gt=0, description="Total finished units requested")
    priority: OrderPriority = Field(..., description="Order priority classification")
    scheduled_date: dt_date = Field(..., description="Original scheduled production date")
    due_date: dt_date = Field(..., description="Contractual delivery due date")
    component_requirements: dict[str, int] = Field(
        ..., description="Total component quantities needed for this order"
    )
    allocated_quantity: int = Field(
        ..., ge=0, description="Finished units for which all required components are available"
    )
    unfulfilled_quantity: int = Field(
        ..., ge=0, description="Finished units that cannot be produced due to component deficit"
    )
    is_affected: bool = Field(
        ..., description="True if unfulfilled_quantity > 0, indicating shortage impact"
    )
    missing_components: list[str] = Field(
        default_factory=list, description="Components lacking sufficient stock for this order"
    )
    estimated_delay_days: Optional[int] = Field(
        default=None, description="Calculated delay in days if determinable, or None"
    )
    delay_status: str = Field(
        default="UNAVAILABLE",
        description="Status of delay calculation: 'EXACT', 'ESTIMATED', or 'UNAVAILABLE'",
    )
    explanation: str = Field(..., description="Clear explanation of the allocation outcome")


class FeasibleProduction(BaseModel):
    """Feasible production calculation distinguishing inventory vs capacity limits."""

    inventory_limited_units: int = Field(
        ..., ge=0, description="Maximum finished units assembleable with available usable inventory"
    )
    capacity_limited_units: int = Field(
        ..., ge=0, description="Maximum finished units producible within line capacity over the horizon"
    )
    feasible_units: int = Field(
        ..., ge=0, description="Final feasible units: min(inventory_limited, capacity_limited)"
    )
    bottleneck_component_id: Optional[str] = Field(
        default=None, description="Component ID that restricts inventory-limited production"
    )
    limiting_factor: str = Field(
        ..., description="Primary bottleneck: 'INVENTORY', 'CAPACITY', or 'NONE'"
    )
    explanation: str = Field(..., description="Summary of the feasibility constraint")


class DemandBreakdownItem(BaseModel):
    """Demand record linking scheduled date, customer order, and component requirements."""

    scheduled_date: dt_date = Field(..., description="Scheduled production run date")
    order_id: str = Field(..., description="Production order ID")
    product_id: str = Field(..., description="Target finished product ID")
    order_quantity: int = Field(..., gt=0, description="Order quantity")
    component_requirements: dict[str, int] = Field(
        ..., description="Component quantities demanded by this order"
    )


class ShortageAnalysisReport(BaseModel):
    """Comprehensive shortage analysis response for the planning horizon."""

    scenario_id: str = Field(..., description="Scenario identifier")
    scenario_name: str = Field(..., description="Scenario display name")
    analysis_date: dt_date = Field(..., description="Effective date when analysis was performed")
    has_shortage: bool = Field(..., description="True if any component has a positive shortage quantity")
    shortage_components: list[ComponentShortageDetail] = Field(
        default_factory=list, description="List of components experiencing inventory shortages"
    )
    demand_breakdown: list[DemandBreakdownItem] = Field(
        default_factory=list, description="Timeline breakdown of demand across orders"
    )
    feasible_production: FeasibleProduction = Field(
        ..., description="Feasible production limits considering inventory and capacity"
    )
    orders_impact: list[OrderAllocationImpact] = Field(
        ..., description="Allocation results and impact status for each customer order"
    )
    allocation_policy: str = Field(
        ..., description="Description of the deterministic order-allocation rules used"
    )
    assumptions_and_limitations: list[str] = Field(
        default_factory=list, description="Explicit modeling assumptions and data limitations"
    )
