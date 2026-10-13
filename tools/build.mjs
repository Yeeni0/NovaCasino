/* =====================================================================
   Construit le site NovaCasino dans dist/  →  node tools/build.mjs
   Réglages : site.config.json (domaine, éditeur, hébergeur, contact, analytics)
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import * as esbuild from "esbuild";

const cfg = JSON.parse(fs.readFileSync("site.config.json", "utf8"));
const SITE_URL = String(cfg.siteUrl || "").replace(/\/+$/, "");
const PLAUSIBLE = (cfg.analytics && cfg.analytics.plausibleDomain) || "";
const TODAY = new Date().toISOString().slice(0, 10);
const DATE_FR = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const DESC = "13 jeux de casino gratuits, un tirage offert chaque soir et zéro argent réel. Dice, Crash, Blackjack, Roulette… sur ordinateur et mobile, sans inscription.";
const OUT = "dist";
const read = f => fs.readFileSync(path.join("src", f), "utf8");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hash = s => crypto.createHash("sha256").update(s).digest("hex").slice(0, 10);
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.writeFileSync(path.join(OUT, f), s); };
const warnings = [];

fs.rmSync(OUT, { recursive: true, force: true });

/* ---------- CSS ---------- */
let css = ["styles/base.css", "styles/games.css", "styles/extra.css", "styles/polish.css", "styles/trust.css"].map(read).join("\n")
  .replace("{{RANGE_LATIN}}", read("static/fonts/rubik-latin.range.txt").trim())
  .replace("{{RANGE_LATIN_EXT}}", read("static/fonts/rubik-latin-ext.range.txt").trim());
const cssMin = (await esbuild.transform(css, { loader: "css", minify: true, target: ["chrome90", "safari14", "firefox90"] })).code;
const cssFile = `assets/app.${hash(cssMin)}.css`;
write(cssFile, cssMin);

/* ---------- JavaScript ---------- */
const site = { url: SITE_URL, desc: DESC, analytics: { plausible: PLAUSIBLE } };
const jsParts = ["core/util.js", "core/fair.js", "core/save.js", "core/bets.js", "core/modal.js", "core/fx.js", "core/ui.js", "core/chat.js", "core/registry.js", "core/feed.js", "core/pages.js", "core/router.js", "core/shell.js", "core/draw.js", "core/trust.js", "core/art.js",
  "games/dice.js", "games/limbo.js", "games/crash.js", "games/plinko.js", "games/mines.js", "games/tower.js", "games/keno.js", "games/coinflip.js", "games/wheel.js", "games/roulette.js", "games/blackjack.js", "games/chicken.js", "games/slots.js", "core/boot.js"];
const js = read("core/config.js").replace("{{SITE_JSON}}", JSON.stringify(site)) + jsParts.map(read).join("\n");
const jsMin = (await esbuild.transform(js, { loader: "js", minify: true, target: "es2020", charset: "utf8", legalComments: "none" })).code;
const jsFile = `assets/app.${hash(jsMin)}.js`;
write(jsFile, jsMin);

/* ---------- fichiers statiques ---------- */
for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "og-image.jpg"])
  fs.copyFileSync(path.join("src/static", f), path.join(OUT, f));
for (const f of ["rubik-latin.woff2", "rubik-latin-ext.woff2"]) {
  fs.mkdirSync(path.join(OUT, "assets/fonts"), { recursive: true });
  fs.copyFileSync(path.join("src/static/fonts", f), path.join(OUT, "assets/fonts", f));
}

/* ---------- liste des jeux (contenu lisible sans JavaScript) ---------- */
const gameSrc = fs.readdirSync("src/games").sort().map(f => "games/" + f).map(read).join("\n");
const games = [...gameSrc.matchAll(/id: "(\w+)", name: "([^"]+)"[\s\S]*?rules: "([^"]+)"/g)]
  .map(m => ({ id: m[1], name: m[2], rule: m[3].split(". ")[0].replace(/\.$/, "") + "." }));

