'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  ChartBarIcon, 
  CubeIcon, 
  ShieldCheckIcon, 
  TruckIcon,
  DocumentCheckIcon,
  QrCodeIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard')
      }
    }
  }, [isAuthenticated, loading, router])

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Tableau de Bord',
      description: 'Analysez vos performances et suivez vos indicateurs clés en temps réel avec des visualisations claires et interactives.',
      color: 'bg-[var(--color-secondary)]/10',
      iconColor: 'text-[var(--color-secondary)]'
    },
    {
      icon: CubeIcon,
      title: 'Traçabilité Complète',
      description: 'Suivez chaque lot du champ à l\'assiette avec une transparence totale grâce à notre technologie blockchain.',
      color: 'bg-[var(--color-primary)]/10',
      iconColor: 'text-[var(--color-primary)]'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Certification EUDR',
      description: 'Générez automatiquement des rapports conformes aux réglementations européennes sur la déforestation.',
      color: 'bg-[var(--color-accent)]/10',
      iconColor: 'text-[var(--color-accent)]'
    },
    {
      icon: TruckIcon,
      title: 'Gestion des Transferts',
      description: 'Simplifiez les transferts de propriété et assurez la conformité à chaque étape de la chaîne d\'approvisionnement.',
      color: 'bg-[var(--color-blockchain)]/10',
      iconColor: 'text-[var(--color-blockchain)]'
    }
  ]

  const stats = [
    { label: 'Lots Traçables', value: '2,847' },
    { label: 'Acteurs Enregistrés', value: '156' },
    { label: 'Transferts Effectués', value: '1,234' },
    { label: 'Certificats EUDR', value: '89' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[var(--color-primary)]">ChainCacao</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-[var(--color-earth)] hover:text-[var(--color-primary)] transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#stats" className="text-[var(--color-earth)] hover:text-[var(--color-primary)] transition-colors">
                Statistiques
              </Link>
              <Link href="/login" className="btn btn-primary-outline">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-secondary)]/5"></div>
          <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--color-secondary)]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-[var(--color-accent)]/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)]"></span>
              Plateforme Certifiée Blockchain
            </div>
            
            <h1 className="text-display-lg md:text-display-xl font-bold text-[var(--color-primary)] mb-6 leading-tight">
              Traçabilité Complète<br />
              <span className="text-[var(--color-secondary)]">pour la filière Cacao</span>
            </h1>
            
            <p className="text-body-lg text-[var(--color-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
              Suivez chaque étape de votre chaîne d'approvisionnement avec une transparence totale. 
              De la plantation à l'exportation, garantissez la qualité et l'authenticité de vos produits.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/login" className="btn btn-primary btn-lg w-full sm:w-auto">
                Commencer Maintenant
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="#features" className="btn btn-secondary-outline w-full sm:w-auto">
                Découvrir les Fonctionnalités
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 text-[var(--color-muted)]">
                <ShieldCheckIcon className="w-5 h-5 text-[var(--color-success)]" />
                <span className="text-body-sm">Certifié EUDR</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-muted)]">
                <CpuChipIcon className="w-5 h-5 text-[var(--color-info)]" />
                <span className="text-body-sm">Technologie Blockchain</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-muted)]">
                <DocumentCheckIcon className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="text-body-sm">Rapports Automatisés</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-md font-bold text-[var(--color-primary)] mb-4">
              Fonctionnalités Clés
            </h2>
            <p className="text-body-lg text-[var(--color-muted)] max-w-3xl mx-auto">
              Des outils puissants conçus pour simplifier votre gestion et garantir la traçabilité 
              de chaque lot à chaque étape.
            </p>
          </div>

          <div className="grid-cols-responsive grid gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card p-8 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`stat-card-icon ${feature.color} ${feature.iconColor} mb-6 w-14 h-14`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-title-md font-semibold text-[var(--color-primary)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-body-md text-[var(--color-muted)] leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-6">
                  <Link 
                    href={`/${feature.title.toLowerCase().replace(/ /g, '-')}`}
                    className="text-[var(--color-primary)] font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    En savoir plus
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-md font-bold text-[var(--color-primary)] mb-4">
              Chiffres Clés
            </h2>
            <p className="text-body-lg text-[var(--color-muted)]">
              Notre impact sur la filière cacao
            </p>
          </div>

          <div className="grid-cols-stats grid gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="stat-card text-center p-8 hover:scale-105 transition-transform"
              >
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display-md font-bold text-white mb-6">
            Prêt à optimiser votre traçabilité ?
          </h2>
          <p className="text-body-lg text-white/70 mb-10 max-w-2xl mx-auto">
            Rejoignez des centaines d'acteurs qui utilisent déjà ChainCacao pour simplifier 
            leur gestion et garantir la qualité de leurs produits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn btn-accent btn-lg w-full sm:w-auto">
              Créer un Compte Gratuit
            </Link>
            <Link href="/login" className="btn btn-accent-outline w-full sm:w-auto">
              Se Connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-[var(--color-primary)]">ChainCacao</span>
            </div>
            <p className="text-body-sm text-[var(--color-muted)]">
              © 2026 ChainCacao. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
