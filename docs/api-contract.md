# One Missing Part — API Contract & Manufacturing Data Models

## 1. Overview

This document specifies the REST API contract for the **One Missing Part** manufacturing shortage decision-support platform (Cypher Challenge 9). 

The platform supports a two-week operational planning horizon on a single assembly line producing finished goods governed by a single-level Bill of Materials (BOM).

---

## 2. API Endpoints

### 2.1 Health Check
* **Endpoint:** `GET /api/health`
* **Purpose:** Basic liveness probe for container orchestration and uptime monitoring.
* **Response:**
```json
{
  "status": "healthy"
}
```

---

### 2.2 Planning Scenario
* **Endpoint:** `GET /api/scenario`
* **Purpose:** Returns the baseline two-week manufacturing scenario, including physical inventory, single-level BOM, customer production orders, assembly-line capacity, supplier availability options, and substitute parts.
* **Status Code:** `200 OK`
* **CORS Origin:** `http://localhost:5173` (with support for `127.0.0.1:5173`)
* **Date Format:** ISO 8601 (`YYYY-MM-DD`)

---

## 3. Sample Response Payload (`GET /api/scenario`)

```json
{
  "scenario_id": "SCENARIO-2026-W42",
  "name": "OptiController X-500 Production Plan (Weeks 42-43)",
  "start_date": "2026-10-12",
  "end_date": "2026-10-25",
  "horizon_days": 14,
  "assembly_lines": [
    {
      "line_id": "LINE-01",
      "name": "Main Surface Mount & Assembly Line Alpha",
      "daily_capacity": 50,
      "scheduled_production": [
        {"date": "2026-10-13", "planned_quantity": 50},
        {"date": "2026-10-14", "planned_quantity": 50},
        {"date": "2026-10-16", "planned_quantity": 50},
        {"date": "2026-10-17", "planned_quantity": 50},
        {"date": "2026-10-18", "planned_quantity": 50},
        {"date": "2026-10-21", "planned_quantity": 50},
        {"date": "2026-10-22", "planned_quantity": 50}
      ],
      "operating_constraints": [
        "Single 8-hour shift per working day",
        "Maximum 50 finished units per calendar day",
        "Requires 2-hour sanitation and tooling changeover between batch runs"
      ]
    }
  ],
  "inventory": [
    {
      "component_id": "COMP-MCU-01",
      "name": "STM32 32-bit Dual-Core Microcontroller",
      "description": "Primary system processing and control unit (CRITICAL COMPONENT)",
      "quantity_on_hand": 140,
      "reserved_quantity": 40,
      "unit_cost": 42.5,
      "usable_quantity": 100
    },
    {
      "component_id": "COMP-PWR-02",
      "name": "24V Power Regulation Module",
      "description": "High-efficiency step-down voltage regulation board",
      "quantity_on_hand": 500,
      "reserved_quantity": 50,
      "unit_cost": 18.0,
      "usable_quantity": 450
    },
    {
      "component_id": "COMP-ENCL-03",
      "name": "Precision Aluminum Chassis Enclosure",
      "description": "IP67-rated anodized extruded aluminum enclosure",
      "quantity_on_hand": 400,
      "reserved_quantity": 0,
      "unit_cost": 35.0,
      "usable_quantity": 400
    },
    {
      "component_id": "COMP-PCB-04",
      "name": "Main Motherboard PCB 8-Layer",
      "description": "Surface finish ENIG, high Tg multilayer PCB",
      "quantity_on_hand": 450,
      "reserved_quantity": 50,
      "unit_cost": 22.0,
      "usable_quantity": 400
    }
  ],
  "boms": [
    {
      "product_id": "PROD-X500",
      "product_name": "OptiController X-500 Industrial Edge Controller",
      "items": [
        {"component_id": "COMP-MCU-01", "quantity_per_unit": 1},
        {"component_id": "COMP-PWR-02", "quantity_per_unit": 1},
        {"component_id": "COMP-ENCL-03", "quantity_per_unit": 1},
        {"component_id": "COMP-PCB-04", "quantity_per_unit": 1}
      ]
    }
  ],
  "production_orders": [
    {
      "order_id": "ORD-2026-001",
      "customer_name": "Apex Robotics Corp",
      "product_id": "PROD-X500",
      "quantity": 100,
      "priority": "CRITICAL",
      "created_date": "2026-10-01",
      "scheduled_date": "2026-10-14",
      "due_date": "2026-10-16"
    },
    {
      "order_id": "ORD-2026-002",
      "customer_name": "Global Dynamics Automation",
      "product_id": "PROD-X500",
      "quantity": 150,
      "priority": "HIGH",
      "created_date": "2026-10-03",
      "scheduled_date": "2026-10-18",
      "due_date": "2026-10-20"
    },
    {
      "order_id": "ORD-2026-003",
      "customer_name": "Nexus Energy Systems",
      "product_id": "PROD-X500",
      "quantity": 100,
      "priority": "MEDIUM",
      "created_date": "2026-10-05",
      "scheduled_date": "2026-10-22",
      "due_date": "2026-10-24"
    }
  ],
  "supplier_options": [
    {
      "supplier_id": "SUPP-SILICO-01",
      "name": "SilicoTech Global Distribution Ltd",
      "component_id": "COMP-MCU-01",
      "available_quantity": 300,
      "standard_lead_time_days": 9,
      "expedited_lead_time_days": 4,
      "standard_unit_cost": 45.0,
      "expedited_unit_cost": 65.0,
      "is_guaranteed": false
    }
  ],
  "substitutes": [
    {
      "original_component_id": "COMP-MCU-01",
      "substitute_component_id": "SUB-MCU-01A",
      "substitute_name": "MicroChip Ultra-32 Automotive Grade MCU",
      "approval_status": "APPROVED",
      "available_quantity": 80,
      "unit_cost": 52.0,
      "compatibility_notes": "Direct pin-to-pin compatible drop-in replacement; verified under ECO-2026-88.",
      "is_approved": true
    },
    {
      "original_component_id": "COMP-MCU-01",
      "substitute_component_id": "SUB-MCU-01B",
      "substitute_name": "Texas Semi C2000 Equivalent",
      "approval_status": "PENDING",
      "available_quantity": 200,
      "unit_cost": 38.5,
      "compatibility_notes": "Requires firmware modification and EMC testing qualification. Not yet approved.",
      "is_approved": false
    }
  ]
}
```

