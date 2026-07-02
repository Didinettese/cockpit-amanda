# Cockpit — Les Pensées d'Amanda 🎬

Cockpit mobile de publication **+** brief PDF, pilotés par **un seul fichier** :
`data/brief-data.json`. Hébergé sur **GitHub Pages** (consultable sur ton téléphone),
reconstruit automatiquement par **GitHub Actions** à chaque mise à jour du contenu.

Onglets du cockpit : **Jour** (classable *par jour* ou *par plateforme*) · **Réels** ·
**Script** · **Idées** · **Liens**.

---

## A. Mise en ligne — à faire UNE fois (~5 min)

1. **Crée le dépôt** : sur GitHub → bouton **New** → nom `cockpit-amanda` → coche *Public*
   (Pages gratuit) → **Create repository**.
2. **Envoie les fichiers** : sur la page du dépôt → **Add file ▸ Upload files** → glisse
   **tout le contenu de ce dossier** (garde l'arborescence : `data/`, `scripts/`,
   `templates/`, `public/`, `.github/`) → **Commit changes**.
3. **Active Pages** : **Settings ▸ Pages ▸ Build and deployment ▸ Source = GitHub Actions**.
4. **Première génération** : onglet **Actions** → *Build brief + cockpit & deploy* →
   **Run workflow**. Quand la coche est verte, ton cockpit est en ligne :

   ```
   https://TON_COMPTE.github.io/cockpit-amanda/
   ```

5. **Sur ton téléphone** : ouvre ce lien → **Partager ▸ Ajouter à l'écran d'accueil**.
   Tu obtiens une icône « Cockpit » qui s'ouvre en plein écran comme une appli.

6. **Rappels (option)** : ouvre `.../cockpit-amanda/reminders.ics` (ou récupère le fichier)
   et importe-le dans ton calendrier : 5 rappels/jour + le rappel du dimanche « saisir
   l'idée choisie ».

---

## B. Le rituel du lundi (mise à jour semi-auto, sans jeton)

1. **Lundi (nuit)** — le brief de la semaine est généré : tu reçois un nouveau
   `data/brief-data.json` (le contenu de la semaine : planning multi-plateforme, réels,
   script, liens, propositions d'idées).
2. **Lundi matin (~30 s)** — sur GitHub, ouvre `data/brief-data.json` → **✏️ (Edit)** →
   colle le nouveau contenu (ou **Upload files** et remplace le fichier) → **Commit**.
3. **Automatique** — GitHub Actions reconstruit le PDF **et** le cockpit et redéploie
   Pages. Rafraîchis l'appli sur ton téléphone : c'est à jour.

> Rien à installer, aucun secret à stocker. La seule action manuelle est le *commit*
> hebdomadaire d'**un seul fichier**.

---

## C. Ce que tu peux éditer toi-même

- **Tes liens** (OnlyFans, MYM, Telegram, PayPal, X, Snapchat, Reddit…) : directement dans
  l'onglet **Liens** du cockpit (mémorisé sur ton téléphone). Pour qu'ils soient aussi dans
  le PDF et repartout, renseigne-les une fois dans `data/brief-data.json` (champs
  `A_COMPLETER`) et commit.
- **Le design** du cockpit : `templates/cockpit.template.html`.

---

## Structure

```
data/brief-data.json            ← SOURCE DE VÉRITÉ (le seul fichier à mettre à jour)
scripts/build_brief.js          ← génère le .docx du brief (→ PDF par Actions)
scripts/build_cockpit.js        ← injecte les données dans le template → public/index.html
templates/cockpit.template.html ← design + moteur du cockpit
public/                         ← publié par GitHub Pages (cockpit, PDF, icônes, .ics)
.github/workflows/weekly.yml    ← build + déploiement automatiques
```

## Générer en local (facultatif)

```bash
npm install
npm run build   # brief .docx + cockpit index.html dans public/
soffice --headless --convert-to pdf --outdir public public/*.docx   # PDF (si LibreOffice)
```
