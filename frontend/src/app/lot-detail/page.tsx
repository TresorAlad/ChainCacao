'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
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

export default function LotDetailPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [lot, setLot] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    // Simuler le chargement des données
    const mockLot = {
      id: 'LOT-2024-0892',
      type: 'Cacao Forastero',
      variety: 'Nacional',
      quantity: '2,500 kg',
      weight: '2.5 tonnes',
      harvestDate: '15 Mars 2026',
      farm: 'Finca La Esperanza',
      region: 'Huila, Colombie',
      status: 'En Transit',
      statusColor: 'warning',
      euDRCompliant: true,
      owner: 'Coop Agri Nord',
      origin: {
        lat: 2.3456,
        lng: -75.1234,
        altitude: '1,400m'
      },
      certifications: ['Bio', 'Fair Trade', 'Rainforest Alliance'],
      notes: 'Cacao de haute qualité avec profil aromatique floral et fruits rouges. Récolte manuelle à maturité optimale.',
      history: [
        { date: '15 Mar 2026', action: 'Récolte', actor: 'Finca La Esperanza', location: 'Huila' },
        { date: '18 Mar 2026', action: 'Fermentation', actor: 'Coop Agri Nord', location: 'Huila' },
        { date: '22 Mar 2026', action: 'Séchage', actor: 'Coop Agri Nord', location: 'Huila' },
        { date: '25 Mar 2026', action: 'Emballage', actor: 'Coop Agri Nord', location: 'Huila' },
        { date: '01 Apr 2026', action: 'Expédition', actor: 'Transport ABC', location: 'Bogota' },
        { date: '05 Apr 2026', action: 'En Transit', actor: 'Douane', location: 'Port de Cartagena' }
      ]
    }
    setLot(mockLot)
  }, [loading, isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated || !lot) return null

  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800'
  }

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
              {lot.type} - {lot.variety}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary-outline btn-sm flex items-center gap-2">
              <QrCodeIcon className="w-4 h-4" />
              QR Code
            </button>
            <button className="btn btn-primary btn-sm flex items-center gap-2">
              <DownloadIcon className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </header>

      {/* Statut global */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                lot.euDRCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <ShieldCheckIcon className="w-4 h-4" />
                {lot.euDRCompliant ? 'Conforme EUDR' : 'Non conforme'}
              </span>
              <span className={`badge ${statusColors[lot.statusColor === 'warning' ? 'warning' : lot.statusColor === 'success' ? 'success' : 'info']}`}>
                {lot.status}
              </span>
            </div>
            <div className="flex gap-2">
              <Link href={`/transfer?lot=${lot.id}`} className="btn btn-secondary btn-sm flex items-center gap-2">
                <TruckIcon className="w-4 h-4" />
                Transférer
              </Link>
              <Link href={`/update-weight?lot=${lot.id}`} className="btn btn-primary btn-sm">
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
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Type et variété</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.type} - {lot.variety}</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Quantité</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.quantity} ({lot.weight})</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Propriétaire</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)]">{lot.owner}</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Date de récolte</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)] flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[var(--color-muted)]" />
                    {lot.harvestDate}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-body-sm text-[var(--color-muted)] mb-1">Notes</p>
                  <p className="text-body-md leading-relaxed text-[var(--color-earth)]">{lot.notes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Origine */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Origine et certifications
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-2">Exploitation</p>
                  <p className="text-body-md font-medium text-[var(--color-earth)] mb-1">{lot.farm}</p>
                  <p className="text-body-sm text-[var(--color-muted)]">{lot.region}</p>
                  <p className="text-body-sm text-[var(--color-muted)]">Altitude: {lot.origin.altitude}</p>
                </div>
                <div>
                  <p className="text-body-sm text-[var(--color-muted)] mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {lot.certifications.map((cert: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="card group">
            <div className="card-header border-b border-[var(--color-border)]/50">
              <h2 className="card-title flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Historique de traçabilité
              </h2>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Date</th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Action</th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Acteur</th>
                      <th className="px-6 py-4 text-left text-body-sm font-semibold text-[var(--color-muted)]">Localisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lot.history.map((event: any, i: number) => (
                      <tr key={i} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50 transition-all">
                        <td className="px-6 py-4 text-body-sm text-[var(--color-earth)]">{event.date}</td>
                        <td className="px-6 py-4 font-medium text-[var(--color-primary)]">{event.action}</td>
                        <td className="px-6 py-4 text-[var(--color-earth)]">{event.actor}</td>
                        <td className="px-6 py-4 text-[var(--color-muted)]">{event.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <button className="w-full btn btn-outline btn-sm text-left justify-start group/btn">
                  <ShareIcon className="w-4 h-4 text-[var(--color-muted)] group-hover/btn:text-[var(--color-primary)] transition-colors" />
                  <span className="text-[var(--color-earth)]">Partager</span>
                </button>
                <Link href={`/eudr-report?lot=${lot.id}`} className="w-full btn btn-primary btn-sm justify-start group/btn">
                  <FileCheckIcon className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  <span>Rapport EUDR</span>
                </Link>
                <button className="w-full btn btn-outline btn-sm text-left justify-start group/btn">
                  <QrCodeIcon className="w-4 h-4 text-[var(--color-muted)] group-hover/btn:text-[var(--color-primary)] transition-colors" />
                  <span className="text-[var(--color-earth)]">Générer QR</span>
                </button>
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
                  <span className="text-body-sm text-[var(--color-muted)]">Temps en stock</span>
                  <span className="text-body-md font-bold text-[var(--color-primary)]">12 jours</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                  <span className="text-body-sm text-[var(--color-muted)]">Transferts</span>
                  <span className="text-body-md font-bold text-[var(--color-primary)]">2</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50">
                  <span className="text-body-sm text-[var(--color-muted)]">Dernière mise à jour</span>
                  <span className="text-body-md font-bold text-[var(--color-primary)]">05 Avr 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}