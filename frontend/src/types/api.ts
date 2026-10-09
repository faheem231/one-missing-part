export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL'
export type StrategyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type DecisionStatusType = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ApiHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version?: string
  timestamp?: string
  service?: string
}

export interface DemandBreakdownItem {
  orderId: string
  orderNumber: string
  customerName: string
  scheduledDate: string
  dayNumber: number
  quantityRequired: number
  allocatedQuantity: number
  shortageQuantity: number
  status: 'BLOCKED' | 'PARTIALLY_FILLED' | 'FULFILLED'
}

export interface CriticalShortageData {
  componentId: string
  componentName: string
  category: string
  quantityOnHand: number
  reservedQuantity: number
  usableStock: number
  requiredQuantity: number
  shortageQuantity: number
  unit: string
  shortageCostUsd: number
  costLabel: string // e.g. "Total Replacement & Rush Surcharge Cost"
  inventoryCoveragePercentage: number
  leadTimeDays: number
  estimatedRestockDay: number
  supplierName: string
  criticality: PriorityLevel
  affectedOrdersCount: number
  demandBreakdown: DemandBreakdownItem[]
}

export interface ProductionOrder {
  orderId: string
  orderNumber: string
  customerName: string
  product: string
  orderQuantity: number
  priority: PriorityLevel
  scheduledDate: string
  dueDate: string
  startDay: number
  dueDay: number
  allocatedQuantity: number
  unfulfilledQuantity: number
  estimatedDelayDays: number | null // Note: Null indicates delay calculation unavailable / not applicable
  delayStatus: 'ON_TIME' | 'AT_RISK' | 'DELAYED' | 'UNAVAILABLE'
  isAffected: boolean
  penaltyPerDayUsd: number
}

export interface ProductionFeasibility {
  inventoryLimitedQuantity: number
  capacityLimitedQuantity: number
  feasibleQuantity: number
  bottleneckComponent: string
  bottleneckComponentId: string
  limitingFactor: string // e.g., "CMP-8821 Microcontroller Chip Stock Depletion"
  explanation: string
  maxShiftCapacityUnits: number
  nominalRunRate: number
}

export interface StrategyOption {
  id: string
  name: string
  description: string
  isFeasible: boolean
  infeasibleReason?: string | null
  feasibleUnits: number
  unmetUnits: number
  fulfillmentRate: number
  ordersOnTime: number
  ordersDelayed: number
  totalDelayDays: number | null // null if unavailable/not applicable
  incrementalCost: number
  implementationHours: number
  riskLevel: StrategyRiskLevel
  score: number
  rank: number
  isRecommended: boolean
  badgeVariant?: 'success' | 'warning' | 'info' | 'critical' | 'neutral'
}

export interface RecommendationExplanation {
  recommendedStrategyId: string
  recommendedStrategyName: string
  whyRankedFirst: string
  feasibilityMetrics: {
    feasibleUnits: number
    fulfillmentRate: number
    ordersProtected: number
    preventedStoppageHours: number
  }
  incrementalCost: number
  customerDeliveryImpact: string
  keyRisksAndAssumptions: string[]
  alternativeTradeOffs: {
    strategyId: string
    strategyName: string
    reasonLowerRanked: string
  }[]
}

export interface ScenarioSummary {
  scenarioId: string
  scenarioName: string
  assemblyLine: string
  assemblyLineDescription: string
  planningHorizonStartDay: number
  planningHorizonEndDay: number
  planningHorizonDays: number
  totalProductionOrders: number
  criticalComponentShortagesCount: number
  affectedOrdersCount: number
  inventoryCoveragePercentage: number
  deliveryRiskSummary: string
  deliveryRiskLevel: PriorityLevel
  lineStatus: 'ONLINE' | 'DEGRADED' | 'HALTED'
}

export interface DecisionApprovalRequest {
  strategyId: string
  action: 'APPROVE' | 'REJECT'
  reviewerNote?: string
}

export interface DecisionRecord {
  decisionId: string
  strategyId: string
  strategyName: string
  action: 'APPROVE' | 'REJECT'
  status: DecisionStatusType
  reviewerNote: string
  timestamp: string
  approvedBy: string
  isSimulated: boolean
}

export interface FullDashboardData {
  scenario: ScenarioSummary
  shortage: CriticalShortageData
  orders: ProductionOrder[]
  feasibility: ProductionFeasibility
  strategies: StrategyOption[]
  recommendation: RecommendationExplanation
  currentDecision: DecisionRecord | null
  isMockData: boolean
  lastUpdated: string
}
