import React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BadgeVariant } from './Badge'

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  upperTag?: string
  value: string | number
  unit?: string
  subtitle?: string
  icon?: React.ReactNode
  variant?: BadgeVariant | 'default'
  trend?: {
    value: string | number
    direction?: 'up' | 'down' | 'neutral'
    isGood?: boolean
    label?: string
  }
}

const valueColorMap: Record<string, string> = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
  cyan: 'text-cyan-400',
  success: 'text-emerald-400',
  neutral: 'text-slate-200',
  default: 'text-white',
}

const iconBgMap: Record<string, string> = {
  critical: 'bg-red-500/15 border-red-500/30 text-red-400',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  info: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  cyan: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  neutral: 'bg-slate-800/60 border-slate-700 text-slate-300',
  default: 'bg-[#222732] border-[#2A303C] text-cyan-400',
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  upperTag,
  value,
  unit,
  subtitle,
  icon,
  variant = 'default',
  trend,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-4 sm:p-5 rounded-xl bg-[#1B1E26] border border-[#2A303C] hover:border-slate-500/70 transition-all duration-150 flex flex-col justify-between gap-3 shadow-card group',
        variant === 'critical' && 'border-red-500/40 bg-[#201518]/90',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          {upperTag && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
              {upperTag}
            </span>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block font-medium">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span
              className={cn(
                'text-2xl sm:text-3xl font-bold font-mono tracking-tight transition-colors',
                valueColorMap[variant] || 'text-white'
              )}
            >
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-slate-400 font-normal">{unit}</span>}
          </div>
        </div>

        {icon && (
          <div
            className={cn(
              'p-2.5 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105',
              iconBgMap[variant] || iconBgMap.default
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="pt-2 border-t border-[#2A303C]/70 flex items-center justify-between text-xs font-mono text-slate-400 gap-2">
          {trend ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium px-2 py-0.5 rounded text-[11px] border',
                  trend.isGood === true &&
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                  trend.isGood === false &&
                    'bg-red-500/10 text-red-400 border-red-500/30',
                  trend.isGood === undefined &&
                    'bg-slate-800 text-slate-300 border-slate-700'
                )}
              >
                {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
                {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
                {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{trend.value}</span>
              </span>
              {trend.label && <span className="text-slate-400 text-[11px]">{trend.label}</span>}
            </div>
          ) : (
            subtitle && <span className="text-slate-400 text-[11px] truncate">{subtitle}</span>
          )}

          {trend && subtitle && (
            <span className="text-slate-400 text-[11px] truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}
