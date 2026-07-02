const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const data = fs.readFileSync(path.join(ROOT, "data", "brief-data.json"), "utf8");
const tpl = fs.readFileSync(path.join(ROOT, "templates", "cockpit.template.html"), "utf8");

// pipeline.json = copie de secours embarquée (affichage hors-ligne / sans API)
let pipe = "{}";
try { pipe = fs.readFileSync(path.join(ROOT, "data", "pipeline.json"), "utf8"); JSON.parse(pipe); }
catch (e) { console.warn("pipeline.json absent ou invalide, fallback {} :", e.message); pipe = "{}"; }

// sanity: valid JSON
JSON.parse(data);

const html = tpl
  .replace("/*__BRIEF_DATA__*/ {}", data)
  .replace("/*__PIPELINE_DATA__*/ {}", pipe);

const outDir = path.join(ROOT, "public");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "index.html");
fs.writeFileSync(out, html);
console.log("OK cockpit:", out, html.length, "bytes");
