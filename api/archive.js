// Vercel serverless function — archive des semaines de tournage passées.
// Lit/écrit data/archive.json dans GitHub (script + réels de chaque semaine),
// pour pouvoir relire une semaine passée depuis le cockpit.
//
// Même mécanisme que api/pipeline.js (API GitHub Contents, aucune dépendance).
//   GET  -> renvoie { weeks: [...] }
//   POST -> body = 1 semaine { isoWeek, weekLabel, briefDate, videoD, script, reels }
//           upsert par isoWeek (remplace si déjà présente), trié récent -> ancien.
//
// Variables d'environnement (partagées avec pipeline) :
//   GITHUB_TOKEN, GH_REPO, GH_BRANCH, GH_ARCHIVE_PATH (défaut data/archive.json)

const REPO = process.env.GH_REPO || "Didinettese/cockpit-amanda";
const BRANCH = process.env.GH_BRANCH || "main";
const PATH = process.env.GH_ARCHIVE_PATH || "data/archive.json";
const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`;
const MAX_WEEKS = 60;

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "cockpit-amanda"
  };
}

async function getFile() {
  const r = await fetch(`${API}?ref=${encodeURIComponent(BRANCH)}`, { headers: ghHeaders(), cache: "no-store" });
  if (r.status === 404) return { archive: null, sha: null };
  if (!r.ok) throw new Error(`GitHub GET ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = Buffer.from(j.content || "", "base64").toString("utf8");
  let parsed; try { parsed = JSON.parse(content); } catch { parsed = null; }
  return { archive: parsed, sha: j.sha };
}

const S = (v, n) => String(v == null ? "" : v).slice(0, n);

// Nettoie une semaine reçue (structure contrôlée, on borne les tailles)
function cleanWeek(w) {
  if (!w || typeof w !== "object") return null;
  const iso = S(w.isoWeek, 20).trim();
  if (!iso) return null;
  const arr = x => Array.isArray(x) ? x : [];
  const line = l => ({ t: S(l && l.t, 2000), quote: !!(l && l.quote) });
  const beat = b => ({
    num: S(b && b.num, 8), title: S(b && b.title, 200), timing: S(b && b.timing, 60),
    lines: arr(b && b.lines).slice(0, 40).map(line),
    notes: arr(b && b.notes).slice(0, 20).map(n => S(n, 500))
  });
  const reel = r => ({
    n: S(r && r.n, 8), title: S(r && r.title, 200), angle: S(r && r.angle, 200),
    dur: S(r && r.dur, 60), cam: S(r && r.cam, 200), plats: S(r && r.plats, 200),
    jour: S(r && r.jour, 60), hook: S(r && r.hook, 2000), corps: S(r && r.corps, 4000), cta: S(r && r.cta, 2000)
  });
  const vd = w.videoD && typeof w.videoD === "object"
    ? { title: S(w.videoD.title, 300), theme: S(w.videoD.theme, 300), date: S(w.videoD.date, 20) } : null;
  return {
    isoWeek: iso, weekLabel: S(w.weekLabel, 200), briefDate: S(w.briefDate, 20), videoD: vd,
    script: arr(w.script).slice(0, 40).map(beat),
    reels: arr(w.reels).slice(0, 40).map(reel)
  };
}

function weeksFrom(archive) {
  return (archive && Array.isArray(archive.weeks)) ? archive.weeks : [];
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (!process.env.GITHUB_TOKEN) {
      res.status(500).json({ error: "GITHUB_TOKEN manquant côté serveur (Vercel env)." });
      return;
    }

    if (req.method === "GET") {
      const { archive } = await getFile();
      res.status(200).json({ weeks: weeksFrom(archive) });
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const week = cleanWeek(body);
      if (!week) { res.status(400).json({ error: "Semaine invalide (isoWeek manquant)." }); return; }

      // upsert par isoWeek + tri récent -> ancien, avec réessai si le sha bouge
      let put, attempt = 0, merged;
      while (true) {
        const { archive, sha } = await getFile();
        const existing = weeksFrom(archive).filter(w => w && w.isoWeek !== week.isoWeek);
        merged = [week, ...existing]
          .sort((a, b) => String(b.isoWeek || "").localeCompare(String(a.isoWeek || "")))
          .slice(0, MAX_WEEKS);
        const content = Buffer.from(JSON.stringify({ weeks: merged }, null, 2) + "\n", "utf8").toString("base64");
        put = await fetch(API, {
          method: "PUT",
          headers: { ...ghHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Cockpit — archive semaine ${week.isoWeek}`,
            content, branch: BRANCH, ...(sha ? { sha } : {})
          })
        });
        if (put.ok) break;
        if (put.status === 409 && attempt < 2) { attempt++; continue; }
        throw new Error(`GitHub PUT ${put.status}: ${await put.text()}`);
      }
      const j = await put.json();
      res.status(200).json({ ok: true, commit: j.commit && j.commit.sha, archive: { weeks: merged } });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Méthode non autorisée." });
  } catch (err) {
    res.status(500).json({ error: String(err && err.message || err) });
  }
};
