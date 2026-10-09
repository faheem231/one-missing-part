"""Tests validating consistency and business constraints of the sample scenario."""

import unittest
from backend.data.sample_scenario import get_sample_scenario
from backend.models.substitute import ApprovalStatus


class TestSampleScenarioData(unittest.TestCase):
    def setUp(self):
        self.scenario = get_sample_scenario()

    def test_sample_scenario_is_valid_and_complete(self):
        self.assertEqual(self.scenario.scenario_id, "SCENARIO-2026-W42")
        self.assertEqual(len(self.scenario.assembly_lines), 1)
        self.assertEqual(self.scenario.horizon_days, 14)

    def test_production_orders_count_priorities_and_dates(self):
        orders = self.scenario.production_orders
        self.assertGreaterEqual(len(orders), 3)

        priorities = {o.priority for o in orders}
        self.assertGreaterEqual(len(priorities), 2, "Orders must have diverse priorities")

        due_dates = {o.due_date for o in orders}
        self.assertGreaterEqual(len(due_dates), 2, "Orders must have diverse due dates")

    def test_assembly_line_capacity_feasibility(self):
        line = self.scenario.assembly_lines[0]
        self.assertGreater(line.daily_capacity, 0)
        self.assertTrue(len(line.operating_constraints) > 0)

        total_scheduled = sum(s.planned_quantity for s in line.scheduled_production)
        total_ordered = sum(o.quantity for o in self.scenario.production_orders)
        self.assertEqual(
            total_scheduled,
            total_ordered,
            f"Scheduled line production ({total_scheduled}) must match total order demand ({total_ordered})",
        )

        for schedule in line.scheduled_production:
            self.assertLessEqual(
                schedule.planned_quantity,
                line.daily_capacity,
                f"Schedule on {schedule.schedule_date} exceeds line daily capacity",
            )

    def test_critical_component_shortage_and_affected_orders(self):
        """Verify the sample data has a critical shortage that affects at least two orders."""
        scenario = self.scenario
        bom_map = {bom.product_id: bom for bom in scenario.boms}
        inventory_map = {item.component_id: item for item in scenario.inventory}

        # Calculate component demand across all orders
        component_demand: dict[str, int] = {}
        order_component_demand: list[tuple[str, dict[str, int]]] = []

        for order in scenario.production_orders:
            bom = bom_map[order.product_id]
            reqs: dict[str, int] = {}
            for item in bom.items:
                needed = item.quantity_per_unit * order.quantity
                reqs[item.component_id] = needed
                component_demand[item.component_id] = (
                    component_demand.get(item.component_id, 0) + needed
                )
            order_component_demand.append((order.order_id, reqs))

        # Identify components where usable inventory < total demand
        shortage_components = []
        for comp_id, total_needed in component_demand.items():
            inv = inventory_map[comp_id]
            if inv.usable_quantity < total_needed:
                shortage_components.append((comp_id, inv.usable_quantity, total_needed))

        self.assertTrue(
            len(shortage_components) >= 1,
            "Must have at least one component with insufficient usable inventory",
        )

        critical_comp_id, usable_stock, total_needed = shortage_components[0]
        self.assertEqual(critical_comp_id, "COMP-MCU-01")
        self.assertEqual(usable_stock, 100)
        self.assertEqual(total_needed, 350)

        # Allocate chronologically by scheduled date to identify affected orders
        sorted_orders = sorted(scenario.production_orders, key=lambda o: o.scheduled_date)
        remaining_stock = usable_stock
        affected_orders = []

        for order in sorted_orders:
            req = bom_map[order.product_id]
            mcu_req = next(i.quantity_per_unit for i in req.items if i.component_id == critical_comp_id) * order.quantity
            if remaining_stock >= mcu_req:
                remaining_stock -= mcu_req
            else:
                affected_orders.append((order.order_id, order.customer_name, mcu_req, remaining_stock))
                remaining_stock = 0

        self.assertGreaterEqual(
            len(affected_orders),
            2,
            f"Expected at least 2 customer orders to be affected by shortage, got {len(affected_orders)}",
        )

    def test_supplier_and_substitutes_configured(self):
        # Supplier availability check
        self.assertGreaterEqual(len(self.scenario.supplier_options), 1)
        supp = self.scenario.supplier_options[0]
        self.assertEqual(supp.component_id, "COMP-MCU-01")
        self.assertGreater(supp.available_quantity, 0)
        self.assertIsNotNone(supp.expedited_lead_time_days)
        self.assertIsNotNone(supp.expedited_unit_cost)

        # Substitute approval status check
        self.assertGreaterEqual(len(self.scenario.substitutes), 2)
        approved_subs = [s for s in self.scenario.substitutes if s.is_approved]
        pending_subs = [s for s in self.scenario.substitutes if s.approval_status == ApprovalStatus.PENDING]

        self.assertEqual(len(approved_subs), 1, "Expected exactly one approved substitute in sample data")
        self.assertEqual(approved_subs[0].substitute_component_id, "SUB-MCU-01A")
        self.assertTrue(approved_subs[0].is_approved)

        self.assertEqual(len(pending_subs), 1, "Expected exactly one pending substitute in sample data")
        self.assertEqual(pending_subs[0].substitute_component_id, "SUB-MCU-01B")
        self.assertFalse(pending_subs[0].is_approved)


if __name__ == "__main__":
    unittest.main()
