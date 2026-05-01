# Guide d’utilisation — ChainCacao (application mobile)

Application de traçabilité des lots de cacao avec synchronisation vers la blockchain (Hyperledger Fabric). Ce document décrit les écrans, les actions courantes et le comportement hors ligne tel qu’implémenté dans l’app.

---

## 1. Premier lancement et compte

### Écran d’accueil (splash)

Au démarrage, l’app affiche brièvement **ChainCacao** puis vous envoie soit vers **Connexion**, soit vers l’onglet **Accueil** si une session est déjà valide.

### Inscription (`register`)

- Renseignez le **nom**, l’**email**, le **mot de passe** (et confirmation).
- Choisissez un **rôle** (par ex. agriculteur, coopérative, transformateur, exportateur) ; selon le rôle, un champ organisation peut être demandé.
- La **localisation GPS** est obligatoire : utilisez le bouton prévu pour récupérer la position (autorisation de localisation requise).
- Options possibles : biométrie, code PIN (4 chiffres si activé).
- À la fin de l’inscription réussie, la session peut être établie automatiquement selon le flux serveur.

### Connexion (`login`)

- Saisissez **email** et **mot de passe**, puis validez pour accéder aux onglets principaux.
- La **biométrie** sur l’écran de connexion sert d’accès rapide **une fois déjà connecté** avec identifiants ; pour une première utilisation, passez par email/mot de passe.

---

## 2. Navigation principale (4 onglets)

Après authentification, la barre du bas propose :

| Onglet       | Rôle principal |
|-------------|----------------|
| **Accueil** | Tableau de bord, raccourcis, derniers lots |
| **Production** | Liste complète des lots, recherche, filtres, création rapide |
| **Scanner** | Lecture QR / code-barres ou saisie manuelle d’un identifiant |
| **Profil** | Infos exploitation, statistiques lots, actions et déconnexion |

---

## 3. Accueil

- **Indicateur réseau** : en cas de perte de connexion, un badge « Hors ligne » apparaît dans l’en-tête.
- **Bannières** : messages si vous êtes hors ligne ou si des lots sont **en attente de synchronisation / confirmation blockchain**.
- **Tableau de bord** : kilos validés (lots au statut **Terminé**), proportion de lots validés, compteur « en attente » si applicable.
- **Actions rapides** : **Nouveau lot**, **Scanner**, **Transférer**, **Historique** (ouvre l’historique pour un lot par défaut si disponible).
- **Derniers lots** : appui sur une ligne ouvre les **détails du lot**.

---

## 4. Production (liste des lots)

- **Recherche** par texte sur le titre du lot.
- **Filtres** : Tous, Terminé, En cours, Problème.
- **Tirer pour rafraîchir** : tente une synchronisation des lots en attente puis recharge la liste.
- Chaque carte affiche le **statut**, la **date**, le **poids**, et si le lot est **confirmé sur la chaîne** ou **en attente de sync**.
- **Zone principale de la carte** : ouvre les **caractéristiques du lot**.
- **Bouton historique** (icône horloge à droite) : ouvre la **timeline** pour ce lot.
- **Bouton flottant +** : crée un **nouveau lot** (`creationlot`).

L’en-tête peut aussi ouvrir directement le **Scanner**.

---

## 5. Créer un lot (`creationlot`)

Accessible depuis Accueil, Production (+), ou autres liens vers cet écran.

Champs et contraintes :

- **Référence du lot** : générée automatiquement (non modifiable), format du type `LOT-ANNÉE-XXXXX`.
- **Culture / type de cacao** : obligatoire.
- **Localisation / zone GPS** : obligatoire (texte libre ou zone).
- **Quantité (kg)** : obligatoire, nombre positif.
- **Date de récolte** : via le sélecteur de date ; **pas de date future**.
- **Producteur** : prérempli depuis votre profil (lecture seule).
- **Statut initial** : **En cours**, **Terminé** ou **Problème**.

Enregistrement :

1. Le lot est **toujours sauvegardé localement** en premier (utile hors ligne).
2. Si le réseau et l’API répondent, le lot est envoyé au serveur ; en cas de succès, l’identifiant peut être mis à jour (ID blockchain) et le lot marqué comme synchronisé.
3. **Erreur réseau** : message « enregistré hors ligne » — la synchronisation sera retentée automatiquement (voir synchronisation).
4. **Autre erreur API** : message d’erreur explicite ; le lot reste local selon le cas.

---

## 6. Détails d’un lot (`caracteristiqueslot`)

