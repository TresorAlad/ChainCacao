'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LotsPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const statusColors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
    'En Transit': 'bg-yellow-100 text-yellow-800',
    'Exporté': 'bg-green-100 text-green-800',
    'En Stock': 'bg-blue-100 text-blue-800',
    'En Inspection': 'bg-gray-100 text-gray-800'
  }

  const lots = [
    { id: 'LOT-2024-0892', type: 'Cacao Forastero', variety: 'Nacional', quantity: '2,500 kg', weight: '2.5 tonnes', harvestDate: '15 Mar 2026', farm: 'Finca La Esperanza', region: 'Huila, Colombia', status: 'En Transit', statusColor: 'warning', euDRCompliant: true },
    { id: 'LOT-2024-0891', type: 'Cacao Criollo', variety: 'Porcelana', quantity: '1,800 kg', weight: '1.8 tonnes', harvestDate: '22 Mar 2026', farm: 'Hacienda Cacao', region: 'Tabasco, Mexico', status: 'Exporté', statusColor: 'success', euDRCompliant: true },
    { id: 'LOT-2024-0890', type: 'Cacao Trinitario', variety: 'CCN-51', quantity: '3,200 kg', weight: '3.2 tonnes', harvestDate: '08 Apr 2026', farm: 'Coop Agri Nord', region: 'Sassandra, Côte d\'Ivoire', status: 'En Stock', statusColor: 'info', euDRCompliant: true },
    { id: 'LOT-2024-0889', type: 'Cacao Forastero', variety: 'Amelonado', quantity: '1,500 kg', weight: '1.5 tonnes', harvestDate: '30 Mar 2026', farm: 'Plantation Royale', region: 'Kumasi, Ghana', status: 'En Inspection', statusColor: 'neutral', euDRCompliant: false },
    { id: 'LOT-2024-0888', type: 'Cacao Criollo', variety: 'Chuao', quantity: '900 kg', weight: '0.9 tonnes', harvestDate: '12 Apr 2026', farm: 'Hacienda Carache', region: 'Aragua, Venezuela', status: 'En Stock', statusColor: 'info', euDRCompliant: true },
  ]

  const badgeClass = (statusColor: string) => {
    return statusColors[statusColor] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Mes Lots</h1>
        <p className="page-description">Liste de tous vos lots agricoles</p>
      </header>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Lot</th>
                  <th>Type & Variété</th>
                  <th>Quantité</th>
                  <th>Origine</th>
                  <th>Statut</th>
                  <th>EUDR</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="font-medium text-[var(--color-primary)]">{lot.id}</td>
                    <td>
                      <div>
                        <p className="font-medium">{lot.type}</p>
                        <p className="text-body-sm text-[var(--color-muted)]">{lot.variety}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium">{lot.quantity}</span>
                      <br />
                      <span className="text-caption">{lot.weight}</span>
                    </td>
                    <td>
                      <p className="font-medium">{lot.farm}</p>
                      <p className="text-body-sm text-[var(--color-muted)]">{lot.region}</p>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass(lot.statusColor)}`}>
                        {lot.status}
                      </span>
                    </td>
                    <td>
                      {lot.euDRCompliant ? (
                        <span className="badge badge-success">Conforme</span>
                      ) : (
                        <span className="badge badge-error">Non conforme</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/lot-detail?id=${lot.id}`} className="btn btn-secondary-outline btn-sm">
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}