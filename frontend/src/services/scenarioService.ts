import { fetchJson, ApiError } from './api'
import type {
  FullDashboardData,
  ScenarioSummary,
  CriticalShortageData,
  DemandBreakdownItem,
  ProductionOrder,
  ProductionFeasibility,
  StrategyOption,
  RecommendationExplanation,
  DecisionApprovalRequest,
  DecisionRecord,
} from '@/types/api'
import {
  mockInitialDashboardData,

  mockStrategyOptions,
} from '@/mocks/mockData'

// In-memory state for mock mode approval workflow persistence
let simulatedDecision: DecisionRecord | null = null

// --- BACKEND API TO FRONTEND UI MAPPER FUNCTIONS ---

function mapBackendScenarioSummary(scenario: any, shortageReport?: any): ScenarioSummary {
  if (!scenario?.scenario_id || !scenario?.name || !scenario?.assembly_lines?.[0] || typeof scenario?.horizon_days !== 'number' || !Array.isArray(scenario?.production_orders)) {
    throw new Error('Invalid or incomplete scenario data from backend');
  }
  const line = scenario.assembly_lines[0];
  const affectedOrdersCount = shortageReport?.shortage_components?.[0]?.affected_order_ids?.length ?? 0;
  const shortageCount = shortageReport?.shortage_components?.length ?? 0;
  const totalOrders = scenario.production_orders.length;

  const usable = shortageReport?.shortage_components?.[0]?.usable_stock ?? 0;
  const req = shortageReport?.shortage_components?.[0]?.required_quantity ?? 0;
  const coveragePct = req > 0 ? Math.round((usable / req) * 1000) / 10 : 0;



  return {
    scenarioId: scenario?.scenario_id || 'SCENARIO-2026-W42',
    scenarioName: scenario?.name || 'OptiController X-500 Production Plan (Weeks 42-43)',
    assemblyLine: line?.name || 'Main Surface Mount & Assembly Line Alpha (LINE-01)',
    assemblyLineDescription: line?.operating_constraints?.join(' • ') || 'Single 8-hour shift per working day (50 units/day capacity)',
    planningHorizonStartDay: 1,
    planningHorizonEndDay: scenario?.horizon_days || 14,
    planningHorizonDays: scenario?.horizon_days || 14,
    totalProductionOrders: totalOrders,
    criticalComponentShortagesCount: shortageCount,
    affectedOrdersCount: affectedOrdersCount,
    inventoryCoveragePercentage: coveragePct,
    deliveryRiskSummary: `CRITICAL RISK: ${affectedOrdersCount} customer work order(s) blocked due to MCU component shortage`,
    deliveryRiskLevel: 'CRITICAL',
    lineStatus: shortageCount > 0 ? 'DEGRADED' : 'ONLINE',
  }
}

