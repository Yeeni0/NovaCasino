const CONSENT_MAX_AGE = 182 * 24 * 3600 * 1000;   // on redemande l'avis au bout de 6 mois

/* ---------- mesure d'audience : Plausible, sans cookie, seulement avec accord ---------- */
const Analytics = {
  loaded: false,
  get configured() { return !!SITE.analytics.plausible; },
  allowed() { return this.configured && !!(DB.consent && DB.consent.analytics); },
  enable() {
    if (!this.configured) return;
    try { localStorage.removeItem("plausible_ignore"); } catch (e) { }
    if (this.loaded) return;
    this.loaded = true;
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    const s = document.createElement("script");
    s.defer = true;
    s.src = "https://plausible.io/js/script.hash.js";
    s.setAttribute("data-domain", SITE.analytics.plausible);
    document.head.appendChild(s);
  },
  /* Plausible respecte cette clé : plus aucun envoi après un retrait d'accord */
  disable() { if (this.configured) try { localStorage.setItem("plausible_ignore", "true"); } catch (e) { } },
  track(name, props) { if (this.allowed() && this.loaded && window.plausible) window.plausible(name, props ? { props } : undefined); }
};

/* ---------- consentement ---------- */
const Consent = {
  valid() { const c = DB.consent; return !!(c && Date.now() - c.t < CONSENT_MAX_AGE); },
  init() { if (!this.valid()) this.banner(); this.apply(); },
  apply() { if (Analytics.allowed()) Analytics.enable(); else Analytics.disable(); },
  set(analytics, quiet) {
    DB.consent = { v: 1, analytics: !!analytics && Analytics.configured, t: Date.now() };
    Store.save(true);
    this.hide();
    this.apply();
    if (!quiet) toast(DB.consent.analytics ? "Choix enregistré : mesure d'audience acceptée." : "Choix enregistré.");
  },
  hide() { const b = $("#consent"); if (b) b.remove(); },
  banner() {
    if ($("#consent")) return;
    const el = document.createElement("section");
    el.id = "consent";
    el.className = "consent";
    el.setAttribute("aria-label", "Cookies et confidentialité");
    el.innerHTML = Analytics.configured
      ? `<div class="consent-txt"><b>Ta vie privée d'abord</b><p>Ta partie est enregistrée sur ton appareil, c'est indispensable. Avec ton accord, on mesure aussi l'audience de façon anonyme et sans cookie (Plausible). <a href="confidentialite.html">En savoir plus</a></p></div>
         <div class="consent-act"><button class="btn btn-gray" type="button" data-consent="no">Tout refuser</button><button class="btn btn-ghost" type="button" data-consent="custom">Personnaliser</button><button class="btn btn-gray" type="button" data-consent="yes">Tout accepter</button></div>`
      : `<div class="consent-txt"><b>Zéro cookie publicitaire, zéro traceur</b><p>NovaCasino enregistre seulement ta partie sur ton appareil pour que tu la retrouves. Rien n'est envoyé ailleurs. <a href="confidentialite.html">En savoir plus</a></p></div>
         <div class="consent-act"><button class="btn btn-gray" type="button" data-consent="no">J'ai compris</button></div>`;
    document.body.appendChild(el);
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-consent]");
      if (!b) return;
      if (b.dataset.consent === "custom") return this.prefs();
      this.set(b.dataset.consent === "yes", !Analytics.configured);
    });
  },
  prefs() {
    const on = !!(DB.consent && DB.consent.analytics);
    openModal("Cookies et confidentialité", `
      <p>Tu choisis ce que NovaCasino peut faire. Tu peux changer d'avis à tout moment depuis le pied de page.</p>
      <div class="opt"><div><b>Sauvegarde de la partie</b><small>Indispensable : solde, profils et réglages, stockés uniquement sur ton appareil.</small></div><span class="tag-on">Toujours actif</span></div>
      ${Analytics.configured
        ? `<button class="opt" type="button" id="cAna" role="switch" aria-checked="${on}"><div><b>Mesure d'audience</b><small>Plausible, sans cookie : statistiques anonymes et agrégées.</small></div><span class="sw ${on ? "on" : ""}"></span></button>`
        : `<div class="opt"><div><b>Mesure d'audience</b><small>Aucun outil de mesure n'est installé sur ce site.</small></div><span class="tag-off">Inactif</span></div>`}
      <div class="row"><button class="btn btn-gray" type="button" id="cNo">Tout refuser</button><button class="btn btn-gray" type="button" id="cSave">Enregistrer</button></div>
      <p class="note"><a href="confidentialite.html">Politique de confidentialité</a> · <a href="cgu.html">Conditions d'utilisation</a></p>`);
    let val = on;
    const sw = $("#cAna");
    if (sw) sw.onclick = () => { val = !val; sw.setAttribute("aria-checked", String(val)); sw.querySelector(".sw").classList.toggle("on", val); };
    $("#cNo").onclick = () => { closeModal(); this.set(false); };
    $("#cSave").onclick = () => { closeModal(); this.set(val); };
  }
};

