
/* ------------------------- utilitaires ------------------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
const round2 = n => Math.round(n * 100) / 100;
const fin = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
const pick = a => a[Math.floor(Math.random() * a.length)];
/* exécute une tâche non urgente quand le navigateur est libre */
const idle = (f, t) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: t || 1500 }) : setTimeout(f, 200));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function tween(dur, onFrame, onEnd) {
  const t0 = performance.now();
  let raf;
  const step = () => {
    const k = clamp((performance.now() - t0) / dur, 0, 1);
    onFrame(k);
    if (k < 1) raf = requestAnimationFrame(step);
    else if (onEnd) onEnd();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
function fmt(n) {
  if (!isFinite(n)) n = 0;
  const neg = n < 0;
  const p = Math.abs(Math.round(n * 100) / 100).toFixed(2).split(".");
  return (neg ? "−" : "") + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + p[1];
}
function fmtMult(m) {
  if (m >= 1000) return (Math.round(m * 10) / 10).toFixed(1) + "×";
  return (Math.round(m * 100) / 100).toFixed(2) + "×";
}
function parseAmt(v) {
  const x = parseFloat(String(v).replace(/[\s ]/g, "").replace(",", "."));
  return isFinite(x) ? x : NaN;
}
function ago(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "à l'instant";
  if (s < 3600) return "il y a " + Math.floor(s / 60) + " min";
  if (s < 86400) return "il y a " + Math.floor(s / 3600) + " h";
  return new Date(t).toLocaleDateString("fr-FR");
}
const COIN = '<svg class="coin-i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ffc53d"/><circle cx="12" cy="12" r="7.6" fill="#f0a91c"/><path d="M9.2 15.6V8.4h1.7l2.9 4.1V8.4h1.7v7.2h-1.7l-2.9-4.1v4.1Z" fill="#fff4cf"/></svg>';
const svgI = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  shield: svgI('<path d="M12 3 4 6v6c0 4.4 3.3 8.3 8 9 4.7-.7 8-4.6 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'),
  sound: svgI('<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: svgI('<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 10 4 4m0-4-4 4"/>'),
  back: svgI('<path d="m15 6-6 6 6 6"/>'),
  save: svgI('<path d="M5 3h11l3 3v15H5Z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>'),
  wallet: svgI('<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16.5 15h.01"/>'),
  trophy: svgI('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  cog: svgI('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  users: svgI('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>'),
  logout: svgI('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  search: svgI('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  reply: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 11V6.5A2.5 2.5 0 0 1 4.5 4H10M7.5 1.5 10 4 7.5 6.5"/></svg>',
  book: svgI('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
  phone: svgI('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>')
};