---

## 4. Key Entities & Field Reference

| Entity | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| **ComponentInventory** | `component_id` | String | Unique component identifier. |
| | `quantity_on_hand` | Integer (`>= 0`) | Physical on-site inventory count. |
| | `reserved_quantity` | Integer (`>= 0`) | Pre-allocated inventory (cannot exceed `quantity_on_hand`). |
| | `unit_cost` | Float (`>= 0.0`) | Inventory book value per unit ($ USD). |
| | `usable_quantity` | Integer | Calculated field: `quantity_on_hand - reserved_quantity`. |
| **BillOfMaterials** | `product_id` | String | Finished goods item code. |
| | `items` | Array of `BOMItem` | Single-level assembly breakdown. Quantity per unit must be strictly `> 0`. |
| **AssemblyLine** | `line_id` | String | Assembly line identifier (strictly 1 line allowed in scope). |
| | `daily_capacity` | Integer (`> 0`) | Maximum units the line can produce in 1 calendar day. |
| | `scheduled_production` | Array | Day-by-day planned output. Each day must not exceed `daily_capacity`. |
| **ProductionOrder** | `order_id` | String | Work order number. |
| | `quantity` | Integer (`> 0`) | Finished units requested by customer. |
| | `priority` | Enum | `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`. |
| | `scheduled_date` | Date (`YYYY-MM-DD`)| Planned production run date (must be within planning horizon). |
| | `due_date` | Date (`YYYY-MM-DD`)| Promised delivery date (`scheduled_date <= due_date`). |
| **SupplierAvailability** | `supplier_id` | String | Vendor ID. |
| | `standard_lead_time_days` | Integer (`>= 0`) | Normal transit lead time in calendar days. |
| | `expedited_lead_time_days`| Optional Int | Fast-track delivery time (`<= standard_lead_time_days`). |
| | `is_guaranteed` | Boolean | True only if contractually guaranteed stock. |
| **ComponentSubstitute** | `approval_status` | Enum | `APPROVED`, `PENDING`, or `REJECTED`. |
| | `is_approved` | Boolean | Computed: True if and only if `approval_status == "APPROVED"`. |
| **PlanningScenario** | `horizon_days` | Integer | Computed duration of planning window (14 days). |

---

## 5. Sample Scenario Assumptions & Shortage Representation

1. **Finished Product**: 1 unit of `PROD-X500` requires exactly 1 unit each of 4 components:
   * `COMP-MCU-01` (Microcontroller)
   * `COMP-PWR-02` (Power Module)
   * `COMP-ENCL-03` (Chassis)
   * `COMP-PCB-04` (Printed Circuit Board)
2. **Customer Demand**:
   * Order 1 (`ORD-2026-001`): 100 units scheduled Oct 14. Priority: `CRITICAL`.
   * Order 2 (`ORD-2026-002`): 150 units scheduled Oct 18. Priority: `HIGH`.
   * Order 3 (`ORD-2026-003`): 100 units scheduled Oct 22. Priority: `MEDIUM`.
   * **Total Required Units**: 350 finished products across 3 orders.
3. **The Shortage Component (`COMP-MCU-01`)**:
   * Physical stock on hand: 140 units.
   * Reserved stock: 40 units.
   * **Usable stock on hand**: 100 units.
   * **Shortage Deficit**: $350 - 100 = 250$ missing MCUs.
4. **Impact on Production**:
   * Order 1 (`ORD-2026-001`) consumes the entire available inventory of 100 usable units.
   * Order 2 (`ORD-2026-002`) and Order 3 (`ORD-2026-003`) **have zero remaining usable inventory** and cannot be produced as scheduled without remediation.
   * Exactly 2 customer orders are directly stalled by this shortage.
5. **Mitigation Inputs Provided in Data**:
   * **Substitution**: `SUB-MCU-01A` is approved with 80 units available immediately at $52.00/unit. (`SUB-MCU-01B` has 200 units but is unapproved/`PENDING`).
   * **Supplier Option**: `SUPP-SILICO-01` can supply up to 300 units with 4-day expedited delivery at $65.00/unit or 9-day standard delivery at $45.00/unit.

---

## 6. Input Facts vs. Future Calculated Values

| Field / Concept | Status in Phase 2 | Handling in Later Phases (Phase 3+) |
| :--- | :--- | :--- |
| `quantity_on_hand`, `reserved_quantity` | **Input Fact** | Used as starting state for stock simulation. |
| `usable_quantity` | **Input Fact (Derived)** | `quantity_on_hand - reserved_quantity`. |
| `daily_capacity`, `planned_quantity` | **Input Fact** | Starting production schedule. |
| `is_approved` | **Input Fact** | Gates whether substitute can be considered by the solver. |
| `shortage_quantity` per order | *Not present in Phase 2* | **Calculated in Phase 3** by Shortage Engine (`/api/shortage`). |
| `order_impact` (which orders slip) | *Implicit in data* | **Calculated in Phase 3** with impact metrics (`/api/shortage`). |
| Recommendation ranking & cost | *Not present in Phase 2* | **Calculated in Phase 4** (decision tradeoffs). |

---

## 7. Shortage Analysis Endpoint (`GET /api/shortage`)

### 7.1 Overview
* **Endpoint:** `GET /api/shortage`
* **Purpose:** Computes deterministic shortage analysis for the current planning horizon. Identifies which components have deficits, allocates usable inventory to customer work orders by priority and due date, determines unfulfilled quantities, and evaluates feasible production against line capacity.
* **Status Code:** `200 OK`
* **CORS Origin:** `http://localhost:5173` (with support for `127.0.0.1:5173`)

### 7.2 Core Formulas
1. **Usable Stock:**
   $$\text{usable\_stock} = \max(0, \text{quantity\_on\_hand} - \text{reserved\_quantity})$$
   *Reserved stock is sequestered and never counted as available.*
