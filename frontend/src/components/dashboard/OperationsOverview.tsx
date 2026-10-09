import React from 'react'
import {
  Calendar,
  Layers,
  PackageX,
  Users,
  Percent,
  Factory,
  ChevronRight,
  Flame,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ScenarioSummary, CriticalShortageData } from '@/types/api'

export interface OperationsOverviewProps {
  scenario: ScenarioSummary
  shortage: CriticalShortageData
  isMockData: boolean
  onJumpToShortage?: () => void
  onJumpToStrategies?: () => void
}

export const OperationsOverview: React.FC<OperationsOverviewProps> = ({
  scenario,
  shortage,
  isMockData,
  onJumpToShortage,
  onJumpToStrategies,
}) => {
  return (
    <section className="space-y-5">
      {/* Top Banner: Prominent Alert Identifying the Critical Missing Component */}
      <div className="relative overflow-hidden rounded-xl bg-[#221215] border border-red-500/40 p-5 sm:p-6 shadow-glow-red">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-300 text-xs font-mono font-bold uppercase tracking-wider border border-red-500/30">
                <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>CRITICAL SHORTAGE DETECTED</span>
              </span>
              <Badge variant="critical" size="sm" pulseDot>
                {shortage.componentId}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                {scenario.assemblyLine} &bull; Day {shortage.estimatedRestockDay} Restock ETA
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{shortage.componentName}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Active shortage of <strong className="text-red-400 font-mono font-bold">-{shortage.shortageQuantity} {shortage.unit}</strong>{' '}
              directly threatens <strong className="text-white font-mono font-bold">{shortage.affectedOrdersCount} customer production runs</strong> on Day 4. Overall coverage is constrained to{' '}
              <strong className="text-amber-400 font-mono font-bold">{shortage.inventoryCoveragePercentage}%</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onJumpToShortage && (
              <Button
                variant="outline"
                size="sm"
                onClick={onJumpToShortage}
                className="text-xs"
              >
                Inspect Shortage
              </Button>
            )}
            {onJumpToStrategies && (
              <Button
                variant="danger"
                size="sm"
                onClick={onJumpToStrategies}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="text-xs"
              >
                Compare 4 Strategies
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Operations Dashboard Metric Tiles (Section A) */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
              Operations Telemetry & Risk Summary
            </h3>
          </div>
          {isMockData && (
            <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Demo Fixtures Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tile 1: Total Production Orders */}
          <StatCard
            upperTag="LINE 1 RUNS"
            label="Total Orders"
            value={scenario.totalProductionOrders}
            unit="orders"
            variant="info"
            icon={<Layers className="w-5 h-5" />}
            trend={{
              value: `${scenario.totalProductionOrders} Scheduled`,
              direction: 'neutral',
              label: '14-Day Cycle',
            }}
            subtitle="Automotive Powertrain"
          />

          {/* Tile 2: Critical Component Shortages */}
          <StatCard
            upperTag="BOTTLENECK"
            label="Critical Shortages"
            value={scenario.criticalComponentShortagesCount}
            unit="part"
            variant="critical"
            icon={<PackageX className="w-5 h-5" />}
            trend={{
              value: `Part #${shortage.componentId}`,
              direction: 'down',
              isGood: false,
              label: 'Immediate Action',
            }}
            subtitle={`-${shortage.shortageQuantity} units deficit`}
          />

          {/* Tile 3: Number of Affected Orders */}
          <StatCard
            upperTag="CUSTOMER IMPACT"
            label="Affected Orders"
            value={scenario.affectedOrdersCount}
            unit="runs"
            variant="warning"
            icon={<Users className="w-5 h-5" />}
            trend={{
              value: '4 OEMs At Risk',
              direction: 'down',
              isGood: false,
              label: 'Line 1 Stoppage',
            }}
            subtitle="Apex, Nordic, Solaria, Quantum"
          />

          {/* Tile 4: Inventory Coverage */}
          <StatCard
            upperTag="STOCK RATIO"
            label="Inventory Coverage"
            value={`${scenario.inventoryCoveragePercentage}%`}
            unit="coverage"
            variant="warning"
            icon={<Percent className="w-5 h-5" />}
            trend={{
              value: `${shortage.usableStock} / ${shortage.requiredQuantity} units`,
              direction: 'down',
              isGood: false,
              label: 'Deficit Alert',
            }}
            subtitle={`${shortage.usableStock} usable on-hand`}
          />

          {/* Tile 5: Two-Week Planning Horizon */}
          <StatCard
            upperTag="PLANNING WINDOW"
            label="Planning Horizon"
            value={scenario.planningHorizonDays}
            unit="Days"
            variant="success"
            icon={<Calendar className="w-5 h-5" />}
            trend={{
              value: `Day ${scenario.planningHorizonStartDay}–${scenario.planningHorizonEndDay}`,
              direction: 'neutral',
              isGood: true,
              label: 'Active Window',
            }}
            subtitle="Master Rolling Schedule"
          />
        </div>
      </div>
    </section>
  )
}
