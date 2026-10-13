/* Découpe les anciens fichiers numérotés en core/, games/ et styles/ sans changer une ligne de code. */
import fs from "node:fs";
import path from "node:path";
const S = "src";
const read = f => fs.readFileSync(path.join(S, f), "utf8");
const out = {};
const add = (file, text) => { out[file] = (out[file] || "") + text.replace(/\s+$/, "") + "\n"; };
const bannerRe = /^\/\* =+\n[\s\S]*?=+ \*\/\n/;
const stripBanner = s => s.replace(/^\s+/, "").replace(bannerRe, "").replace(/^"use strict";\n/, "");

/* --- fichiers du cœur : découpage sur les en-têtes de section --- */
function sections(file) {
  const src = stripBanner(read(file));
  const lines = src.split("\n");
  const list = [];
  let cur = { name: "(début)", lines: [] };
  for (const l of lines) {
    const m = l.match(/^\/\* -{3,} (.+?) -{3,} \*\/$/);
    if (m) { list.push(cur); cur = { name: m[1].trim(), lines: [l] }; }
    else cur.lines.push(l);
  }
  list.push(cur);
  return list.map(s => ({ name: s.name, text: s.lines.join("\n") }));
}
function route(file, map) {
  let last = null;
  for (const s of sections(file)) {
    /* une sous-section inconnue reste avec la section qui la précède */
    const target = map[s.name] || last || map["*"];
    if (!target) throw new Error(`${file} : section « ${s.name} » sans destination`);
    last = target;
    add(target, s.text);
  }
}
add("core/config.js", read("00-config.js"));
route("05a-core.js", {
  "(début)": "core/util.js", "utilitaires": "core/util.js", "équité vérifiable": "core/fair.js",
  "sauvegarde": "core/save.js", "niveaux": "core/save.js", "mises": "core/bets.js",
  "toasts & modale": "core/modal.js", "effets & sons": "core/fx.js"
});
route("05b-ui.js", { "(début)": "core/ui.js", "menu profil": "core/ui.js", "modales": "core/ui.js", "son": "core/ui.js", "*": "core/chat.js" });
/* le chat de 05b commence à un en-tête « ===== » : on le sépare sur le mot-clé */
{
  const ui = out["core/ui.js"];
  const cut = ui.indexOf("/* =====");
  if (cut > 0) { out["core/chat.js"] = ui.slice(cut); out["core/ui.js"] = ui.slice(0, cut); }
}
route("05c-pages.js", {
  "(début)": "core/registry.js", "paris en direct": "core/feed.js", "cartes": "core/pages.js", "illustration du héros": "core/pages.js",
  "pages": "core/pages.js", "apparitions au défilement": "core/router.js", "routeur": "core/router.js",
  "écran de jeu": "core/shell.js", "mode automatique": "core/shell.js"
});
add("core/draw.js", stripBanner(read("05d-draw.js")));
add("core/trust.js", stripBanner(read("05e-trust.js")));
add("core/art.js", stripBanner(read("06-art.js")));
add("core/boot.js", read("10-boot.js"));

/* --- jeux : un fichier par jeu --- */
const GAME_FILES = { DICE: "dice", LIMBO: "limbo", CRASH: "crash", PLINKO: "plinko", MINES: "mines", TOWER: "tower", KENO: "keno",
  "COIN FLIP": "coinflip", WHEEL: "wheel", ROULETTE: "roulette", BLACKJACK: "blackjack", "CHICKEN ROAD": "chicken" };
for (const f of ["07-games1.js", "08-games2.js", "09-games3.js"]) {
  let cur = null;
  for (const s of sections(f)) {
    if (s.name === "(début)") { if (s.text.trim()) throw new Error(`${f} : code avant le premier jeu`); continue; }
    const id = GAME_FILES[s.name] || cur;
    if (!id) throw new Error(`${f} : jeu inconnu « ${s.name} »`);
    cur = id;
    add(`games/${id}.js`, s.text);
  }
}
add("games/slots.js", stripBanner(read("09b-slots.js")));

/* --- styles --- */
for (const [from, to] of [["02-base.css", "base.css"], ["03-games.css", "games.css"], ["03b-extra.css", "extra.css"], ["03c-polish.css", "polish.css"], ["03d-trust.css", "trust.css"]])
  add("styles/" + to, read(from));

/* --- écriture et vérification : même code, dans le même ordre --- */
const ORDER = ["core/config.js", "core/util.js", "core/fair.js", "core/save.js", "core/bets.js", "core/modal.js", "core/fx.js", "core/ui.js", "core/chat.js",
  "core/registry.js", "core/feed.js", "core/pages.js", "core/router.js", "core/shell.js", "core/draw.js", "core/trust.js", "core/art.js",
  "games/dice.js", "games/limbo.js", "games/crash.js", "games/plinko.js", "games/mines.js", "games/tower.js", "games/keno.js", "games/coinflip.js",
  "games/wheel.js", "games/roulette.js", "games/blackjack.js", "games/chicken.js", "games/slots.js", "core/boot.js"];
const OLD = ["00-config.js", "05a-core.js", "05b-ui.js", "05c-pages.js", "05d-draw.js", "05e-trust.js", "06-art.js", "07-games1.js", "08-games2.js", "09-games3.js", "09b-slots.js", "10-boot.js"];
/* comparaison hors commentaires de bloc et lignes vides : le code doit être strictement identique */
const norm = s => s.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map(l => l.replace(/\s+$/, "")).filter(l => l.trim() && l !== '"use strict";').join("\n");
const before = norm(OLD.map(read).join("\n")), after = norm(ORDER.map(f => out[f]).join("\n"));
if (before !== after) {
  const a = before.split("\n"), b = after.split("\n");
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  console.log("DIFFÉRENCE à la ligne", i + 1, "\n  avant :", a[i], "\n  après :", b[i]);
  process.exit(1);
}
for (const [f, text] of Object.entries(out)) { fs.mkdirSync(path.dirname(path.join(S, f)), { recursive: true }); fs.writeFileSync(path.join(S, f), text); }
for (const f of [...OLD, "02-base.css", "03-games.css", "03b-extra.css", "03c-polish.css", "03d-trust.css"]) fs.unlinkSync(path.join(S, f));
console.log("découpage OK :", Object.keys(out).length, "fichiers ;", ORDER.length, "parties JS dans le même ordre qu'avant");
