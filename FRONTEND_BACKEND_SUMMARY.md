# Frontend & Backend – Résumé complet du travail effectué

## 📦 Livrables frontend (dossier `frontend/`)

- `index.html` – Page unique (SPA-like) contenant toutes les vues :  
  Login, Register, Dashboard, Liste des lots, Création lot, Détail lot, Transfert, Update weight, Export, Upload photo, Rapport EUDR (JSON + PDF), QR code, Vérification publique, Sync ledger, Historique complet.

- `style.css` – Styles complets respectant la charte graphique fournie :  
  Palette : #1A3A2A (vert forêt), #5CC97A (vert cacao), #D4A876 (or cacao), #3B2A1A (brun terre), #0F2540 (navy blockchain).  
  Typographie : H1 22px/500, H2 18px, H3 16px, texte 13px, labels 11px uppercase.  
  Boutons : 4 variantes (primaire vert, outline, blockchain…) ; Badges de statut (conforme EUDR, en transit, exporté, blockchain ✓, non conforme).

- `script.js` – Logique JS centralisée :
  - Authentification (login/register/logout) avec stockage JWT.
  - Navigation entre les vues + mise en évidence de l’élément actif dans la sidebar.
  - Appels API génériques (`api()`) avec injection automatique du header `Authorization`.
  - Chargement du dashboard (cartes métriques), liste des lots (pagination côté client), détail + historique.
  - Toutes les opérations : créer, transférer, mettre à jour poids, exporter, upload photo, générer EUDR (JSON + PDF), QR code PNG, vérification publique, synchronisation ledger.
  - Gestion des rôles basique : les boutons d’action sont toujours affichés (le contrôle d’accès se fait côté backend, le frontend pourrait masquer selon le rôle du JWT – non implémenté faute de payload décodé en production, mais décodage local ajouté).
  - Toasts de notification (success/error).

- `README.md` – Documentation d’utilisation : structure, lancement, endpoints consommés, configuration, debug, déploiement.

> **Aucun fichier du backend n’a été modifié.** Le frontend est autonome et consommable via n’importe quel serveur statique.

---

## 🔌 Endpoints API utilisés par le frontend

| Route | Méthode | Utilisation dans le frontend | Auth |
|-------|---------|------------------------------|------|
| `/api/v1/auth/login` | POST | formulaire login | ❌ public |
| `/api/v1/auth/register` | POST | formulaire register (admin) | ❌ public |
| `/api/v1/dashboard/stats` | GET |Dashboard – cartes métriques | ✅ JWT admin |
| `/api/v1/lot` | GET | liste des lots | ✅ JWT agriculteur/admin |
| `/api/v1/lot` | POST | créer un lot | ✅ JWT agriculteur/admin |
| `/api/v1/lot/:id` | GET | détail d’un lot | ✅ public |
| `/api/v1/lot/:id/history` | GET | historique d’un lot | ✅ public |
| `/api/v1/transfer` | POST | transfert de propriété | ✅ JWT coop/transfo/export/admin |
| `/api/v1/lot/:id/weight` | PUT | mise à jour du poids | ✅ JWT |
| `/api/v1/lot/:id/export` | POST | marquer exporté | ✅ JWT export/admin |
| `/api/v1/lot/:id/photo` | POST | upload photo (multipart) | ✅ JWT + Cloudinary |
| `/api/v1/eudr/:id/report` | GET | rapport EUDR JSON | ✅ JWT export/admin |
| `/api/v1/eudr/:id/report/pdf` | GET | rapport EUDR PDF | ✅ JWT export/admin |
| `/api/v1/qrcode/:id` | GET (PNG via `?format=png`) | afficher QR code | ✅ public |
| `/api/v1/verify/:id` | GET | vérification publique | ❌ public |
| `/api/v1/sync` | POST | synchronisation ledger (agriculteur/admin) | ✅ JWT |
| `/api/v1/actors` | GET | (non utilisé directement, potentiel pour filtres/rôles) | ✅ JWT |

