# Outils CROSS Jobourg

Boîte à outils web destinée en premier lieu au quart de surveillance de la navigation et au quart de surveillance de la pollution du **CROSS Jobourg**. Ces outils fonctionnent entièrement dans le navigateur, sans serveur ni installation : aucune donnée n'est transmise à l'extérieur.

D'autres CROSS ou toute personne dont le travail s'y prête sont libres de les utiliser.

**Accès en ligne :** https://babolab.github.io/outils_cross/

---

## Outils disponibles

### Rejeu pollution

Visualisation cartographique animée d'une dérive de polluant issue de **Mothy** (logiciel de prévision de dérive du Shom), superposée aux trajectoires des navires présents (issues du SIG VTS ou d'ANAIS).

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

---

## Utilisation

Aucune installation requise. Ouvrir l'URL ci-dessus dans un navigateur moderne (Chrome, Firefox, Edge).

Pour une utilisation hors ligne ou sur un réseau isolé, cloner le dépôt et lancer localement :

```bash
cd outils-cross-pages
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
```

---

## Licence

Code source ouvert, libre de réutilisation. Aucune garantie sur l'exactitude des données traitées — les outils ne se substituent pas aux procédures opérationnelles en vigueur.
