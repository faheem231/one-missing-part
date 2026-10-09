import React from 'react'
import {
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import type { ComponentShortage } from '@/data/mockScenario'

export interface ShortageAlertBannerProps {
  shortage: ComponentShortage
  onViewBreakdown?: () => void
  onCompareStrategies?: () => void
}

export const ShortageAlertBanner: React.FC<ShortageAlertBannerProps> = ({
  shortage,
  onViewBreakdown,
  onCompareStrategies,
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white shadow-soft-xl border border-red-400/40 p-6 sm:p-8">
      {/* Decorative ambient background flares */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-rose-900/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Alert Tag, Header & Description */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold font-mono tracking-wide uppercase shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>CRITICAL BOTTLENECK DETECTED</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-100 text-[11px] font-mono border border-white/20">
              Day 4 Line 1 Impact
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-heavy flex items-center gap-2.5 flex-wrap">
              <span>CRITICAL COMPONENT SHORTAGE:</span>
              <span className="underline decoration-white/40 underline-offset-4">
                {shortage.partNumber}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-rose-100 font-medium leading-relaxed font-sans">
              {shortage.name} — <strong className="text-white font-bold">{shortage.deficit} {shortage.unit} deficit</strong> across{' '}
              <strong className="text-white font-bold">{shortage.affectedOrdersCount} key customer production orders</strong> threatens on-time assembly delivery.
            </p>
          </div>

          {/* Quick Metrics Pills inside the alert */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-rose-200 font-mono font-bold block">
                Required Stock
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {shortage.quantityRequired} {shortage.unit}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-rose-200 font-mono font-bold block">
                On-Hand Stock
              </span>
              <span className="text-lg font-bold text-rose-200 font-mono">
                {shortage.quantityOnHand} {shortage.unit}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/40 backdrop-blur-md border border-rose-400/30 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-rose-300 font-mono font-bold block">
                Shortage Deficit
              </span>
              <span className="text-lg font-bold text-white font-mono">
                -{shortage.deficit} {shortage.unit}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-rose-200 font-mono font-bold block">
                Restock ETA
              </span>
              <span className="text-lg font-bold text-white font-mono">
                Day {shortage.estimatedRestockDay} (08:00)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Direct CTA Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:min-w-[220px]">
          <button
            type="button"
            onClick={onCompareStrategies}
            className="px-6 py-3.5 bg-white text-rose-700 hover:bg-rose-50 active:bg-rose-100 font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <span>Compare 4 Response Strategies</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onViewBreakdown}
            className="px-6 py-3.5 bg-rose-900/60 hover:bg-rose-900/80 active:bg-rose-950 text-white font-semibold text-sm rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <span>View Shortage Breakdown</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
