const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  ExternalHyperlink, PageBreak, LevelFormat
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "brief-data.json"), "utf8"));
const M = DATA.meta;
const OUT_DIR = path.join(ROOT, "public");
fs.mkdirSync(OUT_DIR, { recursive: true });

// palette
const PURPLE = "6B2FA0", PINK = "C2185B", ORANGE = "FD7E14", GREY = "555555";
const R = (t, o = {}) => new TextRun({ text: t, ...o });
const P = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [R(children)], ...o });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [R(t)] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [R(t)] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [R(t)] });
const spacer = () => P("", { spacing: { after: 60 } });
const bullet = runs => new Paragraph({ numbering: { reference: "b", level: 0 }, children: Array.isArray(runs) ? runs : [R(runs)] });
const rule = (c = PURPLE) => new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: c, space: 1 } }, spacing: { after: 120 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// platform colors for the flat calendar
const PCOL = { telegram: "37A7E0", youtube: "FF0000", extrait: "8E44AD", tiktok: "111111", facebook: "4C8DF6", reddit: "D93A00", x: "111111", snapchat: "B58900", story: "F5A623" };

function pipeRow(icon, label, title, extra, fill) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const kids = [P([R(icon + " " + label, { bold: true, color: "FFFFFF" })]),
    P([R("« " + title + " »", { bold: true, color: "FFFFFF", size: 26 })])];
  if (extra) kids.push(P([R(extra, { color: "FFFFFF", italics: true, size: 20 })]));
  return new TableRow({ children: [new TableCell({ borders, width: { size: 9360, type: WidthType.DXA }, shading: { fill, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, children: kids })] });
}

function flatPost(p) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CDB4E0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const barColor = PCOL[p.platKey] || PURPLE;
  const field = (label, val, opts = {}) => P([R(label + " : ", { bold: true, color: PURPLE }), R(val, opts)]);
  const kids = [
    P([R("● ", { color: barColor, bold: true }), R(p.plats, { bold: true, color: barColor }), R("   " + p.time + " · " + p.moment, { color: GREY, size: 20 })]),
    field("Type", p.type),
    P([R("Texte à poster : ", { bold: true, color: PINK }), R("« " + p.texte.replace(/\n/g, "  /  ") + " »")]),
    field("Média", p.media, { italics: true, color: GREY }),
    field("Lien", p.lien),
  ];
  if (p.astuce) kids.push(P([R("Astuce : ", { bold: true, color: PURPLE }), R(p.astuce, { italics: true, color: GREY })]));
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [new TableRow({ children: [new TableCell({ borders, width: { size: 9360, type: WidthType.DXA }, shading: { fill: "FCFAFE", type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 130, right: 130 }, children: kids })] })] });
}

function reelBlock(r) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E0C8F0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cell = new TableCell({ borders, width: { size: 9360, type: WidthType.DXA }, shading: { fill: "FBF6FE", type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, children: [
    P([R("RÉEL " + r.n + " — " + r.title, { bold: true, color: PURPLE, size: 24 }), R("  (" + r.angle + ")", { color: GREY, italics: true })]),
    P([R("⏱ ", { bold: true }), R(r.dur), R("   🎥 ", { bold: true }), R(r.cam, { italics: true, color: GREY })]),
    P([R("Plateforme(s) : ", { bold: true, color: PURPLE }), R(r.plats), R("   ·   Jour : ", { bold: true, color: PURPLE }), R(r.jour)]),
    P([R("🎣 HOOK — ", { bold: true, color: PINK }), R(r.hook)]),
    P([R("💬 CORPS — ", { bold: true, color: PINK }), R(r.corps)]),
    P([R("📣 CTA — ", { bold: true, color: PINK }), R(r.cta)]),
  ] });
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [new TableRow({ children: [cell] })] });
}

function scriptBeat(b) {
  const out = [P([R(b.num + " ", { bold: true, color: ORANGE, size: 26 }), R(b.title, { bold: true, color: PURPLE, size: 24 }), R(b.timing ? "  (" + b.timing + ")" : "", { color: GREY, italics: true })], { spacing: { before: 120, after: 40 } })];
  b.lines.forEach(l => out.push(P([R(l.quote ? "« " : ""), R(l.t, { italics: !!l.quote }), R(l.quote ? " »" : "")])));
  (b.notes || []).forEach(n => out.push(P([R("[" + n + "]", { italics: true, color: GREY, size: 20 })])));
  return out;
}

