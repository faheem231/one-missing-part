"""Deterministic manufacturing shortage-analysis calculation engine."""

from datetime import date as dt_date
from typing import Optional

from backend.models.analysis import (
    ComponentShortageDetail,
    DemandBreakdownItem,
    FeasibleProduction,
    OrderAllocationImpact,
    ShortageAnalysisReport,
)
from backend.models.inventory import ComponentInventory
from backend.models.production import OrderPriority, ProductionOrder
from backend.models.scenario import PlanningScenario

# Numerical priority ranking for deterministic sorting: lowest numerical value = highest priority
PRIORITY_RANKS: dict[OrderPriority, int] = {
    OrderPriority.CRITICAL: 1,
    OrderPriority.HIGH: 2,
    OrderPriority.MEDIUM: 3,
    OrderPriority.LOW: 4,
}


def calculate_usable_stock(item: ComponentInventory) -> int:
    """Calculate immediately available inventory excluding reserved stock.
    
    Formula: usable_stock = max(0, quantity_on_hand - reserved_quantity)
    """
    if item.reserved_quantity > item.quantity_on_hand:
        raise ValueError(
            f"Component {item.component_id}: Reserved quantity ({item.reserved_quantity}) "
            f"cannot exceed stock on hand ({item.quantity_on_hand})"
        )
    return max(0, item.quantity_on_hand - item.reserved_quantity)


def calculate_component_demand(scenario: PlanningScenario) -> dict[str, int]:
    """Calculate aggregated demand across all production orders for each component.
    
    Formula: component_demand = sum(order_quantity * bom_quantity_per_unit)
    """
    bom_map = {b.product_id: b for b in scenario.boms}
    component_ids = {c.component_id for c in scenario.inventory}
    demand_map: dict[str, int] = {c.component_id: 0 for c in scenario.inventory}

    for order in scenario.production_orders:
        if order.product_id not in bom_map:
            raise ValueError(
                f"Production order {order.order_id} references unknown product '{order.product_id}'"
            )
        bom = bom_map[order.product_id]
        for item in bom.items:
            if item.component_id not in component_ids:
                raise ValueError(
                    f"BOM for product {order.product_id} references unknown component '{item.component_id}'"
                )
            demand_map[item.component_id] += item.quantity_per_unit * order.quantity

    return demand_map


def calculate_component_demand_by_date(
    scenario: PlanningScenario,
) -> dict[dt_date, dict[str, int]]:
    """Calculate component demand aggregated by scheduled production date."""
    bom_map = {b.product_id: b for b in scenario.boms}
    date_demand: dict[dt_date, dict[str, int]] = {}

    for order in scenario.production_orders:
        bom = bom_map[order.product_id]
        if order.scheduled_date not in date_demand:
            date_demand[order.scheduled_date] = {}

        for item in bom.items:
            current = date_demand[order.scheduled_date].get(item.component_id, 0)
            date_demand[order.scheduled_date][item.component_id] = (
                current + item.quantity_per_unit * order.quantity
            )

    return date_demand


def calculate_component_shortages(
    scenario: PlanningScenario,
    affected_order_map: Optional[dict[str, list[str]]] = None,
) -> list[ComponentShortageDetail]:
    """Calculate the shortage for each component in the scenario inventory.
    
    Formula: shortage_quantity = max(0, required_quantity - usable_stock)
    """
    demand_map = calculate_component_demand(scenario)
    shortages: list[ComponentShortageDetail] = []
    affected_map = affected_order_map or {}

    for item in scenario.inventory:
        usable = calculate_usable_stock(item)
        required = demand_map.get(item.component_id, 0)
        shortage = max(0, required - usable)
        shortage_cost = round(shortage * item.unit_cost, 2)
        affected_orders = affected_map.get(item.component_id, [])

        shortages.append(
            ComponentShortageDetail(
                component_id=item.component_id,
                component_name=item.name,
                quantity_on_hand=item.quantity_on_hand,
                reserved_quantity=item.reserved_quantity,
                usable_stock=usable,
                required_quantity=required,
                shortage_quantity=shortage,
                unit_cost=item.unit_cost,
                shortage_cost=shortage_cost,
                affected_order_ids=affected_orders,
            )
        )

    return shortages


