'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleDisplayName, getRoleDescription } from '@/lib/role-utils'
import { Cog6ToothIcon, KeyIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')

  if (!user) return null

  const handlePinChange = () => {
    if (pin.length !== 4 || pin !== pinConfirm) {
      toast.error('Les PIN doivent correspondre (4 chiffres)')
      return
    }
    toast.success("Modification du PIN : utilisez l'application mobile ou contactez l'administrateur.")
    setPin('')
    setPinConfirm('')
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-[#1A2E0D] to-[#33691E] relative">
          <div className="absolute -bottom-16 left-4 sm:left-12 w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-white p-2 shadow-xl border border-gray-100">
            <div className="w-full h-full rounded-[1.5rem] bg-[#F1F8E9] flex items-center justify-center">
              <span className="text-4xl font-black text-[#33691E]">
                {user.email?.[0]?.toUpperCase() || user.role?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-16 sm:pt-20 px-4 sm:px-12 pb-8 sm:pb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-[var(--color-primary)]">{user.email || 'Mon compte'}</h1>
              <p className="text-sm font-bold text-[#33691E] uppercase tracking-widest mt-1">
                {getRoleDisplayName(user.role)}
              </p>
              <p className="text-sm text-[var(--color-muted)] mt-2 max-w-md">{getRoleDescription(user.role)}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
            >
              Déconnexion
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                Informations
              </h3>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Identifiant acteur</p>
                <p className="text-sm font-bold text-[var(--color-primary)] font-mono break-all">{user.actor_id || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                <p className="text-sm font-bold text-[var(--color-primary)]">{user.email || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Rôle</p>
                <p className="text-sm font-bold text-[var(--color-primary)]">{user.role || '—'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <KeyIcon className="w-4 h-4" />
                Code PIN (4 chiffres)
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Obligatoire pour tout paiement, dépôt ou retrait (CDC §15).
              </p>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Nouveau PIN"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold tracking-widest"
              />
              <input
                type="password"
                maxLength={4}
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Confirmer PIN"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold tracking-widest"
              />
              <button
                type="button"
                onClick={handlePinChange}
                className="px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold hover:brightness-110"
              >
                Enregistrer le PIN
              </button>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                <p className="text-xs text-gray-500">Session JWT active sur ce navigateur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
