"""Tests for manufacturing Pydantic domain models and validation rules."""

import unittest
from datetime import date
from pydantic import ValidationError

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


class TestInventoryModels(unittest.TestCase):
    def test_valid_inventory_and_usable_quantity(self):
        item = ComponentInventory(
            component_id="COMP-001",
            name="Test Component",
            quantity_on_hand=100,
            reserved_quantity=30,
            unit_cost=12.50,
        )
        self.assertEqual(item.usable_quantity, 70)
        self.assertEqual(item.quantity_on_hand, 100)
        self.assertEqual(item.reserved_quantity, 30)

    def test_negative_quantity_rejected(self):
        with self.assertRaises(ValidationError):
            ComponentInventory(
                component_id="COMP-001",
                name="Test Component",
                quantity_on_hand=-5,
                reserved_quantity=0,
                unit_cost=10.0,
            )

    def test_negative_unit_cost_rejected(self):
        with self.assertRaises(ValidationError):
            ComponentInventory(
                component_id="COMP-001",
                name="Test Component",
                quantity_on_hand=50,
                reserved_quantity=10,
                unit_cost=-1.0,
            )

    def test_reserved_exceeding_stock_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            ComponentInventory(
                component_id="COMP-001",
                name="Test Component",
                quantity_on_hand=50,
                reserved_quantity=60,
                unit_cost=10.0,
            )
        self.assertIn("Reserved quantity (60) cannot exceed quantity on hand (50)", str(ctx.exception))


class TestProductionModels(unittest.TestCase):
    def test_valid_production_order(self):
        order = ProductionOrder(
            order_id="ORD-001",
            customer_name="Acme Corp",
            product_id="PROD-01",
            quantity=50,
            priority=OrderPriority.HIGH,
            created_date=date(2026, 10, 1),
            scheduled_date=date(2026, 10, 14),
            due_date=date(2026, 10, 15),
        )
        self.assertEqual(order.quantity, 50)
        self.assertEqual(order.priority, OrderPriority.HIGH)

    def test_production_order_non_positive_quantity_rejected(self):
        with self.assertRaises(ValidationError):
            ProductionOrder(
                order_id="ORD-001",
                customer_name="Acme Corp",
                product_id="PROD-01",
                quantity=0,
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 14),
                due_date=date(2026, 10, 15),
            )

    def test_production_order_invalid_dates_rejected(self):
        # scheduled date after due date
        with self.assertRaises(ValidationError) as ctx:
            ProductionOrder(
                order_id="ORD-001",
                customer_name="Acme Corp",
                product_id="PROD-01",
                quantity=20,
                priority=OrderPriority.MEDIUM,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 20),
                due_date=date(2026, 10, 15),
            )
        self.assertIn("cannot exceed due date", str(ctx.exception))

    def test_assembly_line_capacity_exceeded_rejected(self):
        with self.assertRaises(ValidationError) as ctx:
            AssemblyLine(
                line_id="LINE-01",
                name="Main Line",
                daily_capacity=50,
                scheduled_production=[
                    DailyProductionSchedule(date=date(2026, 10, 14), planned_quantity=60)
                ],
            )
        self.assertIn("exceeds daily capacity", str(ctx.exception))


class TestSupplierAndSubstituteModels(unittest.TestCase):
    def test_supplier_expedited_lead_time_validation(self):
        # Expedited lead time cannot exceed standard lead time
        with self.assertRaises(ValidationError) as ctx:
            SupplierAvailability(
                supplier_id="SUPP-01",
                name="Supplier Alpha",
                component_id="COMP-001",
                available_quantity=100,
                standard_lead_time_days=5,
                expedited_lead_time_days=7,
                standard_unit_cost=20.0,
            )
        self.assertIn("cannot be greater than standard lead time", str(ctx.exception))

    def test_substitute_approval_flag_and_identity_validation(self):
        approved_sub = ComponentSubstitute(
            original_component_id="COMP-001",
            substitute_component_id="COMP-001-ALT",
            substitute_name="Alt Component",
            approval_status=ApprovalStatus.APPROVED,
            available_quantity=50,
            unit_cost=15.0,
            compatibility_notes="Qualified pin-compatible",
        )
        self.assertTrue(approved_sub.is_approved)

        pending_sub = ComponentSubstitute(
            original_component_id="COMP-001",
            substitute_component_id="COMP-002-ALT",
            substitute_name="Pending Alt",
            approval_status=ApprovalStatus.PENDING,
            available_quantity=50,
            unit_cost=12.0,
            compatibility_notes="Under lab testing",
        )
        self.assertFalse(pending_sub.is_approved)

        # Rejection when substitute is identical to original component ID
        with self.assertRaises(ValidationError) as ctx:
            ComponentSubstitute(
                original_component_id="COMP-001",
                substitute_component_id="COMP-001",
                substitute_name="Same Component",
                approval_status=ApprovalStatus.APPROVED,
                available_quantity=10,
                unit_cost=10.0,
                compatibility_notes="Invalid same ID",
            )
        self.assertIn("cannot be identical", str(ctx.exception))


