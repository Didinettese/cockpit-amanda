const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const data = fs.readFileSync(path.join(ROOT, "data", "brief-data.json"), "utf8");
const tpl = fs.readFileSync(path.join(ROOT, "templates", "cockpit.template.html"), "utf8");

// pipeline.json = copie de secours embarquée (affichage hors-ligne / sans API)
let pipe = "{}";
try { pipe = fs.readFileSync(path.join(ROOT, "data", "pipeline.json"), "utf8"); JSON.parse(pipe); }
catch (e) { console.warn("pipeline.json absent ou invalide, fallback {} :", e.message); pipe = "{}"; }

// archive.json = copie de secours embarquée des semaines passées (onglet Archives sans API)
let arch = "{}";
try { arch = fs.readFileSync(path.join(ROOT, "data", "archive.json"), "utf8"); JSON.parse(arch); }
catch (e) { console.warn("archive.json absent ou invalide, fallback {} :", e.message); arch = "{}"; }

// sanity: valid JSON
JSON.parse(data);

const html = tpl
  .replace("/*__BRIEF_DATA__*/ {}", () => data)
  .replace("/*__PIPELINE_DATA__*/ {}", () => pipe)
  .replace("/*__ARCHIVE_DATA__*/ {}", () => arch);

const outDir = path.join(ROOT, "public");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "index.html");
fs.writeFileSync(out, html);
console.log("OK cockpit:", out, html.length, "bytes");
