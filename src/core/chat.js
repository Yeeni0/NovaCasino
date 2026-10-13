/* =====================================================================
   Chat (messages simulés + messages du joueur)
   ===================================================================== */
const Chat = {
  BOTS: ["Kazou", "milo_22", "chatnoir", "Rinrin", "Vexx", "alto", "nyx", "BrunoLeBoss", "sashaa", "0xLeo", "Tamago", "ZedZed", "poppy", "Inès", "kobe93",
    "Lyra", "nano", "Rui", "Sven", "uma", "wakko", "yuki", "Maëlys", "theo.b", "Jojo", "Pistache", "Lenny", "ElCapitan", "Sofiane", "Marius"],
  LINES: [
    ["keno en risque faible ou moyen ?", ["moyen", "élevé si t'es joueur", "faible pour durer"]],
    ["vous mettez combien de mines ?", ["3", "5 et j'encaisse après 3 cases", "1 seule, je suis prudent", "24 pour le frisson"]],
    ["qqn a déjà sorti le 1000× au plinko ?", ["jamais vu", "une fois en 16 rangées", "on en rêve tous"]],
    ["c'est quoi le meilleur jeu pour débuter ?", ["le dice, c'est simple", "blackjack si tu connais la stratégie de base", "pile ou face"]],
    ["quelqu'un sur la roulette ?", ["moi, tout sur le 17", "je joue que rouge/noir", "le 0 m'a encore eu"]],
    ["au crash vous encaissez à combien ?", ["2× et pas plus", "je vise 10×, je perds souvent", "1.5× en auto"]],
    ["chicken road en difficile, ça vaut le coup ?", ["non", "si tu cash vite oui", "le poulet finit toujours écrasé"]],
    ["vous jouez sur téléphone ou PC ?", ["téléphone", "PC le soir, tel la journée", "tel, ça passe nickel"]],
    ["split les 8 ou pas ?", ["toujours", "toujours split les 8", "jamais les 10 par contre"]],
    ["tower en expert, c'est jouable ?", ["pas pour moi", "2 étages et je sors", "c'est de la folie"]],
    ["3 mines c'est le bon réglage"], ["chicken road m'a lâché à la 9e voie"], ["je cash toujours à 2× au crash, pas de héros"],
    ["gg"], ["gg wp"], ["le blackjack tourne bien ce soir"], ["croupier qui sort 21 trois fois de suite…"], ["rouge rouge rouge noir, classique"],
    ["bonsoir le chat"], ["yo"], ["dice sous 10, grosse cote"], ["plinko 16 rangées risque élevé, pour les courageux"], ["je reste en faible, j'aime quand ça dure"],
    ["la roue en risque élevé c'est tout ou rien"], ["encaissé à 3.2× au crash, ça me va"], ["le poulet a traversé 12 voies, respect"],
    ["j'ai oublié d'encaisser aux mines, erreur de débutant"], ["mode auto sur le dice, je vais me faire un café"], ["série de 6 au pile ou face"],
    ["la machine à sous est sympa"], ["trois 7 sur la machine, enfin"], ["keno 10 numéros, 7 bons, je prends"], ["vérifiez vos graines dans Équité, c'est transparent"],
    ["petite série de pertes, je fais une pause"], ["pause café, à tout'"], ["bien joué à tous"], ["le crash est monté à 87× et j'étais pas dedans"],
    ["ça tourne"], ["limbo cible 2× en auto, stratégie de mamie"], ["doublé sur 11, sorti une figure, parfait"], ["je remonte doucement"],
    ["c'est calme ce soir"], ["wheel risque moyen, régulier"], ["10 mines, 2 cases, j'encaisse, merci"], ["trop tôt pour cash… et crash à 1.01×"],
    ["rip"], ["haha"], ["c'est parti"], ["allez un dernier"], ["le dernier c'est jamais le dernier"], ["mdr"], ["record perso battu"]
  ],
  REACT: ["gg", "haha", "pareil", "respect", "grave", "c'est la vie", "moi aussi", "bien vu"],
  online: 1180 + Math.floor(Math.random() * 180),
  timer: null, lastMe: 0,
  init() {
    const now = Date.now();
    for (let i = 0; i < 14; i++) this.bot(true);
    this.loop();
    setInterval(() => {
      this.online = clamp(this.online + Math.round((Math.random() - .5) * 14), 900, 1900);
      const o = $("#onlineTxt"); if (o) o.textContent = this.online.toLocaleString("fr-FR") + " en ligne";
    }, 4000);
    $("#chatForm").onsubmit = e => { e.preventDefault(); this.send(); };
    $("#chatInput").addEventListener("focus", () => { if (P().guest) { $("#chatInput").blur(); Modals.register(); } });
    $("#chatPin button").onclick = () => { DB.settings.pin = false; $("#chatPin").remove(); Store.save(); };
    if (!DB.settings.pin) $("#chatPin").remove();
    void now;
  },
  loop() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (!document.hidden) this.bot(); this.loop(); }, 2600 + Math.random() * 4200);
  },
  add(html, cls) {
    const list = $("#chatList");
    if (!list) return;
    const stick = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    const el = document.createElement("div");
    el.className = "msg" + (cls ? " " + cls : "");
    el.innerHTML = html;
    list.appendChild(el);
    while (list.children.length > 70) list.firstElementChild.remove();
    if (stick) list.scrollTop = list.scrollHeight;
  },
  line(user, text, quote, me) {
    const q = quote ? `<div class="q">${IC.reply}<b>@${esc(quote.u)}:</b> ${esc(quote.t)}</div>` : "";
    this.add(`${q}<span class="u">${esc(user)}</span>: ${esc(text)}`, me ? "me" : "");
  },
  recent: [],
  bot(silent) {
    const r = Math.random();
    if (r < .09 && !silent) {
      const g = GAMES[pick(GAME_ORDER)], m = pick([12, 18, 25, 40, 64, 110, 250]) * (1 + Math.random());
      const amt = pick([1, 2, 5, 10, 20, 50]) * m;
      this.add(`<span class="u">${esc(pick(this.BOTS))}</span> vient de gagner <span class="g">+${fmt(amt)}</span> sur ${g.name} (${fmtMult(m)})`, "win");
      return;
    }
    const u = pick(this.BOTS);
    if (r < .3 && this.recent.length) {
      const q = pick(this.recent);
      if (q.u !== u) { this.line(u, pick(this.REACT), q); return; }
    }
    const [t, answers] = pick(this.LINES);
    this.line(u, t);
    this.recent.push({ u, t }); if (this.recent.length > 8) this.recent.shift();
    if (answers) {
      const later = () => { let a = pick(this.BOTS); if (a === u) a = pick(this.BOTS); this.line(a, pick(answers), { u, t }); };
      if (silent) later(); else setTimeout(later, 1800 + Math.random() * 3500);
    }
  },
  sent: [], muteUntil: 0,
  send() {
    const p = P(), inp = $("#chatInput");
    if (p.guest) return Modals.register();
    const now = Date.now();
    let t = inp.value.replace(/[\u0000-\u001f\u007f]/g, "").trim().replace(/\s+/g, " ").slice(0, 160);
    if (!t) return;
    /* anti-spam : cadence, rafales, doublons, liens et coordonnées */
    if (now < this.muteUntil) return toast(`Anti-spam : réessaie dans ${Math.ceil((this.muteUntil - now) / 1000)} s.`, true);
    if (now - this.lastMe < 1500) return toast("Doucement, un message à la fois.", true);
    this.sent = this.sent.filter(x => now - x.t < 20000);
    if (this.sent.length >= 4) { this.muteUntil = now + 30000; return toast("Trop de messages d'affilée : chat en pause 30 secondes.", true); }
    if (/(https?:\/\/|www\.|discord\.gg|\b[a-z0-9-]{2,}\.(com|fr|net|org|io|gg|xyz|ru|me|ly|tk|be|ch|co|app)\b)/i.test(t)) return toast("Les liens sont désactivés dans le chat.", true);
    if (/(\d[\s.-]?){9,}/.test(t) || /[\w.+-]+@[\w-]+\.\w+/.test(t)) return toast("Ne partage ni numéro ni adresse e-mail dans le chat.", true);
    t = t.replace(/(.)\1{4,}/g, "$1$1$1");
    const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
    if (letters.length >= 8 && letters.replace(/[^A-ZÀ-Þ]/g, "").length / letters.length > .7) t = t.charAt(0) + t.slice(1).toLowerCase();
    const key = Mod.norm(t).replace(/[^a-z0-9]/g, "");
    if (this.sent.some(x => x.k === key)) return toast("Évite d'envoyer deux fois le même message.", true);
    const c = Mod.clean(t);
    if (c.text === null) return toast("Message bloqué : les insultes et propos haineux sont interdits.", true);
    if (c.hit) toast("Certains mots ont été masqués.", true);
    t = c.text;
    this.lastMe = now;
    this.sent.push({ t: now, k: key });
    inp.value = "";
    this.line(p.name, t, null, true);
    const l = $("#chatList"); l.scrollTop = l.scrollHeight;
    if (Math.random() < .6) setTimeout(() => {
      const ans = /\?\s*$/.test(t) ? ["bonne question", "aucune idée", "oui", "non, jamais", "ça dépend de ta mise"] : ["salut " + p.name, "gg", "haha", "bien vu", "tu joues à quoi ?", "yo"];
      this.line(pick(this.BOTS), pick(ans), { u: p.name, t });
    }, 1500 + Math.random() * 3000);
  },
  welcome(name) {
    setTimeout(() => this.line(pick(this.BOTS), "bienvenue " + name + " !"), 1400);
  },
  react(rec) {
    const p = P();
    if (p.guest || rec.mult < 10 || rec.payout - rec.amount <= 0) return;
    this.add(`<span class="u" style="color:var(--gold)">${esc(p.name)}</span> vient de gagner <span class="g">+${fmt(rec.payout - rec.amount)}</span> sur ${GAMES[rec.game].name} (${fmtMult(rec.mult)})`, "win");
    if (Math.random() < .8) setTimeout(() => this.line(pick(this.BOTS), pick(["gg " + p.name, "joli " + p.name + " !", "gg, " + fmtMult(rec.mult) + " propre", "bien joué"])), 1200 + Math.random() * 2000);
  }
};
function setChat(open) {
  if (innerWidth > 1100) {
    DB.settings.chat = open === undefined ? !DB.settings.chat : open;
    document.body.classList.toggle("chat-off", !DB.settings.chat);
    document.body.classList.remove("chat-open");
    Store.save();
  } else {
    const on = open === undefined ? !document.body.classList.contains("chat-open") : open;
    document.body.classList.toggle("chat-open", on);
    const t = $("#tabChat"); if (t) t.classList.toggle("on", on);
    if (on) { const l = $("#chatList"); l.scrollTop = l.scrollHeight; }
  }
}
