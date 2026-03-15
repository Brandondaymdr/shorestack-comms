import React, { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

const variantMap = {
  primary: 'bg-deep-ocean text-shore-sand hover:opacity-90',
  secondary: 'bg-driftwood/20 text-deep-slate hover:bg-driftwood/30',
  ghost: 'text-driftwood hover:text-deep-slate',
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const variantClass = variantMap[variant]
    const sizeClass = sizeMap[size]

    return (
      <button
        ref={ref}
        className={`font-mono rounded-md transition-all ${variantClass} ${sizeClass} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
