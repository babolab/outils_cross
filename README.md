# Outils CROSS Jobourg

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://babolab.github.io/outils_cross/)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![Licence](https://img.shields.io/badge/Licence-CC%20BY--NC--ND%204.0-lightgrey?style=for-the-badge)](LICENSE)

> **Web toolbox for Maritime Rescue Coordination Centre (MRCC) operators** — built for real-time pollution surveillance, vessel tracking and SAR coordination. Designed for CROSS Jobourg, adaptable to any MRCC/VTS environment.

Boîte à outils web destinée au quart de surveillance de la navigation, au quart de surveillance de la pollution et au quart de sauvetage (SAR) du **CROSS Jobourg**. Ces outils fonctionnent entièrement dans le navigateur, sans serveur ni installation : aucune donnée n'est transmise à l'extérieur.

D'autres CROSS ou toute personne dont le travail s'y prête sont libres de les utiliser.

**→ Accès en ligne :** https://babolab.github.io/outils_cross/

---

## Operational context

Ces outils ont été conçus et déployés dans un cadre opérationnel réel : la **Manche**, l'une des voies maritimes les plus denses au monde (~500 navires/jour dans le DST du Pas-de-Calais), sous responsabilité du CROSS Jobourg — MRCC compétent sur ~300 000 km² de zone SAR. Les données traitées sont des données opérationnelles réelles : traces AIS issues des systèmes VTS, prévisions de dérive Mothy (SHOM), images satellitaires de surveillance des pollutions.

The English Channel maritime traffic includes a significant proportion of vessels operating with degraded or absent AIS transmissions ("dark vessels"), requiring cross-referencing of drift modelling, satellite imagery and VTS radar tracks — which these tools are designed to support.

---

## Outils disponibles

### Rejeu pollution

Visualisation cartographique animée d'une dérive de polluant issue de **Mothy** (logiciel de prévision de dérive du SHOM), superposée aux trajectoires des navires présents (issues du SIG VTS ou d'ANAIS).

- Importer le fichier de prévision Mothy (KMZ ou GPX) et autant de traces navires que souhaité (GPX)
- Rejouer la dérive pas à pas dans le temps
- Afficher ou masquer la dérive, le barycentre et les navires indépendamment

### Extraction dérive (découpe horaire Mothy)

Certains SIG ne gèrent pas la temporalité et ne peuvent pas rejouer une dérive : ils affichent tous les points en même temps. Cet outil découpe le fichier GPX produit par Mothy en **un fichier par heure UTC**, exploitables séparément dans un SIG standard.

- Importer le fichier GPX Mothy
- Télécharger chaque tranche horaire individuellement ou l'ensemble en ZIP

### Alarmes de collision VTS

Génération d'un rapport à partir du fichier CSV d'alarmes d'acquittement exporté depuis le SIG VTS (Service NAVIGATION → Statistiques → Acquittement des alarmes).

- Les alarmes sont regroupées par couple de navires et par intervalles de 15 minutes pour éviter les doublons
- Filtrage par navire et par période
- Export CSV et PDF avec logo CROSS (le rapport PDF colore en rouge les situations CPA < 150 m)

### Suivi des situations de rapprochement (pnav4)

Génération des lignes pnav4 à partir des exports CSV d'événements SIG VTS (`CROSS_JB_VTS_EVENTS_YYYY-MM_*.csv`), destinées à être collées dans le tableau de suivi Google Sheets pnav4.

- Chargement multi-fichiers (glisser-déposer ou sélection), avec filtre de période
- Déduplication automatique : pour une même paire de navires, les alarmes distantes de moins de 45 minutes sont fusionnées en conservant le meilleur CPA
- Détection du type de navire (FV / SV / MV) à partir du nom AIS et des données de navigation encodées dans le champ b64
- Conversion de la position WKT → degrés minutes décimales (format pnav4)
- Statistiques : alarmes brutes, après déduplication, rapprochées (CPA < 0,7 Nq), anticipées, non acquittées
- Export TSV (collage depuis la colonne C dans Sheets) et CSV téléchargeable

### EGC — Adressage

Aide à la rédaction de la ligne d'adressage des messages **EGC (Enhanced Group Call)** de détresse envoyés par les CROSS via Inmarsat.

- Formulaire guidé pour les 7 champs du code EGC (SAT, C1 priorité, C2 code de service, C3 zone, C4 cadence, C5 fixe)
- Saisie C3 dynamique selon le type de zone : circulaire (C2 = 14 ou 44), rectangulaire (C2 = 34), NAVAREA (C2 = 31) ou globale (C2 = 00)
- Visualisation cartographique en temps réel de la zone d'adressage sur fond Leaflet
- Génération et copie de la ligne d'adressage prête à coller dans l'interface d'envoi

