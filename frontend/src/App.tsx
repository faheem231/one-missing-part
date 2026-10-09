import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { OperationsOverview } from '@/components/dashboard/OperationsOverview'
import { CriticalShortageCard } from '@/components/shortage/CriticalShortageCard'
import { AffectedOrdersTable } from '@/components/orders/AffectedOrdersTable'
import { FeasibilityCard } from '@/components/production/FeasibilityCard'
import { StrategyComparisonGrid } from '@/components/strategies/StrategyComparisonGrid'
import { RecommendationPanel } from '@/components/recommendation/RecommendationPanel'
import { ApprovalWorkflowCard } from '@/components/approval/ApprovalWorkflowCard'
import { fetchFullDashboardData } from '@/services/scenarioService'
import { checkBackendHealth } from '@/services/api'
import type { FullDashboardData, DecisionRecord } from '@/types/api'
import { mockInitialDashboardData } from '@/mocks/mockData'

export default function App(): React.JSX.Element {
  const [data, setData] = useState<FullDashboardData>(mockInitialDashboardData)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [isMockMode, setIsMockMode] = useState<boolean>(false)
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('STRAT-01')

  // Load dashboard data from API or Mock Engine
  const loadData = useCallback(async (forceMock: boolean = isMockMode, isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setErrorMessage(null)

    try {
      // Check health
      const health = await checkBackendHealth()
      setIsBackendConnected(health.isConnected)

      const result = await fetchFullDashboardData(forceMock || !health.isConnected)
      setData(result)

      // Set default selected strategy to the recommended one if not manually changed
      if (result.recommendation?.recommendedStrategyId) {
        setSelectedStrategyId(result.recommendation.recommendedStrategyId)
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to retrieve operations data from backend'
      )
      // Fallback to mock data on error
      setData({
        ...mockInitialDashboardData,
        lastUpdated: new Date().toLocaleTimeString(),
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isMockMode])

  useEffect(() => {
    loadData(isMockMode, false)
  }, [loadData, isMockMode])

  const handleToggleMockMode = () => {
    const nextMock = !isMockMode
    setIsMockMode(nextMock)
    loadData(nextMock, true)
  }

  const handleDecisionUpdated = (decision: DecisionRecord | null) => {
    setData((prev) => ({
      ...prev,
      currentDecision: decision,
    }))
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <DashboardLayout
      isMockMode={data.isMockData}
      isBackendConnected={isBackendConnected}
      isRefreshing={isRefreshing}
      lastUpdated={data.lastUpdated}
      errorMessage={errorMessage}
      onRefresh={() => loadData(isMockMode, true)}
      onToggleMockMode={handleToggleMockMode}
      onRetry={() => loadData(isMockMode, true)}
    >
      {isLoading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 font-mono text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Connecting to Operations Decision Engine (FastAPI :8000)...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION A: Main Operations Dashboard & Telemetry Overview */}
          <div id="section-overview">
            <OperationsOverview
              scenario={data.scenario}
              shortage={data.shortage}
              isMockData={data.isMockData}
              onJumpToShortage={() => scrollToSection('section-shortage')}
              onJumpToStrategies={() => scrollToSection('section-strategies')}
            />
          </div>

          {/* SECTION B: Critical Shortage Details */}
          <div id="section-shortage">
            <CriticalShortageCard shortage={data.shortage} />
          </div>

          {/* SECTION C: Affected Production Orders Schedule */}
          <div id="section-orders">
            <AffectedOrdersTable orders={data.orders} />
          </div>

          {/* SECTION D: Production Feasibility & Constraint Analysis */}
          <div id="section-feasibility">
            <FeasibilityCard feasibility={data.feasibility} />
          </div>

          {/* SECTION E: Strategy Comparison Matrix (All 4 Heuristic Options) */}
          <div id="section-strategies">
            <StrategyComparisonGrid
              strategies={data.strategies}
              totalOrders={data.scenario.totalProductionOrders}
              shortageComponentId={data.shortage.componentId}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategy={(id) => setSelectedStrategyId(id)}
              appliedStrategyId={data.currentDecision?.status === 'APPROVED' ? data.currentDecision.strategyId : null}
            />
          </div>

          {/* SECTION F: Recommendation Explanation Panel */}
          <div id="section-recommendation">
            <RecommendationPanel
              recommendation={data.recommendation}
              onSelectRecommended={() => {
                setSelectedStrategyId(data.recommendation.recommendedStrategyId)
                scrollToSection('section-approval')
              }}
            />
          </div>

          {/* SECTION G: Decision Approval Workflow & Authorization */}
          <div id="section-approval">
            <ApprovalWorkflowCard
              strategies={data.strategies}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategy={(id) => setSelectedStrategyId(id)}
              currentDecision={data.currentDecision}
              onDecisionUpdated={handleDecisionUpdated}
              isMockMode={data.isMockData}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
