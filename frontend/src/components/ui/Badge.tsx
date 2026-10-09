import React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'critical' | 'warning' | 'info' | 'cyan' | 'success' | 'neutral'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  showDot?: boolean
  pulseDot?: boolean
  size?: BadgeSize
}

const variantStyles: Record<
  BadgeVariant,
  { container: string; dot: string; ping: string }
> = {
  critical: {
    container: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-500',
    ping: 'bg-red-400',
  },
  warning: {
    container: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
  },
  info: {
    container: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
    ping: 'bg-blue-400',
  },
  cyan: {
    container: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-400',
    ping: 'bg-cyan-300',
  },
  success: {
    container: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
  },
  neutral: {
    container: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    dot: 'bg-slate-400',
    ping: 'bg-slate-300',
  },
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-medium font-mono',
  md: 'text-xs px-2.5 py-1 gap-2 font-semibold font-mono',
  lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold font-mono',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  showDot = true,
  pulseDot = false,
  size = 'md',
  className,
  children,
  ...props
}) => {
  const styles = variantStyles[variant] || variantStyles.neutral

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border tracking-wider uppercase select-none transition-colors backdrop-blur-xs',
        styles.container,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulseDot && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                styles.ping
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', styles.dot)} />
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}