---

## ⚠️ Points d’attention & évolutions possibles (sans toucher au backend)

1. **Authentification avancée** – Le frontend stocke le JWT et l’envoie automatiquement. Pour un contrôle d’accès UI plus fin, décoder le JWT côté client et lire les claims `role` / `org_id` pour masquer les boutons non autorisés (ex. un agriculteur ne voit pas “Export”).  
   *Implémentation partielle déjà présente : décodage du JWT au login pour récupérer `actor_id` et `role`.*

2. **Upload Cloudinary** – Nécessite que le backend ait les variables `CLOUDINARY_CLOUD_NAME` et `CLOUDINARY_UPLOAD_PRESET` renseignées. L’upload depuis le frontend est en `multipart/form-data` ; aucune configuration supplémentaire n’est requise côté frontend.

3. **Pagination backend** – La liste des lots estchargée en une fois puis paginée côté client. Si le volume devient important, l’API pourrait supporter `?page=1&limit=50`. Le frontend peut être adapté facilement.

4. **Gestion des erreurs détaillées** – Les messages d’erreur de l’API sont affichés en toast. On pourrait annoter les champs de formulaire avec les messages de validation spécifiques (si le backend les renvoie dans le corps de la réponse 400).

5. **Page de vérification publique** – Elle est incluse (`#verify`) et appelle l’endpoint public ; on peut envisager une page séparée dédiée (par exemple `verify.html` reprenant uniquement ce formulaire).

6. **QR code en tant qu’image** – L’API renvoie directement un PNG si `?format=png` est présent. Le frontend l’affiche dans une balise `<img>`. Si l’endpoint ne supporte pas le paramètre, le fallback affiche les données JSON à encoder.

7. **Filtres / recherche** – Non implémentés (filtres par statut, région, propriétaire). Ajoutable via des champs de recherche et en injectant des query parameters dans l’appel `GET /lot`.

8. **Responsive avancé** – Le CSS inclut déjà quelques breaks ; on peut enrichir pour mobile (menu hamburger, colonne unique).

9. **Sécurité JWT** – En prod, stocker le JWT en `httpOnly` cookie serait préférable à `localStorage`. Nécessiterait une adaptation du backend (set-cookie) et du frontend (envoi automatique des cookies).

---

## 🚀 Comment tout faire fonctionner

1. **Backend**  
   ```bash
   cd tracabilite-api
   # avec Docker (Postgres + Redis + API)
   docker compose up --build
   # ou en dev (ledger mock)
   go run ./cmd/api
   ```
   Vérifiez : `curl -s http://localhost:8080/health` doit renvoyer `{"status":"ok"}`.

2. **Frontend**  
   ```bash
   cd frontend
   python3 -m http.server 8081
   ```
   Ouvrez `http://localhost:8081`.

3. **First login** – Avec une base PostgreSQL seedée (ou en mémoire), le PIN par défaut pour `actor-agri-001` est `1111`.  
   Le JWT retourné est automatiquement stocké ; les requêtes subséquentes l’envoient.

---

## ✅ Checklist de conformité au cahier des charges (basée sur le README backend)

- [x] Dashboard avec cartes métriques
- [x] Liste des lots (GET /lot)
- [x] Création lot (POST /lot)
- [x] Détail lot + historique blockchain
- [x] Transfert (POST /transfer)
- [x] Mise à jour poids (PUT /lot/:id/weight)
- [x] Export (POST /lot/:id/export)
- [x] Upload photo (POST /lot/:id/photo)
- [x] Rapport EUDR JSON + PDF
- [x] QR code (PNG)
- [x] Vérification publique
- [x] Synchronisation ledger (POST /sync)
- [x] Authentification (login + register admin)
- [x] Charte graphique appliquée partout

---

**Rappel** : Aucun fichier backend n’a été modifié. Le frontend est pleinement fonctionnel tel quel avec l’API telle que documentée dans `tracabilite-api/README.md`.
