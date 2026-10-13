/* Génère l'image de partage et les icônes à partir du design du site (rendu par Edge headless). */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const WIN = process.argv[2];                       // chemin Windows réel du projet
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
fs.mkdirSync("tools/render", { recursive: true });
const ART = new Function(fs.readFileSync("src/06-art.js", "utf8") + "; return ART;")();
const fav = fs.readFileSync("src/static/favicon.svg", "utf8");
const font = `@font-face{font-family:Rubik;src:url(../../src/static/fonts/rubik-latin.woff2) format("woff2");font-weight:400 900}`;

const games = [["dice", "Dice"], ["blackjack", "Blackjack"], ["plinko", "Plinko"], ["crash", "Crash"], ["mines", "Mines"], ["limbo", "Limbo"], ["roulette", "Roulette"], ["wheel", "Wheel"], ["chicken", "Chicken Road"]];
const cards = games.map(([id, n]) => `<div class="c" style="background:${ART.bgCSS(id)}">${ART.svg(id)}<span>${n}</span></div>`).join("");
const og = `<!doctype html><html><head><meta charset="utf-8"><style>${font}
*{margin:0;box-sizing:border-box}html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;font-family:Rubik,sans-serif;color:#fff;background:radial-gradient(circle at 80% 25%,rgba(107,118,255,.38),transparent 55%),radial-gradient(circle at 8% 105%,rgba(255,197,61,.2),transparent 45%),linear-gradient(135deg,#0c0d1f,#1b1747 58%,#2a1f5e)}
.l{position:absolute;left:72px;top:62px;width:610px}
.logo{display:flex;align-items:center;gap:16px;font-weight:800;font-size:40px;letter-spacing:-1px}
.logo i{width:62px;height:62px;display:block}.logo i svg{width:100%;height:100%}.logo b{font-weight:500;color:#b8bcff}
h1{margin-top:52px;font-size:64px;line-height:1.03;font-weight:900;letter-spacing:-2px}
p{margin-top:24px;font-size:26px;line-height:1.35;color:#d4d6ff;font-weight:500}
.pills{display:flex;gap:12px;margin-top:36px}
.pills span{padding:10px 18px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15);font-size:20px;font-weight:700}
.pills span.g{background:linear-gradient(135deg,#ffd76b,#e7a51c);color:#3d2500;border-color:transparent}
.cards{position:absolute;right:-70px;top:-10px;width:520px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;transform:rotate(-9deg)}
.c{position:relative;aspect-ratio:3/4;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.45)}
.c svg{width:100%;height:100%;display:block}
.c span{position:absolute;left:0;right:0;bottom:14px;text-align:center;font-weight:800;font-size:21px;text-shadow:0 2px 8px rgba(0,0,0,.45)}
</style></head><body><div class="cards">${cards}</div>
<div class="l"><div class="logo"><i>${fav}</i><span>Nova<b>Casino</b></span></div>
<h1>Le casino qui ne te prend pas pour un pigeon.</h1>
<p>13 jeux gratuits, zéro argent réel,<br>et un tirage offert chaque soir.</p>
<div class="pills"><span class="g">Tirage gratuit</span><span>Sans inscription</span><span>Mobile</span></div></div></body></html>`;

const icon = maskable => `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}html,body{width:512px;height:512px;overflow:hidden;background:${maskable ? "linear-gradient(135deg,#6b76ff,#4331ff)" : "transparent"}}
svg{display:block;${maskable ? "width:62%;height:62%;margin:19%" : "width:512px;height:512px"}}</style></head><body>${maskable ? fav.replace(/<rect[^>]*\/>/, "") : fav}</body></html>`;

fs.writeFileSync("tools/render/og.html", og);
fs.writeFileSync("tools/render/icon.html", icon(false));
fs.writeFileSync("tools/render/icon-maskable.html", icon(true));
const shot = (file, out, w, h) => {
  execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--default-background-color=00000000", `--window-size=${w},${h}`, `--screenshot=${WIN}/tools/render/${out}`,
    `file:///${WIN}/tools/render/${file}`], { stdio: "ignore", timeout: 60000 });
  console.log(out, fs.statSync(`tools/render/${out}`).size, "octets");
};
shot("og.html", "og.png", 1200, 630);
shot("icon.html", "icon-512.png", 512, 512);
shot("icon-maskable.html", "icon-maskable-512.png", 512, 512);
