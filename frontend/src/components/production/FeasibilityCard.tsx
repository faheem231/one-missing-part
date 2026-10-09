import React from 'react'
import {
  AlertOctagon,
  Boxes,
  Cpu,
  Factory,
  Gauge,
  Info,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ProductionFeasibility } from '@/types/api'

export interface FeasibilityCardProps {
  feasibility: ProductionFeasibility
}

export const FeasibilityCard: React.FC<FeasibilityCardProps> = ({ feasibility }) => {
  const inventoryPercentage = Math.round((feasibility.inventoryLimitedQuantity / feasibility.capacityLimitedQuantity) * 100)
  const capacityPercentage = 100
  const feasiblePercentage = Math.round((feasibility.feasibleQuantity / feasibility.capacityLimitedQuantity) * 100)

  return (
    <Card className="bg-[#1B1E26] border-[#2A303C]">
      <CardHeader
        action={
          <Badge variant="warning" size="sm">
            Bottleneck Active
          </Badge>
        }
      >
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span>SECTION D — PRODUCTION FEASIBILITY & BOTTLENECK ANALYSIS</span>
        </div>
        <CardTitle>Inventory vs Shift Capacity Constraint Breakdown</CardTitle>
        <CardDescription>
          Evaluating physical workstation throughput against component stock availability.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Core Metric Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          {/* Inventory-Limited Quantity */}
          <div className="p-4 rounded-xl bg-[#222732] border border-red-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase text-[10px] font-bold">Inventory-Limited Qty</span>
              <Boxes className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-red-400">
                {feasibility.inventoryLimitedQuantity}
              </span>
              <span className="text-slate-400 text-xs">units</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all"
                style={{ width: `${inventoryPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-red-400/80 block">
              Constrained by CMP-8821 stock deficit
            </span>
          </div>

          {/* Capacity-Limited Quantity */}
          <div className="p-4 rounded-xl bg-[#222732] border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase text-[10px] font-bold">Capacity-Limited Qty</span>
              <Factory className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-blue-400">
                {feasibility.capacityLimitedQuantity}
              </span>
              <span className="text-slate-400 text-xs">units</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              Physical shift & workstation max run rate
            </span>
          </div>

          {/* Feasible Output Quantity */}
          <div className="p-4 rounded-xl bg-[#222732] border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase text-[10px] font-bold">Feasible Output</span>
              <Gauge className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-amber-400">
                {feasibility.feasibleQuantity}
              </span>
              <span className="text-slate-400 text-xs">units ({feasiblePercentage}% capacity)</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all"
                style={{ width: `${feasiblePercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-amber-400/80 block">
              Actual achievable output without mitigation
            </span>
          </div>
        </div>

        {/* Bottleneck & Limiting Factor Detailed Banner */}
        <div className="p-4 rounded-xl bg-[#222732]/70 border border-[#2E343D] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Bottleneck Component:
              </span>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm font-bold text-white font-mono">
                  {feasibility.bottleneckComponent}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Primary Limiting Factor:
              </span>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-amber-300 font-sans">
                  {feasibility.limitingFactor}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2E343D]/60 flex items-start gap-2.5 text-xs text-slate-300 font-sans">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white font-mono">Constraint Analysis:</strong> {feasibility.explanation}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-slate-400">Workstation Run Rate: {feasibility.nominalRunRate} units/shift</span>
        <span className="text-cyan-400 font-mono">Capacity Headroom: +500 units available upon restock</span>
      </CardFooter>
    </Card>
  )
}