2. **Component Demand:**
   $$\text{component\_demand}(c) = \sum_{\text{order} \in \text{Orders}} (\text{order.quantity} \times \text{BOM}(c))$$
3. **Shortage Deficit:**
   $$\text{shortage\_quantity}(c) = \max(0, \text{component\_demand}(c) - \text{usable\_stock}(c))$$
4. **Feasible Finished Goods Production:**
   $$\text{feasible\_units} = \min(\text{inventory\_limited\_units}, \text{capacity\_limited\_units})$$
   where:
   $$\text{inventory\_limited\_units} = \min_{c \in \text{BOM}} \left\lfloor \frac{\text{usable\_stock}(c)}{\text{BOM}(c)} \right\rfloor$$

### 7.3 Order Allocation Policy
Orders are evaluated and allocated available stock sequentially based on a strict, deterministic hierarchy:
1. **Priority Rank:** `CRITICAL` (1) > `HIGH` (2) > `MEDIUM` (3) > `LOW` (4)
2. **Delivery Due Date:** Ascending (earliest contractual delivery first)
3. **Scheduled Production Date:** Ascending
4. **Order Creation Date:** Ascending
5. **Order ID:** Ascending alphanumeric string comparison (strict tie-breaker)

An order is allocated discrete finished units if and only if **all mandatory BOM components** are simultaneously available in unallocated usable stock.

### 7.4 Delay Values & Classifications
* **`ON_SCHEDULE` (0 days):** The order was completely fulfilled from usable inventory under the allocation policy and can be assembled on its scheduled date.
* **`UNAVAILABLE` (`null`):** The order cannot be assembled on schedule due to missing components. Because neither an expedited vendor purchase order nor an approved engineering substitute has yet been committed to the manufacturing schedule, projecting an exact delivery date would be misleading. Exact completion dates are determined in Phase 4 once mitigation strategies are selected.

### 7.5 Sample Response Payload (`GET /api/shortage`)

```json
{
  "scenario_id": "SCENARIO-2026-W42",
  "scenario_name": "OptiController X-500 Production Plan (Weeks 42-43)",
  "analysis_date": "2026-10-12",
  "has_shortage": true,
  "shortage_components": [
    {
      "component_id": "COMP-MCU-01",
      "component_name": "STM32 32-bit Dual-Core Microcontroller",
      "quantity_on_hand": 140,
      "reserved_quantity": 40,
      "usable_stock": 100,
      "required_quantity": 350,
      "shortage_quantity": 250,
      "unit_cost": 42.5,
      "shortage_cost": 10625.0,
      "affected_order_ids": [
        "ORD-2026-002",
        "ORD-2026-003"
      ]
    }
  ],
  "demand_breakdown": [
    {
      "scheduled_date": "2026-10-14",
      "order_id": "ORD-2026-001",
      "product_id": "PROD-X500",
      "order_quantity": 100,
      "component_requirements": {
        "COMP-MCU-01": 100,
        "COMP-PWR-02": 100,
        "COMP-ENCL-03": 100,
        "COMP-PCB-04": 100
      }
    },
    {
      "scheduled_date": "2026-10-18",
      "order_id": "ORD-2026-002",
      "product_id": "PROD-X500",
      "order_quantity": 150,
      "component_requirements": {
        "COMP-MCU-01": 150,
        "COMP-PWR-02": 150,
        "COMP-ENCL-03": 150,
        "COMP-PCB-04": 150
      }
    },
    {
      "scheduled_date": "2026-10-22",
      "order_id": "ORD-2026-003",
      "product_id": "PROD-X500",
      "order_quantity": 100,
      "component_requirements": {
        "COMP-MCU-01": 100,
        "COMP-PWR-02": 100,
        "COMP-ENCL-03": 100,
        "COMP-PCB-04": 100
      }
    }
  ],
  "feasible_production": {
    "inventory_limited_units": 100,
    "capacity_limited_units": 350,
    "feasible_units": 100,
    "bottleneck_component_id": "COMP-MCU-01",
    "limiting_factor": "INVENTORY",
    "explanation": "Production is constrained to 100 units by inventory deficit in 'COMP-MCU-01'. Line capacity (350 units) has surplus."
  },
  "orders_impact": [
    {
      "order_id": "ORD-2026-001",
      "customer_name": "Apex Robotics Corp",
      "product_id": "PROD-X500",
      "order_quantity": 100,
      "priority": "CRITICAL",
      "scheduled_date": "2026-10-14",
      "due_date": "2026-10-16",
      "component_requirements": {
        "COMP-MCU-01": 100,
        "COMP-PWR-02": 100,
        "COMP-ENCL-03": 100,
        "COMP-PCB-04": 100
      },
      "allocated_quantity": 100,
      "unfulfilled_quantity": 0,
      "is_affected": false,
      "missing_components": [],
      "estimated_delay_days": 0,
      "delay_status": "ON_SCHEDULE",
      "explanation": "Fully fulfilled (100/100 units) from usable stock under CRITICAL priority allocation."
    },
    {
      "order_id": "ORD-2026-002",
      "customer_name": "Global Dynamics Automation",
      "product_id": "PROD-X500",
      "order_quantity": 150,
      "priority": "HIGH",
      "scheduled_date": "2026-10-18",
      "due_date": "2026-10-20",
      "component_requirements": {
        "COMP-MCU-01": 150,
        "COMP-PWR-02": 150,
        "COMP-ENCL-03": 150,
        "COMP-PCB-04": 150
      },
      "allocated_quantity": 0,
      "unfulfilled_quantity": 150,
      "is_affected": true,
      "missing_components": [
        "COMP-MCU-01"
      ],
      "estimated_delay_days": null,
      "delay_status": "UNAVAILABLE",
      "explanation": "Completely stalled (0/150 units). Stock depleted for critical component(s): COMP-MCU-01. Requires replenishment."
    },
    {
      "order_id": "ORD-2026-003",
      "customer_name": "Nexus Energy Systems",
      "product_id": "PROD-X500",
      "order_quantity": 100,
      "priority": "MEDIUM",
      "scheduled_date": "2026-10-22",
      "due_date": "2026-10-24",
      "component_requirements": {
        "COMP-MCU-01": 100,
        "COMP-PWR-02": 100,
        "COMP-ENCL-03": 100,
        "COMP-PCB-04": 100
      },
      "allocated_quantity": 0,
      "unfulfilled_quantity": 100,
      "is_affected": true,
      "missing_components": [
        "COMP-MCU-01"
      ],
      "estimated_delay_days": null,
      "delay_status": "UNAVAILABLE",
      "explanation": "Completely stalled (0/100 units). Stock depleted for critical component(s): COMP-MCU-01. Requires replenishment."
    }
  ],
  "allocation_policy": "Deterministic prioritization: 1) Order priority (CRITICAL > HIGH > MEDIUM > LOW), 2) Due date ascending, 3) Scheduled production date ascending, 4) Creation date ascending, 5) Order ID ascending. Orders are allocated discrete finished goods if all mandatory BOM components are simultaneously available.",
  "assumptions_and_limitations": [
    "Usable stock is evaluated strictly as quantity_on_hand minus reserved_quantity at horizon start.",
    "Reserved stock is sequestered for historical commitments and cannot be reallocated.",
    "Assembly operations are limited to exactly one production line with defined daily throughput limits.",
    "Estimated delivery delays for affected orders are labelled UNAVAILABLE until procurement or substitute strategies are committed.",
    "Component demand is strictly derived from single-level BOM definitions with no scrap rate or rework inflation."
  ]
}
```

