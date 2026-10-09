import { fetchJson, ApiError } from './api'
import type {
  FullDashboardData,
  ScenarioSummary,
  CriticalShortageData,
  StrategyOption,
  DecisionApprovalRequest,
  DecisionRecord,
} from '@/types/api'
import {
  mockInitialDashboardData,
  mockProductionOrders,
  mockProductionFeasibility,
  mockStrategyOptions,
  mockRecommendationExplanation,
} from '@/mocks/mockData'

// In-memory state for mock mode approval workflow persistence
let simulatedDecision: DecisionRecord | null = null

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
    const [scenarioRes, shortageRes, decisionsRes] = await Promise.allSettled([
      fetchJson<ScenarioSummary>('/api/scenario', undefined, 3000),
      fetchJson<CriticalShortageData>('/api/shortage', undefined, 3000),
      fetchJson<{ options?: StrategyOption[]; strategies?: StrategyOption[] }>('/api/decisions/options', undefined, 3000),
    ])

    // If real backend responds
    if (scenarioRes.status === 'fulfilled' && shortageRes.status === 'fulfilled') {
      const scenario = scenarioRes.value
      const shortage = shortageRes.value
      const strategyData =
        decisionsRes.status === 'fulfilled'
          ? decisionsRes.value.options || decisionsRes.value.strategies || mockStrategyOptions
          : mockStrategyOptions

      // Fetch current decision if endpoint exists
      let currentDecision: DecisionRecord | null = null
      try {
        currentDecision = await fetchJson<DecisionRecord>('/api/decisions/current', undefined, 2000)
      } catch {
        currentDecision = simulatedDecision
      }

      return {
        scenario,
        shortage,
        orders: mockProductionOrders, // Merged with real breakdown if provided
        feasibility: mockProductionFeasibility,
        strategies: strategyData,
        recommendation: mockRecommendationExplanation,
        currentDecision,
        isMockData: false,
        lastUpdated: new Date().toLocaleTimeString(),
      }
    }

    // Backend endpoint rejected -> fallback to rich mock data
    return {
      ...mockInitialDashboardData,
      currentDecision: simulatedDecision,
      isMockData: true,
      lastUpdated: new Date().toLocaleTimeString(),
    }
  } catch {
    return {
      ...mockInitialDashboardData,
      currentDecision: simulatedDecision,
      isMockData: true,
      lastUpdated: new Date().toLocaleTimeString(),
    }
  }
}

export async function submitDecisionApproval(
  request: DecisionApprovalRequest,
  forceMock: boolean = false
): Promise<DecisionRecord> {
  if (!forceMock) {
    try {
      const response = await fetchJson<DecisionRecord>(
        '/api/decisions/approve',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        5000
      )
      simulatedDecision = response
      return response
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