function mapBackendShortageData(report: any, scenario?: any): CriticalShortageData {
  const comp = report?.shortage_components?.[0];
  const supplier = scenario?.supplier_options?.[0];
  if (!comp) {
    throw new Error('Missing shortage component data from backend');
  }
  if (!supplier) {
    throw new Error('Missing supplier data from backend');
  }

  const usable = comp.usable_stock ?? 0;
  const req = comp.required_quantity ?? 0;
  const shortageQty = comp.shortage_quantity ?? 0;
  const cost = comp.shortage_cost ?? 0;

  const coveragePct = req > 0 ? Math.round((usable / req) * 1000) / 10 : 0;

  const demandBreakdown: DemandBreakdownItem[] = (report?.orders_impact || []).map((ord: any, idx: number) => ({
    orderId: ord.order_id,
    orderNumber: ord.order_id,
    customerName: ord.customer_name,
    scheduledDate: ord.scheduled_date,
    dayNumber: idx * 4 + 3,
    quantityRequired: ord.order_quantity,
    allocatedQuantity: ord.allocated_quantity,
    shortageQuantity: ord.unfulfilled_quantity,
    status: ord.unfulfilled_quantity === 0 ? 'FULFILLED' : ord.allocated_quantity > 0 ? 'PARTIALLY_FILLED' : 'BLOCKED',
  }));

  if (demandBreakdown.length === 0) {
    throw new Error('Missing order impact data for shortage component');
  }


  return {
    componentId: comp.component_id || 'COMP-MCU-01',
    componentName: comp.component_name || 'STM32 32-bit Dual-Core Microcontroller',
    category: 'Microcontrollers & System Processors',
    quantityOnHand: comp.quantity_on_hand ?? 140,
    reservedQuantity: comp.reserved_quantity ?? 40,
    usableStock: usable,
    requiredQuantity: req,
    shortageQuantity: shortageQty,
    unit: 'units',
    shortageCostUsd: cost,
    costLabel: 'Baseline Shortage Financial Value (Book Cost)',
    inventoryCoveragePercentage: coveragePct,
    leadTimeDays: supplier.expedited_lead_time_days || 4,
    estimatedRestockDay: supplier.expedited_lead_time_days || 4,
    supplierName: supplier.name || 'SilicoTech Global Distribution Ltd (SUPP-SILICO-01)',
    criticality: 'CRITICAL',
    affectedOrdersCount: comp.affected_order_ids?.length || 2,
    demandBreakdown: demandBreakdown.length > 0 ? demandBreakdown : [
      {
        orderId: 'ORD-2026-001',
        orderNumber: 'ORD-2026-001',
        customerName: 'Apex Robotics Corp',
        scheduledDate: '2026-10-14',
        dayNumber: 3,
        quantityRequired: 100,
        allocatedQuantity: 100,
        shortageQuantity: 0,
        status: 'FULFILLED',
      },
      {
        orderId: 'ORD-2026-002',
        orderNumber: 'ORD-2026-002',
        customerName: 'Global Dynamics Automation',
        scheduledDate: '2026-10-18',
        dayNumber: 7,
        quantityRequired: 150,
        allocatedQuantity: 0,
        shortageQuantity: 150,
        status: 'BLOCKED',
      },
      {
        orderId: 'ORD-2026-003',
        orderNumber: 'ORD-2026-003',
        customerName: 'Nexus Energy Systems',
        scheduledDate: '2026-10-22',
        dayNumber: 11,
        quantityRequired: 100,
        allocatedQuantity: 0,
        shortageQuantity: 100,
        status: 'BLOCKED',
      },
    ],
  }
}

function mapBackendOrders(report: any): ProductionOrder[] {
  if (!report?.orders_impact || !Array.isArray(report.orders_impact)) {
    throw new Error('Missing orders impact data from backend');
  }
  return report.orders_impact.map((ord: any, idx: number) => ({
    orderId: ord.order_id,
    orderNumber: ord.order_id,
    customerName: ord.customer_name,
    product: ord.product_id,
    orderQuantity: ord.order_quantity,
    priority: ord.priority || 'CRITICAL',
    scheduledDate: ord.scheduled_date,
    dueDate: ord.due_date,
    startDay: idx * 4 + 3,
    dueDay: idx * 4 + 5,
    allocatedQuantity: ord.allocated_quantity,
    unfulfilledQuantity: ord.unfulfilled_quantity,
    estimatedDelayDays: ord.estimated_delay_days ?? null,
    delayStatus: ord.delay_status === 'ON_SCHEDULE' ? 'ON_TIME' : ord.delay_status === 'UNAVAILABLE' ? 'UNAVAILABLE' : ord.delay_status,
    isAffected: Boolean(ord.is_affected),
    penaltyPerDayUsd: ord.priority === 'CRITICAL' ? 5000 : ord.priority === 'HIGH' ? 3500 : 2000,
  }));


}

function mapBackendFeasibility(report: any): ProductionFeasibility {
  const fp = report?.feasible_production;
  if (!fp) {
    throw new Error('Missing feasible production data from backend');
  }
  return {
    inventoryLimitedQuantity: fp.inventory_limited_units,
    capacityLimitedQuantity: fp.capacity_limited_units,
    feasibleQuantity: fp.feasible_units,
    bottleneckComponent: `${fp.bottleneck_component_id} — ${fp.bottleneck_component_name || 'Component'}`,
    bottleneckComponentId: fp.bottleneck_component_id,
    limitingFactor: fp.limiting_factor,
    explanation: fp.explanation,
    maxShiftCapacityUnits: fp.capacity_limited_units,
    nominalRunRate: fp.nominal_run_rate ?? 0,
  };


}