class TestScenarioConstraints(unittest.TestCase):
    def _create_base_components(self):
        return [
            ComponentInventory(
                component_id="C-1",
                name="Comp 1",
                quantity_on_hand=100,
                reserved_quantity=20,
                unit_cost=5.0,
            )
        ]

    def _create_base_bom(self):
        return [
            BillOfMaterials(
                product_id="P-1",
                product_name="Product 1",
                items=[BOMItem(component_id="C-1", quantity_per_unit=1)],
            )
        ]

    def _create_base_line(self):
        return [
            AssemblyLine(
                line_id="L-1",
                name="Line 1",
                daily_capacity=50,
                scheduled_production=[
                    DailyProductionSchedule(date=date(2026, 10, 15), planned_quantity=20)
                ],
            )
        ]

    def _create_base_orders(self):
        return [
            ProductionOrder(
                order_id="O-1",
                customer_name="Cust",
                product_id="P-1",
                quantity=20,
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 18),
            )
        ]

    def test_single_assembly_line_enforced(self):
        lines = self._create_base_line()
        lines.append(
            AssemblyLine(line_id="L-2", name="Line 2", daily_capacity=30)
        )
        with self.assertRaises(ValidationError) as ctx:
            PlanningScenario(
                scenario_id="S-1",
                name="Two Lines Test",
                start_date=date(2026, 10, 12),
                end_date=date(2026, 10, 25),
                assembly_lines=lines,
                inventory=self._create_base_components(),
                boms=self._create_base_bom(),
                production_orders=self._create_base_orders(),
            )
        self.assertTrue(
            "at most 1 item" in str(ctx.exception)
            or "exactly one assembly line" in str(ctx.exception)
        )

    def test_two_week_horizon_enforced(self):
        # 7-day range instead of 14 days
        with self.assertRaises(ValidationError) as ctx:
            PlanningScenario(
                scenario_id="S-1",
                name="Short Horizon Test",
                start_date=date(2026, 10, 12),
                end_date=date(2026, 10, 18),
                assembly_lines=self._create_base_line(),
                inventory=self._create_base_components(),
                boms=self._create_base_bom(),
                production_orders=self._create_base_orders(),
            )
        self.assertIn("exactly two weeks", str(ctx.exception))

    def test_invalid_component_reference_in_bom_rejected(self):
        invalid_bom = [
            BillOfMaterials(
                product_id="P-1",
                product_name="Product 1",
                items=[BOMItem(component_id="UNKNOWN-COMP", quantity_per_unit=1)],
            )
        ]
        with self.assertRaises(ValidationError) as ctx:
            PlanningScenario(
                scenario_id="S-1",
                name="Invalid BOM Component Reference",
                start_date=date(2026, 10, 12),
                end_date=date(2026, 10, 25),
                assembly_lines=self._create_base_line(),
                inventory=self._create_base_components(),
                boms=invalid_bom,
                production_orders=self._create_base_orders(),
            )
        self.assertIn("references unknown component 'UNKNOWN-COMP'", str(ctx.exception))

    def test_invalid_product_reference_in_order_rejected(self):
        invalid_order = [
            ProductionOrder(
                order_id="O-1",
                customer_name="Cust",
                product_id="UNKNOWN-PROD",
                quantity=10,
                priority=OrderPriority.LOW,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 18),
            )
        ]
        with self.assertRaises(ValidationError) as ctx:
            PlanningScenario(
                scenario_id="S-1",
                name="Invalid Order Product Reference",
                start_date=date(2026, 10, 12),
                end_date=date(2026, 10, 25),
                assembly_lines=self._create_base_line(),
                inventory=self._create_base_components(),
                boms=self._create_base_bom(),
                production_orders=invalid_order,
            )
        self.assertIn("references unknown product 'UNKNOWN-PROD'", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