---

## 8. Decision Support & Strategy Engine (`GET /api/decisions/options`)

### 8.1 Overview
* **Endpoint:** `GET /api/decisions/options`
* **Purpose:** Evaluates four deterministic response options to the shortage, scores them across customer delivery, cost, and operational feasibility using configurable weights, and recommends the top-ranked feasible strategy.
* **Query Parameters (Configurable Weights):**
  * `weight_delivery` (float, default `0.50`): Relative weight for customer fulfillment performance.
  * `weight_cost` (float, default `0.30`): Relative weight for incremental cost efficiency.
  * `weight_ops` (float, default `0.20`): Relative weight for operational simplicity / low execution risk.
* **Status Code:** `200 OK`
* **CORS Origin:** `http://localhost:5173` (with support for `127.0.0.1:5173`)

### 8.2 The Four Mitigation Strategies Evaluated

| Strategy ID | Strategy Name | Type | Feasibility | Feasible Units | Incremental Cost | Customer Fulfillment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`STRAT-EXPEDITED-SUPPLY`** | Expedited Supplier Procurement | `EXPEDITED_SUPPLY` | **Feasible** | **350 / 350** | **$5,625.00** | **100.0%** (All 3 orders on time) |
| **`STRAT-SUBSTITUTION`** | Approved Substitution (`SUB-MCU-01A`) | `SUBSTITUTION` | **Feasible** | **180 / 350** | **$760.00** | **51.4%** (1 on time, 2 unfulfilled) |
| **`STRAT-PARTIAL-PROD`** | Partial Production | `PARTIAL_PRODUCTION` | **Feasible** | **100 / 350** | **$0.00** | **28.6%** (1 on time, 2 unfulfilled) |
| **`STRAT-SCHEDULE-SWAP`** | Schedule Sequence Optimization | `SCHEDULE_SWAP` | **Infeasible** | **100 / 350** | **$0.00** | **28.6%** (Cannot resolve material deficit) |

### 8.3 Scoring & Ranking Model
1. **Hard Feasibility Constraint:**
   * Infeasible options are assigned a composite score of `0.0` and are strictly ranked below all feasible options. An infeasible option is **never** recommended.
2. **Normalized Delivery Score ($S_{\text{delivery}} \in [0, 1]$):**
   $$S_{\text{delivery}} = \max\left(0, \frac{\text{fulfilled\_units}}{\text{total\_demand}} - 0.10 \times \frac{\text{delayed\_orders}}{\text{total\_orders}}\right)$$
3. **Normalized Cost Score ($S_{\text{cost}} \in [0, 1]$):**
   $$S_{\text{cost}} = \max\left(0, 1.0 - \frac{\text{incremental\_cost}}{\text{reference\_shortage\_value}}\right)$$
   *(where $\text{reference\_shortage\_value} = \$10,625.00$ USD)*
4. **Normalized Operational Score ($S_{\text{ops}} \in [0, 1]$):**
   * Standard on-hand execution (Partial Production): `1.00`
   * Vendor shipment coordination (Expedited Supply): `0.85`
   * Engineering ECO substitution validation (Approved Substitution): `0.75`
   * Infeasible (Schedule Swap): `0.00`
5. **Composite Score:**
   $$\text{Composite Score} = w_{\text{del}} \cdot S_{\text{delivery}} + w_{\text{cost}} \cdot S_{\text{cost}} + w_{\text{ops}} \cdot S_{\text{ops}}$$

### 8.4 Sample Response Payload (`GET /api/decisions/options`)

