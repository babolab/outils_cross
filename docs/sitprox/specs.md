# Besoin

à partir du fichier de suivi des alarmes du logiciel SIG VTS au CROSS Jobourg, un script doit pouvoir générer les lignes prêtes à être collées sur le tableau pnav4, que tu dois voir dans le dossier activité-nav. Ce tableau est un extrait d'une feuille google sheets. 

Il s'agit d'extraire les informations (certaines sont en base 64) pour remplir les cases demandées sur la tableau. Attention, les fichiers sont assez lourds, vas-y doucement pour ne pas consommer tous les tokens.

## Contraintes

- une même alarme (mêmes navires impliqués) doit être prise en compte une seule fois toutes les 30 minutes.

- Les colonnes àa partir de AH incluse ne sont pas à remplir

- Les colonnes de R à V ne sont pas à remplir

- script intégré à une page web seule pour éviter d'avoir des dépendances. Cela sera intégré à mon projet outils-cross une fois mature.

  