'use client'

import { UsersIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { RoleLayout } from '@/components/RoleLayout'
import { RoleGate } from '@/components/RoleGate'
import api, { type ActorDTO, type Batch } from '@/lib/api'
import {
  ACTOR_ROLE_FILTERS,
  filterAnnuaireActors,
  roleDisplayLabel,
} from '@/lib/actors-utils'
import { isMinistereRole } from '@/lib/role-utils'
import { getErrorMessage } from '@/lib/error-utils'
import toast from 'react-hot-toast'

type ActorStats = {
  nb_lots: number
  poids_total: number
  par_statut: Record<string, number>
}

function deriveActorStatsFromLots(lots: Batch[]): ActorStats {
  let poids_total = 0
  const par_statut: Record<string, number> = {}
  for (const lot of lots) {
    poids_total += Number(lot.quantite) || 0
    const st = (lot.statut || 'inconnu').trim().toLowerCase() || 'inconnu'
    par_statut[st] = (par_statut[st] || 0) + 1
  }
  return { nb_lots: lots.length, poids_total, par_statut }
}

export default function ActorsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedLots, setSelectedLots] = useState<Batch[]>([])
  const [selectedStats, setSelectedStats] = useState<ActorStats | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const layoutRole = user?.role === 'admin' ? 'admin' : user?.role === 'ministere' ? 'ministere' : 'cooperative'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    api
      .get<{ success: boolean; actors: ActorDTO[] }>('/actors')
      .then((res) => setActors(filterAnnuaireActors(res.data.actors || [])))
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Erreur')
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const filtered = useMemo(() => {
    let list = actors
    if (roleFilter !== 'all') {
      list = list.filter((a) => (a.role || '').toLowerCase() === roleFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          (a.nom || '').toLowerCase().includes(q) ||
          (a.id || '').toLowerCase().includes(q) ||
          (a.email || '').toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))
  }, [actors, roleFilter, search])

  const selectedActor = useMemo(
    () => actors.find((a) => a.id === selectedId) ?? null,
    [actors, selectedId]
  )

  const loadActorDetail = async (actor: ActorDTO) => {
    setSelectedId(actor.id)
    setDetailLoading(true)
    setDetailError(null)
    setSelectedLots([])
    setSelectedStats(null)
    const url = `/actors/${encodeURIComponent(actor.id)}/lots`
    try {
      const res = await api.get<{
        success: boolean
        lots: Batch[]
        stats?: ActorStats
      }>(url)
      const lots = res.data.lots || []
      setSelectedLots(lots)
      const bodyStats = res.data.stats
      setSelectedStats(bodyStats != null ? bodyStats : deriveActorStatsFromLots(lots))
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Impossible de charger les données de cet acteur')
      setDetailError(msg)
      toast.error(msg)
      if (process.env.NODE_ENV === 'development') {
        const status =
          err && typeof err === 'object' && 'status' in err ? (err as { status?: number }).status : undefined
        console.warn('[actors] loadActorDetail failed', { actorId: actor.id, url, status, err })
      }
    } finally {
      setDetailLoading(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()

  if (authLoading) {
    return (
      <div className="page-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <RoleGate role={user?.role} path="/actors">
      <RoleLayout role={layoutRole}>
        <div className="page-container py-6 sm:py-8">
          <header className="page-header mb-6">
            <h1 className="page-heading">Annuaire des acteurs</h1>
            <p className="page-subtitle">
              Filière cacao — cliquez sur un acteur pour voir ses lots et statistiques. Les comptes
              ministère et administrateur ne sont pas listés.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase">Total</p>
              <p className="text-2xl font-black text-[var(--color-primary)]">{actors.length}</p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase">Agriculteurs</p>
              <p className="text-2xl font-black text-[#33691E]">
                {actors.filter((a) => a.role === 'agriculteur').length}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase">Coopératives</p>
              <p className="text-2xl font-black text-[#1565C0]">
                {actors.filter((a) => a.role === 'cooperative').length}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 card-panel">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="search"
                  className="form-input flex-1"
                  placeholder="Rechercher par nom, ID, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {ACTOR_ROLE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRoleFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                      roleFilter === f.id
                        ? 'bg-[#1B3A0F] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className="text-center py-12 text-gray-400">Chargement…</p>
              ) : (
                <div className="table-container">
                  <table className="table min-w-[32rem]">
                    <thead>
                      <tr>
                        <th>Acteur</th>
                        <th>Rôle</th>
                        <th className="hidden sm:table-cell">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((actor) => (
                        <tr
                          key={actor.id}
                          onClick={() => void loadActorDetail(actor)}
                          className={`cursor-pointer ${
                            selectedId === actor.id ? 'bg-[#F1F8E9]' : ''
                          }`}
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#F1F8E9] flex items-center justify-center shrink-0">
                                <span className="text-xs font-black text-[#33691E]">
                                  {getInitials(actor.nom || 'A')}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[var(--color-primary)] truncate">
                                  {actor.nom}
                                </p>
                                <p className="text-[10px] font-mono text-gray-400 break-all">{actor.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-xs font-bold uppercase">{roleDisplayLabel(actor.role)}</span>
                          </td>
                          <td className="py-3 hidden sm:table-cell text-sm truncate max-w-[12rem]">
                            {actor.email || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="py-16 text-center">
                      <UsersIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 font-bold">Aucun acteur pour ce filtre.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="w-full lg:w-[22rem] xl:w-[26rem] shrink-0">
              <div className="card p-5 sticky top-24">
                {!selectedActor ? (
                  <p className="text-sm text-[var(--color-muted)] text-center py-8">
                    Sélectionnez un acteur dans la liste pour afficher ses statistiques.
                  </p>
                ) : detailLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#33691E] border-t-transparent" />
                  </div>
                ) : detailError ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-black text-lg text-[var(--color-primary)]">{selectedActor.nom}</h2>
                      <p className="text-xs font-mono text-gray-500 break-all mt-1">{selectedActor.id}</p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <p className="font-bold mb-2">Chargement impossible</p>
                      <p className="break-words">{detailError}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary w-full text-sm"
                      onClick={() => void loadActorDetail(selectedActor)}
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-black text-lg text-[var(--color-primary)]">{selectedActor.nom}</h2>
                      <p className="text-xs font-mono text-gray-500 break-all mt-1">{selectedActor.id}</p>
                      <p className="text-sm text-[var(--color-muted)] mt-2">
                        {roleDisplayLabel(selectedActor.role)}
                        {selectedActor.org_name ? ` · ${selectedActor.org_name}` : ''}
                      </p>
                    </div>

                    {selectedStats ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-[#F1F8E9] p-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Lots</p>
                          <p className="text-xl font-black text-[#1B5E20]">{selectedStats.nb_lots}</p>
                        </div>
                        <div className="rounded-xl bg-[#E3F2FD] p-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Poids total</p>
                          <p className="text-xl font-black text-[#1565C0]">
                            {Math.round(selectedStats.poids_total).toLocaleString('fr-FR')} kg
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {selectedStats ? (
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase mb-2">Par statut</p>
                        {Object.keys(selectedStats.par_statut || {}).length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {Object.entries(selectedStats.par_statut).map(([st, n]) => (
                              <li key={st} className="flex justify-between">
                                <span className="capitalize">{st}</span>
                                <strong>{n}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune répartition (tous les lots sans statut ou liste vide).</p>
                        )}
                      </div>
                    ) : null}

                    {selectedLots.length > 0 ? (
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase mb-2">
                          Derniers lots ({selectedLots.length})
                        </p>
                        <ul className="max-h-48 overflow-y-auto space-y-2 text-xs">
                          {selectedLots.slice(0, 15).map((lot) => (
                            <li key={lot.id} className="p-2 rounded-lg bg-gray-50 break-all">
                              <span className="font-mono font-bold">{lot.id}</span>
                              <span className="text-gray-500"> — {lot.quantite} kg · {lot.statut || '—'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun lot enregistré pour cet acteur.</p>
                    )}

                    {isMinistereRole(user?.role) && selectedActor ? (
                      <a
                        href={`/dashboard-ministere?lot=${encodeURIComponent(selectedLots[0]?.id || '')}`}
                        className="btn btn-primary w-full text-center text-sm"
                      >
                        Auditer un lot
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </RoleLayout>
    </RoleGate>
  )
}