```json
{
  "scenario_id": "SCENARIO-2026-W42",
  "analysis_date": "2026-10-12",
  "weights_applied": {
    "weight_delivery": 0.5,
    "weight_cost": 0.3,
    "weight_ops": 0.2
  },
  "options": [
    {
      "strategy_id": "STRAT-EXPEDITED-SUPPLY",
      "name": "Expedited Supplier Procurement",
      "strategy_type": "EXPEDITED_SUPPLY",
      "is_feasible": true,
      "feasibility_notes": "Fully feasible: Supplier SUPP-SILICO-01 delivers 250 units in 4 days (arrives 2026-10-16). All 3 orders complete on or before due date.",
      "feasible_production_units": 350,
      "incremental_cost": 5625.0,
      "delivery_impact": {
        "total_demand_units": 350,
        "fulfilled_units": 350,
        "unfulfilled_units": 0,
        "fulfillment_rate_pct": 100.0,
        "on_time_orders_count": 3,
        "delayed_orders_count": 0,
        "unfulfilled_orders_count": 0
      },
      "orders_impact": [
        {
          "order_id": "ORD-2026-001",
          "customer_name": "Apex Robotics Corp",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "CRITICAL",
          "scheduled_date": "2026-10-14",
          "due_date": "2026-10-16",
          "allocated_quantity": 100,
          "unfulfilled_quantity": 0,
          "is_fulfilled": true,
          "estimated_completion_date": "2026-10-14",
          "estimated_delay_days": 0,
          "delay_status": "ON_TIME",
          "explanation": "Fully fulfilled (100/100 units) on time. Completed on 2026-10-14 (Due 2026-10-16)."
        },
        {
          "order_id": "ORD-2026-002",
          "customer_name": "Global Dynamics Automation",
          "product_id": "PROD-X500",
          "order_quantity": 150,
          "priority": "HIGH",
          "scheduled_date": "2026-10-18",
          "due_date": "2026-10-20",
          "allocated_quantity": 150,
          "unfulfilled_quantity": 0,
          "is_fulfilled": true,
          "estimated_completion_date": "2026-10-18",
          "estimated_delay_days": 0,
          "delay_status": "ON_TIME",
          "explanation": "Fully fulfilled (150/150 units) on time. Completed on 2026-10-18 (Due 2026-10-20)."
        },
        {
          "order_id": "ORD-2026-003",
          "customer_name": "Nexus Energy Systems",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "MEDIUM",
          "scheduled_date": "2026-10-22",
          "due_date": "2026-10-24",
          "allocated_quantity": 100,
          "unfulfilled_quantity": 0,
          "is_fulfilled": true,
          "estimated_completion_date": "2026-10-22",
          "estimated_delay_days": 0,
          "delay_status": "ON_TIME",
          "explanation": "Fully fulfilled (100/100 units) on time. Completed on 2026-10-22 (Due 2026-10-24)."
        }
      ],
      "risks": [
        "Supplier availability is not contractually guaranteed (is_guaranteed == false).",
        "Premium expedited freight and material expense."
      ],
      "assumptions": [
        "Purchase order issued at scenario start (2026-10-12).",
        "Lead time strictly follows supplier contract (4 calendar days).",
        "Expedited unit cost is $65.00 (+ $22.50 premium per unit)."
      ],
      "scoring": {
        "delivery_score": 1.0,
        "cost_score": 0.4706,
        "operational_score": 0.85,
        "composite_score": 0.8112
      },
      "rank": 1,
      "is_recommended": true
    },
    {
      "strategy_id": "STRAT-SUBSTITUTION",
      "name": "Approved Substitution (SUB-MCU-01A)",
      "strategy_type": "SUBSTITUTION",
      "is_feasible": true,
      "feasibility_notes": "Feasible for 180 units using 80 units of pre-approved substitute SUB-MCU-01A. Leaves 170 units unfulfilled.",
      "feasible_production_units": 180,
      "incremental_cost": 760.0,
      "delivery_impact": {
        "total_demand_units": 350,
        "fulfilled_units": 180,
        "unfulfilled_units": 170,
        "fulfillment_rate_pct": 51.43,
        "on_time_orders_count": 1,
        "delayed_orders_count": 0,
        "unfulfilled_orders_count": 2
      },
      "orders_impact": [
        {
          "order_id": "ORD-2026-001",
          "customer_name": "Apex Robotics Corp",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "CRITICAL",
          "scheduled_date": "2026-10-14",
          "due_date": "2026-10-16",
          "allocated_quantity": 100,
          "unfulfilled_quantity": 0,
          "is_fulfilled": true,
          "estimated_completion_date": "2026-10-14",
          "estimated_delay_days": 0,
          "delay_status": "ON_TIME",
          "explanation": "Fully fulfilled (100/100 units) (100 standard, 0 substitute SUB-MCU-01A)."
        },
        {
          "order_id": "ORD-2026-002",
          "customer_name": "Global Dynamics Automation",
          "product_id": "PROD-X500",
          "order_quantity": 150,
          "priority": "HIGH",
          "scheduled_date": "2026-10-18",
          "due_date": "2026-10-20",
          "allocated_quantity": 80,
          "unfulfilled_quantity": 70,
          "is_fulfilled": false,
          "estimated_completion_date": null,
          "estimated_delay_days": null,
          "delay_status": "UNAVAILABLE",
          "explanation": "Partially fulfilled (80/150 units) using 80 substitute units of SUB-MCU-01A. Remaining 70 units stalled due to stock exhaustion."
        },
        {
          "order_id": "ORD-2026-003",
          "customer_name": "Nexus Energy Systems",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "MEDIUM",
          "scheduled_date": "2026-10-22",
          "due_date": "2026-10-24",
          "allocated_quantity": 0,
          "unfulfilled_quantity": 100,
          "is_fulfilled": false,
          "estimated_completion_date": null,
          "estimated_delay_days": null,
          "delay_status": "UNAVAILABLE",
          "explanation": "Unfulfilled (0/100 units). All standard and substitute stock consumed."
        }
      ],
      "risks": [
        "Substitute SUB-MCU-01A quantity (80) is insufficient for total demand.",
        "Requires ECO sign-off verification on line before feeding parts."
      ],
      "assumptions": [
        "Only SUB-MCU-01A is used; unapproved substitute SUB-MCU-01B is rejected.",
        "Unit cost difference is $9.50 per substitute part."
      ],
      "scoring": {
        "delivery_score": 0.5143,
        "cost_score": 0.9285,
        "operational_score": 0.75,
        "composite_score": 0.6857
      },
      "rank": 2,
      "is_recommended": false
    },
    {
      "strategy_id": "STRAT-PARTIAL-PROD",
      "name": "Partial Production (Baseline Stock Allocation)",
      "strategy_type": "PARTIAL_PRODUCTION",
      "is_feasible": true,
      "feasibility_notes": "Immediately executable using physical warehouse inventory without external spend.",
      "feasible_production_units": 100,
      "incremental_cost": 0.0,
      "delivery_impact": {
        "total_demand_units": 350,
        "fulfilled_units": 100,
        "unfulfilled_units": 250,
        "fulfillment_rate_pct": 28.57,
        "on_time_orders_count": 1,
        "delayed_orders_count": 0,
        "unfulfilled_orders_count": 2
      },
      "orders_impact": [
        {
          "order_id": "ORD-2026-001",
          "customer_name": "Apex Robotics Corp",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "CRITICAL",
          "scheduled_date": "2026-10-14",
          "due_date": "2026-10-16",
          "allocated_quantity": 100,
          "unfulfilled_quantity": 0,
          "is_fulfilled": true,
          "estimated_completion_date": "2026-10-14",
          "estimated_delay_days": 0,
          "delay_status": "ON_TIME",
          "explanation": "Fully fulfilled (100/100 units) from on-hand stock."
        },
        {
          "order_id": "ORD-2026-002",
          "customer_name": "Global Dynamics Automation",
          "product_id": "PROD-X500",
          "order_quantity": 150,
          "priority": "HIGH",
          "scheduled_date": "2026-10-18",
          "due_date": "2026-10-20",
          "allocated_quantity": 0,
          "unfulfilled_quantity": 150,
          "is_fulfilled": false,
          "estimated_completion_date": null,
          "estimated_delay_days": null,
          "delay_status": "UNAVAILABLE",
          "explanation": "Unfulfilled (150 units remaining). Blocked by stock depletion. Delay is UNAVAILABLE because no replenishment is scheduled under partial production."
        },
        {
          "order_id": "ORD-2026-003",
          "customer_name": "Nexus Energy Systems",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "MEDIUM",
          "scheduled_date": "2026-10-22",
          "due_date": "2026-10-24",
          "allocated_quantity": 0,
          "unfulfilled_quantity": 100,
          "is_fulfilled": false,
          "estimated_completion_date": null,
          "estimated_delay_days": null,
          "delay_status": "UNAVAILABLE",
          "explanation": "Unfulfilled (100 units remaining). Blocked by stock depletion. Delay is UNAVAILABLE because no replenishment is scheduled under partial production."
        }
      ],
      "risks": [
        "Severe customer relationship damage for unfulfilled orders.",
        "Potential contract delivery penalties on unfulfilled commitments."
      ],
      "assumptions": [
        "Prioritizes CRITICAL orders ahead of lower priority orders.",
        "No incoming supplier orders or substitutions are initiated."
      ],
      "scoring": {
        "delivery_score": 0.2857,
        "cost_score": 1.0,
        "operational_score": 1.0,
        "composite_score": 0.6428
      },
      "rank": 3,
      "is_recommended": false
    },
    {
      "strategy_id": "STRAT-SCHEDULE-SWAP",
      "name": "Schedule Sequence Optimization (Order Reordering)",
      "strategy_type": "SCHEDULE_SWAP",
      "is_feasible": false,
      "feasibility_notes": "Infeasible as a standalone shortage resolution. In a single-product line with 100 units of on-hand component stock, reordering production runs cannot fulfill the 250-unit deficit.",
      "feasible_production_units": 100,
      "incremental_cost": 0.0,
      "delivery_impact": {
        "total_demand_units": 350,
        "fulfilled_units": 100,
        "unfulfilled_units": 250,
        "fulfillment_rate_pct": 28.57,
        "on_time_orders_count": 1,
        "delayed_orders_count": 0,
        "unfulfilled_orders_count": 2
      },
      "orders_impact": [
        {
          "order_id": "ORD-2026-001",
          "customer_name": "Apex Robotics Corp",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "CRITICAL",
          "scheduled_date": "2026-10-14",
          "due_date": "2026-10-16",
          "allocated_quantity": 100,
          "unfulfilled_quantity": 0,
          "is_fulfilled": true,
          "estimated_completion_date": "2026-10-14",
          "estimated_delay_days": 0,
          "delay_status": "ON_TIME",
          "explanation": "Rescheduling cannot generate missing components. Fulfilled from on-hand stock."
        },
        {
          "order_id": "ORD-2026-002",
          "customer_name": "Global Dynamics Automation",
          "product_id": "PROD-X500",
          "order_quantity": 150,
          "priority": "HIGH",
          "scheduled_date": "2026-10-18",
          "due_date": "2026-10-20",
          "allocated_quantity": 0,
          "unfulfilled_quantity": 150,
          "is_fulfilled": false,
          "estimated_completion_date": null,
          "estimated_delay_days": null,
          "delay_status": "UNAVAILABLE",
          "explanation": "Rescheduling cannot generate missing components. Remains stalled due to deficit."
        },
        {
          "order_id": "ORD-2026-003",
          "customer_name": "Nexus Energy Systems",
          "product_id": "PROD-X500",
          "order_quantity": 100,
          "priority": "MEDIUM",
          "scheduled_date": "2026-10-22",
          "due_date": "2026-10-24",
          "allocated_quantity": 0,
          "unfulfilled_quantity": 100,
          "is_fulfilled": false,
          "estimated_completion_date": null,
          "estimated_delay_days": null,
          "delay_status": "UNAVAILABLE",
          "explanation": "Rescheduling cannot generate missing components. Remains stalled due to deficit."
        }
      ],
      "risks": [
        "Violates customer priority commitments without increasing aggregate throughput.",
        "Schedule churn without resolving physical component deficit."
      ],
      "assumptions": [
        "Assembly line throughput is capped at 50 units/day.",
        "All production orders assemble the identical finished product (PROD-X500)."
      ],
      "scoring": {
        "delivery_score": 0.0,
        "cost_score": 0.0,
        "operational_score": 0.0,
        "composite_score": 0.0
      },
      "rank": 4,
      "is_recommended": false
    }
  ],
  "recommended_option": {
    "strategy_id": "STRAT-EXPEDITED-SUPPLY",
    "name": "Expedited Supplier Procurement",
    "strategy_type": "EXPEDITED_SUPPLY",
    "is_feasible": true,
    "feasibility_notes": "Fully feasible: Supplier SUPP-SILICO-01 delivers 250 units in 4 days (arrives 2026-10-16). All 3 orders complete on or before due date.",
    "feasible_production_units": 350,
    "incremental_cost": 5625.0,
    "delivery_impact": {
      "total_demand_units": 350,
      "fulfilled_units": 350,
      "unfulfilled_units": 0,
      "fulfillment_rate_pct": 100.0,
      "on_time_orders_count": 3,
      "delayed_orders_count": 0,
      "unfulfilled_orders_count": 0
    },
    "orders_impact": [
      {
        "order_id": "ORD-2026-001",
        "customer_name": "Apex Robotics Corp",
        "product_id": "PROD-X500",
        "order_quantity": 100,
        "priority": "CRITICAL",
        "scheduled_date": "2026-10-14",
        "due_date": "2026-10-16",
        "allocated_quantity": 100,
        "unfulfilled_quantity": 0,
        "is_fulfilled": true,
        "estimated_completion_date": "2026-10-14",
        "estimated_delay_days": 0,
        "delay_status": "ON_TIME",
        "explanation": "Fully fulfilled (100/100 units) on time. Completed on 2026-10-14 (Due 2026-10-16)."
      },
      {
        "order_id": "ORD-2026-002",
        "customer_name": "Global Dynamics Automation",
        "product_id": "PROD-X500",
        "order_quantity": 150,
        "priority": "HIGH",
        "scheduled_date": "2026-10-18",
        "due_date": "2026-10-20",
        "allocated_quantity": 150,
        "unfulfilled_quantity": 0,
        "is_fulfilled": true,
        "estimated_completion_date": "2026-10-18",
        "estimated_delay_days": 0,
        "delay_status": "ON_TIME",
        "explanation": "Fully fulfilled (150/150 units) on time. Completed on 2026-10-18 (Due 2026-10-20)."
      },
      {
        "order_id": "ORD-2026-003",
        "customer_name": "Nexus Energy Systems",
        "product_id": "PROD-X500",
        "order_quantity": 100,
        "priority": "MEDIUM",
        "scheduled_date": "2026-10-22",
        "due_date": "2026-10-24",
        "allocated_quantity": 100,
        "unfulfilled_quantity": 0,
        "is_fulfilled": true,
        "estimated_completion_date": "2026-10-22",
        "estimated_delay_days": 0,
        "delay_status": "ON_TIME",
        "explanation": "Fully fulfilled (100/100 units) on time. Completed on 2026-10-22 (Due 2026-10-24)."
      }
    ],
    "risks": [
      "Supplier availability is not contractually guaranteed (is_guaranteed == false).",
      "Premium expedited freight and material expense."
    ],
    "assumptions": [
      "Purchase order issued at scenario start (2026-10-12).",
      "Lead time strictly follows supplier contract (4 calendar days).",
      "Expedited unit cost is $65.00 (+ $22.50 premium per unit)."
    ],
    "scoring": {
      "delivery_score": 1.0,
      "cost_score": 0.4706,
      "operational_score": 0.85,
      "composite_score": 0.8112
    },
    "rank": 1,
    "is_recommended": true
  },
  "recommendation_summary": "Recommended Strategy: Expedited Supplier Procurement (STRAT-EXPEDITED-SUPPLY). Achieves 100.0% customer fulfillment (350/350 units) with an incremental investment of $5625.00 USD (Composite Score: 0.811).",
  "tradeoff_analysis": "Trade-off Summary: Expedited Supply maximizes customer fulfillment (100% on-time delivery across all 3 orders) at an incremental cost of $5,625.00 USD. Substitution offers lower cost ($760.00 USD) but only partially covers demand (51.4% fulfillment, leaving 170 units unfulfilled). Partial Production incurs zero additional spend but stalls 71.4% of customer demand (250 units). Schedule Swap cannot resolve physical component deficits in a single-line scenario."
}
```

