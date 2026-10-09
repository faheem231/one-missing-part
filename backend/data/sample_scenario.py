"""Deterministic sample manufacturing scenario data."""

from datetime import date
from backend.models.inventory import ComponentInventory
from backend.models.bom import BillOfMaterials, BOMItem
from backend.models.production import (
    AssemblyLine,
    DailyProductionSchedule,
    OrderPriority,
    ProductionOrder,
)
from backend.models.supplier import SupplierAvailability
from backend.models.substitute import ApprovalStatus, ComponentSubstitute
from backend.models.scenario import PlanningScenario


def get_sample_scenario() -> PlanningScenario:
    """Generate the baseline deterministic two-week manufacturing scenario."""
    return PlanningScenario(
        scenario_id="SCENARIO-2026-W42",
        name="OptiController X-500 Production Plan (Weeks 42-43)",
        start_date=date(2026, 10, 12),
        end_date=date(2026, 10, 25),
        assembly_lines=[
            AssemblyLine(
                line_id="LINE-01",
                name="Main Surface Mount & Assembly Line Alpha",
                daily_capacity=50,
                operating_constraints=[
                    "Single 8-hour shift per working day",
                    "Maximum 50 finished units per calendar day",
                    "Requires 2-hour sanitation and tooling changeover between batch runs",
                ],
                scheduled_production=[
                    DailyProductionSchedule(date=date(2026, 10, 13), planned_quantity=50),
                    DailyProductionSchedule(date=date(2026, 10, 14), planned_quantity=50),
                    DailyProductionSchedule(date=date(2026, 10, 16), planned_quantity=50),
                    DailyProductionSchedule(date=date(2026, 10, 17), planned_quantity=50),
                    DailyProductionSchedule(date=date(2026, 10, 18), planned_quantity=50),
                    DailyProductionSchedule(date=date(2026, 10, 21), planned_quantity=50),
                    DailyProductionSchedule(date=date(2026, 10, 22), planned_quantity=50),
                ],
            )
        ],
        inventory=[
            ComponentInventory(
                component_id="COMP-MCU-01",
                name="STM32 32-bit Dual-Core Microcontroller",
                description="Primary system processing and control unit (CRITICAL COMPONENT)",
                quantity_on_hand=140,
                reserved_quantity=40,
                unit_cost=42.50,
            ),
            ComponentInventory(
                component_id="COMP-PWR-02",
                name="24V Power Regulation Module",
                description="High-efficiency step-down voltage regulation board",
                quantity_on_hand=500,
                reserved_quantity=50,
                unit_cost=18.00,
            ),
            ComponentInventory(
                component_id="COMP-ENCL-03",
                name="Precision Aluminum Chassis Enclosure",
                description="IP67-rated anodized extruded aluminum enclosure",
                quantity_on_hand=400,
                reserved_quantity=0,
                unit_cost=35.00,
            ),
            ComponentInventory(
                component_id="COMP-PCB-04",
                name="Main Motherboard PCB 8-Layer",
                description="Surface finish ENIG, high Tg multilayer PCB",
                quantity_on_hand=450,
                reserved_quantity=50,
                unit_cost=22.00,
            ),
        ],
        boms=[
            BillOfMaterials(
                product_id="PROD-X500",
                product_name="OptiController X-500 Industrial Edge Controller",
                items=[
                    BOMItem(component_id="COMP-MCU-01", quantity_per_unit=1),
                    BOMItem(component_id="COMP-PWR-02", quantity_per_unit=1),
                    BOMItem(component_id="COMP-ENCL-03", quantity_per_unit=1),
                    BOMItem(component_id="COMP-PCB-04", quantity_per_unit=1),
                ],
            )
        ],
        production_orders=[
            ProductionOrder(
                order_id="ORD-2026-001",
                customer_name="Apex Robotics Corp",
                product_id="PROD-X500",
                quantity=100,
                priority=OrderPriority.CRITICAL,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 14),
                due_date=date(2026, 10, 16),
            ),
            ProductionOrder(
                order_id="ORD-2026-002",
                customer_name="Global Dynamics Automation",
                product_id="PROD-X500",
                quantity=150,
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 3),
                scheduled_date=date(2026, 10, 18),
                due_date=date(2026, 10, 20),
            ),
            ProductionOrder(
                order_id="ORD-2026-003",
                customer_name="Nexus Energy Systems",
                product_id="PROD-X500",
                quantity=100,
                priority=OrderPriority.MEDIUM,
                created_date=date(2026, 10, 5),
                scheduled_date=date(2026, 10, 22),
                due_date=date(2026, 10, 24),
            ),
        ],
        supplier_options=[
            SupplierAvailability(
                supplier_id="SUPP-SILICO-01",
                name="SilicoTech Global Distribution Ltd",
                component_id="COMP-MCU-01",
                available_quantity=300,
                standard_lead_time_days=9,
                expedited_lead_time_days=4,
                standard_unit_cost=45.00,
                expedited_unit_cost=65.00,
                is_guaranteed=False,
            )
        ],
        substitutes=[
            ComponentSubstitute(
                original_component_id="COMP-MCU-01",
                substitute_component_id="SUB-MCU-01A",
                substitute_name="MicroChip Ultra-32 Automotive Grade MCU",
                approval_status=ApprovalStatus.APPROVED,
                available_quantity=80,
                unit_cost=52.00,
                compatibility_notes="Direct pin-to-pin compatible drop-in replacement; verified under ECO-2026-88.",
            ),
            ComponentSubstitute(
                original_component_id="COMP-MCU-01",
                substitute_component_id="SUB-MCU-01B",
                substitute_name="Texas Semi C2000 Equivalent",
                approval_status=ApprovalStatus.PENDING,
                available_quantity=200,
                unit_cost=38.50,
                compatibility_notes="Requires firmware modification and EMC testing qualification. Not yet approved.",
            ),
        ],
    )
