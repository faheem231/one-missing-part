import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'critical' | 'highlight'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-xl border transition-all duration-150 overflow-hidden shadow-card',
          variant === 'default' &&
            'bg-[#1B1E26] border-[#2A303C] text-slate-100',
          variant === 'elevated' &&
            'bg-[#222732] border-[#323947] text-slate-100',
          variant === 'interactive' &&
            'bg-[#1B1E26] border-[#2A303C] hover:bg-[#222732] hover:border-slate-500 cursor-pointer text-slate-100',
          variant === 'critical' &&
            'bg-[#201518] border-red-500/40 text-slate-100 shadow-glow-red',
          variant === 'highlight' &&
            'bg-[#17202C] border-blue-500/40 text-slate-100 shadow-glow-cyan',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'p-4 sm:p-5 border-b border-[#2A303C] flex items-center justify-between gap-4 bg-[#15181F]/70',
          className
        )}
        {...props}
      >
        <div className="space-y-1 min-w-0">{children}</div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-sm sm:text-base font-bold text-slate-100 tracking-tight flex items-center gap-2 font-sans',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
})
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-slate-400 font-sans leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  )
})
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  )
})
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'p-3.5 sm:p-4 border-t border-[#2A303C] bg-[#14171E] flex items-center justify-between gap-4 text-xs font-mono text-slate-400',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CardFooter.displayName = 'CardFooter'
