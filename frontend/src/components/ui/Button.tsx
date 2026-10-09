import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold border border-blue-500/40 shadow-sm shadow-blue-500/20',
  secondary:
    'bg-[#222732] hover:bg-[#292F3D] active:bg-[#1C202A] text-slate-200 border border-[#2E343D]',
  danger:
    'bg-red-600/90 hover:bg-red-500 active:bg-red-700 text-white font-semibold border border-red-500/40 shadow-sm shadow-red-950/40',
  success:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold border border-emerald-500/40 shadow-sm shadow-emerald-950/40',
  outline:
    'bg-[#1B1E26] hover:bg-[#222732] active:bg-[#181B22] text-slate-300 hover:text-white border border-[#2E343D] hover:border-slate-500',
  ghost:
    'bg-transparent hover:bg-[#222732] active:bg-[#1B1E26] text-slate-400 hover:text-white border border-transparent',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs h-8 px-3 gap-1.5 rounded-lg',
  md: 'text-xs sm:text-sm h-9 px-4 gap-2 rounded-lg',
  lg: 'text-sm h-11 px-5 gap-2.5 rounded-xl',
  icon: 'h-9 w-9 p-0 justify-center rounded-lg',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-[#0F1115] cursor-pointer',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
