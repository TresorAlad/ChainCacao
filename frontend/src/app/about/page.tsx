'use client'

import Link from 'next/link'
import { ShieldCheckIcon, GlobeAmericasIcon, UsersIcon } from '@heroicons/react/24/outline'

const ACTEURS = [
  { role: 'Agriculteur', interface: 'Mobile React Native', desc: 'Création lots, paiements, portefeuille' },
  { role: 'Coopérative', interface: 'Mobile + Web', desc: 'Réception, listes groupées, marges' },
  { role: 'Transformateur', interface: 'Web Next.js', desc: 'Achat direct, transformation, paiements' },
  { role: 'Exportateur', interface: 'Web Next.js', desc: 'Export, paiement par ID lot' },
  { role: 'Ministère', interface: 'Web Next.js', desc: 'Supervision, audit, alertes fraude' },
  { role: 'Admin système', interface: 'Web Next.js', desc: 'Acteurs, marges coopératives, configuration' },
]

const ODD = [
  { id: 'ODD 1', label: 'Pas de pauvreté — paiement direct < 60 s' },
  { id: 'ODD 8', label: 'Travail décent — transparence des pesées' },
  { id: 'ODD 12', label: 'Consommation responsable — traçabilité UE' },
  { id: 'ODD 16', label: 'Institutions efficaces — registre immuable' },
]

export default function AboutPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4">
      <h1 className="text-4xl font-black text-[var(--color-primary)] mb-4">À propos de ChainCacao</h1>
      <p className="text-lg text-[var(--color-muted)] mb-10 leading-relaxed">
        Plateforme de traçabilité café/cacao pour le Togo — du champ à l&apos;exportation, avec preuves GPS,
        blockchain Hyperledger Fabric et paiements Mobile Money (Flooz / T-Money).
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-black text-[var(--color-primary)] mb-6 flex items-center gap-2">
          <UsersIcon className="w-7 h-7 text-[#33691E]" />
          Les 6 acteurs du MVP
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ACTEURS.map((a) => (
            <div key={a.role} className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
              <p className="font-black text-[var(--color-primary)]">{a.role}</p>
              <p className="text-xs font-bold text-[#33691E] uppercase tracking-widest mt-1">{a.interface}</p>
              <p className="text-sm text-[var(--color-muted)] mt-2">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black text-[var(--color-primary)] mb-6 flex items-center gap-2">
          <ShieldCheckIcon className="w-7 h-7 text-[#33691E]" />
          Objectifs stratégiques (CDC)
        </h2>
        <ul className="space-y-3">
          {[
            'Photo caméra + GPS EXIF obligatoires à la création',
            'QR code automatique et mode hors ligne avec sync',
            'Listes groupées coopérative et marge officielle',
            'Portefeuille intégré avec code PIN',
            'Paiement web par identifiant de lot (transformateur / exportateur)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
              <span className="w-2 h-2 rounded-full bg-[#33691E] mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-black text-[var(--color-primary)] mb-6 flex items-center gap-2">
          <GlobeAmericasIcon className="w-7 h-7 text-[#33691E]" />
          ODD couverts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ODD.map((o) => (
            <div key={o.id} className="p-4 rounded-xl bg-[#F1F8E9] border border-[#C8E6C9]">
              <p className="text-xs font-black text-[#33691E]">{o.id}</p>
              <p className="text-sm font-medium text-[var(--color-primary)] mt-1">{o.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-8 border border-[var(--color-border)]">
        <h2 className="text-xl font-black text-[var(--color-primary)] mb-4">Technologies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {['Hyperledger Fabric', 'Go / Gin API', 'PostgreSQL', 'Next.js 14'].map((t) => (
            <div key={t} className="p-4 rounded-xl bg-[var(--color-bg)]">
              <p className="font-bold text-sm text-[var(--color-primary)]">{t}</p>
            </div>
          ))}
        </div>
        <p className="text-caption text-[var(--color-muted)] mt-6">
          Équipe DevLeaders — MIABE Hackathon 2026 · DAROLLO TECHNOLOGIES CORPORATION
        </p>
        <Link href="/verify" className="inline-block mt-4 text-sm font-bold text-[#33691E] hover:underline">
          Vérifier un lot publiquement →
        </Link>
      </section>
    </div>
  )
}
