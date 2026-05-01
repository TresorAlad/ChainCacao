'use client'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-h1 mb-6">À propos de ChainCacao</h1>

      <section className="mb-8">
        <h2 className="text-h2 mb-4">Mission</h2>
        <p className="mb-4">
          ChainCacao est une solution de traçabilité intégrant la blockchain Hyperledger Fabric pour garantir
          l’origine et la conformité EUDR du cacao. Elle permet aux acteurs de la filière (agriculteurs,
          coopératives, transformateurs, exportateurs) de enregistrer chaque étape de la vie d’un lot,
          depuis la récolte jusqu’à l’export.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-h2 mb-4">Fonctionnalités</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Création et suivi de lots (identifiant, culture, variété, quantité, origine géographique)</li>
          <li>Transfert de propriété entre acteurs, avec horodatage et commentaires</li>
          <li>Mise à jour du poids avec justification (traçabilité des modifications)</li>
          <li>Marquage export et génération de rapport EUDR (JSON + PDF signé)</li>
          <li>Upload de photos de lots vers Cloudinary</li>
          <li>Génération de QR code pour vérification publique</li>
          <li>Historique blockchain complet avec hash de transaction</li>
          <li>Tableau de bord avec statistiques globales</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-h2 mb-4">Technologies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <h3 className="font-semibold mb-2">Hyperledger Fabric</h3>
            <p className="caption">Blockchain permissionnée</p>
          </div>
          <div className="card text-center">
            <h3 className="font-semibold mb-2">Go (Gin)</h3>
            <p className="caption">Backend API</p>
          </div>
          <div className="card text-center">
            <h3 className="font-semibold mb-2">PostgreSQL / Neon</h3>
            <p className="caption">Base de données</p>
          </div>
          <div className="card text-center">
            <h3 className="font-semibold mb-2">Next.js</h3>
            <p className="caption">Frontend React</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-h2 mb-4">Équipe DevLeaders – MIABE Hackathon 2026</h2>
        <p className="caption">
          Projet réalisé dans le cadre du hackathon MIABE 2026 par l’équipe DevLeaders.
        </p>
      </section>
    </div>
  )
}