Affiche : titre, statut, badge **certifié Hyperledger Fabric** ou **en attente**, date de production, type de cacao, poids, acheteur, destination.

Actions :

- **Historique** (en-tête ou bloc d’actions) : timeline blockchain ou locale.
- **Transférer ce lot** : ouvre l’écran de transfert avec le lot présélectionné quand c’est possible.

---

## 7. Scanner (`scan`)

### Mode caméra

- Autorisez l’**accès caméra** si demandé.
- Pointez un **QR code** (ou types supportés comme indiqué dans l’app).
- Après une lecture, utilisez **Scanner à nouveau** si besoin.

### Mode saisie manuelle

- Basculez via l’icône **clavier** dans l’en-tête.
- Saisissez un **identifiant** ou une **référence** de lot (ex. `LOT-2026-A1`) puis lancez la recherche.

Comportement après scan / recherche :

- Si le lot existe **localement** : ouverture des **détails du lot**.
- Sinon : redirection vers **Historique** avec l’identifiant extrait — utile pour une **vérification** à partir d’un QR public ou d’une URL (l’app extrait le dernier segment de chemin si le QR contient une URL de vérification).

---

## 8. Historique et vérification (`historique`)

- Saisissez ou conservez un **identifiant de lot**, puis lancez la recherche.
- L’app interroge en priorité l’**API publique de vérification** (`verify`) pour reconstruire une **timeline** depuis la blockchain quand le lot existe côté serveur.
- Si le lot n’est pas trouvé sur la chaîne mais correspond à des données **locales**, une timeline simplifiée peut être affichée (création, éventuel transfert stocké sur l’appareil).
- En cas d’**erreur réseau** sans données locales suffisantes, un message peut vous inviter à réessayer plus tard.

Depuis le **Profil**, l’entrée **Vérifier un lot (public)** ouvre cet écran sans présupposer un lot déjà choisi.

---

## 9. Transférer un lot (`transfert`)

Assistant en étapes (lot → acteur → confirmation) :

1. **Choisir le lot** : liste filtrable par recherche.
2. **Choisir le destinataire** : liste d’**acteurs** chargée depuis l’API si disponible ; sinon une liste de secours peut s’afficher.
3. **Commentaire** optionnel, puis **confirmation**.

Effet :

- Mise à jour **immédiate en local** (destination, acheteur, statut **En cours**, marqué non synchronisé).
- Appel API de transfert ; en succès, le lot repasse en **synchronisé** et un message peut afficher un **hash de transaction**.
- **Hors ligne** : message indiquant que le transfert sera synchronisé à la reconnexion.

---

## 10. Profil (`profil`)

- Affiche nom, rôle, **localisation**, **surface** (ha), date « membre depuis ».
- Statistiques : lots créés, confirmés, en attente.
- **Modifier le profil** : nom, localisation GPS ou lieu, surface en hectares (via la feuille modale).
- Raccourcis : historique complet (avec lot par défaut si disponible), transfert, vérification publique.
- **Déconnexion** : termine la session et renvoie vers la connexion.

---

## 11. Mode hors ligne et synchronisation

- Les **créations** et **transferts** sont enregistrés **localement** même sans réseau.
- Les lots non synchronisés apparaissent avec une **horloge** / mention « en attente » sur Accueil et Production.
- Une **synchronisation périodique** en arrière-plan tente d’envoyer les lots en attente lorsque le réseau et un **jeton de session** valide sont disponibles.
- Vous pouvez aussi **tirer pour rafraîchir** sur l’écran Production pour déclencher une tentative de sync.

Si un lot reste bloqué après retour en ligne, vérifiez la connexion, la session (reconnexion), et les messages d’erreur éventuels de l’API.

---

## 12. Conseils pratiques

- Gardez le **GPS / réseau** activés lors de l’inscription et pour les premières synchronisations.
- Pour retrouver un lot sur une étiquette physique, utilisez le **Scanner** ou copiez l’**ID** affiché après création réussie sur la blockchain.
- Le statut **Problème** peut refléter une erreur métier côté API après tentative de sync ; consultez le détail du lot et l’historique.

---

## 13. Fichiers techniques (référence développeur)

Configuration Expo et **URL de l’API** : uniquement dans `AppMobile/app.config.js` (constante `apiUrl`, exposée en `extra.apiUrl`). Voir `.env.example` pour la note sur l’absence de variables d’environnement pour l’API.

Pour toute évolution du guide, alignez-le sur les écrans sous `AppMobile/app/` (routes Expo Router).
