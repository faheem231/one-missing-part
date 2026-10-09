import React from 'react'
import {
  AlertTriangle,
  Award,
  Check,
  Clock,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { StrategyOption } from '@/types/api'
import { cn } from '@/lib/utils'

export interface StrategyComparisonGridProps {
  strategies: StrategyOption[]
  selectedStrategyId: string
  onSelectStrategy: (strategyId: string) => void
  appliedStrategyId?: string | null
}

export const StrategyComparisonGrid: React.FC<StrategyComparisonGridProps> = ({
  strategies,
  selectedStrategyId,
  onSelectStrategy,
  appliedStrategyId,
}) => {
  return (
    <Card className="bg-[#1B1E26] border-[#2A303C]">
      <CardHeader
        action={
          <Badge variant="cyan" size="sm">
            4 Solver Heuristics Evaluated
          </Badge>
        }
      >
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>SECTION E — STRATEGY COMPARISON & RESPONSE OPTIONS</span>
        </div>
        <CardTitle>4 Evaluated Mitigation Strategies for CMP-8821</CardTitle>
        <CardDescription>
          Backend-computed response options ranked by cost, delay impact, and SLA fulfillment feasibility.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 4-Card Strategy Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strat) => {
            const isSelected = selectedStrategyId === strat.id
            const isApplied = appliedStrategyId === strat.id
            const isDelayNull = strat.totalDelayDays === null

            return (
              <div
                key={strat.id}
                onClick={() => onSelectStrategy(strat.id)}
                className={cn(
                  'p-5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden',
                  strat.isRecommended && 'ring-1 ring-emerald-500/40',
                  isSelected
                    ? 'bg-[#222732] border-blue-500 shadow-glow-cyan'
                    : strat.isFeasible
                    ? 'bg-[#181B22] border-[#2E343D] hover:border-slate-500 hover:bg-[#1E222B]'
                    : 'bg-[#1E1719] border-red-500/30 opacity-80 hover:opacity-100'
                )}
              >
                {/* Top Strategy Header Tag & Rank Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-[#14171E] border border-[#2E343D] text-[11px] font-mono font-bold text-white flex items-center justify-center">
                      #{strat.rank}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {strat.id}
                    </span>

                    {strat.isRecommended && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                        <Award className="w-3 h-3 text-emerald-400" />
                        <span>RECOMMENDED</span>
                      </span>
                    )}

                    {!strat.isFeasible && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold">
                        <XCircle className="w-3 h-3" />
                        <span>INFEASIBLE</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-cyan-400 block">
                      Score: {strat.score}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Risk: {strat.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Strategy Title & Description */}
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white font-sans tracking-tight">
                    {strat.name}
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {strat.description}
                  </p>
                </div>

                {/* Infeasibility Reason Callout */}
                {!strat.isFeasible && strat.infeasibleReason && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-sans text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-red-200">Rejection Reason:</strong> {strat.infeasibleReason}
                    </div>
                  </div>
                )}

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#2A303C] font-mono text-xs">
                  {/* Metric 1: Feasible Units */}
                  <div className="p-2 rounded bg-[#14171E] border border-[#2A303C]/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase">Feasible Units</span>
                    <span className="text-sm font-bold text-white">
                      {strat.feasibleUnits} <span className="text-[10px] font-normal text-slate-400">({strat.fulfillmentRate}%)</span>
                    </span>
                  </div>

                  {/* Metric 2: Orders On-Time */}
                  <div className="p-2 rounded bg-[#14171E] border border-[#2A303C]/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase">Orders On-Time</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {strat.ordersOnTime} / 12
                    </span>
                  </div>

                  {/* Metric 3: Total Delay */}
                  <div className="p-2 rounded bg-[#14171E] border border-[#2A303C]/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase">Total Delay</span>
                    <span className="text-sm font-bold text-slate-200">
                      {isDelayNull ? (
                        <span className="text-slate-500 text-xs">N/A</span>
                      ) : strat.totalDelayDays === 0 ? (
                        <span className="text-emerald-400">0 Days</span>
                      ) : (
                        <span className="text-red-400">+{strat.totalDelayDays} Days</span>
                      )}
                    </span>
                  </div>

                  {/* Metric 4: Incremental Cost */}
                  <div className="p-2 rounded bg-[#14171E] border border-[#2A303C]/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase">Extra Cost</span>
                    <span className="text-sm font-bold text-white">
                      {strat.incrementalCost === 0 ? (
                        <span className="text-emerald-400">$0</span>
                      ) : (
                        <span className="text-amber-400">+${strat.incrementalCost.toLocaleString()}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Footer Selection Radio */}
                <div className="pt-2 border-t border-[#2A303C]/60 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Setup Lead Time: {strat.implementationHours} hrs</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold">
                    {isApplied ? (
                      <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        <span>Active Plan</span>
                      </span>
                    ) : isSelected ? (
                      <span className="text-blue-400">Selected for Approval</span>
                    ) : (
                      <span className="text-slate-500 group-hover:text-slate-300">Click to Select</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Note: Infeasible strategies cannot be approved per backend validation constraints</span>
        </div>
        <span className="text-cyan-400 font-mono">Backend Heuristic Engine v2.4</span>
      </CardFooter>
    </Card>
  )
}
