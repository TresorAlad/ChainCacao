'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="w-full max-w-6xl mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-[var(--color-border)] overflow-hidden">
        {/* Profile Header Background */}
        <div className="h-48 bg-gradient-to-r from-[#1A2E0D] to-[#33691E] relative">
          <div className="absolute -bottom-16 left-4 sm:left-12 w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-white p-2 shadow-xl border border-gray-100">
            <div className="w-full h-full rounded-[1.5rem] bg-[#F1F8E9] flex items-center justify-center">
              <span className="text-4xl font-black text-[#33691E]">
                {user.email?.[0].toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-16 sm:pt-20 px-4 sm:px-12 pb-8 sm:pb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-[var(--color-primary)]">{user.email || 'Utilisateur'}</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{user.role || 'Rôle non défini'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={logout} className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                Déconnexion
              </button>
              <button className="px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all">
                Modifier le profil
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Informations Personnelles</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Identifiant Acteur</p>
                  <p className="text-sm font-bold text-[var(--color-primary)]">{user.actor_id || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Adresse Email</p>
                  <p className="text-sm font-bold text-[var(--color-primary)]">{user.email || 'Non renseigné'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Sécurité & Accès</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-primary)]">Authentification</p>
                    <p className="text-xs text-gray-500">Activée via API</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-primary)]">Rôle Système</p>
                    <p className="text-xs text-gray-500">{user.role || 'Standard'}</p>
                  </div>
                  <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
