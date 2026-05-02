'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) {
    return <p>Redirection...</p>
  }

  return (
    <div>
      <h1 className="text-h1 mb-6">Mon profil</h1>
      <div className="card mb-6">
        <div className="space-y-4">
          <p><strong>Actor ID :</strong> {user.actor_id || 'Non défini'}</p>
          <p><strong>Email :</strong> {user.email || 'Non défini'}</p>
          <p><strong>Rôle :</strong> {user.role || 'utilisateur'}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={logout} className="btn-outline">
          Déconnexion
        </button>
        <Link href="/dashboard" className="btn-outline">
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}