---

## 9. Phase 5 — Recommendation Explanation & Simulated Approval

### 9.1 Structured Recommendation Explanation Endpoint (`GET /api/decisions/explanation`)

* **Endpoint:** `GET /api/decisions/explanation`
* **Purpose:** Returns a structured, evidence-based explanation detailing why the top-ranked strategy was selected, its feasibility and supporting metrics, cost and customer-delivery impact, key assumptions, operational risks, comparative reasons why lower-ranked options did not win, and data limitations affecting confidence.
* **Query Parameters:** Supports identical decision weighting parameters (`weight_delivery`, `weight_cost`, `weight_ops`).
* **Status Code:** `200 OK`

#### Sample Response Payload (`GET /api/decisions/explanation`)

```json
{
  "scenario_id": "SCENARIO-2026-W42",
  "recommended_strategy_id": "STRAT-EXPEDITED-SUPPLY",
  "recommended_strategy_name": "Expedited Supplier Procurement",
  "is_feasible": true,
  "selection_rationale": "Expedited Supplier Procurement (STRAT-EXPEDITED-SUPPLY) was selected as the optimal response option because it achieves a 100.0% customer fulfillment rate (350/350 units) with 100% on-time delivery across all 3 customer orders. It achieved the highest composite score of 0.8112 under delivery-prioritized decision weighting (delivery: 0.5, cost: 0.3, ops: 0.2).",
  "supporting_metrics": {
    "feasible_production_units": 350,
    "total_demand_units": 350,
    "fulfillment_rate_pct": 100.0,
    "on_time_orders_count": 3,
    "delayed_orders_count": 0,
    "unfulfilled_orders_count": 0,
    "incremental_cost_usd": 5625.0,
    "composite_score": 0.8112,
    "delivery_score": 1.0,
    "cost_score": 0.4706,
    "operational_score": 0.85
  },
  "cost_and_delivery_impact": "The strategy incurs an incremental premium cost of $5,625.00 ($22.50 per unit premium for 250 expedited microcontrollers from Silico Components). In return, all 3 customer orders (ORD-2026-001, ORD-2026-002, ORD-2026-003) complete on or before their contractual due dates with zero unfulfilled demand.",
  "key_assumptions": [
    "Purchase order issued at scenario start (2026-10-12).",
    "Lead time strictly follows supplier contract (4 calendar days).",
    "Expedited unit cost is $65.00 (+ $22.50 premium per unit)."
  ],
  "key_risks": [
    "Supplier availability is not contractually guaranteed (is_guaranteed == false).",
    "Premium expedited freight and material expense."
  ],
  "lower_ranked_strategies_comparison": [
    {
      "strategy_id": "STRAT-PARTIAL-PROD",
      "name": "Partial Production (Baseline Stock Allocation)",
      "rank": 2,
      "is_feasible": true,
      "score": 0.6428,
      "reasons": [
        "Produces only 100 of 350 required units (28.6% fulfillment rate).",
        "Leaves 250 units unfulfilled across ORD-2026-002 and ORD-2026-003.",
        "Lower delivery score (0.2857 vs 1.0000) results in rank #2 despite zero incremental cost."
      ]
    },
    {
      "strategy_id": "STRAT-SUBSTITUTION",
      "name": "Approved Substitution (SUB-MCU-01A)",
      "rank": 3,
      "is_feasible": true,
      "score": 0.6857,
      "reasons": [
        "Produces only 180 of 350 required units (51.4% fulfillment rate).",
        "Substitute SUB-MCU-01A is limited to 80 on-hand units, leaving 170 units unfulfilled.",
        "Higher operational risk penalty results in lower overall rank when delivery is prioritized."
      ]
    },
    {
      "strategy_id": "STRAT-SCHEDULE-SWAP",
      "name": "Schedule Sequence Optimization (Order Reordering)",
      "rank": 4,
      "is_feasible": false,
      "score": 0.0,
      "reasons": [
        "Operationally infeasible (0 units produced).",
        "No approved substitute component exists for Smart Thermostat (PROD-STAT-01).",
        "Failed feasibility check and received composite score of 0.0000 (rank #4)."
      ]
    }
  ],
  "data_limitations": [
    "Supplier lead time (4 business days) is based on supplier quote and does not include expedited customs clearance or transit delay buffers.",
    "Component unit costs reflect primary single-level BOM items; sub-tier supplier cost volatility is unmonitored.",
    "Assembly line throughput assumes constant 50 units/day without accounting for line changeover downtime between product variants."
  ]
}
```

