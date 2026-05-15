'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { AdminGate } from '@/components/AdminGate'
import api, { type ActorDTO } from '@/lib/api'
import { getRoleDisplayName, type UserRole } from '@/lib/role-utils'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'

const ROLES: UserRole[] = [
  'agriculteur',
  'cooperative',
  'transformateur',
  'exportateur',
  'ministere',
  'admin',
]

type CreateForm = {
  nom: string
  email: string
  password: string
  org_id: string
  role: UserRole
  pin: string
}

const emptyCreate: CreateForm = {
  nom: '',
  email: '',
  password: '',
  org_id: 'CooperativeMSP',
  role: 'agriculteur',
  pin: '1234',
}

export default function AdminUtilisateursPage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [fetching, setFetching] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate)
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadActors = () => {
    setFetching(true)
    api
      .get<{ success: boolean; actors: ActorDTO[] }>('/admin/actors')
      .then((res) => setActors(res.data.actors || []))
      .catch((err) => toast.error(getErrorMessage(err, 'Impossible de charger les utilisateurs')))
      .finally(() => setFetching(false))
  }

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') loadActors()
  }, [isAuthenticated, user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    const pin = createForm.pin.trim()
    if (!/^\d{4}$/.test(pin)) {
      const msg = 'Le PIN doit comporter exactement 4 chiffres.'
      setCreateError(msg)
      toast.error(msg)
      return
    }
    setSaving(true)
    try {
      const email = createForm.email.trim().toLowerCase()
      const role = createForm.role
      await api.post('/admin/actors', {
        nom: createForm.nom.trim(),
        email,
        password: createForm.password,
        org_id: createForm.org_id.trim(),
        role,
        pin,
      })
      toast.success(`Compte créé : ${email} — rôle « ${getRoleDisplayName(role)} »`)
      setShowCreate(false)
      setCreateForm(emptyCreate)
      setCreateError(null)
      loadActors()
    } catch (err) {
      const msg = getErrorMessage(err, 'Création impossible')
      setCreateError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleSuspend = async (actor: ActorDTO) => {
    try {
      await api.patch(`/admin/actors/${actor.id}`, { suspended: !actor.suspended })
      toast.success(actor.suspended ? 'Compte réactivé' : 'Compte suspendu')
      loadActors()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Mise à jour impossible'))
    }
  }

  const resetPin = async (actor: ActorDTO) => {
    const ok = window.confirm(
      `Réinitialiser le PIN de « ${actor.nom} » ?\n\n` +
        `Un nouveau code à 4 chiffres sera généré immédiatement et affiché ensuite : transmettez-le à l’utilisateur par un canal sécurisé (pas par e-mail en clair si possible).`
    )
    if (!ok) return
    try {
      const res = await api.post<{ success: boolean; pin: string; message?: string }>(
        `/admin/actors/${actor.id}/reset-pin`
      )
      const pin = res.data.pin
      const serverMsg = res.data.message || 'PIN réinitialisé avec succès.'
      toast.success(`${serverMsg} — Nouveau PIN : ${pin}`, { duration: 14000 })
      if (process.env.NODE_ENV === 'development') {
        console.info('[admin/utilisateurs] PIN réinitialisé', { actor_id: actor.id, nom: actor.nom })
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Réinitialisation impossible'))
      if (process.env.NODE_ENV === 'development') {
        console.warn('[admin/utilisateurs] reset-pin erreur', actor.id, err)
      }
    }
  }

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
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#33691E] mb-6 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Retour administration
        </Link>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-primary)]">Utilisateurs</h1>
            <p className="text-[var(--color-muted)] mt-1">
              Gestion complète des comptes ChainCacao ({actors.length} compte{actors.length !== 1 ? 's' : ''})
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreate((v) => !v)
              setCreateError(null)
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3A0F] text-white rounded-xl text-sm font-bold"
          >
            <PlusIcon className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </header>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl p-6 border border-[var(--color-border)] mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="form-label">Nom</label>
              <input
                className="form-input"
                value={createForm.nom}
                onChange={(e) => setCreateForm((f) => ({ ...f, nom: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="form-label">PIN (4 chiffres)</label>
              <input
                className="form-input"
                value={createForm.pin}
                onChange={(e) => setCreateForm((f) => ({ ...f, pin: e.target.value }))}
                required
                maxLength={4}
                pattern="\d{4}"
              />
            </div>
            <div>
              <label className="form-label">Organisation (org_id)</label>
              <input
                className="form-input"
                value={createForm.org_id}
                onChange={(e) => setCreateForm((f) => ({ ...f, org_id: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Rôle</label>
              <select
                className="form-input"
                value={createForm.role}
                onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {getRoleDisplayName(r)}
                  </option>
                ))}
              </select>
            </div>
            {createError ? (
              <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-bold mb-1">Erreur</p>
                <p className="break-words">{createError}</p>
              </div>
            ) : null}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Création…' : 'Créer le compte'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowCreate(false)
                  setCreateError(null)
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {fetching ? (
            <p className="p-8 text-center text-[var(--color-muted)]">Chargement…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Utilisateur</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Rôle</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Org</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400">Statut</th>
                    <th className="p-4 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {actors.map((actor) => (
                    <tr key={actor.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-bold text-[var(--color-primary)]">{actor.nom}</p>
                        <p className="text-xs text-gray-500">{actor.email || actor.id}</p>
                      </td>
                      <td className="p-4">{getRoleDisplayName(actor.role)}</td>
                      <td className="p-4 font-mono text-xs">{actor.org_id}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            actor.suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {actor.suspended ? 'Suspendu' : 'Actif'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleSuspend(actor)}
                          className="text-xs font-bold text-[#33691E] hover:underline"
                        >
                          {actor.suspended ? 'Réactiver' : 'Suspendre'}
                        </button>
                        <button
                          type="button"
                          onClick={() => resetPin(actor)}
                          className="text-xs font-bold text-amber-700 hover:underline"
                        >
                          PIN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminGate>
  )
}