/* ---------- titre et description de chaque page ---------- */
const Seo = {
  set(title, desc) {
    document.title = title;
    const m = document.querySelector('meta[name="description"]');
    if (m && desc) {
      let d = desc.replace(/\s+/g, " ").trim();
      if (d.length > 158) d = d.slice(0, 155).replace(/\s+\S*$/, "") + "…";
      m.setAttribute("content", d);
    }
  },
  page(a, b) {
    const G = GAME_ORDER.length;
    if (a === "jeu" && GAMES[b]) {
      const g = GAMES[b];
      return this.set(`${g.name} gratuit en ligne · NovaCasino`, `Joue à ${g.name} gratuitement, en crédits fictifs. ${g.rules}`);
    }
    if (a === "jeux" && b === "originals") return this.set("NovaOriginals : Dice, Crash, Mines, Plinko… · NovaCasino", "Les jeux maison de NovaCasino : Dice, Crash, Mines, Plinko, Limbo, Keno, Tower, Chicken Road et plus, avec 99 % de retour théorique et des tirages vérifiables.");
    if (a === "jeux" && b === "casino") return this.set("Blackjack, roulette et machine à sous · NovaCasino", "Les classiques du casino en version gratuite : blackjack 3:2, roulette européenne et la machine à sous Nova Fruits, en crédits fictifs.");
    if (a === "jeux") return this.set("Tous les jeux de casino gratuits · NovaCasino", `${G} jeux de casino gratuits, jouables sur ordinateur et téléphone, sans argent réel et sans inscription.`);
    if (a === "tirage") return this.set("Tirage gratuit et roue quotidienne · NovaCasino", "Une roue gratuite toutes les 12 heures, des tickets gagnés en jouant et un grand tirage chaque soir à 20 h. Lots en crédits fictifs, aucun achat.");
    if (a === "records") return this.set("Mes records et ma sauvegarde · NovaCasino", "Tes statistiques, tes meilleurs gains et ta sauvegarde NovaCasino, stockés sur ton appareil.");
    if (a && a !== "cookies") return this.set("Page introuvable · NovaCasino", "Cette page n'existe pas ou plus. Retourne à l'accueil de NovaCasino.");
    return this.set("NovaCasino · Casino gratuit sans argent réel", SITE.desc);
  }
};

/* ---------- modération du chat et des pseudos ---------- */
const Mod = {
  PREFIX: ["connard", "connass", "salope", "salaud", "encul", "batard", "niqu", "negre", "negro", "nigg", "bougnoul", "youpin", "bicot", "chinetoqu", "niakou", "tarlouz", "tapette", "gouine", "pedophil", "fdp", "ntm", "faggot"],
  EXACT: ["pd", "tg", "pute", "putes", "conne", "connes", "raton", "ratons"],
  COMPACT: ["filsdepute", "niquetamere", "connard", "connasse", "salope", "encule", "bougnoule", "nigger", "nigga", "youpin", "tarlouze"],
  norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[0°]/g, "o").replace(/[1!|]/g, "i").replace(/3/g, "e").replace(/[4@]/g, "a").replace(/[5$]/g, "s").replace(/7/g, "t").replace(/€/g, "e");
  },
  bad(token) {
    const w = this.norm(token).replace(/[^a-z]/g, "");
    return !!w && (this.EXACT.includes(w) || this.PREFIX.some(p => w.startsWith(p)));
  },
  /** Masque les mots interdits. text vaut null si le message doit être bloqué. */
  clean(text) {
    let hit = false;
    const out = String(text).split(/(\s+)/).map(t => {
      if (!t.trim() || !this.bad(t)) return t;
      hit = true;
      return t[0] + "*".repeat(Math.max(2, t.length - 1));
    }).join("");
    const compact = this.norm(out).replace(/[^a-z*]/g, "");
    if (this.COMPACT.some(w => compact.includes(w))) return { text: null, hit: true };
    return { text: out, hit };
  },
  okName(name) { const c = this.clean(name); return !c.hit && c.text !== null; }
};

/* ---------- aide aux formulaires : message d'erreur relié au champ ---------- */
function fieldError(input, msg) {
  const field = input.closest(".field");
  if (!field) return;
  const box = input.closest(".inp");
  let e = field.querySelector(".err");
  if (!e) {
    e = document.createElement("p");
    e.className = "err";
    e.id = input.id + "Err";
    e.setAttribute("aria-live", "polite");
    field.appendChild(e);
    input.setAttribute("aria-describedby", [input.getAttribute("aria-describedby"), e.id].filter(Boolean).join(" "));
  }
  e.textContent = msg || "";
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  if (box) box.classList.toggle("bad", !!msg);
}

/* ---------- page introuvable ---------- */
function render404() {
  $("#view").innerHTML = `<div class="wrap"><section class="nf">
    <div class="nf-num" aria-hidden="true">404</div>
    <h1>Cette page s'est fait la malle</h1>
    <p>Le lien est peut-être ancien ou mal recopié. Pas d'inquiétude, tes crédits sont toujours là.</p>
    <a class="btn btn-blue btn-xl" href="#/">Retour à l'accueil</a>
    <p class="note">Ou file directement aux <a href="#/jeux">jeux</a> ou au <a href="#/tirage">tirage gratuit</a>.</p>
  </section></div>`;
}

/* ---------- fenêtre modale : le focus reste dedans ---------- */
document.addEventListener("keydown", e => {
  if (e.key !== "Tab" || !$("#modal").classList.contains("on")) return;
  const f = $$("#modal button, #modal a[href], #modal input, #modal textarea, #modal select")
    .filter(x => !x.disabled && x.tabIndex !== -1 && x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === $("#modal .mbox"))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
