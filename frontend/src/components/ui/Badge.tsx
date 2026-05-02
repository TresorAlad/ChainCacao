import { ReactNode } from 'react'
import { getRoleTheme, UserRole } from '@/lib/role-themes'

interface BadgeProps {
  children: ReactNode
  variant: 'success' | 'warning' | 'error' | 'info'
  role: UserRole
}

export function Badge({ children, variant, role }: BadgeProps) {
  const theme = getRoleTheme(role)

  const colors = {
    success: theme.badge.success,
    warning: theme.badge.warning,
    error: theme.badge.error,
    info: theme.badge.info
  }

  const textColors = {
    success: '#166534',
    warning: '#92400E',
    error: '#B71C1C',
    info: '#1565C0'
  }

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: colors[variant],
        color: textColors[variant]
      }}
    >
      {children}
    </span>
  )
}