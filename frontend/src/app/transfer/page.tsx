'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import api, { ActorDTO } from '@/lib/api'
import toast from 'react-hot-toast'

const TRANSFER_ALLOWED_ROLES = ['agriculteur', 'cooperative', 'transformateur', 'distributeur', 'exportateur', 'admin']

function TransferContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading, user } = useAuth()
  const [formData, setFormData] = useState({
    batch_id: '',
    to_actor_id: '',
    commentaire: ''
  })
  const [actors, setActors] = useState<ActorDTO[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const lot = searchParams.get('lot')
    if (lot) {
      setFormData((prev) => ({ ...prev, batch_id: lot.trim() }))
    }
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<{ success: boolean; actors: ActorDTO[] }>('/actors')
        .then((res) => setActors(res.data.actors || []))
        .catch(() => setActors([]))
    }
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/transfer', {
        batch_id: formData.batch_id,
        to_actor_id: formData.to_actor_id,
        commentaire: formData.commentaire,
      })
      toast.success('Transfert effectué avec succès')
      router.push('/lots')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du transfert'
      toast.error(message)
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
          <p className="text-red-600 mt-2 text-sm">Votre rôle ({user.role}) n&apos;est pas autorisé à effectuer des transferts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 sm:py-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            Transfert de Propriété
          </h1>
          <p className="text-lg mt-2 font-medium opacity-60 text-[var(--color-muted)]">
            Initier un changement de détenteur pour un lot de cacao sur la blockchain.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-[var(--color-border)]">
            <h2 className="text-2xl font-black text-[var(--color-primary)] mb-8">Détails de la Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID du Lot</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-300"
                  placeholder="Ex: 4CB-3409-A45"
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Acteur Destinataire</label>
                {actors.length > 0 ? (
                  <select
                    className="w-full px-6 py-4 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    value={formData.to_actor_id}
                    onChange={(e) => setFormData({ ...formData, to_actor_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un acteur certifié</option>
                    {actors.map((actor) => (
                      <option key={actor.id} value={actor.id}>
                        {actor.nom} ({actor.role?.toUpperCase() || '—'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    placeholder="Identifiant acteur destinataire"
                    value={formData.to_actor_id}
                    onChange={(e) => setFormData({ ...formData, to_actor_id: e.target.value })}
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commentaire de transfert</label>
                <textarea
                  className="w-full px-6 py-4 bg-gray-50 border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all placeholder:text-gray-300"
                  rows={4}
                  placeholder="Précisez les conditions de transport ou de réception..."
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-[#1B3A0F] text-white rounded-[1.5rem] text-sm font-black shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <ArrowRightIcon className="w-5 h-5" />
                      Confirmer & Enregistrer Blockchain
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 flex flex-col gap-8">
           <div className="bg-[#FAFDF7] rounded-[2rem] p-8 border border-[#33691E]/10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6">
                 <ShieldCheckIcon className="w-10 h-10 text-[#33691E]" />
              </div>
              <h3 className="text-xl font-black text-[var(--color-primary)] mb-4">Sécurité Immuable</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Ce transfert utilise une preuve de possession cryptographique. Une fois validé, il sera visible sur l'explorateur public et ne pourra être modifié.
              </p>
           </div>

           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--color-border)]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Étapes du Processus</h3>
              <div className="space-y-6">
                 {[
                   { step: '1', title: 'Vérification du Lot', desc: 'Contrôle de disponibilité' },
                   { step: '2', title: 'Signature Numérique', desc: 'Preuve de consentement' },
                   { step: '3', title: 'Minage Blockchain', desc: 'Validation par les nœuds' },
                   { step: '4', title: 'Mise à jour Registre', desc: 'Transfert effectif' },
                 ].map((s, idx) => (
                   <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-xs font-black text-[#33691E] border border-gray-100">
                         {s.step}
                      </div>
                      <div>
                         <p className="text-sm font-black text-[var(--color-primary)]">{s.title}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{s.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
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