/* ---------- héros rendu dans le HTML : affichage immédiat, avant le JavaScript ---------- */
const heroSrc = read("core/pages.js").match(/function heroScene\(\) \{[\s\S]*?\n\}\n/)[0];
const staticHero = `<section class="hero" data-static>${new Function(heroSrc + "; return heroScene();")()}<div class="hero-txt">` +
  `<span class="live"><i class="dot"></i>1 248 joueurs en ligne</span><h1>Le casino qui ne te prend<br>pas pour un pigeon.</h1>` +
  `<p>Du jeu à l'état pur : pas d'argent réel, pas de bonus piège, des tirages vérifiables.</p>` +
  `<div class="cta"><a class="btn btn-blue btn-xl" href="#/jeux">Jouer gratuitement</a></div></div></section>`;

/* ---------- page d'accueil ---------- */
const jsonld = JSON.stringify({
  "@context": "https://schema.org", "@type": "WebSite", name: "NovaCasino", url: SITE_URL + "/",
  inLanguage: "fr-FR", description: DESC
}).replace(/</g, "\\u003c");
const index = read("index.template.html")
  .replaceAll("{{DESC}}", esc(DESC))
  .replaceAll("{{SITE_URL}}", SITE_URL)
  .replace("{{CSS}}", cssFile)
  .replace("{{JS}}", jsFile)
  .replace("{{JSONLD}}", jsonld)
  .replace("{{STATIC_HERO}}", staticHero)
  .replace("{{YEAR}}", String(new Date().getFullYear()))
  .replace("{{GAMES_LIST}}", games.map(g => `<li><b>${esc(g.name)}</b> : ${esc(g.rule)}</li>`).join(""))
  .replace(/\n\s+/g, "\n");
write("index.html", index);