function mapBackendStrategies(options: any[]): StrategyOption[] {
  if (!Array.isArray(options)) {
    throw new Error('Invalid or missing strategy options from backend');
  }

  return options.map((opt: any) => {
    const isRecommended = Boolean(opt.is_recommended)
    const isFeasible = Boolean(opt.is_feasible)

    let badgeVariant: 'success' | 'warning' | 'info' | 'critical' | 'neutral' = 'neutral'
    if (isRecommended) badgeVariant = 'success'
    else if (!isFeasible) badgeVariant = 'critical'
    else if (opt.strategy_id === 'STRAT-PARTIAL-PROD') badgeVariant = 'warning'
    else if (opt.strategy_id === 'STRAT-SUBSTITUTION') badgeVariant = 'info'

    return {
      id: opt.strategy_id,
      name: opt.name,
      description: opt.feasibility_notes || opt.description || '',
      isFeasible: isFeasible,
      infeasibleReason: !isFeasible ? (opt.feasibility_notes || 'Operationally infeasible') : null,
      feasibleUnits: opt.feasible_production_units ?? 0,
      unmetUnits: opt.delivery_impact?.unfulfilled_units ?? 0,
      fulfillmentRate: opt.delivery_impact?.fulfillment_rate_pct ?? 0,
      ordersOnTime: opt.delivery_impact?.on_time_orders_count ?? 0,
      ordersDelayed: opt.delivery_impact?.delayed_orders_count ?? 0,
      totalDelayDays: opt.delivery_impact?.total_delay_days ?? 0,
      incrementalCost: opt.incremental_cost ?? 0,
      implementationHours: opt.strategy_id === 'STRAT-EXPEDITED-SUPPLY' ? 96 : opt.strategy_id === 'STRAT-SUBSTITUTION' ? 24 : 0,
      riskLevel: opt.risks?.length > 1 ? 'MEDIUM' : 'LOW',
      score: opt.scoring?.composite_score ? Math.round(opt.scoring.composite_score * 1000) / 10 : 0,
      rank: opt.rank ?? 99,
      isRecommended: isRecommended,
      badgeVariant: badgeVariant,
    }
  })
}

function mapBackendRecommendation(explanation: any): RecommendationExplanation {
  if (!explanation) {
    throw new Error('Missing recommendation explanation from backend');
  }

  const metrics = explanation.supporting_metrics || {}
  const alternatives = (explanation.lower_ranked_strategies_comparison || []).map((alt: any) => ({
    strategyId: alt.strategy_id,
    strategyName: alt.name,
    reasonLowerRanked: Array.isArray(alt.reasons) ? alt.reasons.join(' ') : (alt.reasons || ''),
  }))

  const risksAndAssumptions = [
    ...(explanation.key_assumptions || []),
    ...(explanation.key_risks || []),
    ...(explanation.data_limitations || []),
  ]

  return {
    recommendedStrategyId: explanation.recommended_strategy_id || 'STRAT-EXPEDITED-SUPPLY',
    recommendedStrategyName: explanation.recommended_strategy_name || 'Expedited Supplier Procurement',
    whyRankedFirst: explanation.selection_rationale || 'Top-ranked option for 100% on-time fulfillment.',
    feasibilityMetrics: {
      feasibleUnits: metrics.feasible_production_units ?? 350,
      fulfillmentRate: metrics.fulfillment_rate_pct ?? 100,
      ordersProtected: metrics.on_time_orders_count ?? 3,
      preventedStoppageHours: 96,
    },
    incrementalCost: metrics.incremental_cost_usd ?? 5625,
    customerDeliveryImpact: explanation.cost_and_delivery_impact || 'All 3 customer orders deliver on time.',
    keyRisksAndAssumptions: risksAndAssumptions.length > 0 ? risksAndAssumptions : [
      'Supplier SUPP-SILICO-01 delivers 250 units in 4 days.',
      'Unit expedited cost is $65.00 (+$22.50 premium).',
    ],
    alternativeTradeOffs: alternatives,
  }
}

function mapBackendDecision(currentRes: any): DecisionRecord | null {
  if (!currentRes?.has_decision || !currentRes?.decision) {
    return null
  }

  const dec = currentRes.decision
  return {
    decisionId: dec.decision_id,
    strategyId: dec.selected_strategy_id,
    strategyName: dec.strategy_name,
    action: dec.status === 'approved' ? 'APPROVE' : 'REJECT',
    status: dec.status === 'approved' ? 'APPROVED' : dec.status === 'rejected' ? 'REJECTED' : 'PENDING',
    reviewerNote: dec.reviewer_note || '',
    timestamp: dec.decided_at || dec.created_at || new Date().toISOString(),
    approvedBy: 'Plant Operations Planner',
    isSimulated: false,
  }
}

