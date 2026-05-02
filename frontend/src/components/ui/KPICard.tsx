import { ReactNode } from 'react'
import { getRoleTheme, UserRole } from '@/lib/role-themes'

interface KPICardProps {
  title: string
  value: string | number
  trend?: string
  icon?: ReactNode
  color?: string
  role: UserRole
}

export function KPICard({ title, value, trend, icon, color, role }: KPICardProps) {
  const theme = getRoleTheme(role)

  return (
    <div
      className="rounded-xl p-6 shadow-sm"
      style={{ backgroundColor: theme.card.background, boxShadow: theme.card.shadow }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1" style={{ color: theme.text.muted }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ color: theme.primary }}>
            {value}
          </p>
          {trend && (
            <p className="text-sm font-medium mt-1 flex items-center" style={{ color: theme.secondary }}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: color || theme.secondary + '20', color: color || theme.secondary }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}