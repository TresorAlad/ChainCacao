'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminGate } from '@/components/AdminGate'
import {
  UsersIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ShieldExclamationIcon,
  CubeIcon,
  TruckIcon,
  ChartBarIcon,
  QrCodeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

const ADMIN_TOOLS = [
  {
    href: '/admin/utilisateurs',
    title: 'Utilisateurs',
    description: 'Créer, modifier, suspendre les comptes et réinitialiser les PIN.',
    icon: UsersIcon,
    color: 'bg-[#E3F2FD] text-[#1565C0]',
  },
  {
    href: '/admin/marges',
    title: 'Marges coopératives',
    description: 'Définir les marges appliquées par organisation coopérative sur la blockchain.',
    icon: CurrencyDollarIcon,
    color: 'bg-[#FFF3E0] text-[#E65100]',
  },
  {
    href: '/admin/config',
    title: 'Configuration système',
    description: 'Paramètres globaux de la plateforme (seuils, règles, options).',
    icon: AdjustmentsHorizontalIcon,
    color: 'bg-[#F3E5F5] text-[#7B1FA2]',
  },
  {
    href: '/admin/incidents',
    title: 'Incidents',
    description: 'Erreurs et anomalies remontées par l’API — résolution et suivi.',
    icon: ShieldExclamationIcon,
    color: 'bg-[#FFEBEE] text-[#B71C1C]',
  },
]

const OPS_LINKS = [
  { href: '/lots', label: 'Lots', icon: CubeIcon },
  { href: '/transfer', label: 'Transferts', icon: TruckIcon },
  { href: '/transactions', label: 'Transactions', icon: ChartBarIcon },
  { href: '/blockchain', label: 'Blockchain', icon: QrCodeIcon },
  { href: '/sync', label: 'Sync hors-ligne', icon: ArrowPathIcon },
  { href: '/dashboard-ministere', label: 'Supervision nationale', icon: ShieldExclamationIcon },
]

export default function AdminHubPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  return (
    <AdminGate role={user?.role}>
      <div className="w-full py-6 sm:py-8">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Administration système
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Gestion des utilisateurs, marges coopératives, configuration et supervision technique.
          </p>
        </header>

        <h2 className="text-sm font-black uppercase tracking-widest text-[#33691E] mb-4">
          Outils d&apos;administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {ADMIN_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-[var(--color-border)] hover:border-[#33691E]/40 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[var(--color-primary)] group-hover:text-[#33691E]">
                {tool.title}
              </h3>
              <p className="text-sm text-[var(--color-muted)] mt-2">{tool.description}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
          Accès opérationnels (tous rôles)
        </h2>
        <div className="flex flex-wrap gap-3">
          {OPS_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-primary)] hover:bg-[#F1F8E9] transition-colors"
            >
              <link.icon className="w-4 h-4 text-[#33691E]" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </AdminGate>
  )
}
