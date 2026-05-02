'use client'

import { useAuth } from '@/contexts/AuthContext'
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const { user } = useAuth()
  
  const displayName = user?.email || user?.actor_id || 'Utilisateur'
  const roleLabel = user?.role || 'Admin'

  return (
    <header className="fixed top-0 right-0 left-[280px] h-20 bg-[var(--color-surface)] border-b border-[var(--color-border)] z-40 flex items-center justify-between px-8 max-lg:left-0">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <input 
            type="text" 
            placeholder="Rechercher (Lot, Acteur, Hash...)" 
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg)] border-none rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-secondary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full border border-[var(--color-surface)]"></span>
        </button>

        <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-[var(--color-earth)]">{displayName}</span>
            <span className="text-xs text-[var(--color-muted)] capitalize">{roleLabel}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] font-bold flex items-center justify-center border border-[var(--color-secondary)]/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
