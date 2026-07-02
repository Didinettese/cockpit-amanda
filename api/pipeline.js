// Vercel serverless function — lit et écrit data/pipeline.json dans GitHub.
// Aucune dépendance : utilise le fetch natif de Node 18+ et l'API GitHub Contents.
//
// Variables d'environnement à définir dans Vercel (Project Settings ▸ Environment Variables) :
//   GITHUB_TOKEN  = token GitHub fine-grained (dépôt cockpit-amanda · Contents: Read and write)
//   GH_REPO       = Didinettese/cockpit-amanda        (optionnel, valeur par défaut ci-dessous)
//   GH_BRANCH     = main                              (optionnel)
//   GH_PATH       = data/pipeline.json                (optionnel)

const REPO = process.env.GH_REPO || "Didinettese/cockpit-amanda";
const BRANCH = process.env.GH_BRANCH || "main";
const PATH = process.env.GH_PATH || "data/pipeline.json";
const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`;

const STATUS_KEYS = ["idee", "script", "tourne", "monte", "publie"];

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "cockpit-amanda"
  };
}

// Récupère le contenu + le sha courant du fichier
async function getFile() {
  const r = await fetch(`${API}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: ghHeaders(),
    cache: "no-store"
  });
  if (r.status === 404) return { pipeline: null, sha: null };
  if (!r.ok) throw new Error(`GitHub GET ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = Buffer.from(j.content || "", "base64").toString("utf8");
  return { pipeline: JSON.parse(content), sha: j.sha };
}

function cleanLinks(obj) {
  const out = {};
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) out[String(k)] = String(obj[k] == null ? "" : obj[k]);
  }
  return out;
}
function cleanProgress(obj) {
  const out = {};
  if (obj && typeof obj === "object") {
    for (const wk of Object.keys(obj)) {
      const arr = obj[wk];
      if (Array.isArray(arr)) out[String(wk)] = arr.map(String);
    }
  }
  return out;
}
// linkCats : { "<catégorie>": ["<clé de lien ajouté>", ...] } — classe les liens perso
function cleanLinkCats(obj) {
  const out = {};
  if (obj && typeof obj === "object") {
    for (const cat of Object.keys(obj)) {
      const arr = obj[cat];
      if (Array.isArray(arr)) out[String(cat)] = arr.map(String);
    }
  }
  return out;
}

// Nettoie / valide la charge utile envoyée par le cockpit
function sanitize(body) {
  const out = { statuses: [], episodes: [], ideas: [], links: {}, progress: {}, linkCats: {} };
  out.statuses = Array.isArray(body.statuses) && body.statuses.length
    ? body.statuses
    : STATUS_KEYS.map(k => ({ key: k }));
  out.episodes = (Array.isArray(body.episodes) ? body.episodes : []).map((e, i) => ({
    id: String(e.id || `ep-${Date.now()}-${i}`),
    date: String(e.date || "").slice(0, 10),
    theme: String(e.theme || ""),
    title: String(e.title || ""),
    status: STATUS_KEYS.includes(e.status) ? e.status : "idee",
    lieu: String(e.lieu || ""),
    notes: String(e.notes || ""),
    titleOptions: Array.isArray(e.titleOptions)
      ? e.titleOptions.map(o => ({
          text: String(o && o.text || ""),
          potentiel: String(o && o.potentiel || ""),
          best: !!(o && o.best)
        }))
      : [],
    caption: String(e.caption || "")
  }));
  out.ideas = (Array.isArray(body.ideas) ? body.ideas : []).map((it, i) => ({
    id: String(it.id || `id-${Date.now()}-${i}`),
    theme: String(it.theme || ""),
    title: String(it.title || ""),
    format: String(it.format || "Long format"),
    hook: String(it.hook || ""),
    potentiel: String(it.potentiel || "")
  }));
  out.links = cleanLinks(body.links);
  out.progress = cleanProgress(body.progress);
  out.linkCats = cleanLinkCats(body.linkCats);
  // tri des épisodes par date croissante
  out.episodes.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (!process.env.GITHUB_TOKEN) {
      res.status(500).json({ error: "GITHUB_TOKEN manquant côté serveur (Vercel env)." });
      return;
    }

    if (req.method === "GET") {
      const { pipeline } = await getFile();
      res.status(200).json(pipeline || { statuses: [], episodes: [], ideas: [], links: {}, progress: {}, linkCats: {} });
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      if (!body || typeof body !== "object") { res.status(400).json({ error: "Corps JSON invalide." }); return; }

      const clean = sanitize(body);
      const content = Buffer.from(JSON.stringify(clean, null, 2) + "\n", "utf8").toString("base64");

      // écrit avec 1 réessai si le sha a changé entre-temps (conflit multi-appareils)
      let put, attempt = 0;
      while (true) {
        const { sha } = await getFile();
        put = await fetch(API, {
          method: "PUT",
          headers: { ...ghHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Cockpit — MAJ pipeline (${new Date().toISOString().slice(0, 10)})`,
            content,
            branch: BRANCH,
            ...(sha ? { sha } : {})
          })
        });
        if (put.ok) break;
        if (put.status === 409 && attempt < 2) { attempt++; continue; } // sha périmé → on relit et on réessaie
        throw new Error(`GitHub PUT ${put.status}: ${await put.text()}`);
      }
      const j = await put.json();
      res.status(200).json({ ok: true, commit: j.commit && j.commit.sha, pipeline: clean });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Méthode non autorisée." });
  } catch (err) {
    res.status(500).json({ error: String(err && err.message || err) });
  }
};