> **Responsabilité opérateur :** l'opérateur est seul responsable de vérifier la cohérence et l'exactitude de l'adressage EGC avant tout envoi. Cet outil est une aide à la rédaction et ne se substitue pas au jugement opérationnel.

### TNAV → Seamis

Report dans **Seamis** des déclarations de traversée (TNAV) déposées par les plaisanciers sur démarches-simplifiées, pour qu'une alerte de balise (406 MHz ou AIS) renvoie immédiatement vers le dossier.

- Importer l'export **.ods** de démarches-simplifiées (le CSV ne contient ni les balises, ni l'équipage, ni les contacts à terre)
- Seuls les dossiers dont la case « Entré dans Seamis? » n'est pas cochée sont traités
- Une entrée **clé HEXID ou MMSI + texte** par identifiant de balise, à copier dans la base balises de Seamis (texte court encadré par le n° de dossier, à coller en tête des déclarations précédentes)
- Pour chaque dossier, la **recherche du navire dans Seamis** (`mmsi:…, cs:…, immat:…, nom:…`) à copier, pour y verser le PDF du dossier
- Suivi des actions à faire : entrées saisies, PDF versés, cases cochées dans démarches-simplifiées
- Anomalies signalées sans bloquer : HEXID ou MMSI invalide, pavillon incohérent avec le MMSI, dossier sans balise ou sans contact à terre

L'outil est développé et déployé dans son propre dépôt, [tnav2Seamis](https://github.com/babolab/tnav2Seamis), et affiché ici dans un cadre (iframe) : il se met à jour à chaque déploiement de ce dépôt. Mode d'emploi opérateur : [MODE_EMPLOI.md](https://github.com/babolab/tnav2Seamis/blob/main/MODE_EMPLOI.md).

### Quizz opérateurs

Trois quiz d'auto-formation, chacun dans un sous-onglet :

- **Géo — Débutant** et **Géo — Confirmé** : connaissance géographique de la zone du CROSS Jobourg
- **Quiz SNSM** : correspondance entre les stations SNSM et leur numéro SNS

Les quiz sont des pages HTML autonomes (`public/quizz/`), affichées en iframe.

---

## Utilisation

Aucune installation requise. Ouvrir l'URL ci-dessus dans un navigateur moderne (Chrome, Firefox, Edge).

Pour une utilisation hors ligne ou sur un réseau isolé, cloner le dépôt et lancer localement :

```bash
cd outils_cross
npm install
npm run dev
```

---

## Développement

Projet **React + TypeScript + Vite**, déployé automatiquement sur GitHub Pages à chaque push sur `main`.

```
src/
  modules/
    carte/        # Rejeu pollution
    extraction/   # Découpe horaire Mothy
    alarmes/      # Alarmes de collision VTS
    sitprox/      # Suivi situations de rapprochement (pnav4)
    egc/          # EGC — Adressage
    tnav/         # TNAV → Seamis (iframe vers babolab.github.io/tnav2Seamis)
    quizz/        # Quizz opérateurs (sous-onglets en iframe)

public/
  quizz/          # Pages HTML autonomes des quiz

docs/
  sitprox/
    vts2pnav4.html   # Outil standalone autonome (référence / secours)
    specs.md         # Spécifications fonctionnelles initiales

data/                # Données opérationnelles locales — gitignorées, non publiées
  sitprox/
    CROSS_JB_VTS_EVENTS_YYYY-MM_*.csv   # Exports mensuels SIG VTS
    pnav4.csv                            # Export de référence du tableau pnav4
```

### Ajouter un onglet

Chaque outil est un module de `src/modules/`, déclaré dans `src/App.tsx` (entrée `navItems` de la barre latérale et `Route`, navigation par hash : `#/tnav`, `#/quizz`…).

Un outil développé et déployé à part (comme TNAV → Seamis) est intégré par un module qui l'affiche en iframe. Les deux sites étant sur `babolab.github.io`, ils partagent la même origine : l'attribut `allow="clipboard-write"` suffit pour que les boutons « copier » fonctionnent dans le cadre. L'outil intégré peut détecter qu'il est affiché en iframe (`window.self !== window.top`) pour masquer son propre en-tête.

---

## Licence

[![Licence: CC BY-NC-ND 4.0](https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fr)

Ce projet est publié sous licence **Creative Commons Attribution — Pas d'Utilisation Commerciale — Pas de Modification 4.0 International (CC BY-NC-ND 4.0)**.

Copyright (c) 2026 Geoffrey Babault

- Le partage à l'identique est autorisé avec attribution.
- Toute utilisation commerciale est **interdite**.
- Toute modification ou œuvre dérivée est **interdite** sans accord de l'auteur.

Voir le fichier [LICENSE](LICENSE) pour le texte complet.