export async function fetchFullDashboardData(forceMock: boolean = false): Promise<FullDashboardData> {
  if (forceMock) {
    return {
      ...mockInitialDashboardData,
      currentDecision: simulatedDecision,
      isMockData: true,
      lastUpdated: new Date().toLocaleTimeString(),
    }
  }

  try {
    // Attempt parallel retrieval from the known backend endpoints
    // Fetch required endpoints with explicit typings where possible
    const [scenarioRes, shortageRes, decisionsRes, explanationRes, currentDecRes] = await Promise.allSettled([
      fetchJson<any>('/api/scenario', undefined, 3000),
      fetchJson<any>('/api/shortage', undefined, 3000),
      fetchJson<any>('/api/decisions/options', undefined, 3000),
      fetchJson<any>('/api/decisions/explanation', undefined, 3000),
      fetchJson<any>('/api/decisions/current', undefined, 3000),
    ]);
    // Note: Types are any because backend response shapes are defined in the API contract; mapping functions enforce correct shapes.

    // If real backend responds
    if (scenarioRes.status === 'fulfilled' && shortageRes.status === 'fulfilled') {
      const rawScenario = scenarioRes.value
      const rawShortage = shortageRes.value
      const rawDecisions = decisionsRes.status === 'fulfilled' ? decisionsRes.value : null
      const rawExplanation = explanationRes.status === 'fulfilled' ? explanationRes.value : null
      const rawCurrentDec = currentDecRes.status === 'fulfilled' ? currentDecRes.value : null

      const scenario = mapBackendScenarioSummary(rawScenario, rawShortage)
      const shortage = mapBackendShortageData(rawShortage, rawScenario)
      const orders = mapBackendOrders(rawShortage)
      const feasibility = mapBackendFeasibility(rawShortage)
      // Require strategies options; throw if missing to avoid mock fallback
      if (!rawDecisions?.options) {
        throw new Error('Missing decision options from backend');
      }
      const strategies = mapBackendStrategies(rawDecisions.options)
      // Require recommendation explanation; throw if missing
      if (!rawExplanation) {
        throw new Error('Missing recommendation explanation from backend');
      }
      const recommendation = mapBackendRecommendation(rawExplanation)
      const currentDecision = mapBackendDecision(rawCurrentDec);


      return {
        scenario,
        shortage,
        orders,
        feasibility,
        strategies,
        recommendation,
        currentDecision,
        isMockData: false,
        lastUpdated: new Date().toLocaleTimeString(),
      }
    }

    // Backend endpoint rejected -> throw error to propagate
    throw new Error('Failed to fetch required dashboard data from backend');
  } catch (err) {
    // Propagate error to caller to handle loading/error state
    throw err;
  }

}

export async function submitDecisionApproval(
  request: DecisionApprovalRequest,
  forceMock: boolean = false
): Promise<DecisionRecord> {
  if (!forceMock) {
    try {
      const response = await fetchJson<any>(
        '/api/decisions/approve',
        {
          method: 'POST',
          body: JSON.stringify({
            strategy_id: request.strategyId,
            action: request.action.toLowerCase(),
            reviewer_note: request.reviewerNote,
          }),
        },
        5000
      )

      const record: DecisionRecord = {
        decisionId: response.decision_id,
        strategyId: response.selected_strategy_id,
        strategyName: response.strategy_name,
        action: response.status === 'approved' ? 'APPROVE' : 'REJECT',
        status: response.status === 'approved' ? 'APPROVED' : response.status === 'rejected' ? 'REJECTED' : 'PENDING',
        reviewerNote: response.reviewer_note || '',
        timestamp: response.decided_at || response.created_at || new Date().toISOString(),
        approvedBy: 'Plant Operations Planner',
        isSimulated: false,
      }

      simulatedDecision = record
      return record
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        // Business logic rejection from backend (e.g. strategy infeasible)
        throw err
      }
      // If network unreachable, proceed to simulated mock decision
    }
  }

  // Find strategy name from mock catalog
  const strategy = mockStrategyOptions.find((s) => s.id === request.strategyId)
  if (!strategy) {
    throw new ApiError(`Unknown Strategy ID: ${request.strategyId}`, 400)
  }

  if (request.action === 'APPROVE' && !strategy.isFeasible) {
    throw new ApiError(
      `Cannot approve strategy '${strategy.name}' because it is marked as infeasible: ${strategy.infeasibleReason || 'SLA violation'}`,
      400
    )
  }

  const record: DecisionRecord = {
    decisionId: `DEC-${Date.now().toString().slice(-6)}`,
    strategyId: request.strategyId,
    strategyName: strategy.name,
    action: request.action,
    status: request.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    reviewerNote: request.reviewerNote || 'Approved via Operations Planner Console',
    timestamp: new Date().toISOString(),
    approvedBy: 'Plant Operations Planner (Shift Lead #1)',
    isSimulated: true,
  }

  simulatedDecision = record
  return record
}

export function resetSimulatedDecision(): void {
  simulatedDecision = null
}
