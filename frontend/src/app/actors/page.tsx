'use client'

import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import api, { ActorDTO } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ActorsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api
      .get<{ success: boolean; actors: ActorDTO[] }>('/actors')
      .then((res) => {
        setActors(res.data.actors || [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erreur'
        toast.error(message)
        setLoading(false)
      })
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'agriculteur':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cooperative':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'exportateur':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'transformateur':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="w-full py-6 sm:py-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Annuaire des Acteurs
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Gestion et supervision des intervenants de la filière cacao.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all">
            <PlusIcon className="w-5 h-5" />
            Enrôler un Acteur
          </button>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="bg-white p-6 rounded-[1.5rem] border border-[var(--color-border)] shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Acteurs</p>
            <p className="text-3xl font-black text-[var(--color-primary)]">{actors.length}</p>
         </div>
         <div className="bg-white p-6 rounded-[1.5rem] border border-[var(--color-border)] shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Agriculteurs</p>
            <p className="text-3xl font-black text-[#33691E]">{actors.filter(a => a.role === 'agriculteur').length}</p>
         </div>
         <div className="bg-white p-6 rounded-[1.5rem] border border-[var(--color-border)] shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Coopératives</p>
            <p className="text-3xl font-black text-[#1565C0]">{actors.filter(a => a.role === 'cooperative').length}</p>
         </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acteur</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Statut</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {actors.map((actor) => (
                <tr key={actor.id} className="group hover:bg-gray-50 transition-all">
                  <td className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F1F8E9] to-[#E8F5E9] flex items-center justify-center border border-[#C5E1A5]/30">
                        <span className="text-sm font-black text-[#33691E]">{getInitials(actor.nom || 'A')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-primary)]">{actor.nom}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{actor.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 text-sm font-bold text-[var(--color-primary)]">
                    {actor.email || 'Non renseigné'}
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      actor.role === 'agriculteur' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                      actor.role === 'cooperative' ? 'bg-[#E3F2FD] text-[#1565C0]' : 'bg-[#F3E5F5] text-[#7B1FA2]'
                    }`}>
                      {actor.role}
                    </span>
                  </td>
                  <td className="py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Actif</span>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {actors.length === 0 && (
            <div className="py-20 text-center">
              <UsersIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">Aucun acteur enregistré pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
