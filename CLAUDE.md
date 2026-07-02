# CLAUDE.md — Cockpit « Les Pensées d'Amanda »

Contexte projet pour Claude Code. Répondre et commenter en **français**.

## Ce qu'est ce projet
Cockpit mobile (PWA) qui pilote la chaîne YouTube « Les Pensées d'Amanda »
(@blondymandise). Deux rôles :
1. Afficher le **brief hebdomadaire** (planning multi-plateformes, réels, script long).
2. Gérer le **pipeline éditorial** des vidéos (statuts) et la banque d'idées, éditable
   depuis le téléphone.

Hébergé sur **Vercel** (site statique + fonction serverless). La **source de vérité**
est le dépôt GitHub `Didinettese/cockpit-amanda` : les modifs faites dans le cockpit
sont committées via l'API, et la tâche automatique du lundi lit/écrit ces fichiers.

## Architecture (fichiers clés)
- `templates/cockpit.template.html` — TOUTE l'app en un seul fichier (HTML+CSS+JS
  vanilla, sans framework). Onglets : Jour, Réels, Script, **Prog**, Idées, Liens,
  Archives. Tout s'enregistre automatiquement (auto-save débouncé), sans bouton.
- `data/pipeline.json` — pipeline éditorial + état perso synchronisé : `episodes[]`
  (date, theme, title, status, lieu, notes), `ideas[]`, `links` (URLs modifiées),
  `progress` (coches par semaine ISO) et `linkCats` (liens perso classés par catégorie).
  Statuts : `idee|script|tourne|monte|publie`.
- `data/brief-data.json` — contenu du brief de la semaine (meta, links, schedule[7],
  reels[8], script[10], ideaProposals[3], sources).
- `data/archive.json` — `weeks[]` : snapshots par semaine (isoWeek, weekLabel, videoD,
  script, reels), consultables dans l'onglet Archives. L'entrée de la **semaine en cours**
  sert aussi de **script éditable** : l'onglet Script lit/écrit `weeks[semaine].script`
  (repli sur `brief-data.json` → `script` tant que la semaine n'est pas archivée). Pour
  remplacer le script d'une semaine à la main, éditer cette entrée (et `brief-data.json`
  pour le PDF).
- `api/pipeline.js` — fonction Vercel (Node, sans dépendance) : `GET` lit et `POST`
  écrit `data/pipeline.json` via l'API GitHub Contents. Auth par env `GITHUB_TOKEN`.
  `sanitize()` conserve links/progress/linkCats (ne pas les retirer).
- `api/archive.js` — même mécanisme pour `data/archive.json` : `POST` = 1 semaine,
  upsert par isoWeek. Le cockpit archive la semaine en cours à l'ouverture (autoArchive).
- `scripts/build_cockpit.js` — injecte `brief-data.json` + `pipeline.json` dans le
  template → `public/index.html`. C'est le **build command** de Vercel.
- `scripts/build_brief.js` — génère le `.docx` du brief (converti en PDF par CI).
- `vercel.json` — buildCommand + outputDirectory `public` + fonction API.

## Commandes
```bash
node scripts/build_cockpit.js   # reconstruire public/index.html
vercel dev                      # prévisualiser cockpit + API en local (besoin .env.local)
```
Après un `node scripts/build_cockpit.js`, vérifier que `public/index.html` ne contient
plus les marqueurs `__BRIEF_DATA__` ni `__PIPELINE_DATA__`.

## Conventions & règles
- **Un seul fichier d'app** : ne pas découper `cockpit.template.html` en modules CSS/JS.
- Le template contient deux marqueurs remplacés au build :
  `/*__BRIEF_DATA__*/ {}` et `/*__PIPELINE_DATA__*/ {}`. Ne pas les supprimer.
- Après toute modif du template ou des données, **rebâtir** et si possible **tester le
  JS** (ex. jsdom) avant de committer : les onglets Prog/Idées doivent se rendre et le
  bouton Enregistrer doit POST vers `/api/pipeline`.
- Le cockpit charge le pipeline en direct via `/api/pipeline` (GET), avec repli sur la
  copie embarquée (`PIPE_EMBED`) si l'API est indisponible.
- **Sécurité** : ne jamais committer de token ; `GITHUB_TOKEN` vit dans `.env.local`
  (local, gitignoré) et dans les variables d'environnement Vercel.
- **Permissions Git** : le token fine-grained n'a QUE « Contents ». Ne jamais modifier
  `.github/workflows/**` par push (ça échoue) — passer par l'interface web GitHub.
- Publication chaîne : vidéo le vendredi 8h (heure FR). Contenu 100% en français.
  Phrases signature à ne jamais altérer :
  - Lancement : « Et maintenant je vous invite à entrer profondément... dans ma tête. »
  - Clôture : « Et n'oubliez pas que chacun a ses raisons de penser ce qu'il pense. »

## Déploiement
Push sur `main` → Vercel rebâtit (`build_cockpit.js`) et redéploie l'API + le site
(~1 min). Un workflow GitHub Actions régénère le PDF du brief dans `public/`.

## Pièges connus
- Ne pas régresser un statut d'épisode déjà avancé (tourne/monte/publie).
- `episodes` doit rester trié par date croissante (le tri est refait au rendu et à
  la sauvegarde côté API).
- Les vraies URLs de liens (`data/brief-data.json` → `links`) sont réelles : ne pas
  les écraser par des placeholders.
