import { ReactNode } from 'react'
import { getRoleTheme, UserRole } from '@/lib/role-themes'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
  role: UserRole
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  className = '',
  role
}: ButtonProps) {
  const theme = getRoleTheme(role)

  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: {
      backgroundColor: theme.button.primary,
      color: 'white',
      border: 'none'
    },
    secondary: {
      backgroundColor: theme.button.secondary,
      color: 'white',
      border: 'none'
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.button.primary,
      border: `1px solid ${theme.button.outline}`
    }
  }

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={variantClasses[variant]}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}