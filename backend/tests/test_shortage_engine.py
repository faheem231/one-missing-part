"""Tests for the shortage analysis engine, allocation policies, and feasibility logic."""

import unittest
from datetime import date
from pydantic import ValidationError

from backend.data.sample_scenario import get_sample_scenario
from backend.models.bom import BillOfMaterials, BOMItem
from backend.models.inventory import ComponentInventory
from backend.models.production import (
    AssemblyLine,
    DailyProductionSchedule,
    OrderPriority,
    ProductionOrder,
)
from backend.models.scenario import PlanningScenario
from backend.services.shortage_engine import (
    analyze_scenario_shortage,
    calculate_component_demand,
    calculate_component_shortages,
    calculate_feasible_production,
    calculate_usable_stock,
)


class TestShortageEngine(unittest.TestCase):
    def _create_minimal_scenario(
        self,
        inventory: list[ComponentInventory],
        bom_items: list[BOMItem],
        orders: list[ProductionOrder],
        line_capacity: int = 100,
        scheduled_quantities: list[int] = None,
    ) -> PlanningScenario:
        scheduled_quantities = scheduled_quantities or [sum(o.quantity for o in orders)]
        return PlanningScenario(
            scenario_id="TEST-SCENARIO",
            name="Test Scenario",
            start_date=date(2026, 10, 12),
            end_date=date(2026, 10, 25),
            assembly_lines=[
                AssemblyLine(
                    line_id="L1",
                    name="Test Line",
                    daily_capacity=line_capacity,
                    scheduled_production=[
                        DailyProductionSchedule(
                            date=date(2026, 10, 15),
                            planned_quantity=q,
                        )
                        for q in scheduled_quantities
                    ],
                )
            ],
            inventory=inventory,
            boms=[
                BillOfMaterials(
                    product_id="PROD-1",
                    product_name="Product 1",
                    items=bom_items,
                )
            ],
            production_orders=orders,
        )

    def test_1_no_shortage_when_stock_covers_demand(self):
        """1. No shortage when usable stock covers demand."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=200,
                reserved_quantity=50,  # usable = 150
                unit_cost=10.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=1)]
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust 1",
                product_id="PROD-1",
                quantity=100,  # demand = 100 <= 150
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 16),
            )
        ]
        scenario = self._create_minimal_scenario(inv, boms, orders)
        report = analyze_scenario_shortage(scenario)

        self.assertFalse(report.has_shortage)
        self.assertEqual(len(report.shortage_components), 0)
        self.assertEqual(report.orders_impact[0].allocated_quantity, 100)
        self.assertEqual(report.orders_impact[0].unfulfilled_quantity, 0)
        self.assertFalse(report.orders_impact[0].is_affected)

    def test_2_partial_shortage(self):
        """2. Partial shortage where available stock covers part of demand."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=100,
                reserved_quantity=20,  # usable = 80
                unit_cost=5.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=1)]
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust 1",
                product_id="PROD-1",
                quantity=150,  # demand = 150 > usable 80
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 16),
            )
        ]
        scenario = self._create_minimal_scenario(inv, boms, orders, line_capacity=150)
        report = analyze_scenario_shortage(scenario)

        self.assertTrue(report.has_shortage)
        self.assertEqual(len(report.shortage_components), 1)
        self.assertEqual(report.shortage_components[0].shortage_quantity, 70)
        self.assertEqual(report.shortage_components[0].shortage_cost, 350.0)
        self.assertEqual(report.orders_impact[0].allocated_quantity, 80)
        self.assertEqual(report.orders_impact[0].unfulfilled_quantity, 70)
        self.assertTrue(report.orders_impact[0].is_affected)

    def test_3_complete_shortage(self):
        """3. Complete shortage where usable stock is zero."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=50,
                reserved_quantity=50,  # usable = 0
                unit_cost=8.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=1)]
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust 1",
                product_id="PROD-1",
                quantity=50,
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 16),
            )
        ]
        scenario = self._create_minimal_scenario(inv, boms, orders)
        report = analyze_scenario_shortage(scenario)

        self.assertTrue(report.has_shortage)
        self.assertEqual(report.shortage_components[0].usable_stock, 0)
        self.assertEqual(report.shortage_components[0].shortage_quantity, 50)
        self.assertEqual(report.orders_impact[0].allocated_quantity, 0)
        self.assertEqual(report.orders_impact[0].unfulfilled_quantity, 50)
        self.assertTrue(report.orders_impact[0].is_affected)

    def test_4_reserved_inventory_reducing_usable_stock(self):
        """4. Reserved inventory reduces usable stock and is not counted as available."""
        inv_item = ComponentInventory(
            component_id="C1",
            name="Comp 1",
            quantity_on_hand=150,
            reserved_quantity=100,
            unit_cost=10.0,
        )
        usable = calculate_usable_stock(inv_item)
        self.assertEqual(usable, 50)

    def test_5_multiple_orders_sharing_a_component(self):
        """5. Multiple orders sharing a component without double-counting."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=120,
                reserved_quantity=0,  # usable = 120
                unit_cost=10.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=2)]  # 2 per unit
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust A",
                product_id="PROD-1",
                quantity=30,  # needs 60
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 14),
                due_date=date(2026, 10, 15),
            ),
            ProductionOrder(
                order_id="O2",
                customer_name="Cust B",
                product_id="PROD-1",
                quantity=40,  # needs 80 (total needed = 140)
                priority=OrderPriority.MEDIUM,
                created_date=date(2026, 10, 2),
                scheduled_date=date(2026, 10, 16),
                due_date=date(2026, 10, 17),
            ),
        ]
        scenario = self._create_minimal_scenario(inv, boms, orders, scheduled_quantities=[70])
        demand = calculate_component_demand(scenario)
        self.assertEqual(demand["C1"], 140)

        report = analyze_scenario_shortage(scenario)
        self.assertEqual(report.shortage_components[0].shortage_quantity, 20)
        # O1 gets 30 units (consuming 60 components, leaving 60)
        self.assertEqual(report.orders_impact[0].allocated_quantity, 30)
        self.assertFalse(report.orders_impact[0].is_affected)
        # O2 gets 30 units (consuming remaining 60 components, 10 units short)
        self.assertEqual(report.orders_impact[1].allocated_quantity, 30)
        self.assertEqual(report.orders_impact[1].unfulfilled_quantity, 10)
        self.assertTrue(report.orders_impact[1].is_affected)

    def test_6_deterministic_allocation_by_priority_and_due_date(self):
        """6. Deterministic allocation strictly prioritizes CRITICAL > HIGH > earlier due date."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=50,
                reserved_quantity=0,
                unit_cost=10.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=1)]
        # Order A: LOW priority, earlier due date
        # Order B: CRITICAL priority, later due date
        orders = [
            ProductionOrder(
                order_id="ORD-LOW",
                customer_name="Cust Low",
                product_id="PROD-1",
                quantity=50,
                priority=OrderPriority.LOW,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 13),
                due_date=date(2026, 10, 14),
            ),
            ProductionOrder(
                order_id="ORD-CRIT",
                customer_name="Cust Crit",
                product_id="PROD-1",
                quantity=50,
                priority=OrderPriority.CRITICAL,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 18),
                due_date=date(2026, 10, 20),
            ),
        ]
        scenario = self._create_minimal_scenario(inv, boms, orders, scheduled_quantities=[100])
        report = analyze_scenario_shortage(scenario)

        # First evaluated order should be ORD-CRIT despite later due date
        self.assertEqual(report.orders_impact[0].order_id, "ORD-CRIT")
        self.assertEqual(report.orders_impact[0].allocated_quantity, 50)
        self.assertFalse(report.orders_impact[0].is_affected)

        # ORD-LOW gets remaining 0 stock
        self.assertEqual(report.orders_impact[1].order_id, "ORD-LOW")
        self.assertEqual(report.orders_impact[1].allocated_quantity, 0)
        self.assertTrue(report.orders_impact[1].is_affected)

    def test_7_affected_order_identification(self):
        """7. Affected-order identification in the baseline sample scenario."""
        sample = get_sample_scenario()
        report = analyze_scenario_shortage(sample)

        # 1. Shortage component details and cost
        self.assertTrue(report.has_shortage)
        self.assertEqual(len(report.shortage_components), 1)
        mcu = report.shortage_components[0]
        self.assertEqual(mcu.component_id, "COMP-MCU-01")
        self.assertEqual(mcu.usable_stock, 100)
        self.assertEqual(mcu.required_quantity, 350)
        self.assertEqual(mcu.shortage_quantity, 250)
        self.assertEqual(mcu.shortage_cost, 10625.0)  # 250 * 42.50
        self.assertEqual(mcu.affected_order_ids, ["ORD-2026-002", "ORD-2026-003"])

        # 2. Feasible production verification (all mandatory components available)
        self.assertEqual(report.feasible_production.feasible_units, 100)
        self.assertEqual(report.feasible_production.inventory_limited_units, 100)
        self.assertEqual(report.feasible_production.capacity_limited_units, 350)
        self.assertEqual(report.feasible_production.bottleneck_component_id, "COMP-MCU-01")
        # Verify that for every unit reported feasible, each BOM component has sufficient usable inventory
        bom = sample.boms[0]
        inv_map = {i.component_id: i.usable_quantity for i in sample.inventory}
        for item in bom.items:
            self.assertGreaterEqual(
                inv_map[item.component_id],
                report.feasible_production.feasible_units * item.quantity_per_unit,
                f"Component {item.component_id} lacks inventory for feasible units",
            )

        # 3. Order allocation and delay statuses
        # ORD-2026-001 (CRITICAL) is fulfilled
        ord1 = report.orders_impact[0]
        self.assertEqual(ord1.order_id, "ORD-2026-001")
        self.assertEqual(ord1.allocated_quantity, 100)
        self.assertEqual(ord1.unfulfilled_quantity, 0)
        self.assertFalse(ord1.is_affected)
        self.assertEqual(ord1.delay_status, "ON_SCHEDULE")
        self.assertEqual(ord1.estimated_delay_days, 0)

        # ORD-2026-002 (HIGH) is affected
        ord2 = report.orders_impact[1]
        self.assertEqual(ord2.order_id, "ORD-2026-002")
        self.assertEqual(ord2.allocated_quantity, 0)
        self.assertEqual(ord2.unfulfilled_quantity, 150)
        self.assertTrue(ord2.is_affected)
        self.assertIn("COMP-MCU-01", ord2.missing_components)
        self.assertEqual(ord2.delay_status, "UNAVAILABLE")
        self.assertIsNone(ord2.estimated_delay_days)

        # ORD-2026-003 (MEDIUM) is affected
        ord3 = report.orders_impact[2]
        self.assertEqual(ord3.order_id, "ORD-2026-003")
        self.assertEqual(ord3.allocated_quantity, 0)
        self.assertEqual(ord3.unfulfilled_quantity, 100)
        self.assertTrue(ord3.is_affected)
        self.assertIn("COMP-MCU-01", ord3.missing_components)
        self.assertEqual(ord3.delay_status, "UNAVAILABLE")
        self.assertIsNone(ord3.estimated_delay_days)

    def test_8_production_limited_by_another_mandatory_component(self):
        """8. Production limited by another mandatory component in the BOM."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=1000,
                reserved_quantity=0,
                unit_cost=10.0,
            ),
            ComponentInventory(
                component_id="C2",
                name="Comp 2",
                quantity_on_hand=30,  # Bottleneck!
                reserved_quantity=0,
                unit_cost=5.0,
            ),
        ]
        boms = [
            BOMItem(component_id="C1", quantity_per_unit=1),
            BOMItem(component_id="C2", quantity_per_unit=1),
        ]
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust 1",
                product_id="PROD-1",
                quantity=100,
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 16),
            )
        ]
        scenario = self._create_minimal_scenario(inv, boms, orders)
        feasible = calculate_feasible_production(scenario)

        self.assertEqual(feasible.feasible_units, 30)
        self.assertEqual(feasible.bottleneck_component_id, "C2")
        self.assertEqual(feasible.limiting_factor, "INVENTORY")

    def test_9_production_capacity_constraints(self):
        """9. Assembly line capacity constraints limiting production."""
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=500,  # Ample stock
                reserved_quantity=0,
                unit_cost=10.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=1)]
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust 1",
                product_id="PROD-1",
                quantity=50,
                priority=OrderPriority.HIGH,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 16),
            )
        ]
        # Line scheduled capacity is only 50 units
        scenario = self._create_minimal_scenario(
            inv, boms, orders, line_capacity=50, scheduled_quantities=[50]
        )
        feasible = calculate_feasible_production(scenario)

        self.assertEqual(feasible.capacity_limited_units, 50)
        self.assertEqual(feasible.inventory_limited_units, 500)
        self.assertEqual(feasible.feasible_units, 50)
        self.assertEqual(feasible.limiting_factor, "CAPACITY")

    def test_10_invalid_or_inconsistent_scenario_data(self):
        """10. Detection of invalid or inconsistent scenario data."""
        # 1. Reserved quantity exceeding stock on hand
        with self.assertRaises(ValidationError):
            ComponentInventory(
                component_id="C1",
                name="Bad Inv",
                quantity_on_hand=10,
                reserved_quantity=20,
                unit_cost=5.0,
            )

        # 2. Demand calculation with missing product reference
        inv = [
            ComponentInventory(
                component_id="C1",
                name="Comp 1",
                quantity_on_hand=100,
                reserved_quantity=0,
                unit_cost=10.0,
            )
        ]
        boms = [BOMItem(component_id="C1", quantity_per_unit=1)]
        orders = [
            ProductionOrder(
                order_id="O1",
                customer_name="Cust",
                product_id="PROD-1",
                quantity=10,
                priority=OrderPriority.LOW,
                created_date=date(2026, 10, 1),
                scheduled_date=date(2026, 10, 15),
                due_date=date(2026, 10, 16),
            )
        ]
        valid_scenario = self._create_minimal_scenario(inv, boms, orders)
        # Modify order product to invalid product
        valid_scenario.production_orders[0].product_id = "UNKNOWN-PROD"
        with self.assertRaises(ValueError) as ctx:
            calculate_component_demand(valid_scenario)
        self.assertIn("unknown product", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