/* ---------- pages légales et 404 ---------- */
const mark = label => `<mark>[À compléter : ${label}]</mark>`;
const val = (v, label) => (v ? esc(v) : mark(label));
const ed = cfg.editor || {}, host = cfg.host || {};
const contact = cfg.contactEmail ? `<a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : mark("adresse e-mail de contact");
const baseRepl = {
  EDITOR_NAME: val(ed.name, "nom ou raison sociale de l'éditeur"),
  EDITOR_STATUS: val(ed.status, "particulier, micro-entreprise ou société"),
  EDITOR_ADDRESS: val(ed.address, "adresse postale"),
  EDITOR_SIRET: ed.siret ? esc(ed.siret) : /particulier/i.test(ed.status || "") ? "non applicable" : mark("SIREN ou SIRET, si activité professionnelle"),
  EDITOR_DIRECTOR: val(ed.director, "nom du directeur ou de la directrice de la publication"),
  HOST_NAME: val(host.name, "nom de l'hébergeur"),
  HOST_ADDRESS: val(host.address, "adresse de l'hébergeur"),
  HOST_CONTACT: val(host.contact, "téléphone ou contact de l'hébergeur"),
  CONTACT: contact,
  ANALYTICS_SHORT: PLAUSIBLE ? "Mesure d'audience anonyme et sans cookie (Plausible), uniquement si tu l'acceptes." : "Aucun outil de mesure d'audience n'est installé.",
  ANALYTICS_BLOCK: PLAUSIBLE
    ? `<p>Si tu l'acceptes dans le bandeau ou via « Gérer les cookies », NovaCasino utilise <b>Plausible Analytics</b> (Plausible Insights OÜ, Estonie, données hébergées dans l'Union européenne). Plausible ne dépose aucun cookie, ne suit pas les visiteurs d'un site à l'autre et ne produit que des statistiques agrégées : pages vues, pays, type d'appareil, provenance de la visite. Tu peux retirer ton accord à tout moment ; plus rien n'est alors envoyé.</p>`
    : `<p>Aucun outil de mesure d'audience n'est installé pour le moment. Si un outil est ajouté, il sera décrit ici et ne s'activera qu'avec ton accord.</p>`
};
const LOGO = `<span class="logo-mark"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 14V2h3l5.2 7.2V2h2.8v12h-3L5.3 6.8V14Z" fill="#fff"/></svg></span><span>Nova<b>Casino</b></span>`;
function layout({ title, description, body, noindex, base, file, plain }) {
  const canon = file ? `${SITE_URL}/${file}` : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow"}">
${canon ? `<link rel="canonical" href="${canon}">` : ""}
<meta name="theme-color" content="#0c0d1f">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="article">
<meta property="og:site_name" content="NovaCasino">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canon ? `<meta property="og:url" content="${canon}">` : ""}
<meta property="og:image" content="${SITE_URL}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}favicon.ico" sizes="32x32">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${base}apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preload" href="${base}assets/fonts/rubik-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}${cssFile}">
</head>
<body class="doc">
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="top">
<a class="logo" href="${base}" aria-label="NovaCasino, retour à l'accueil">${LOGO}</a>
<div class="top-r"><a class="btn btn-blue" href="${base}#/jeux">Jouer gratuitement</a></div>
</header>
<div class="main">
<main class="wrap${plain ? "" : " prose"}" id="contenu" tabindex="-1">
${body}
${plain ? "" : `<p class="updated">Dernière mise à jour : ${DATE_FR}</p>`}
</main>
<footer class="foot"><div class="wrap">
<div class="foot-cols">
<div><h2 class="foot-h">NovaCasino</h2><a href="${base}">Accueil</a><a href="${base}#/jeux">Tous les jeux</a><a href="${base}#/tirage">Tirage gratuit</a><a href="${base}#/records">Records</a></div>
<div><h2 class="foot-h">Légal</h2><a href="${base}cgu.html">Conditions d'utilisation</a><a href="${base}confidentialite.html">Confidentialité</a><a href="${base}mentions-legales.html">Mentions légales</a><a href="${base}#/cookies">Gérer les cookies</a></div>
<div><h2 class="foot-h">Aide</h2><a href="https://www.joueurs-info-service.fr/" target="_blank" rel="noopener">Joueurs Info Service</a></div>
</div>
<p class="legal"><b>NovaCasino est un casino de démonstration.</b> Les crédits sont fictifs, sans aucune valeur, et ne peuvent être ni achetés ni retirés. Réservé aux 18 ans et plus.<br>© ${new Date().getFullYear()} NovaCasino</p>
</div></footer>
</div>
</body>
</html>
`.replace(/\n{2,}/g, "\n");
}
const pages = [
  { src: "mentions-legales.html", file: "mentions-legales.html" },
  { src: "confidentialite.html", file: "confidentialite.html" },
  { src: "cgu.html", file: "cgu.html" },
  { src: "404.html", file: "", out: "404.html", base: "/", plain: true }
];
for (const p of pages) {
  const raw = read("pages/" + p.src);
  const meta = Object.fromEntries([...raw.match(/^<!--meta (.*?) -->/)[1].matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  const base = p.base || "./";
  const repl = { ...baseRepl, BASE: base };
  const body = raw.replace(/^<!--meta .*? -->\n?/, "").replace(/\{\{(\w+)\}\}/g, (m, k) => (k in repl ? repl[k] : m));
  write(p.out || p.file, layout({ title: meta.title, description: meta.description, noindex: meta.noindex === "1", body, base, file: p.file, plain: p.plain }));
}

/* ---------- GitHub Pages : domaine personnalisé, pas de traitement Jekyll ---------- */
if (SITE_URL && !/\.example/.test(SITE_URL)) write("CNAME", new URL(SITE_URL).hostname + "\n");
write(".nojekyll", "");

/* ---------- référencement ---------- */
write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
const urls = [["/", "weekly", "1.0"], ["/cgu.html", "yearly", "0.3"], ["/confidentialite.html", "yearly", "0.3"], ["/mentions-legales.html", "yearly", "0.2"]];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, f, p]) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`).join("\n") + `\n</urlset>\n`);
write("site.webmanifest", JSON.stringify({
  name: "NovaCasino", short_name: "NovaCasino", description: DESC, lang: "fr", dir: "ltr",
  start_url: "./", scope: "./", display: "standalone", orientation: "portrait",
  background_color: "#0c0d1f", theme_color: "#0c0d1f",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2));

/* ---------- sécurité et HTTPS côté serveur ---------- */
const pl = PLAUSIBLE ? " https://plausible.io" : "";
const CSP = `default-src 'self'; script-src 'self'${pl}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'${pl}; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;
const HEADERS = [
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
  ["Content-Security-Policy", CSP],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"],
  ["Cross-Origin-Opener-Policy", "same-origin"]
];
write(".htaccess", `# NovaCasino : configuration Apache (OVH, o2switch, Hostinger...)
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html
AddType application/manifest+json .webmanifest
AddType font/woff2 .woff2
AddDefaultCharset utf-8

# Forcer HTTPS (redirection permanente)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

<IfModule mod_headers.c>
${HEADERS.map(([k, v]) => `  Header always set ${k} "${v}"`).join("\n")}
  <FilesMatch "\\.(html|xml|txt|webmanifest)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(png|jpg|ico|svg)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml text/plain application/xml
</IfModule>
`);
write("_headers", `# Netlify et Cloudflare Pages (HTTPS forcé automatiquement par ces hébergeurs)
/*
${HEADERS.map(([k, v]) => `  ${k}: ${v}`).join("\n")}

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: no-cache
`);
write("vercel.json", JSON.stringify({
  cleanUrls: false,
  headers: [
    { source: "/(.*)", headers: HEADERS.map(([key, value]) => ({ key, value })) },
    { source: "/assets/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }
  ]
}, null, 2));

/* ---------- contrôles ---------- */
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(OUT);
const routes = new Set(["", "jeux", "jeux/originals", "jeux/casino", "tirage", "records", "cookies", ...games.map(g => "jeu/" + g.id)]);
const broken = [], external = new Set();
const checkRoute = (r, where) => { if (!routes.has(r.replace(/\/$/, ""))) broken.push(`${where} → #/${r} (route inconnue)`); };
for (const f of files.filter(f => f.endsWith(".html"))) {
  const html = fs.readFileSync(f, "utf8");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const rel = path.relative(OUT, f).replace(/\\/g, "/");
  for (const [, v] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:)/.test(v)) { if (!v.startsWith(SITE_URL)) external.add(v); continue; }
    if (v.includes("{{")) { broken.push(`${rel} → ${v} (gabarit non remplacé)`); continue; }
    const [p, frag] = v.split("#");
    if (frag !== undefined && frag.startsWith("/")) checkRoute(frag.slice(1), rel);
    else if (frag && !p && !ids.has(frag)) broken.push(`${rel} → #${frag} (ancre absente)`);
    if (!p || p === "./" || p === "/") continue;
    const target = p.startsWith("/") ? path.join(OUT, p) : path.join(path.dirname(f), p);
    if (!fs.existsSync(target)) broken.push(`${rel} → ${v} (fichier absent)`);
  }
}
for (const [, r] of js.matchAll(/href="#\/([a-z0-9/]*)"/g)) checkRoute(r, "app.js");
for (const [, p] of js.matchAll(/href="([a-z-]+\.html)"/g)) if (!fs.existsSync(path.join(OUT, p))) broken.push(`app.js → ${p} (fichier absent)`);
for (const u of external) {
  try {
    const res = await fetch(u, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Mozilla/5.0 NovaCasino-linkcheck" } });
    if (!res.ok) broken.push(`lien externe ${u} → HTTP ${res.status}`);
  } catch (e) { warnings.push(`lien externe ${u} non vérifié (${e.name})`); }
}
if (/\.example$|\.example\//.test(SITE_URL) || !SITE_URL) warnings.push(`siteUrl vaut « ${SITE_URL} » : remplace-le par ton vrai domaine dans site.config.json`);
const todo = files.filter(f => f.endsWith(".html")).map(f => [path.basename(f), (fs.readFileSync(f, "utf8").match(/\[À compléter/g) || []).length]).filter(([, n]) => n);
if (todo.length) warnings.push("champs légaux à compléter dans site.config.json : " + todo.map(([f, n]) => `${f} (${n})`).join(", "));

const size = f => fs.statSync(path.join(OUT, f)).size;
const gz = f => zlib.gzipSync(fs.readFileSync(path.join(OUT, f)), { level: 9 }).length;
const kb = n => (n / 1024).toFixed(1) + " Ko";
console.log(`\nConstruit dans ${OUT}/ (${files.length} fichiers)`);
for (const f of ["index.html", cssFile, jsFile]) console.log(`  ${f.padEnd(34)} ${kb(size(f)).padStart(9)}   gzip ${kb(gz(f)).padStart(8)}`);
console.log(`  poids total transféré à l'accueil (gzip, polices et icône comprises) ≈ ${kb(gz("index.html") + gz(cssFile) + gz(jsFile) + size("assets/fonts/rubik-latin.woff2") + size("favicon.ico"))}`);
console.log(`  jeux listés pour le référencement : ${games.length}`);
console.log(broken.length ? `\nLIENS CASSÉS (${broken.length}) :\n  ` + broken.join("\n  ") : `\nLiens : tout est valide (${external.size} liens externes vérifiés).`);
if (warnings.length) console.log("\nÀ faire :\n  - " + warnings.join("\n  - "));
process.exit(broken.length ? 1 : 0);