---

### 9.2 Simulated Decision Approval Endpoint (`POST /api/decisions/approve`)

* **Endpoint:** `POST /api/decisions/approve`
* **Purpose:** Validates and records an approval or rejection for a target mitigation strategy.
* **Request Body:**
```json
{
  "strategy_id": "STRAT-EXPEDITED-SUPPLY",
  "action": "approve",
  "reviewer_note": "Approved by Plant Operations Manager."
}
```
* **Validation Rules:**
  1. **Unknown Strategy ID:** If `strategy_id` does not match any candidate option in the scenario, returns `HTTP 400 Bad Request`.
  2. **Infeasible Strategy Approval Constraint:** Attempting to approve an infeasible strategy (e.g. `STRAT-SCHEDULE-SWAP`) returns `HTTP 400 Bad Request`. *Note: Rejecting an infeasible strategy is permitted.*
  3. **Data Validation:** Rejects missing or malformed payload fields with standard Pydantic validation errors (`HTTP 422 Unprocessable Entity`).
* **Successful Response:** `HTTP 200 OK` returning the recorded `DecisionRecord`.

#### Sample Approval Response (`POST /api/decisions/approve`)

```json
{
  "decision_id": "DEC-A81F93B2",
  "scenario_id": "SCENARIO-2026-W42",
  "selected_strategy_id": "STRAT-EXPEDITED-SUPPLY",
  "strategy_name": "Expedited Supplier Procurement",
  "status": "approved",
  "is_feasible": true,
  "reviewer_note": "Approved by Plant Operations Manager.",
  "created_at": "2026-10-09T20:25:00.123456+00:00",
  "decided_at": "2026-10-09T20:25:00.123456+00:00",
  "version": 1,
  "policy_notes": "Initial decision record created with status 'approved' for strategy 'STRAT-EXPEDITED-SUPPLY' at audit version v1."
}
```

