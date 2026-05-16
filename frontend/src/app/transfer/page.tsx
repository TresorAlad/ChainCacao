'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import api, { ActorDTO, Batch } from '@/lib/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/error-utils'
import { canAgriculteurTransfer, canTransferLot, isEnTransit } from '@/lib/lot-workflow'

const TRANSFER_ALLOWED_ROLES = ['agriculteur', 'cooperative', 'transformateur', 'exportateur', 'admin']

function filterRecipientActors(all: ActorDTO[], userRole: string | undefined, selfId: string): ActorDTO[] {
  const self = selfId.trim()
  const r = (userRole || '').toLowerCase()
  let out = all.filter((a) => {
    if (!a.id || a.id === self) return false
    const role = (a.role || '').toLowerCase()
    return role !== 'admin' && role !== 'ministere'
  })
  if (r === 'agriculteur') {
    out = out.filter((a) => (a.role || '').toLowerCase() === 'cooperative')
  } else if (r === 'cooperative') {
    out = out.filter((a) => ['transformateur', 'exportateur'].includes((a.role || '').toLowerCase()))
  } else if (r === 'transformateur') {
    out = out.filter((a) => (a.role || '').toLowerCase() === 'exportateur')
  }
  return out.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))
}

function TransferContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()

  const [step, setStep] = useState<'lot' | 'destinataire' | 'confirm'>('lot')
  const [myLots, setMyLots] = useState<Batch[]>([])
  const [lotsLoading, setLotsLoading] = useState(false)
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [batchId, setBatchId] = useState('')
  const [toActorId, setToActorId] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [lotSearch, setLotSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const lot = searchParams.get('lot')
    if (lot?.trim()) setBatchId(lot.trim())
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated) return
    setLotsLoading(true)
    api
      .get<{ success: boolean; lots: Batch[] }>('/actors/me/lots', { params: { limit: 200, page: 1 } })
      .then((res) => setMyLots(res.data.lots || []))
      .catch(() => setMyLots([]))
      .finally(() => setLotsLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    api
      .get<{ success: boolean; actors: ActorDTO[] }>('/actors', { params: { limit: 500 } })
      .then((res) => setActors(res.data.actors || []))
      .catch(() => setActors([]))
  }, [isAuthenticated])

  const selfId = user?.actor_id || ''

  const recipients = useMemo(
    () => filterRecipientActors(actors, user?.role, selfId),
    [actors, user?.role, selfId]
  )

  const myCoop = useMemo(() => {
    if (!user?.org_id) return undefined
    return recipients.find((a) => a.org_id === user.org_id)
  }, [recipients, user?.org_id])

  const selectedLot = useMemo(
    () => myLots.find((b) => b.id === batchId) ?? null,
    [myLots, batchId]
  )

  const selectedRecipient = useMemo(
    () => recipients.find((a) => a.id === toActorId) ?? null,
    [recipients, toActorId]
  )

  const roleLower = (user?.role || '').toLowerCase()

  const transferableLots = useMemo(() => {
    return myLots.filter((b) => {
      if (roleLower === 'agriculteur') return canAgriculteurTransfer(b.statut)
      return canTransferLot(b.statut)
    })
  }, [myLots, roleLower])

  const pendingReceptionLots = useMemo(
    () => myLots.filter((b) => isEnTransit(b.statut)),
    [myLots]
  )

  const filteredLots = useMemo(() => {
    const q = lotSearch.trim().toLowerCase()
    const base = transferableLots
    if (!q) return base
    return base.filter(
      (b) =>
        (b.id || '').toLowerCase().includes(q) ||
        (b.culture || '').toLowerCase().includes(q) ||
        (b.statut || '').toLowerCase().includes(q)
    )
  }, [transferableLots, lotSearch])

  const handleSubmit = async () => {
    if (!batchId.trim() || !toActorId.trim()) {
      toast.error('Choisissez un lot et un destinataire.')
      return
    }
    const lot = myLots.find((b) => b.id === batchId.trim())
    if (lot && isEnTransit(lot.statut)) {
      toast.error('Confirmez d’abord la réception physique du lot (statut en transit).')
      router.push(`/reception-lot?lot=${encodeURIComponent(lot.id)}`)
      return
    }
    setIsSubmitting(true)
    try {
      await api.post('/transfer', {
        batch_id: batchId.trim(),
        to_actor_id: toActorId.trim(),
        commentaire: commentaire.trim() || undefined,
      })
      toast.success('Transfert enregistré sur la blockchain')
      router.push('/lots')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erreur lors du transfert'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (user?.role && !TRANSFER_ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="w-full py-6 sm:py-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 font-bold text-lg">Accès non autorisé</p>
          <p className="text-red-600 mt-2 text-sm">
            Votre rôle ({user.role}) n&apos;est pas autorisé à effectuer des transferts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 sm:py-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Transférer un lot
          </h1>
          <p className="text-lg mt-2 font-medium opacity-70 text-[var(--color-muted)]">
            Choisissez un lot parmi les vôtres, puis une coopérative ou partenaire — même parcours que sur mobile.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { key: 'lot' as const, label: 'Lot', active: step === 'lot', done: step !== 'lot' },
          { key: 'destinataire' as const, label: 'Destinataire', active: step === 'destinataire', done: step === 'confirm' },
          { key: 'confirm' as const, label: 'Confirmation', active: step === 'confirm', done: false },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              if (s.key === 'lot') setStep('lot')
              if (s.key === 'destinataire' && batchId) setStep('destinataire')
              if (s.key === 'confirm' && batchId && toActorId) setStep('confirm')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${
              s.done ? 'bg-[#E8F5E9] text-[#2E7D32]' : s.active ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              {s.done ? '✓' : s.key === 'lot' ? '1' : s.key === 'destinataire' ? '2' : '3'}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {step === 'lot' && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
              <h2 className="text-xl font-black text-[var(--color-primary)] mb-4">1. Quel lot transférer ?</h2>
              <input
                type="search"
                className="form-input mb-4"
                placeholder="Rechercher par ID, culture…"
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
              />
              {pendingReceptionLots.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-900">
                  <p className="font-black mb-2">
                    {pendingReceptionLots.length} lot(s) en transit — réception requise
                  </p>
                  <p className="mb-3 text-xs">
                    Après un transfert vers vous, confirmez la réception avant de renvoyer le lot.
                  </p>
                  <ul className="space-y-2">
                    {pendingReceptionLots.slice(0, 5).map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          className="w-full text-left font-mono text-xs font-bold underline"
                          onClick={() => router.push(`/reception-lot?lot=${encodeURIComponent(b.id)}`)}
                        >
                          {b.id} — confirmer réception
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {lotsLoading ? (
                <p className="text-gray-400 py-8 text-center">Chargement de vos lots…</p>
              ) : filteredLots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-[var(--color-muted)]">
                  <p className="font-bold mb-2">Aucun lot transférable</p>
                  <p className="text-sm mb-4">
                    Les lots « en transit » doivent être réceptionnés avant un nouveau transfert.
                  </p>
                  {roleLower === 'agriculteur' ? (
                    <button type="button" className="btn btn-primary text-sm" onClick={() => router.push('/nouveau-lot')}>
                      Nouveau lot
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary text-sm" onClick={() => router.push('/reception-lot')}>
                      Réception lot
                    </button>
                  )}
                </div>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto">
                  {filteredLots.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setBatchId(b.id)}
                        className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors ${
                          batchId === b.id
                            ? 'border-[#2E7D32] bg-[#F1F8E9]'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-mono text-sm font-black text-[var(--color-primary)]">{b.id}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {b.culture || '—'} · {b.quantite ?? '—'} kg · {b.statut || '—'}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn btn-primary w-full mt-6 justify-center gap-2"
                disabled={!batchId}
                onClick={() => batchId && setStep('destinataire')}
              >
                Suivant <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 'destinataire' && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
              <h2 className="text-xl font-black text-[var(--color-primary)] mb-4">2. Destinataire</h2>
              {selectedLot && (
                <div className="rounded-xl bg-[#E8F5E9] px-4 py-3 mb-4 text-sm font-bold text-[#1B5E20] flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 shrink-0" />
                  <span className="font-mono">{selectedLot.id}</span>
                  <span className="text-gray-600 font-normal">
                    · {selectedLot.quantite} kg · {selectedLot.statut || '—'}
                  </span>
                </div>
              )}

              {(user?.role || '').toLowerCase() === 'agriculteur' && myCoop && (
                <button
                  type="button"
                  className="mb-4 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[#1565C0] bg-[#E3F2FD] px-4 py-3 text-sm font-black text-[#1565C0]"
                  onClick={() => setToActorId(myCoop.id)}
                >
                  <BuildingOffice2Icon className="w-6 h-6" />
                  Transférer vers ma coopérative ({myCoop.nom})
                </button>
              )}

              {recipients.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun destinataire compatible pour votre rôle.</p>
              ) : (
                <ul className="space-y-2 max-h-[340px] overflow-y-auto mb-4">
                  {recipients.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setToActorId(a.id)}
                        className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors ${
                          toActorId === a.id
                            ? 'border-[#2E7D32] bg-[#F1F8E9]'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-bold text-[var(--color-primary)]">{a.nom}</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">
                          {a.role} · {a.org_name || a.org_id}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Commentaire (optionnel)
              </label>
              <textarea
                className="form-input mt-2 mb-6"
                rows={3}
                placeholder="Ex. : Livraison prévue lundi…"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />

              <div className="flex gap-3">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setStep('lot')}>
                  Retour
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1 justify-center gap-2"
                  disabled={!toActorId}
                  onClick={() => toActorId && setStep('confirm')}
                >
                  Suivant <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedLot && selectedRecipient && (
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
              <h2 className="text-xl font-black text-[var(--color-primary)] mb-6">3. Confirmation</h2>
              <dl className="space-y-3 text-sm mb-8">
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                  <dt className="text-gray-500 font-bold">Lot</dt>
                  <dd className="font-mono font-black text-right">{selectedLot.id}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                  <dt className="text-gray-500 font-bold">Quantité</dt>
                  <dd className="font-bold">{selectedLot.quantite} kg</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                  <dt className="text-gray-500 font-bold">Vers</dt>
                  <dd className="font-bold text-right">{selectedRecipient.nom}</dd>
                </div>
                {commentaire.trim() ? (
                  <div className="flex justify-between gap-4 pt-1">
                    <dt className="text-gray-500 font-bold">Commentaire</dt>
                    <dd className="text-right max-w-[60%]">{commentaire.trim()}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex gap-3">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setStep('destinataire')}>
                  Retour
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1 justify-center"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? 'Envoi…' : 'Confirmer le transfert'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#FAFDF7] rounded-[2rem] p-8 border border-[#33691E]/10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-9 h-9 text-[#33691E]" />
            </div>
            <h3 className="text-lg font-black text-[var(--color-primary)] mb-2">Traçabilité</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Le transfert est signé avec votre session et enregistré sur la chaîne. Les agriculteurs ne voient que les
              coopératives comme destinataires ; utilisez « Ma coopérative » si votre compte est rattaché à la même
              organisation qu&apos;une coopérative du réseau.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
        </div>
      }
    >
      <TransferContent />
    </Suspense>
  )
}
