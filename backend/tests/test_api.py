"""API endpoint integration tests."""

import json
import unittest
from backend.main import app


class TestScenarioAPI(unittest.IsolatedAsyncioTestCase):
    async def _make_asgi_request(self, path: str, method: str = "GET", body: dict = None, headers: list = None):
        if headers is None:
            headers = [(b"host", b"localhost:8000")]
        else:
            headers = list(headers)

        body_bytes = json.dumps(body).encode("utf-8") if body is not None else b""
        if body is not None:
            headers.append((b"content-type", b"application/json"))
            headers.append((b"content-length", str(len(body_bytes)).encode("utf-8")))

        if "?" in path:
            url_path, query_str = path.split("?", 1)
        else:
            url_path, query_str = path, ""

        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": url_path,
            "raw_path": url_path.encode("utf-8"),
            "query_string": query_str.encode("utf-8"),
            "headers": headers,
        }
        messages = []

        async def receive():
            return {"type": "http.request", "body": body_bytes, "more_body": False}

        async def send(message):
            messages.append(message)

        await app(scope, receive, send)

        start = next(m for m in messages if m["type"] == "http.response.start")
        body_chunks = [m.get("body", b"") for m in messages if m["type"] == "http.response.body"]
        body_text = b"".join(body_chunks).decode("utf-8")
        data = json.loads(body_text) if body_text else None
        headers_dict = {k.decode("latin1").lower(): v.decode("latin1") for k, v in start.get("headers", [])}

        return start["status"], data, headers_dict

    async def test_health_endpoint(self):
        status, data, _ = await self._make_asgi_request("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(data, {"status": "healthy"})

    async def test_scenario_endpoint_success(self):
        status, data, _ = await self._make_asgi_request("/api/scenario")
        self.assertEqual(status, 200)
        self.assertIsNotNone(data)

        # Validate top-level keys
        self.assertEqual(data["scenario_id"], "SCENARIO-2026-W42")
        self.assertEqual(data["horizon_days"], 14)
        self.assertEqual(data["start_date"], "2026-10-12")
        self.assertEqual(data["end_date"], "2026-10-25")

        # Validate assembly line
        self.assertEqual(len(data["assembly_lines"]), 1)
        line = data["assembly_lines"][0]
        self.assertEqual(line["line_id"], "LINE-01")
        self.assertEqual(line["daily_capacity"], 50)

        # Validate inventory
        inventory = data["inventory"]
        self.assertGreaterEqual(len(inventory), 4)
        mcu_item = next(i for i in inventory if i["component_id"] == "COMP-MCU-01")
        self.assertEqual(mcu_item["usable_quantity"], 100)
        self.assertEqual(mcu_item["quantity_on_hand"], 140)
        self.assertEqual(mcu_item["reserved_quantity"], 40)

        # Validate BOM
        boms = data["boms"]
        self.assertEqual(len(boms), 1)
        self.assertEqual(boms[0]["product_id"], "PROD-X500")

        # Validate orders
        orders = data["production_orders"]
        self.assertEqual(len(orders), 3)

        # Validate substitutes
        substitutes = data["substitutes"]
        self.assertEqual(len(substitutes), 2)
        approved_sub = next(s for s in substitutes if s["substitute_component_id"] == "SUB-MCU-01A")
        self.assertEqual(approved_sub["approval_status"], "APPROVED")
        self.assertTrue(approved_sub["is_approved"])

    async def test_cors_headers_on_scenario(self):
        headers = [
            (b"host", b"localhost:8000"),
            (b"origin", b"http://localhost:5173"),
        ]
        status, _, resp_headers = await self._make_asgi_request("/api/scenario", headers=headers)
        self.assertEqual(status, 200)
        self.assertEqual(resp_headers.get("access-control-allow-origin"), "http://localhost:5173")

    async def test_shortage_endpoint_success(self):
        """11. Test GET /api/shortage returns correct structured report."""
        status, data, _ = await self._make_asgi_request("/api/shortage")
        self.assertEqual(status, 200)
        self.assertIsNotNone(data)

        # Basic metadata
        self.assertEqual(data["scenario_id"], "SCENARIO-2026-W42")
        self.assertTrue(data["has_shortage"])

        # Shortage component details
        shortages = data["shortage_components"]
        self.assertEqual(len(shortages), 1)
        mcu_shortage = shortages[0]
        self.assertEqual(mcu_shortage["component_id"], "COMP-MCU-01")
        self.assertEqual(mcu_shortage["usable_stock"], 100)
        self.assertEqual(mcu_shortage["required_quantity"], 350)
        self.assertEqual(mcu_shortage["shortage_quantity"], 250)
        self.assertEqual(mcu_shortage["shortage_cost"], 10625.0)
        self.assertEqual(mcu_shortage["affected_order_ids"], ["ORD-2026-002", "ORD-2026-003"])

        # Feasible production
        feasible = data["feasible_production"]
        self.assertEqual(feasible["feasible_units"], 100)
        self.assertEqual(feasible["inventory_limited_units"], 100)
        self.assertEqual(feasible["bottleneck_component_id"], "COMP-MCU-01")
        self.assertEqual(feasible["limiting_factor"], "INVENTORY")

        # Orders impact
        orders = data["orders_impact"]
        self.assertEqual(len(orders), 3)

        ord1 = orders[0]
        self.assertEqual(ord1["order_id"], "ORD-2026-001")
        self.assertEqual(ord1["allocated_quantity"], 100)
        self.assertEqual(ord1["unfulfilled_quantity"], 0)
        self.assertFalse(ord1["is_affected"])
        self.assertEqual(ord1["delay_status"], "ON_SCHEDULE")

        ord2 = orders[1]
        self.assertEqual(ord2["order_id"], "ORD-2026-002")
        self.assertEqual(ord2["allocated_quantity"], 0)
        self.assertEqual(ord2["unfulfilled_quantity"], 150)
        self.assertTrue(ord2["is_affected"])
        self.assertIn("COMP-MCU-01", ord2["missing_components"])
        self.assertEqual(ord2["delay_status"], "UNAVAILABLE")

        ord3 = orders[2]
        self.assertEqual(ord3["order_id"], "ORD-2026-003")
        self.assertEqual(ord3["allocated_quantity"], 0)
        self.assertEqual(ord3["unfulfilled_quantity"], 100)
        self.assertTrue(ord3["is_affected"])
        self.assertIn("COMP-MCU-01", ord3["missing_components"])
        self.assertEqual(ord3["delay_status"], "UNAVAILABLE")

        # Demand breakdown and policies
        self.assertGreaterEqual(len(data["demand_breakdown"]), 3)
        self.assertTrue("CRITICAL" in data["allocation_policy"])
        self.assertGreater(len(data["assumptions_and_limitations"]), 0)

    async def test_cors_headers_on_shortage(self):
        headers = [
            (b"host", b"localhost:8000"),
            (b"origin", b"http://localhost:5173"),
        ]
        status, _, resp_headers = await self._make_asgi_request("/api/shortage", headers=headers)
        self.assertEqual(status, 200)
        self.assertEqual(resp_headers.get("access-control-allow-origin"), "http://localhost:5173")

    async def test_regression_checks_health_and_scenario_still_work(self):
        """12. Regression checks confirming health and scenario endpoints still work."""
        status_health, data_health, _ = await self._make_asgi_request("/api/health")
        self.assertEqual(status_health, 200)
        self.assertEqual(data_health, {"status": "healthy"})

        status_scenario, data_scenario, _ = await self._make_asgi_request("/api/scenario")
        self.assertEqual(status_scenario, 200)
        self.assertEqual(data_scenario["scenario_id"], "SCENARIO-2026-W42")

    async def test_decisions_options_endpoint_success(self):
        """Test GET /api/decisions/options returns complete evaluated strategies."""
        status, data, _ = await self._make_asgi_request("/api/decisions/options")
        self.assertEqual(status, 200)
        self.assertIsNotNone(data)

        self.assertEqual(data["scenario_id"], "SCENARIO-2026-W42")
        options = data["options"]
        self.assertEqual(len(options), 4)

        # Check default recommended option is Expedited Supply
        rec = data["recommended_option"]
        self.assertIsNotNone(rec)
        self.assertEqual(rec["strategy_id"], "STRAT-EXPEDITED-SUPPLY")
        self.assertEqual(rec["feasible_production_units"], 350)
        self.assertEqual(rec["incremental_cost"], 5625.0)

        # Verify rank ordering
        ranks = [o["rank"] for o in options]
        self.assertEqual(ranks, [1, 2, 3, 4])

        # Verify infeasible option is ranked last
        infeasible_opt = next(o for o in options if not o["is_feasible"])
        self.assertEqual(infeasible_opt["strategy_id"], "STRAT-SCHEDULE-SWAP")
        self.assertEqual(infeasible_opt["rank"], 4)

    async def test_decisions_options_with_custom_weights(self):
        """Test GET /api/decisions/options with cost-dominant weights shifting recommendation."""
        query_path = "/api/decisions/options?weight_cost=0.8&weight_delivery=0.1&weight_ops=0.1"
        status, data, _ = await self._make_asgi_request(query_path)
        self.assertEqual(status, 200)

        rec = data["recommended_option"]
        self.assertIsNotNone(rec)
        self.assertEqual(rec["strategy_id"], "STRAT-PARTIAL-PROD")
        self.assertEqual(rec["incremental_cost"], 0.0)

    async def test_cors_headers_on_decisions_options(self):
        headers = [
            (b"host", b"localhost:8000"),
            (b"origin", b"http://localhost:5173"),
        ]
        status, _, resp_headers = await self._make_asgi_request("/api/decisions/options", headers=headers)
        self.assertEqual(status, 200)
        self.assertEqual(resp_headers.get("access-control-allow-origin"), "http://localhost:5173")

    async def test_recommendation_explanation_endpoint(self):
        """Test GET /api/decisions/explanation returns detailed narrative and metrics."""
        status, data, _ = await self._make_asgi_request("/api/decisions/explanation")
        self.assertEqual(status, 200)
        self.assertEqual(data["recommended_strategy_id"], "STRAT-EXPEDITED-SUPPLY")
        self.assertTrue(data["is_feasible"])
        self.assertEqual(data["supporting_metrics"]["feasible_production_units"], 350)
        self.assertIn("Silico Components", data["cost_and_delivery_impact"])
        self.assertGreaterEqual(len(data["lower_ranked_strategies_comparison"]), 3)

    async def test_current_decision_initial_pending_state(self):
        """Test GET /api/decisions/current returns pending when no approval action taken yet."""
        # Reset store first to guarantee initial state
        from backend.services.approval_service import approval_store
        approval_store.reset()

        status, data, _ = await self._make_asgi_request("/api/decisions/current")
        self.assertEqual(status, 200)
        self.assertFalse(data["has_decision"])
        self.assertEqual(data["status"], "pending")
        self.assertIsNone(data["decision"])
        self.assertIn("No decision action has been recorded", data["message"])

    async def test_approve_feasible_strategy_endpoint_success(self):
        """Test POST /api/decisions/approve with valid feasible strategy."""
        payload = {
            "strategy_id": "STRAT-EXPEDITED-SUPPLY",
            "action": "approve",
            "reviewer_note": "Approved by Plant Manager."
        }
        status, data, _ = await self._make_asgi_request("/api/decisions/approve", method="POST", body=payload)
        self.assertEqual(status, 200)
        self.assertEqual(data["selected_strategy_id"], "STRAT-EXPEDITED-SUPPLY")
        self.assertEqual(data["status"], "approved")
        self.assertTrue(data["is_feasible"])
        self.assertEqual(data["reviewer_note"], "Approved by Plant Manager.")

        # Confirm GET /api/decisions/current now reflects approval
        status_curr, data_curr, _ = await self._make_asgi_request("/api/decisions/current")
        self.assertEqual(status_curr, 200)
        self.assertTrue(data_curr["has_decision"])
        self.assertEqual(data_curr["status"], "approved")
        self.assertEqual(data_curr["decision"]["selected_strategy_id"], "STRAT-EXPEDITED-SUPPLY")

    async def test_approve_infeasible_strategy_endpoint_fails(self):
        """Test POST /api/decisions/approve fails for infeasible strategy (HTTP 400)."""
        payload = {
            "strategy_id": "STRAT-SCHEDULE-SWAP",
            "action": "approve",
            "reviewer_note": "Invalid attempt to approve infeasible option."
        }
        status, data, _ = await self._make_asgi_request("/api/decisions/approve", method="POST", body=payload)
        self.assertEqual(status, 400)
        self.assertIn("Cannot approve infeasible strategy", data["detail"])

    async def test_all_zero_weights_returns_http_400(self):
        """Test GET /api/decisions/options with all-zero weights returns HTTP 400 Bad Request."""
        query_path = "/api/decisions/options?weight_delivery=0.0&weight_cost=0.0&weight_ops=0.0"
        status, data, _ = await self._make_asgi_request(query_path)
        self.assertEqual(status, 400)
        self.assertIn("Sum of scoring weights must be greater than zero", data["detail"])


if __name__ == "__main__":
    unittest.main()



