'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import {
  ChartBarIcon,
  CubeIcon,
  ShieldCheckIcon,
  TruckIcon,
  DocumentCheckIcon,
  QrCodeIcon,
  CpuChipIcon,
  SparklesIcon,
  GiftIcon,
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        // Animation d'entrée
        setTimeout(() => setIsVisible(true), 100)
      }
    }
  }, [isAuthenticated, loading, router])

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

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Tableau de Bord Intelligent',
      description: 'Analysez vos performances et suivez vos indicateurs clés en temps réel avec des visualisations claires et des insights actionnables.',
      color: 'bg-gradient-to-br from-[var(--color-secondary)]/20 to-[var(--color-secondary)]/5',
      iconColor: 'text-[var(--color-secondary)]',
      gradient: 'from-[var(--color-secondary)]'
    },
    {
      icon: CubeIcon,
      title: 'Traçabilité Complète',
      description: 'Suivez chaque lot du champ à l\'assiette avec une transparence totale grâce à notre technologie blockchain infalsifiable.',
      color: 'bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5',
      iconColor: 'text-[var(--color-primary)]',
      gradient: 'from-[var(--color-primary)]'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Certification EUDR',
      description: 'Générez automatiquement des rapports conformes aux réglementations européennes sur la déforestation en un clic.',
      color: 'bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5',
      iconColor: 'text-[var(--color-accent)]',
      gradient: 'from-[var(--color-accent)]'
    },
    {
      icon: TruckIcon,
      title: 'Gestion des Transferts',
      description: 'Simplifiez les transferts de propriété et assurez la conformité à chaque étape de la chaîne d\'approvisionnement.',
      color: 'bg-gradient-to-br from-[var(--color-blockchain)]/20 to-[var(--color-blockchain)]/5',
      iconColor: 'text-[var(--color-blockchain)]',
      gradient: 'from-[var(--color-blockchain)]'
    },
    {
      icon: SparklesIcon,
      title: 'Qualité Premium',
      description: 'Valorisez vos pratiques agricoles durables et prouvez l\'excellence de votre cacao.',
      color: 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5',
      iconColor: 'text-yellow-500',
      gradient: 'from-yellow-500'
    },
    {
      icon: GiftIcon,
      title: 'Gestion des Lots',
      description: 'Créez, modifiez et suivez vos lots avec des informations détaillées et des mises à jour en temps réel.',
      color: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
      gradient: 'from-purple-500'
    }
  ]

  const impactPillars = [
    {
      title: 'Traçabilité bout en bout',
      description: 'Suivez chaque lot depuis la parcelle jusqu’à l’export, avec des événements vérifiables.',
    },
    {
      title: 'Acteurs de la chaîne',
      description: 'Coordonnez coopératives, transformateurs et distributeurs sur une même source de vérité.',
    },
    {
      title: 'Transferts et historique',
      description: 'Enregistrez les changements de propriété et consultez l’historique associé à chaque lot.',
    },
    {
      title: 'Conformité EUDR',
      description: 'Appuyez vos déclarations sur des preuves géographiques et documentaires rattachées au lot.',
    },
  ]

  const floatingElements = [
    { delay: 0, duration: 6, x: -20, y: -20 },
    { delay: 1, duration: 8, x: 30, y: -40 },
    { delay: 2, duration: 7, x: -40, y: 20 },
    { delay: 3, duration: 9, x: 20, y: 40 },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-bg)]"></div>
        {floatingElements.map((el, i) => (
          <div
            key={i}
            className="absolute w-64 h-64 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float"
            style={{
              background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
              animationDelay: `${el.delay}s`,
              animationDuration: `${el.duration}s`,
              transform: `translate(${el.x}px, ${el.y}px)`
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-90"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden ring-2 ring-[var(--color-border)]/60 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BrandLogo className="w-full h-full" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
                ChainCacao
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-[var(--color-earth)] hover:text-[var(--color-primary)] transition-colors font-medium relative group">
                Fonctionnalités
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link href="#stats" className="text-[var(--color-earth)] hover:text-[var(--color-primary)] transition-colors font-medium relative group">
                Impact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
              <Link href="#about" className="text-[var(--color-earth)] hover:text-[var(--color-primary)] transition-colors font-medium relative group">
                À Propos
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all group-hover:w-full"></span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 group">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Connexion
              </Link>
              <Link href="/register" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all duration-300 group">
                Commencer
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--color-secondary)]/20 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text Content */}
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-sm font-medium mb-6 border border-[var(--color-secondary)]/20">
                <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse"></span>
                Plateforme Certifiée Blockchain
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-primary)] mb-6 leading-tight">
                Traçabilité
                <span className="block text-[var(--color-secondary)]">Complète</span>
                <span className="block text-[var(--color-earth)]">pour le Cacao</span>
              </h1>
              
              <p className="text-lg md:text-xl text-[var(--color-muted)] mb-8 leading-relaxed max-w-xl">
                Suivez chaque étape de votre chaîne d'approvisionnement avec une transparence totale. De la plantation à l'exportation, garantissez la qualité et l'authenticité de vos produits grâce à la technologie blockchain.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
                <Link href="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all duration-300 group">
                  <span className="relative z-10 flex items-center gap-2">
                    Commencer Maintenant
                    <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link href="#features" className="btn-secondary-outline inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--color-secondary)] text-[var(--color-secondary)] font-semibold hover:bg-[var(--color-secondary)] hover:text-white transition-all duration-300 group">
                  <span className="flex items-center gap-2">
                    Découvrir
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-sm text-[var(--color-muted)]">Certifié EUDR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CpuChipIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-[var(--color-muted)]">Blockchain</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <DocumentCheckIcon className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm text-[var(--color-muted)]">Rapports Auto</span>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className={`relative transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative w-full max-w-lg mx-auto">
                {/* Main Card */}
                <div className="relative bg-[var(--color-surface)] rounded-3xl p-8 shadow-2xl border border-[var(--color-border)] overflow-hidden group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-px bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      </div>
                      <span className="text-xs text-[var(--color-muted)]">Fiche lot (aperçu)</span>
                    </div>

                    {/* Product Info — illustration sans données fictives */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-bg)]/50 border border-[var(--color-border)]/50">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 flex items-center justify-center">
                          <GiftIcon className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--color-muted)]">Culture</p>
                          <p className="font-semibold text-[var(--color-earth)]">—</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--color-muted)]">Quantité</p>
                        <p className="font-semibold text-[var(--color-earth)]">—</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--color-muted)]">Origine</p>
                        <p className="font-semibold text-[var(--color-earth)]">—</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                        <p className="text-xs text-green-500 mb-1">Quantité</p>
                        <p className="font-bold text-green-600">—</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                        <p className="text-xs text-blue-500 mb-1">Origine</p>
                        <p className="font-bold text-blue-600">—</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-muted)]">Traçabilité (blockchain)</span>
                        <span className="font-semibold text-[var(--color-muted)]">Données réelles après connexion</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                        <div className="h-full w-1/3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full opacity-60" />
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 backdrop-blur-sm flex items-center justify-center animate-float" style={{ animationDelay: '0s' }}>
                  <QrCodeIcon className="w-8 h-8 text-[var(--color-accent)]" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-success)]/30 to-[var(--color-success)]/10 border border-[var(--color-success)]/30 backdrop-blur-sm flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
                  <ShieldCheckIcon className="w-6 h-6 text-[var(--color-success)]" />
                </div>
                <div className="absolute top-1/2 -right-6 w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-secondary)]/30 to-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 backdrop-blur-sm flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
                  <SparklesIcon className="w-4 h-4 text-[var(--color-secondary)]" />
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 bg-[var(--color-surface)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent"></div>
        </div>
        
         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-20">
             <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)] mb-6">
               Fonctionnalités Clés
             </h2>
             <p className="text-lg text-[var(--color-muted)] max-w-3xl mx-auto leading-relaxed">
               Des outils puissants conçus pour simplifier votre gestion et garantir la traçabilité de chaque lot
             </p>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {features.map((feature, index) => (
               <div
                 key={index}
                 className="bg-[var(--color-surface)] rounded-2xl p-8 group hover:shadow-xl transition-all duration-500 cursor-pointer border border-[var(--color-border)]/50"
                 style={{ 
                   animationDelay: `${index * 0.1}s`,
                   opacity: isVisible ? 1 : 0,
                   transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
                 }}
               >
                 <div className="stat-card-icon flex items-center justify-center mb-6 w-14 h-14 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-lg" style={{ background: feature.gradient }}>
                   <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                 </div>
                 <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3 group-hover:text-[var(--color-secondary)] transition-colors">
                   {feature.title}
                 </h3>
                 <p className="text-[var(--color-muted)] leading-relaxed mb-6">
                   {feature.description}
                 </p>
                 <div className="pt-4 border-t border-[var(--color-border)]">
                   <Link 
                     href="/dashboard" 
                     className="text-[var(--color-primary)] font-semibold text-sm flex items-center gap-1 group/btn"
                   >
                     En savoir plus
                     <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <section id="stats" className="relative py-24 bg-[var(--color-bg)] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)] mb-6">
                Notre Impact
              </h2>
              <p className="text-lg text-[var(--color-muted)]">
                Chaque jour, nous aidons la filière cacao à devenir plus transparente et durable
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {impactPillars.map((pillar, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-surface)] rounded-2xl p-8 text-left group hover:scale-[1.02] transition-all duration-500 border border-[var(--color-border)]/50"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
                  }}
                >
                  <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-body-sm text-[var(--color-muted)] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)] opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à optimiser votre traçabilité ?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connectez-vous pour enregistrer vos lots, suivre les transferts et produire vos justificatifs de traçabilité.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-accent inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-semibold hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all duration-300 group">
              <span className="relative z-10 flex items-center gap-2">
                Créer un Compte Gratuit
                <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
            <Link href="/login" className="btn-accent-outline inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white hover:text-[var(--color-primary)] transition-all duration-300 group">
              <span className="flex items-center gap-2">
                Se Connecter
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-[var(--color-border)] shadow-sm shrink-0">
                <BrandLogo className="w-full h-full" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
                ChainCacao
              </span>
            </div>
            <p className="text-[var(--color-muted)] text-sm">
              © 2026 ChainCacao. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
