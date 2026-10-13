
/* ---------------------------- démarrage ---------------------------- */
(function () {
  const ORDER = ["dice", "blackjack", "plinko", "crash", "mines", "limbo", "keno", "roulette", "coinflip", "wheel", "tower", "chicken", "slots"];
  GAME_ORDER.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

  Store.load();
  FX.init();
  document.body.classList.toggle("chat-off", !DB.settings.chat);
  renderAuth();
  $("#chatForm").onsubmit = e => e.preventDefault();
  idle(() => Chat.init(), 2500);
  Router.render();
  Draw.init();
  Consent.init();
  Store.save();

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-act]");
    if (!e.target.closest("#menu") && !(el && el.dataset.act === "menu")) closeMenu();
    if (!el) return;
    const a = el.dataset.act;
    if (a !== "menu") closeMenu();
    switch (a) {
      case "menu": openMenu(); break;
      case "logout": switchProfile("guest"); break;
      case "go-records": closeModal(); location.hash = "#/records"; break;
      case "cookies": Consent.prefs(); break;
      case "skip": { const v = $("#view"); v.focus({ preventScroll: true }); v.scrollIntoView(); break; }
      case "go-draw": closeModal(); location.hash = "#/tirage"; break;
      case "close": closeModal(); break;
      case "close-go-games": closeModal(); location.hash = "#/jeux"; break;
      case "rule": {
        const g = GAMES[el.dataset.g];
        if (g) openModal(g.name, `<p>${g.rules}</p><p class="note">Retour théorique : ${String(g.rtp || 99).replace(".", ",")} %. Chaque tirage est vérifiable dans « Équité ».</p>`);
        break;
      }
      default: if (Modals[a]) Modals[a]();
    }
  });
  $("#mClose").onclick = closeModal;
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
  $("#chatToggle").onclick = () => setChat();
  $("#chatClose").onclick = () => setChat(false);
  $("#scrim").onclick = () => setChat(false);
  $("#tabChat").onclick = () => setChat();
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); closeMenu(); if (innerWidth <= 1100) setChat(false); }
  });
  window.addEventListener("hashchange", () => Router.render());
  window.addEventListener("scroll", () => document.body.classList.toggle("scrolled", scrollY > 8), { passive: true });
  window.addEventListener("resize", () => { if (innerWidth > 1100) document.body.classList.remove("chat-open"); });

  /* sauvegarde immédiate quand l'onglet passe en arrière-plan ou se ferme */
  document.addEventListener("visibilitychange", () => { if (document.hidden) Store.save(true); else if (Store.stale) reloadFromStorage(); });
  window.addEventListener("pagehide", () => Store.save(true));
  window.addEventListener("beforeunload", () => Store.save(true));
  /* un autre onglet a joué : on recharge sa sauvegarde au retour sur celui-ci */
  window.addEventListener("storage", e => { if (e.key === SAVE_KEY && document.hidden) Store.stale = true; });
  function reloadFromStorage() {
    Store.stale = false;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      Router.leave();
      DB = sanitizeDB(JSON.parse(raw));
      useProfile(DB.current);
      document.body.classList.toggle("chat-off", !DB.settings.chat);
      refreshAll();
    } catch (err) { }
  }
})();
