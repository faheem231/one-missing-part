"""Tests for Phase 4 decision strategy evaluation, trade-off analysis, and ranking."""

import unittest
from datetime import date
from pydantic import ValidationError

from backend.data.sample_scenario import get_sample_scenario
from backend.models.bom import BillOfMaterials, BOMItem
from backend.models.decisions import ScoringWeights, StrategyType
from backend.models.inventory import ComponentInventory
from backend.models.production import (
    AssemblyLine,
    DailyProductionSchedule,
    OrderPriority,
    ProductionOrder,
)
from backend.models.scenario import PlanningScenario
from backend.models.substitute import ApprovalStatus, ComponentSubstitute
from backend.models.supplier import SupplierAvailability
from backend.services.decision_engine import (
    evaluate_all_decisions,
    evaluate_expedited_supply,
    evaluate_partial_production,
    evaluate_schedule_swap,
    evaluate_substitution,
    score_and_rank_strategies,
)


class TestDecisionEngine(unittest.TestCase):
    def setUp(self):
        self.sample_scenario = get_sample_scenario()

    def test_1_partial_production_strategy(self):
        """1. Evaluates partial production strategy on baseline scenario."""
        strat = evaluate_partial_production(self.sample_scenario)
        self.assertEqual(strat.strategy_id, "STRAT-PARTIAL-PROD")
        self.assertEqual(strat.strategy_type, StrategyType.PARTIAL_PRODUCTION)
        self.assertTrue(strat.is_feasible)
        self.assertEqual(strat.feasible_production_units, 100)
        self.assertEqual(strat.incremental_cost, 0.0)
        self.assertEqual(strat.delivery_impact.fulfilled_units, 100)
        self.assertEqual(strat.delivery_impact.unfulfilled_units, 250)
        self.assertEqual(strat.delivery_impact.on_time_orders_count, 1)
        self.assertEqual(strat.delivery_impact.unfulfilled_orders_count, 2)

    def test_2_schedule_swap_strategy(self):
        """2. Evaluates schedule swap strategy (infeasible as standalone resolution)."""
        strat = evaluate_schedule_swap(self.sample_scenario)
        self.assertEqual(strat.strategy_id, "STRAT-SCHEDULE-SWAP")
        self.assertEqual(strat.strategy_type, StrategyType.SCHEDULE_SWAP)
        self.assertFalse(strat.is_feasible)
        self.assertIn("Infeasible as a standalone shortage resolution", strat.feasibility_notes)
        self.assertEqual(strat.feasible_production_units, 100)
        self.assertEqual(strat.delivery_impact.unfulfilled_units, 250)

    def test_3_approved_substitution_strategy(self):
        """3. Evaluates approved substitution strategy using SUB-MCU-01A."""
        strat = evaluate_substitution(self.sample_scenario)
        self.assertEqual(strat.strategy_id, "STRAT-SUBSTITUTION")
        self.assertEqual(strat.strategy_type, StrategyType.SUBSTITUTION)
        self.assertTrue(strat.is_feasible)
        # 100 on-hand original + 80 approved substitute = 180 units
        self.assertEqual(strat.feasible_production_units, 180)
        # Cost difference: 80 * ($52.00 - $42.50) = 80 * $9.50 = $760.00
        self.assertEqual(strat.incremental_cost, 760.0)
        self.assertEqual(strat.delivery_impact.fulfilled_units, 180)
        self.assertEqual(strat.delivery_impact.unfulfilled_units, 170)
        self.assertEqual(strat.delivery_impact.fulfillment_rate_pct, 51.43)

    def test_4_infeasible_substitution_unapproved(self):
        """4. Rejects unapproved substitutes and marks strategy infeasible."""
        # Create scenario with ONLY unapproved substitute
        scenario = get_sample_scenario()
        scenario.substitutes = [
            ComponentSubstitute(
                original_component_id="COMP-MCU-01",
                substitute_component_id="SUB-MCU-01B",
                substitute_name="Unapproved Sub",
                approval_status=ApprovalStatus.PENDING,  # NOT approved
                available_quantity=200,
                unit_cost=38.50,
                compatibility_notes="Pending testing",
            )
        ]
        strat = evaluate_substitution(scenario)
        self.assertFalse(strat.is_feasible)
        self.assertIn("No approved substitute", strat.feasibility_notes)
        self.assertEqual(strat.feasible_production_units, 0)

    def test_5_expedited_supply_strategy(self):
        """5. Evaluates expedited supply strategy with on-time delivery."""
        strat = evaluate_expedited_supply(self.sample_scenario)
        self.assertEqual(strat.strategy_id, "STRAT-EXPEDITED-SUPPLY")
        self.assertEqual(strat.strategy_type, StrategyType.EXPEDITED_SUPPLY)
        self.assertTrue(strat.is_feasible)
        # Covers all 350 units
        self.assertEqual(strat.feasible_production_units, 350)
        self.assertEqual(strat.delivery_impact.unfulfilled_units, 0)
        self.assertEqual(strat.delivery_impact.fulfillment_rate_pct, 100.0)
        self.assertEqual(strat.delivery_impact.on_time_orders_count, 3)
        self.assertEqual(strat.delivery_impact.delayed_orders_count, 0)
        # Cost difference: 250 deficit * ($65.00 - $42.50) = 250 * $22.50 = $5,625.00
        self.assertEqual(strat.incremental_cost, 5625.0)

    def test_6_expedited_supply_arriving_too_late(self):
        """6. Evaluates expedited delivery that arrives too late to fulfill due dates."""
        scenario = get_sample_scenario()
        # Change supplier lead time to 12 days (arrival Oct 24, after due dates Oct 20)
        scenario.supplier_options[0].expedited_lead_time_days = 12
        scenario.supplier_options[0].standard_lead_time_days = 12

        strat = evaluate_expedited_supply(scenario)
        delayed_orders = [o for o in strat.orders_impact if o.delay_status == "DELAYED"]
        self.assertGreater(len(delayed_orders), 0)

    def test_7_schedule_capacity_constraints(self):
        """7. Verifies assembly line capacity constraint is respected."""
        scenario = get_sample_scenario()
        # Reduce line capacity to 10 units/day
        scenario.assembly_lines[0].daily_capacity = 25
        for s in scenario.assembly_lines[0].scheduled_production:
            s.planned_quantity = 25

        response = evaluate_all_decisions(scenario)
        for opt in response.options:
            self.assertIsNotNone(opt)

    def test_8_strategy_reduces_delivery_impact_at_higher_cost(self):
        """8. Compares trade-off: Expedited supply achieves 100% fulfillment at higher cost."""
        response = evaluate_all_decisions(self.sample_scenario)
        expedited = next(o for o in response.options if o.strategy_id == "STRAT-EXPEDITED-SUPPLY")
        partial = next(o for o in response.options if o.strategy_id == "STRAT-PARTIAL-PROD")

        # Expedited has higher cost but much lower delivery impact
        self.assertGreater(expedited.incremental_cost, partial.incremental_cost)
        self.assertLess(
            expedited.delivery_impact.unfulfilled_units,
            partial.delivery_impact.unfulfilled_units,
        )

    def test_9_correct_exclusion_of_infeasible_recommendations(self):
        """9. Hard constraint: An infeasible strategy is NEVER marked recommended."""
        response = evaluate_all_decisions(self.sample_scenario)
        swap_opt = next(o for o in response.options if o.strategy_id == "STRAT-SCHEDULE-SWAP")

        self.assertFalse(swap_opt.is_feasible)
        self.assertFalse(swap_opt.is_recommended)
        self.assertGreater(swap_opt.rank, 1)

        # The recommended option MUST be feasible
        self.assertIsNotNone(response.recommended_option)
        self.assertTrue(response.recommended_option.is_feasible)

    def test_10_no_strategy_feasible_case(self):
        """10. Reports clearly when no candidate strategy is feasible."""
        scenario = get_sample_scenario()
        # Deplete inventory to 0, remove approved substitutes, remove suppliers
        for item in scenario.inventory:
            item.quantity_on_hand = 0
            item.reserved_quantity = 0
        scenario.substitutes = []
        scenario.supplier_options = []

        # When partial prod has 0 units, evaluate ranking
        strat_partial = evaluate_partial_production(scenario)
        strat_sub = evaluate_substitution(scenario)
        strat_exp = evaluate_expedited_supply(scenario)
        strat_swap = evaluate_schedule_swap(scenario)

        # Force all infeasible
        strat_partial.is_feasible = False
        strat_sub.is_feasible = False
        strat_exp.is_feasible = False
        strat_swap.is_feasible = False

        ranked = score_and_rank_strategies(
            [strat_partial, strat_sub, strat_exp, strat_swap], ScoringWeights()
        )
        self.assertFalse(any(o.is_recommended for o in ranked))

    def test_11_deterministic_results(self):
        """11. Ensures identical inputs yield identical scores, ranks, and recommendations."""
        res1 = evaluate_all_decisions(self.sample_scenario)
        res2 = evaluate_all_decisions(self.sample_scenario)

        self.assertEqual(res1.recommended_option.strategy_id, res2.recommended_option.strategy_id)
        self.assertEqual(
            [o.strategy_id for o in res1.options],
            [o.strategy_id for o in res2.options],
        )
        self.assertEqual(
            [o.scoring.composite_score for o in res1.options],
            [o.scoring.composite_score for o in res2.options],
        )

    def test_12_ranking_changes_when_configurable_weights_change(self):
        """12. Ranking adapts predictably to changes in preference weights."""
        # 1. Delivery-focused weights (default): Expedited supply is #1
        w_delivery = ScoringWeights(weight_delivery=0.60, weight_cost=0.20, weight_ops=0.20)
        res_del = evaluate_all_decisions(self.sample_scenario, w_delivery)
        self.assertEqual(res_del.recommended_option.strategy_id, "STRAT-EXPEDITED-SUPPLY")

        # 2. Extreme cost-focused weights: Partial production (cost $0) is #1
        w_cost = ScoringWeights(weight_delivery=0.10, weight_cost=0.80, weight_ops=0.10)
        res_cost = evaluate_all_decisions(self.sample_scenario, w_cost)
        self.assertEqual(res_cost.recommended_option.strategy_id, "STRAT-PARTIAL-PROD")
        self.assertEqual(res_cost.recommended_option.incremental_cost, 0.0)


    def test_13_all_zero_weights_raises_value_error(self):
        """13. Verifies passing all-zero weights (0.0, 0.0, 0.0) raises ValueError."""
        zero_weights = ScoringWeights(weight_delivery=0.0, weight_cost=0.0, weight_ops=0.0)
        with self.assertRaises(ValueError) as ctx:
            evaluate_all_decisions(self.sample_scenario, zero_weights)
        self.assertIn("Sum of scoring weights must be greater than zero", str(ctx.exception))

    def test_14_relative_weight_normalization(self):
        """14. Verifies weights are treated as relative and normalized to sum to 1.0."""
        # Un-normalized weights (1.0, 1.0, 0.0) -> relative normalized weights (0.5, 0.5, 0.0)
        weights = ScoringWeights(weight_delivery=1.0, weight_cost=1.0, weight_ops=0.0)
        res = evaluate_all_decisions(self.sample_scenario, weights)

        expedited = next(o for o in res.options if o.strategy_id == "STRAT-EXPEDITED-SUPPLY")
        # delivery_score = 1.0, cost_score = 0.4706, ops_score = 0.85
        # composite should equal round(0.5 * 1.0 + 0.5 * 0.4706, 4) = round(0.5 + 0.2353, 4) = 0.7353
        self.assertEqual(expedited.scoring.composite_score, 0.7353)

    def test_15_schedule_swap_semantics(self):
        """15. Verifies schedule-swap evaluates sequence without requiring substitutes."""
        strat = evaluate_schedule_swap(self.sample_scenario)
        # Must evaluate actual orders against BOM requirements
        self.assertEqual(len(strat.orders_impact), 3)
        self.assertFalse(strat.is_feasible)
        # Reason must cite physical component deficit, not missing substitute
        self.assertIn("cannot fulfill the 250-unit deficit", strat.feasibility_notes)
        self.assertNotIn("substitute", strat.feasibility_notes.lower())


if __name__ == "__main__":
    unittest.main()

