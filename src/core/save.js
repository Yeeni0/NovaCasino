/* ------------------------- sauvegarde ------------------------- */
const SAVE_KEY = "novacasino.save.v1";
const AV_COLORS = ["#4f5bff", "#c2276d", "#137a4c", "#b35309", "#0b6fa4", "#7a3fe0", "#c72a3b", "#0b7a6f"];
/* anciennes teintes, trop claires pour du texte blanc, converties vers les nouvelles */
const AV_OLD = ["#4f5bff", "#ff5fa2", "#22b574", "#ff9a3c", "#2cb5f5", "#a86bff", "#ef4a58", "#14b8a6"];
const avColor = c => (AV_COLORS.includes(c) ? c : AV_OLD.includes(c) ? AV_COLORS[AV_OLD.indexOf(c)] : AV_COLORS[0]);
const LEVELS = [[0, "Bronze"], [500, "Argent"], [2000, "Or"], [10000, "Platine"], [50000, "Diamant"], [200000, "Nova"]];
const START_BALANCE = 1000;

function newState() {
  return { balance: START_BALANCE, wagered: 0, profit: 0, best: 0, bestMult: 0, count: 0, wins: 0, lastAmount: 1,
    refills: 0, myBets: [], topWins: [], perGame: {}, pend: [],
    draw: { lastFree: 0, streak: 0, tickets: 0, prog: 0, next: 0, hist: [] } };
}
function newFair() { return { client: randStr(16), server: randStr(48), nonce: 0 }; }
function newProfile(name, color, guest) {
  return { id: guest ? "guest" : "p" + Date.now().toString(36) + randStr(4), name, color, guest: !!guest,
    created: Date.now(), state: newState(), fair: newFair() };
}
const validBet = b => b && typeof b.game === "string" && isFinite(b.amount) && isFinite(b.payout) && isFinite(b.mult) && isFinite(b.t);
function sanitizeState(s) {
  const d = newState();
  if (!s || typeof s !== "object") return d;
  ["balance", "wagered", "profit", "best", "bestMult", "count", "wins", "lastAmount", "refills"].forEach(k => { d[k] = fin(s[k], d[k]); });
  d.balance = Math.max(0, round2(d.balance));
  d.myBets = Array.isArray(s.myBets) ? s.myBets.filter(validBet).slice(0, 100) : [];
  d.topWins = Array.isArray(s.topWins) ? s.topWins.filter(validBet).slice(0, 10) : [];
  if (s.perGame && typeof s.perGame === "object") {
    Object.keys(s.perGame).forEach(k => {
      const g = s.perGame[k] || {};
      d.perGame[k] = { n: fin(g.n, 0), w: fin(g.w, 0), wag: fin(g.wag, 0), net: fin(g.net, 0), best: fin(g.best, 0) };
    });
  }
  d.pend = Array.isArray(s.pend) ? s.pend.filter(p => p && typeof p.game === "string" && isFinite(p.bet) && p.bet > 0 && isFinite(p.mult))
    .slice(0, 30).map(p => ({ key: String(p.key || p.game), game: p.game, bet: p.bet, mult: Math.max(0, p.mult) })) : [];
  const dr = s.draw && typeof s.draw === "object" ? s.draw : {};
  d.draw = { lastFree: Math.max(0, fin(dr.lastFree, 0)), streak: clamp(Math.round(fin(dr.streak, 0)), 0, 7),
    tickets: clamp(Math.round(fin(dr.tickets, 0)), 0, 99999), prog: Math.max(0, fin(dr.prog, 0)), next: Math.max(0, fin(dr.next, 0)),
    hist: Array.isArray(dr.hist) ? dr.hist.filter(h => h && isFinite(h.t) && isFinite(h.v)).slice(0, 40) : [] };
  return d;
}
function sanitizeDB(db) {
  const out = { v: 1, current: "guest", profiles: {}, settings: { sound: true, fx: true, vib: true, chat: true, pin: true } };
  if (db && typeof db === "object") {
    if (db.consent && isFinite(db.consent.t)) out.consent = { v: 1, analytics: !!db.consent.analytics, t: db.consent.t };
    if (db.settings) Object.keys(out.settings).forEach(k => { if (typeof db.settings[k] === "boolean") out.settings[k] = db.settings[k]; });
    if (db.profiles && typeof db.profiles === "object") {
      Object.keys(db.profiles).forEach(id => {
        const p = db.profiles[id];
        if (!p || typeof p.name !== "string") return;
        out.profiles[id] = {
          id, name: p.name.slice(0, 16), color: avColor(p.color), guest: id === "guest",
          created: fin(p.created, Date.now()), state: sanitizeState(p.state),
          fair: p.fair && typeof p.fair.server === "string" ? { client: String(p.fair.client || randStr(16)).slice(0, 64), server: p.fair.server, nonce: fin(p.fair.nonce, 0) } : newFair()
        };
      });
    }
    if (typeof db.current === "string" && out.profiles[db.current]) out.current = db.current;
  }
  if (!out.profiles.guest) out.profiles.guest = newProfile("Invité", AV_COLORS[5], true);
  if (!out.profiles[out.current]) out.current = "guest";
  return out;
}

