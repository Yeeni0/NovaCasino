/* ---------- apparitions au défilement ---------- */
let revObs = null, revScroll = false, revSafe = null;
function revealCheck() {
  $$(".rv").forEach(e => { if (!e.classList.contains("in") && e.getBoundingClientRect().top < innerHeight * .95) e.classList.add("in"); });
}
function revealInit() {
  if (!revScroll) { revScroll = true; window.addEventListener("scroll", revealCheck, { passive: true }); }
  const els = $$(".rv");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return els.forEach(e => e.classList.add("in"));
  document.body.classList.add("rv-on");
  /* filet de sécurité : rien ne doit rester invisible si le navigateur ne notifie pas */
  clearTimeout(revSafe);
  revSafe = setTimeout(() => { document.body.classList.remove("rv-on"); $$(".rv").forEach(e => e.classList.add("in")); }, 4000);
  if (!revObs) revObs = new IntersectionObserver(en => en.forEach(x => {
    if (x.isIntersecting) { x.target.classList.add("in"); revObs.unobserve(x.target); }
  }), { rootMargin: "0px 0px -6% 0px" });
  els.forEach((e, i) => {
    if (e.getBoundingClientRect().top < innerHeight * .92) { e.style.transitionDelay = Math.min(i * 45, 220) + "ms"; e.classList.add("in"); }
    else revObs.observe(e);
  });
}
/* ---------- routeur ---------- */
function cleanupGame() {
  if (currentGame && typeof currentGame.unmount === "function") { try { currentGame.unmount(); } catch (e) { } }
  Auto.running = false;
  currentGame = null;
}
const Router = {
  leave() { cleanupGame(); Feed.stop(); Draw.stop(); },
  render() {
    const h = location.hash;
    if (h.length > 1 && !h.startsWith("#/")) return;
    this.leave();
    closeMenu();
    if (innerWidth <= 1100) setChat(false);
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const a = parts[0], b = parts[1];
    let nav = "", tab = "home";
    if (a === "jeu" && GAMES[b]) { renderGame(b); nav = GAMES[b].cat === "originals" && !GAMES[b].table ? "originals" : "casino"; tab = "games"; }
    else if (a === "jeux" && [undefined, "", "originals", "casino"].includes(b)) { renderGames(b); nav = b || ""; tab = "games"; }
    else if (a === "tirage" && !b) { Draw.render(); nav = "tirage"; tab = "tirage"; }
    else if (a === "records" && !b) { renderRecords(); nav = "records"; tab = "records"; }
    else if (a === "cookies" && !b) { renderHome(); setTimeout(() => Consent.prefs(), 60); }
    else if (!a) renderHome();
    else { render404(); tab = ""; }
    Seo.page(a, b);
    $$(".nav a").forEach(x => x.classList.toggle("on", x.dataset.nav === nav));
    $$("#tabbar [data-tab]").forEach(x => x.classList.toggle("on", x.dataset.tab === tab));
    window.scrollTo(0, 0);
    const v = $("#view");
    if (this.shown) { v.classList.remove("swap"); void v.offsetWidth; v.classList.add("swap"); }
    this.shown = true;
    revealInit();
  }
};
