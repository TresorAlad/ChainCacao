'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  PackageIcon, 
  HistoryIcon, 
  MapPinIcon, 
  CalendarIcon,
  WeightIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  DownloadIcon,
  ShareIcon,
  TruckIcon,
  CheckCircleIcon,
  FileCheckIcon
} from 'lucide-react'
import Link from 'next/link'
import api, { Batch, BatchHistoryEvent } from '@/lib/api'
import toast from 'react-hot-toast'

function LotDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const [lot, setLot] = useState<Batch | null>(null)
  const [history, setHistory] = useState<BatchHistoryEvent[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const lotId = searchParams.get('id')

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (!isAuthenticated || !lotId) return

    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [lotRes, histRes] = await Promise.all([
          api.get<Batch>(`/lot/${lotId}`),
          api.get<{ success: boolean; events: BatchHistoryEvent[] }>(`/lot/${lotId}/history`),
        ])
        setLot(lotRes.data)
        setHistory(histRes.data.events || [])
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors du chargement du lot')
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, lotId])

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (!lotId) {
    return (
      <div className="page-container">
        <div className="card p-8 text-center">
          <p className="text-[var(--color-muted)]">Aucun ID de lot spécifié.</p>
          <Link href="/lots" className="btn btn-primary mt-4">Retour aux lots</Link>
        </div>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="page-container">
        <div className="card p-8 text-center">
          <p className="text-[var(--color-muted)]">Lot introuvable.</p>
          <Link href="/lots" className="btn btn-primary mt-4">Retour aux lots</Link>
        </div>
      </div>
    )
  }

  const isCompliant = lot.eudr_conforme

  return (
    <div className="page-container">
      {/* En-tête du lot */}
      <header className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)]">
              {lot.id}
            </h1>
            <p className="text-[var(--color-muted)] mt-1">
              {lot.culture} — {lot.variete}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/qrcode?id=${lot.id}`} className="btn btn-secondary-outline btn-sm flex items-center gap-2">
              <QrCodeIcon className="w-4 h-4" />
              QR Code
            </Link>
            <Link href={`/eudr-report?lot=${lot.id}`} className="btn btn-primary btn-sm flex items-center gap-2">
              <DownloadIcon className="w-4 h-4" />
              Rapport EUDR
            </Link>
          </div>
        </div>
      </header>

      {/* Statut global */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <ShieldCheckIcon className="w-4 h-4" />
                {isCompliant ? 'Conforme EUDR' : 'Non conforme'}
              </span>
              {lot.statut && (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {lot.statut}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/transfer?lot=${lot.id}`} className="btn btn-secondary btn-sm flex items-center gap-2">
                <TruckIcon className="w-4 h-4" />
                Transférer
              </Link>
              <Link href={`/update-weight?lot=${lot.id}`} className="btn btn-primary btn-sm flex items-center gap-2">
                <WeightIcon className="w-4 h-4" />
                Mettre à jour poids
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails principaux */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Détails du lot
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Culture et variété</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.culture} — {lot.variete}</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Quantité</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.quantite} kg</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Propriétaire</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.proprietaire_id || '—'}</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Date de récolte</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)] flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[var(--color-muted)]" />
                    {lot.date_recolte || '—'}
                  </p>
                </div>
                {lot.notes && (
                  <div className="md:col-span-2">
                    <p className="text-body-sm text-[var(--color-muted)] mb-1">Notes</p>
                    <p className="text-body-md leading-relaxed text-[var(--color-earth)]">{lot.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Origine */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Origine géographique
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-2">Lieu</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.lieu || '—'}</p>
                  <p className="text-body-sm text-[var(--color-muted)]">{lot.region} — {lot.village}</p>
                  <p className="text-body-sm text-[var(--color-muted)]">Parcelle : {lot.parcelle || '—'}</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-2">Coordonnées GPS</p>
                  <p className="text-body-sm font-medium text-[var(--color-earth)]">
                    Lat: {lot.latitude ?? '—'} / Lon: {lot.longitude ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Historique de traçabilité ({history.length} événement{history.length !== 1 ? 's' : ''})
              </h2>
            </div>
            <div className="card-body p-0">
              {history.length === 0 ? (
                <p className="p-6 text-[var(--color-muted)] text-center">Aucun événement enregistré.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Date</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Type</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Acteur</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Commentaire</th>
                        <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((event, i) => (
                        <tr key={i} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-all">
                          <td className="px-6 py-4 text-body-sm text-[var(--color-earth)]">
                            {new Date(event.created_at).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{event.type}</td>
                          <td className="px-6 py-4 text-[var(--color-earth)]">{event.actor_id || '—'}</td>
                          <td className="px-6 py-4 text-[var(--color-muted)]">{event.commentaire || '—'}</td>
                          <td className="px-6 py-4 text-[var(--color-muted)] font-mono text-xs">
                            {event.tx_hash ? `${event.tx_hash.slice(0, 10)}...` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title text-title-sm">Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: lot.id, url: window.location.href })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Lien copié !')
                    }
                  }}
                  className="w-full btn btn-outline btn-sm text-left justify-start group/btn"
                >
                  <ShareIcon className="w-4 h-4 text-[var(--color-muted)] group-hover/btn:text-[var(--color-primary)] transition-colors" />
                  <span className="text-[var(--color-earth)]">Partager</span>
                </button>
                <Link href={`/eudr-report?lot=${lot.id}`} className="w-full btn btn-primary btn-sm justify-start group/btn">
                  <FileCheckIcon className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  <span>Rapport EUDR</span>
                </Link>
                <Link href={`/qrcode?id=${lot.id}`} className="w-full btn btn-outline btn-sm text-left justify-start group/btn">
                  <QrCodeIcon className="w-4 h-4 text-[var(--color-muted)] group-hover/btn:text-[var(--color-primary)] transition-colors" />
                  <span className="text-[var(--color-earth)]">Générer QR</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Indicateurs */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title text-title-sm">Indicateurs</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                  <span className="text-body-sm text-[var(--color-muted)]">Événements</span>
                  <span className="text-body-md font-bold text-[var(--color-primary)]">{history.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                  <span className="text-body-sm text-[var(--color-muted)]">Organisation</span>
                  <span className="text-body-md font-bold text-[var(--color-primary)] truncate max-w-[120px]">{lot.org_id || '—'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                  <span className="text-body-sm text-[var(--color-muted)]">Enregistré le</span>
                  <span className="text-body-sm font-bold text-[var(--color-primary)]">
                    {lot.timestamp ? new Date(lot.timestamp).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </div>
                {lot.certificat_url && (
                  <a
                    href={lot.certificat_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-body-sm hover:bg-green-100 transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Voir certificat
                  </a>
                )}
                {lot.photo_url && (
                  <a
                    href={lot.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-body-sm hover:bg-blue-100 transition-colors"
                  >
                    <PackageIcon className="w-4 h-4" />
                    Voir photo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LotDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    }>
      <LotDetailContent />
    </Suspense>
  )
}