def order_sort_key(order: ProductionOrder) -> tuple:
    """Deterministic sort key for order allocation.
    
    Policy:
      1. Priority level (CRITICAL -> HIGH -> MEDIUM -> LOW)
      2. Earlier due date
      3. Earlier scheduled production date
      4. Earlier creation date
      5. Order ID (tie-breaker)
    """
    return (
        PRIORITY_RANKS.get(order.priority, 99),
        order.due_date,
        order.scheduled_date,
        order.created_date,
        order.order_id,
    )


def allocate_orders(
    scenario: PlanningScenario,
) -> tuple[list[OrderAllocationImpact], dict[str, list[str]]]:
    """Allocate available inventory to production orders according to deterministic policy.
    
    Returns:
      - List of OrderAllocationImpact records
      - Map of component_id -> list of affected order_ids
    """
    bom_map = {b.product_id: b for b in scenario.boms}
    remaining_stock: dict[str, int] = {
        item.component_id: calculate_usable_stock(item) for item in scenario.inventory
    }

    # Sort orders deterministically
    sorted_orders = sorted(scenario.production_orders, key=order_sort_key)
    allocation_impacts: list[OrderAllocationImpact] = []
    affected_by_component: dict[str, list[str]] = {
        item.component_id: [] for item in scenario.inventory
    }

    for order in sorted_orders:
        bom = bom_map[order.product_id]
        comp_reqs: dict[str, int] = {}
        max_possible_units = order.quantity

        for item in bom.items:
            needed = item.quantity_per_unit * order.quantity
            comp_reqs[item.component_id] = needed
            available_comp = remaining_stock.get(item.component_id, 0)
            units_supported = available_comp // item.quantity_per_unit
            if units_supported < max_possible_units:
                max_possible_units = units_supported

        # Allocate feasible finished units
        allocated = max(0, max_possible_units)
        unfulfilled = order.quantity - allocated
        is_affected = unfulfilled > 0

        missing_comps: list[str] = []
        for item in bom.items:
            if remaining_stock.get(item.component_id, 0) < comp_reqs[item.component_id]:
                missing_comps.append(item.component_id)
                if is_affected and order.order_id not in affected_by_component[item.component_id]:
                    affected_by_component[item.component_id].append(order.order_id)

            # Deduct allocated component quantities
            remaining_stock[item.component_id] -= allocated * item.quantity_per_unit

        # Formulate explanation and delay status
        if not is_affected:
            delay_status = "ON_SCHEDULE"
            estimated_delay = 0
            explanation = (
                f"Fully fulfilled ({allocated}/{order.quantity} units) from usable stock "
                f"under {order.priority.value} priority allocation."
            )
        else:
            delay_status = "UNAVAILABLE"
            estimated_delay = None
            if allocated == 0:
                explanation = (
                    f"Completely stalled (0/{order.quantity} units). Stock depleted for "
                    f"critical component(s): {', '.join(missing_comps)}. Requires replenishment."
                )
            else:
                explanation = (
                    f"Partially fulfilled ({allocated}/{order.quantity} units). Remaining {unfulfilled} "
                    f"units blocked by deficit in: {', '.join(missing_comps)}. Requires replenishment."
                )

        allocation_impacts.append(
            OrderAllocationImpact(
                order_id=order.order_id,
                customer_name=order.customer_name,
                product_id=order.product_id,
                order_quantity=order.quantity,
                priority=order.priority,
                scheduled_date=order.scheduled_date,
                due_date=order.due_date,
                component_requirements=comp_reqs,
                allocated_quantity=allocated,
                unfulfilled_quantity=unfulfilled,
                is_affected=is_affected,
                missing_components=missing_comps,
                estimated_delay_days=estimated_delay,
                delay_status=delay_status,
                explanation=explanation,
            )
        )

    return allocation_impacts, affected_by_component