const children = [
  // COVER
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [R(M.channel.toUpperCase(), { bold: true, size: 40, color: PURPLE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [R(M.handle, { size: 24, color: PINK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [R("BRIEF DE PRODUCTION — LUNDI 29 JUIN 2026", { bold: true, size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [R(M.weekLabel, { italics: true, color: GREY })] }),
  rule(),

  // PARTIE 1
  h1("PARTIE 1 — ÉTAT DU PIPELINE"),
  P([R("Note : le calendrier Drive n'ayant pas été mis à jour depuis le 21 juin, ses statuts sont en retard d'environ une semaine. Conformément à la règle « la DATE fait foi », le pipeline est reconstruit à partir des dates de publication (une vidéo par vendredi).", { italics: true, color: GREY, size: 20 })]),
  spacer(),
  new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [
    pipeRow("📅", "SORT VENDREDI 3 JUILLET", M.videoA.title, "Montage bouclé avant jeudi soir — publication vendredi 8h.", PINK),
    pipeRow("🔨", "À MONTER avant jeudi", M.videoB.title, "Sortie prévue le vendredi 10 juillet 2026.", PURPLE),
    pipeRow("🎥", "À TOURNER MERCREDI 1er JUILLET", M.videoC.title, "Sortie prévue le vendredi 17 juillet 2026 — script + réels fournis lundi dernier.", "8E44AD"),
    pipeRow("✍️", "SCRIPT + RÉELS FOURNIS CE LUNDI", M.videoD.title + " — « " + M.videoD.theme + " »", "Sortie prévue le vendredi 24 juillet 2026 — à tourner mercredi prochain (8 juillet).", ORANGE),
  ] }),
  spacer(),
  P([R("Vidéo précédente (sortie 26/06) : ", { bold: true }), R("« " + M.previous.title + " »", { italics: true }), R(" — thème des stories de lundi à jeudi matin.")]),
  pageBreak(),

  // PARTIE 2
  h1("PARTIE 2 — STRATÉGIE MARKETING (VIDÉO D)"),
  P([R("Vidéo D : ", { bold: true }), R("« " + M.videoD.title + " » — " + M.videoD.theme, { italics: true }), R("  ·  Sortie prévue vendredi 24 juillet 2026.")]),
  h2("① Titre optimisé YouTube — 3 propositions"),
  h3("Proposition A (recommandée) ✅"),
  bullet([R("« On a tous 3 personnes en nous » ", { bold: true }), R("— 38 caractères")]),
  bullet([R("Angle : ", { bold: true }), R("curiosity gap + universel. Keyword « 3 personnes en nous » en tête. Recommandé.")]),
  h3("Proposition B"),
  bullet([R("« Le ça, le moi, le sur-moi : qui commande ? » ", { bold: true }), R("— 44 caractères")]),
  bullet([R("Angle : ", { bold: true }), R("pédagogique + tension. Très SEO psycho, un peu scolaire.")]),
  h3("Proposition C"),
  bullet([R("« Je vous révèle mes 3 prénoms » ", { bold: true }), R("— 30 caractères")]),
  bullet([R("Angle : ", { bold: true }), R("personnel + mystère, mais keyword psycho absent → moins de portée.")]),
  P([R("👉 Recommandation : ", { bold: true, color: PINK }), R("Proposition A — meilleur équilibre curiosity gap / universalité / longueur.")]),
  h2("② Miniature — prompt ChatGPT / DALL·E"),
  P([R("Prompt (EN) : ", { bold: true }), R("Split-personality YouTube thumbnail, adult lifestyle vlog style. Close-up face-cam of a confident blonde French woman (Amanda), face divided into three vertical panels showing three expressions of the SAME woman: left wild/desiring (id), center calm (ego), right strict/judgmental (superego). Dramatic studio lighting, high contrast dark purple-to-magenta background. Bold white overlay text \"MOI, SUR-MOI & CA\" + small \"3 EN 1\" badge. Cinematic, 4k, expressive eyes, 16:9.", { italics: true })]),
  bullet([R("Couleurs : ", { bold: true }), R("violet profond → magenta, texte blanc bold contour noir. Éviter le fond clair.")]),
  bullet([R("Photo réelle vs IA : ", { bold: true }), R("privilégier une vraie photo face-cam d'Amanda (meilleur CTR), composer le triptyque en montage ; IA pour le fond/effets.")]),
  h2("③ Caption YouTube (description vidéo)"),
  P([R("On a tous 3 personnes qui se disputent dans notre tête — et la plus honnête n'est pas celle que vous croyez. 👀", { bold: true })]),
  spacer(),
  P("Le ça qui veut tout. Le sur-moi qui juge. Le moi coincé au milieu. Dans cet épisode je vous ouvre ma tête en grand — et je vous donne même mes 3 prénoms."),
  bullet("→ Le ça, le moi, le sur-moi expliqués simplement"),
  bullet("→ Pourquoi vous n'êtes jamais « une seule » personne"),
  bullet("→ Mes 3 prénoms et ce que chacun cache"),
  bullet("→ Comment je fais la paix entre mes 3 voix"),
  bullet("→ La question qui va vous faire réfléchir toute la semaine"),
  spacer(),
  P([R("📲 Facebook @blondymandise · OnlyFans/MYM · Telegram → liens en bio", { bold: true })]),
  P([R("#psychologie #connaissancedesoi #ça #surmoi #freud #développementpersonnel #lespenséesdamanda #blondymandise #introspection", { color: GREY })]),
  h2("④ Caption Facebook (post de sortie)"),
  P([R("On a tous 3 personnes en nous… et la mienne préférée est celle que je cache le plus. 🎭", { bold: true })]),
  P("Nouvelle vidéo en ligne : le ça, le moi, le sur-moi — et mes 3 prénoms révélés. Lien en bio 🔗"),
  P([R("Laquelle de vos 3 voix parle le plus fort en ce moment ? 👇", { italics: true })]),
  P([R("#lespenséesdamanda #psychologie #connaissancedesoi #introspection", { color: GREY })]),
  pageBreak(),

  // PARTIE 3
  h1("PARTIE 3 — PLANNING STORIES DE LA SEMAINE (narratif)"),
  P([R("Version narrative de la stratégie éditoriale Facebook + Telegram. Le détail plat et copiable est en Partie 6.", { italics: true, color: GREY })]),
  h2("Bloc 1 — Lundi → Jeudi matin : « " + M.previous.title + " »"),
  P("Facebook (public, engagement ouvert) : relance commentaires (lun), sondage à-deux-ou-seul (mar), Q&A + coulisses tournage (mer), citation partageable (jeu matin). Varier les formats chaque jour."),
  P("Telegram (abonnés exclusifs, ton intime) : confession + vocal exclusif (lun), question sur leur vécu de couple (mar), lecture exclusive des questions de tournage (mer), confession « la phrase non dite » (jeu matin)."),
  h2("Bloc 2 — Jeudi soir : teasing Vidéo A"),
  P("Facebook : story teaser mystérieux (sans nommer le sujet) + sondage anticipation « assume / esquive ». Telegram : annonce d'un debrief exclusif post-vidéo pour vendredi soir → créer l'anticipation."),
  h2("Bloc 3 — Vendredi → Dimanche : « " + M.videoA.title + " »"),
  P("Vendredi : annonce sortie + CTA (IG) / invitation + promesse de debrief (TG matin), puis résultat sondage (IG soir) / DEBRIEF EXCLUSIF (TG soir). Samedi : exploitation commentaires + question ouverte (IG) / question plus intime, Amanda commence (TG). Dimanche : recap + amorce vendredi prochain (IG) / bilan intime + teasing exclusivité de la semaine suivante (TG)."),
  pageBreak(),

  // PARTIE 4
  h1("PARTIE 4 — SCRIPT LONG FORMAT (VIDÉO D)"),
  P([R("« " + M.videoD.title + " » — " + M.videoD.theme, { bold: true }), R("  ·  Sortie prévue vendredi 24 juillet 2026  ·  Durée cible 5-10 min (~1100 mots).")]),
  rule(PINK),
];

DATA.script.forEach(b => scriptBeat(b).forEach(x => children.push(x)));
children.push(pageBreak());

// PARTIE 5
children.push(h1("PARTIE 5 — 8 SCRIPTS RÉELS (VIDÉO D)"));
children.push(P([R("Même thème que la vidéo longue. Tournés en batch le mercredi 8 juillet, drippés sur la semaine de sortie (autour du 24/07).", { italics: true, color: GREY })]));
children.push(spacer());
DATA.reels.forEach(r => { children.push(reelBlock(r)); children.push(spacer()); });
children.push(pageBreak());

// PARTIE 6
children.push(h1("PARTIE 6 — CALENDRIER DE DIFFUSION MULTI-PLATEFORME"));
children.push(P([R("Liste plate et structurée de toutes les publications de la semaine, jour par jour, toutes plateformes. C'est ce que le cockpit lit (onglets Jour & Plateforme).", { italics: true, color: GREY })]));
children.push(P([R("Roster de plateformes — Funnel marque (SFW) : ", { bold: true }), R("YouTube · TikTok · Facebook. "), R("Funnel direct / monétisation : ", { bold: true }), R("X (teasers → OnlyFans) · Reddit (subs + flair) · Telegram (PPV) · Snapchat (manuel). Contenu 100% en français.")]));
DATA.schedule.forEach(d => {
  children.push(h2(d.day + " " + d.date));
  d.posts.forEach(p => { children.push(flatPost(p)); children.push(spacer()); });
});
children.push(pageBreak());

// PARTIE 7
children.push(h1("PARTIE 7 — LIENS"));
children.push(P([R("Coffre à liens (onglet Liens du cockpit). Les URL marquées A_COMPLETER sont à renseigner une fois pour toutes dans data/brief-data.json.", { italics: true, color: GREY })]));
const linkGroups = [
  ["Plateformes payantes", ["OnlyFans", "MYM"]],
  ["Direct", ["Telegram", "PayPal", "Snapchat"]],
  ["Funnel direct", ["X", "Reddit"]],
  ["Marque (réseaux)", ["YouTube", "TikTok", "Facebook", "Threads"]],
  ["Bio", ["Bio"]],
];
linkGroups.forEach(([grp, keys]) => {
  children.push(h3(grp));
  keys.forEach(k => children.push(bullet([R(k + " → ", { bold: true }), new ExternalHyperlink({ children: [R(DATA.links[k] || "—", { style: "Hyperlink" })], link: DATA.links[k] || "https://example.com" })])));
});
children.push(pageBreak());

// ANNEXE — propositions d'idées
if (Array.isArray(DATA.ideaProposals) && DATA.ideaProposals.length) {
  children.push(h1("ANNEXE — PROPOSITIONS D'IDÉES (prochaines semaines)"));
  children.push(P([R("À choisir dans le cockpit (onglet Idées), puis à saisir manuellement dans le calendrier avant lundi.", { italics: true, color: GREY })]));
  DATA.ideaProposals.forEach((p, i) => {
    children.push(h3((i + 1) + ". " + p.title));
    children.push(bullet([R("Thématique : ", { bold: true }), R(p.theme + " · " + (p.format || "Long format") + " · " + (p.potentiel || ""))]));
    children.push(bullet([R("Angle : ", { bold: true }), R(p.hook || "")]));
  });
  children.push(pageBreak());
}

// SOURCES
children.push(h2("Sources (recherche web)"));
DATA.sources.forEach(s => children.push(bullet([new ExternalHyperlink({ children: [R(s.label, { style: "Hyperlink" })], link: s.url })])));

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: "Arial", color: PURPLE }, paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 27, bold: true, font: "Arial", color: PINK }, paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, font: "Arial", color: "333333" }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, right: 1440, bottom: 1200, left: 1440 } } }, children }],
});

function briefFilename() {
  const MO = ["JAN", "FEV", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOUT", "SEP", "OCT", "NOV", "DEC"];
  const d = (M.briefDate || "2026-06-29").split("-");
  const dd = String(parseInt(d[2], 10)).padStart(2, "0");
  const mon = MO[parseInt(d[1], 10) - 1] || "";
  return "BRIEF_LUNDI_" + dd + mon + ".docx";
}

Packer.toBuffer(doc).then(buffer => {
  // clean older briefs so only the current week's file remains
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (/^BRIEF_LUNDI_.*\.(docx|pdf)$/.test(f)) { try { fs.unlinkSync(path.join(OUT_DIR, f)); } catch (e) {} }
  }
  const out = path.join(OUT_DIR, briefFilename());
  fs.writeFileSync(out, buffer);
  console.log("OK docx:", out, buffer.length);
});