---

### 9.3 Current Decision Status Endpoint (`GET /api/decisions/current`)

* **Endpoint:** `GET /api/decisions/current`
* **Purpose:** Retrieves the current active decision record and approval state.
* **Status Code:** `200 OK`

#### Response When Pending (Before Any Approval Action)

```json
{
  "has_decision": false,
  "status": "pending",
  "decision": null,
  "message": "No decision action has been recorded yet for scenario SCN-2026-001."
}
```

#### Response After Approval Action

```json
{
  "has_decision": true,
  "status": "approved",
  "decision": {
    "decision_id": "DEC-A81F93B2",
    "scenario_id": "SCENARIO-2026-W42",
    "selected_strategy_id": "STRAT-EXPEDITED-SUPPLY",
    "strategy_name": "Expedited Supplier Procurement",
    "status": "approved",
    "is_feasible": true,
    "reviewer_note": "Approved by Plant Operations Manager.",
    "created_at": "2026-10-09T20:25:00.123456+00:00",
    "decided_at": "2026-10-09T20:25:00.123456+00:00",
    "version": 1,
    "policy_notes": "Initial decision record created with status 'approved' for strategy 'STRAT-EXPEDITED-SUPPLY' at audit version v1."
  },
  "message": "Active decision recorded: APPROVED for strategy 'STRAT-EXPEDITED-SUPPLY'."
}
```

---

### 9.4 Repeated Action & State Transition Policy

The system enforces a clear, deterministic policy for handling repeated approval/rejection submissions:

1. **Exact Duplicate Action (Same Strategy & Status):**
   * If a reviewer submits an identical action (e.g. approving `STRAT-EXPEDITED-SUPPLY` again), the system updates `decided_at` and `reviewer_note` without incrementing the audit `version` number.
2. **State Transition or Strategy Change:**
   * If a reviewer changes the selected strategy (e.g., from `STRAT-EXPEDITED-SUPPLY` to `STRAT-PARTIAL-PROD`) or changes the action (e.g., from `approved` to `rejected`), the active record transitions state, increments the audit `version` ($v1 \rightarrow v2$), retains the original `created_at` timestamp, and appends a transition audit note.
3. **Infeasibility Guardrail:**
   * Infeasible options (e.g. `STRAT-SCHEDULE-SWAP`) can **never** be approved, regardless of prior state. Attempting to approve an infeasible option is rejected immediately before mutating state.