def calculate_feasible_production(scenario: PlanningScenario) -> FeasibleProduction:
    """Calculate finished units producible considering all mandatory BOM components and line capacity.
    
    Distinguishes inventory-limited bottlenecks from capacity-limited throughput.
    """
    bom_map = {b.product_id: b for b in scenario.boms}
    usable_stock = {
        item.component_id: calculate_usable_stock(item) for item in scenario.inventory
    }

    # 1. Inventory-limited calculation (for primary product in scenario)
    primary_bom = scenario.boms[0]
    component_limits: dict[str, int] = {}
    for item in primary_bom.items:
        available = usable_stock.get(item.component_id, 0)
        component_limits[item.component_id] = available // item.quantity_per_unit

    bottleneck_component_id = min(component_limits, key=component_limits.get)
    inventory_limited_units = component_limits[bottleneck_component_id]

    # 2. Capacity-limited calculation
    line = scenario.assembly_lines[0]
    scheduled_capacity = sum(s.planned_quantity for s in line.scheduled_production)
    # Feasible capacity represents the scheduled capacity envelope
    capacity_limited_units = (
        scheduled_capacity if scheduled_capacity > 0 else line.daily_capacity * scenario.horizon_days
    )

    # 3. Overall feasible units
    feasible_units = min(inventory_limited_units, capacity_limited_units)

    if inventory_limited_units < capacity_limited_units:
        limiting_factor = "INVENTORY"
        explanation = (
            f"Production is constrained to {feasible_units} units by inventory deficit in "
            f"'{bottleneck_component_id}'. Line capacity ({capacity_limited_units} units) has surplus."
        )
    elif capacity_limited_units < inventory_limited_units:
        limiting_factor = "CAPACITY"
        explanation = (
            f"Production is constrained to {feasible_units} units by assembly line capacity, "
            f"despite inventory supporting {inventory_limited_units} units."
        )
    else:
        limiting_factor = "BALANCED"
        explanation = (
            f"Inventory and scheduled line capacity are balanced at {feasible_units} units."
        )

    return FeasibleProduction(
        inventory_limited_units=inventory_limited_units,
        capacity_limited_units=capacity_limited_units,
        feasible_units=feasible_units,
        bottleneck_component_id=bottleneck_component_id,
        limiting_factor=limiting_factor,
        explanation=explanation,
    )


def analyze_scenario_shortage(
    scenario: PlanningScenario,
    analysis_date: Optional[dt_date] = None,
) -> ShortageAnalysisReport:
    """Coordinate full deterministic shortage analysis for the manufacturing planning scenario."""
    effective_date = analysis_date or scenario.start_date

    # 1. Allocate orders and map affected orders
    orders_impact, affected_map = allocate_orders(scenario)

    # 2. Calculate component shortages
    all_shortages = calculate_component_shortages(scenario, affected_map)
    shortage_components = [s for s in all_shortages if s.shortage_quantity > 0]
    has_shortage = len(shortage_components) > 0

    # 3. Build demand breakdown
    bom_map = {b.product_id: b for b in scenario.boms}
    demand_breakdown: list[DemandBreakdownItem] = []
    for order in sorted(scenario.production_orders, key=lambda o: (o.scheduled_date, o.order_id)):
        bom = bom_map[order.product_id]
        comp_reqs = {
            item.component_id: item.quantity_per_unit * order.quantity for item in bom.items
        }
        demand_breakdown.append(
            DemandBreakdownItem(
                scheduled_date=order.scheduled_date,
                order_id=order.order_id,
                product_id=order.product_id,
                order_quantity=order.quantity,
                component_requirements=comp_reqs,
            )
        )

    # 4. Feasible production
    feasible = calculate_feasible_production(scenario)

    allocation_policy = (
        "Deterministic prioritization: 1) Order priority (CRITICAL > HIGH > MEDIUM > LOW), "
        "2) Due date ascending, 3) Scheduled production date ascending, "
        "4) Creation date ascending, 5) Order ID ascending. Orders are allocated discrete "
        "finished goods if all mandatory BOM components are simultaneously available."
    )

    assumptions_and_limitations = [
        "Usable stock is evaluated strictly as quantity_on_hand minus reserved_quantity at horizon start.",
        "Reserved stock is sequestered for historical commitments and cannot be reallocated.",
        "Assembly operations are limited to exactly one production line with defined daily throughput limits.",
        "Estimated delivery delays for affected orders are labelled UNAVAILABLE until procurement or substitute strategies are committed.",
        "Component demand is strictly derived from single-level BOM definitions with no scrap rate or rework inflation.",
    ]

    return ShortageAnalysisReport(
        scenario_id=scenario.scenario_id,
        scenario_name=scenario.name,
        analysis_date=effective_date,
        has_shortage=has_shortage,
        shortage_components=shortage_components,
        demand_breakdown=demand_breakdown,
        feasible_production=feasible,
        orders_impact=orders_impact,
        allocation_policy=allocation_policy,
        assumptions_and_limitations=assumptions_and_limitations,
    )
