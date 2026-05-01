ChainCacao est une application mobile moderne développée avec React Native et Expo. Elle vise à transformer la gestion de la chaîne de valeur du café et du cacao au Togo en remplaçant les processus manuels par un suivi numérique transparent, du champ à l'exportation.
Le projet s'attaque aux défis de traçabilité et de gestion de données dans le secteur agricole. Grâce à une interface premium et une architecture modulaire, l'application permet :
La traçabilité totale des lots de production.
La gestion des acteurs (Producteurs, Coopératives, Acheteurs).
La centralisation des données géographiques et techniques.

Stack Technique
Framework : React Native avec Expo (SDK 52+).

Navigation : Expo Router (File-based routing).

UI/UX :

Style Glassmorphism & Design Premium.



Lucide React / MaterialCommunityIcons pour l'iconographie.

Versionnage : Git (Workflow par branches).

Structure du Dépôt
Le projet est organisé pour séparer les différents modules de développement :

main : Branche principale (stable).

AppMobile : Branche dédiée au développement de l'interface et des flux mobiles.

Architecture du dossier /AppMobile
Plaintext
app/
├── (tabs)/              
├── accueil.tsx         
├── production.tsx       
├── creationlot.tsx     
├── login.tsx / register.tsx 
components/             
constants/               



Dashboard Dynamique : Visualisation en temps réel des stocks et des statuts de production.

Gestion de Lots : Création de lots avec suivi du poids (kg), de la date et de la localisation GPS.

Système de Filtres : Tri des productions par statut (Terminé, En cours, Problème).

Interface Adaptative : Design optimisé pour une utilisation sur le terrain.

Roadmap (Perspectives)
[ ] Offline Mode : Persistance des données avec SQLite pour les zones sans réseau.

[ ] Mobile Money : Intégration des paiements T-Money/Moov pour les transactions producteurs.



Assure-toi de le git add, git commit et git push sur ta branche AppMobile.

GitHub affichera automatiquement cette page avec une mise en forme propre (titres, listes, code).