let DB = null, state = null, fair = null;
const P = () => DB.profiles[DB.current];
const Store = {
  ok: true, timer: null, last: 0,
  load() {
    let raw = null, db = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { this.ok = false; }
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    DB = sanitizeDB(db);
    /* première visite : si le système demande moins d'animations, les effets sont coupés par défaut */
    if (!raw && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) DB.settings.fx = false;
    useProfile(DB.current);
  },
  write() {
    clearTimeout(this.timer); this.timer = null;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(DB));
      this.ok = true; this.last = Date.now();
    } catch (e) {
      if (this.ok) toast("Impossible d'enregistrer sur ce navigateur (navigation privée ?). Exporte ta sauvegarde.", true);
      this.ok = false;
    }
  },
  save(now) {
    if (now) return this.write();
    if (!this.timer) this.timer = setTimeout(() => this.write(), 350);
  }
};
function useProfile(id) {
  DB.current = id;
  state = P().state;
  fair = P().fair;
  resolvePending();
}
/* ---- export / import ---- */
function b64enc(s) { const b = new TextEncoder().encode(s); let bin = ""; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin); }
function b64dec(s) { return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); }
function exportData(p) {
  return { app: "NovaCasino", v: 1, at: Date.now(),
    profile: { name: p.name, color: p.color, created: p.created, state: p.state, client: p.fair.client } };
}
function exportCode(p) { return "NOVA1-" + b64enc(JSON.stringify(exportData(p))); }
/** Lit un code "NOVA1-…" ou le contenu JSON d'un fichier exporté. */
function parseSave(text) {
  text = String(text || "").trim();
  if (!text) throw new Error("Colle ton code de sauvegarde ou choisis un fichier.");
  let data;
  try {
    if (/^NOVA1-/.test(text)) data = JSON.parse(b64dec(text.slice(6).replace(/\s+/g, "")));
    else data = JSON.parse(text);
  } catch (e) { throw new Error("Ce code n'est pas une sauvegarde NovaCasino valide."); }
  if (!data || data.app !== "NovaCasino" || !data.profile || typeof data.profile.name !== "string") throw new Error("Ce code n'est pas une sauvegarde NovaCasino valide.");
  return data.profile;
}
function importProfile(src) {
  const name = src.name.trim().slice(0, 16) || "Joueur";
  const existing = Object.values(DB.profiles).find(p => !p.guest && p.name.toLowerCase() === name.toLowerCase());
  const p = existing || newProfile(name, AV_COLORS[0], false);
  p.color = avColor(src.color);
  p.created = fin(src.created, p.created);
  p.state = sanitizeState(src.state);
  p.state.pend = [];
  p.fair = { client: typeof src.client === "string" ? src.client.slice(0, 64) : randStr(16), server: randStr(48), nonce: 0 };
  DB.profiles[p.id] = p;
  return p;
}
/* ------------------------- niveaux ------------------------- */
function levelOf(w) {
  let i = 0;
  while (i < LEVELS.length - 1 && w >= LEVELS[i + 1][0]) i++;
  const lo = LEVELS[i][0], hi = i < LEVELS.length - 1 ? LEVELS[i + 1][0] : lo;
  return { i, name: LEVELS[i][1], next: i < LEVELS.length - 1 ? LEVELS[i + 1][1] : null,
    pct: hi > lo ? clamp((w - lo) / (hi - lo) * 100, 0, 100) : 100, left: Math.max(0, hi - w) };
}
