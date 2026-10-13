const initials = n => (String(n).trim().replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || "?");
const avatar = (p, cls) => `<span class="avatar ${cls || ""}" style="background:${p.color}">${esc(initials(p.name))}</span>`;

function renderAuth() {
  const p = P(), box = $("#authBox");
  if (p.guest) {
    box.innerHTML = `<button class="btn btn-gray hide-m" data-act="login">Connexion</button><button class="btn btn-blue" data-act="register">Inscription</button>`;
  } else {
    box.innerHTML = `<button class="me-btn" data-act="menu" aria-label="Mon profil">${avatar(p)}</button>`;
  }
  const ci = $("#chatInput");
  if (ci) ci.placeholder = p.guest ? "Crée un profil pour chatter" : "Écris un message…";
  updateBalance();
}
function refreshAll() {
  renderAuth();
  updateBalance();
  Router.render();
}
function switchProfile(id) {
  if (!DB.profiles[id]) return;
  Router.leave();
  useProfile(id);
  Store.save(true);
  closeModal(); closeMenu();
  refreshAll();
  toast(P().guest ? "Tu joues maintenant en invité." : "Bon retour, " + P().name + " !");
}
/* ---------- menu profil ---------- */
function closeMenu() { const m = $("#menu"); if (m) m.remove(); }
function openMenu() {
  if ($("#menu")) return closeMenu();
  const p = P(), lv = levelOf(state.wagered);
  const m = document.createElement("div");
  m.className = "menu on"; m.id = "menu";
  m.innerHTML = `
    <div class="who">${avatar(p)}<div><b>${esc(p.name)}</b><small>${p.guest ? "Profil invité" : "Niveau " + lv.name}</small></div></div>
    ${p.guest ? `<button data-act="register">${IC.users}Créer mon profil</button><button data-act="login">${IC.logout}Connexion</button><hr>` : ""}
    <button data-act="go-records">${IC.trophy}Mes records</button>
    <button data-act="wallet">${IC.wallet}Caisse</button>
    <button data-act="save">${IC.save}Sauvegarde</button>
    <button data-act="settings">${IC.cog}Paramètres</button>
    ${p.guest ? "" : `<hr><button data-act="login">${IC.users}Changer de profil</button><button data-act="logout">${IC.logout}Se déconnecter</button>`}`;
  const host = $(".top-r");
  host.style.position = "relative";
  host.appendChild(m);
}
/* ---------- modales ---------- */
const Modals = {
  wallet() {
    openModal("Caisse", `
      <div class="kv" style="padding:14px"><span>Solde de ${esc(P().name)}</span><div class="big-bal">${COIN}<span class="tnum">${fmt(state.balance)}</span></div></div>
      <p>Ici, pas de dépôt ni de retrait : les crédits sont fictifs et n'ont aucune valeur. À court ? Recharge-toi, c'est gratuit.</p>
      <button class="btn btn-blue btn-block" id="wTop">Recharger 1 000 crédits</button>
      <p class="note">Recharges effectuées sur ce profil : <b>${state.refills}</b>. Elles apparaissent dans tes statistiques.</p>
      <button class="btn btn-gray btn-block" data-act="save">${IC.save}Gérer ma sauvegarde</button>`);
    $("#wTop").onclick = () => {
      state.balance = round2(state.balance + 1000); state.refills++;
      Store.save(); FX.countTo(state.balance, 600); FX.sCoin();
      closeModal(); toast("1 000 crédits ajoutés.");
    };
  },
  save() {
    const p = P();
    openModal("Sauvegarde", `
      <div class="kv"><span>Profil</span><div style="display:flex;align-items:center;gap:10px;margin-top:4px">${avatar(p, "sm")}<b style="font:600 14px var(--f);color:var(--text)">${esc(p.name)}</b></div></div>
      <p>${Store.ok ? "<b>Sauvegarde automatique activée.</b> Solde, statistiques et historique sont enregistrés dans ce navigateur après chaque partie."
        : "<b>Ce navigateur bloque l'enregistrement</b> (navigation privée ?). Exporte ta progression pour ne pas la perdre."}</p>
      <h5>Exporter</h5>
      <p>Pour passer du PC au téléphone (ou garder une copie), copie ce code ou télécharge le fichier, puis importe-le sur l'autre appareil.</p>
      <div class="row"><button class="btn btn-gray" id="sCopy">Copier le code</button><button class="btn btn-gray" id="sFile">Télécharger</button></div>
      <textarea class="code hidden" id="sCode" readonly></textarea>
      <h5>Importer</h5>
      <textarea class="code" id="sIn" placeholder="Colle ici un code NOVA1-…"></textarea>
      <div class="row"><button class="btn btn-blue" id="sImport">Importer le code</button><button class="btn btn-gray" id="sPick">Choisir un fichier</button></div>
      <input type="file" id="sFileIn" accept=".json,application/json,text/plain" class="hidden">
      <p class="note">L'import restaure le profil sauvegardé sur cet appareil (il remplace un profil du même nom).</p>
      <h5>Recommencer</h5>
      <button class="btn btn-red btn-block" id="sReset">Remettre ce profil à zéro</button>`);
    const code = exportCode(p);
    $("#sCopy").onclick = async () => {
      Analytics.track("Export sauvegarde");
      const t = $("#sCode");
      t.value = code; t.classList.remove("hidden");
      let ok = false;
      try { await navigator.clipboard.writeText(code); ok = true; } catch (e) {
        try { t.select(); ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      }
      toast(ok ? "Code copié dans le presse-papiers." : "Sélectionne le code et copie-le.", !ok);
    };
    $("#sFile").onclick = () => {
      try {
        const blob = new Blob([JSON.stringify(exportData(p), null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "novacasino-" + p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      } catch (e) { toast("Téléchargement impossible ici : utilise « Copier le code ».", true); }
    };
    const doImport = text => {
      try {
        const src = parseSave(text);
        Router.leave();
        const np = importProfile(src);
        useProfile(np.id);
        Store.save(true);
        closeModal(); refreshAll();
        toast("Sauvegarde de " + np.name + " importée.");
      } catch (e) { toast(e.message, true); }
    };
    $("#sImport").onclick = () => doImport($("#sIn").value);
    $("#sPick").onclick = () => $("#sFileIn").click();
    $("#sFileIn").onchange = e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => doImport(rd.result);
      rd.readAsText(f);
    };
    let armed = false;
    $("#sReset").onclick = e => {
      if (!armed) { armed = true; e.target.textContent = "Confirmer : tout effacer sur ce profil"; return; }
      Router.leave();
      p.state = newState(); p.fair = newFair();
      useProfile(p.id); Store.save(true);
      closeModal(); refreshAll(); toast("Profil remis à zéro.");
    };
  },
  fair() {
    openModal("Équité vérifiable", `
      <p>Chaque résultat sort d'un générateur déterministe alimenté par trois valeurs : la graine serveur (cachée), ta graine client et un compteur (nonce). L'empreinte publiée à l'avance prouve que la graine serveur n'a pas changé ; elle est révélée quand tu en changes.</p>
      <div class="kv"><span>Empreinte de la graine serveur</span><b>${serverHash()}</b></div>
      <div class="kv"><span>Graine client (modifiable)</span><input id="fClient" value="${esc(fair.client)}" maxlength="64" aria-label="Graine client"></div>
      <div class="kv"><span>Nonce (paris joués avec ces graines)</span><b>${fair.nonce}</b></div>
      <button class="btn btn-blue btn-block" id="fRotate">Changer de graines</button>`);
    $("#fRotate").onclick = () => {
      const old = fair.server;
      fair.client = ($("#fClient").value.trim() || randStr(16)).slice(0, 64);
      fair.server = randStr(48); fair.nonce = 0;
      Store.save();
      openModal("Graines changées", `
        <div class="kv"><span>Ancienne graine serveur (révélée)</span><b>${old}</b></div>
        <div class="kv"><span>Nouvelle empreinte serveur</span><b>${serverHash()}</b></div>
        <div class="kv"><span>Graine client</span><b>${esc(fair.client)}</b></div>
        <button class="btn btn-gray btn-block" data-act="close">Fermer</button>`);
    };
  },
  login() {
    const list = Object.values(DB.profiles).sort((a, b) => (a.guest - b.guest) || a.created - b.created);
    openModal("Connexion", `
      <p>Les profils sont enregistrés sur cet appareil. Choisis le tien :</p>
      <div class="plist">${list.map(p => `<button class="p ${p.id === DB.current ? "cur" : ""}" data-pid="${p.id}">${avatar(p)}
        <div><b>${esc(p.name)}</b><small>${COIN.replace('class="coin-i"', 'class="coin-i" style="width:12px;height:12px;display:inline;vertical-align:-1px"')} ${fmt(p.state.balance)} · ${p.state.count} paris</small></div>
        ${p.id === DB.current ? '<span class="tag">Actuel</span>' : ""}</button>`).join("")}</div>
      <div class="divider">ou</div>
      <div class="row"><button class="btn btn-blue" data-act="register">Créer un profil</button><button class="btn btn-gray" data-act="save">Importer</button></div>`);
    $$("#mBody [data-pid]").forEach(b => b.onclick = () => { if (b.dataset.pid !== DB.current) switchProfile(b.dataset.pid); else closeModal(); });
  },
  register() {
    const g = P();
    const canKeep = g.guest && (g.state.count > 0 || g.state.balance !== START_BALANCE);
    const opened = Date.now();
    let color = pick(AV_COLORS), tried = false;
    openModal("Créer mon profil", `
      <p>Pas d'e-mail ni de mot de passe : ton profil et ta progression restent sur cet appareil.</p>
      <form id="rForm" novalidate style="display:flex;flex-direction:column;gap:14px">
        <div class="field"><label class="lbl" for="rName">Pseudo</label>
          <div class="inp"><input id="rName" name="pseudo" maxlength="16" minlength="3" required autocomplete="nickname" autocapitalize="off" spellcheck="false" aria-describedby="rHelp"></div>
          <p class="help" id="rHelp">3 à 16 caractères : lettres, chiffres, espaces, points ou tirets.</p></div>
        <div class="hp" aria-hidden="true"><label for="rWeb">Ne pas remplir</label><input id="rWeb" name="website" tabindex="-1" autocomplete="off"></div>
        <fieldset class="field"><legend class="lbl">Couleur de l'avatar</legend>
          <div class="swatches" id="rCol">${AV_COLORS.map((c, i) => `<button type="button" style="background:${c}" data-c="${c}" aria-label="Couleur ${i + 1}" aria-pressed="${c === color}"></button>`).join("")}</div></fieldset>
        ${canKeep ? `<button class="opt" id="rKeepB" type="button" role="switch" aria-checked="true"><div><b>Garder ma progression d'invité</b><small>${fmt(g.state.balance)} crédits · ${g.state.count} paris</small></div><span class="sw on" id="rKeep"></span></button>` : ""}
        <button class="btn btn-blue btn-block" type="submit">Créer mon profil</button>
        <p class="note">En créant un profil, tu acceptes les <a href="cgu.html">conditions d'utilisation</a> et confirmes avoir 18 ans ou plus.</p>
      </form>`);
    $$("#rCol button").forEach(b => b.onclick = () => { color = b.dataset.c; $$("#rCol button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
    if (canKeep) $("#rKeepB").onclick = () => { const on = $("#rKeep").classList.toggle("on"); $("#rKeepB").setAttribute("aria-checked", String(on)); };
    const inp = $("#rName");
    setTimeout(() => inp.focus(), 60);
    const clean = () => inp.value.trim().replace(/\s+/g, " ");
    const check = () => {
      const name = clean();
      if (name.length < 3) return "Ton pseudo doit contenir au moins 3 caractères.";
      if (!/^[\p{L}\p{N}_.\- ]{3,16}$/u.test(name)) return "Utilise seulement des lettres, chiffres, espaces, points ou tirets.";
      if (/^invit/i.test(name) || !Mod.okName(name)) return "Ce pseudo n'est pas autorisé, choisis-en un autre.";
      if (Object.values(DB.profiles).some(p => p.name.toLowerCase() === name.toLowerCase())) return "Ce pseudo est déjà pris sur cet appareil.";
      return "";
    };
    inp.addEventListener("input", () => { if (tried) fieldError(inp, check()); });
    inp.addEventListener("blur", () => { if (inp.value) { tried = true; fieldError(inp, check()); } });
    $("#rForm").onsubmit = e => {
      e.preventDefault();
      /* piège à robots : champ invisible rempli ou envoi instantané */
      if ($("#rWeb").value || Date.now() - opened < 700) { closeModal(); return; }
      tried = true;
      const err = check();
      fieldError(inp, err);
      if (err) { inp.focus(); return; }
      const name = clean();
      Router.leave();
      const np = newProfile(name, color, false);
      if (canKeep && $("#rKeep").classList.contains("on")) {
        np.state = g.state; np.fair = g.fair;
        g.state = newState(); g.fair = newFair();
      }
      DB.profiles[np.id] = np;
      useProfile(np.id);
      Store.save(true);
      closeModal(); refreshAll();
      toast("Bienvenue, " + name + " !");
      Chat.welcome(name);
      Analytics.track("Inscription");
    };
  },
  settings() {
    const S = DB.settings;
    const row = (k, t, d) => `<button class="opt" data-set="${k}" type="button" role="switch" aria-checked="${S[k]}"><div><b>${t}</b><small>${d}</small></div><span class="sw ${S[k] ? "on" : ""}"></span></button>`;
    openModal("Paramètres", `
      ${row("sound", "Sons", "Effets sonores des jeux")}
      ${row("fx", "Animations", "Pièces, confettis et compteurs animés")}
      ${row("vib", "Vibrations", "Retour haptique sur téléphone")}
      ${row("chat", "Chat ouvert", "Afficher le chat sur grand écran")}
      <p class="note">Les paramètres sont enregistrés avec ta sauvegarde.</p>`);
    $$("#mBody [data-set]").forEach(b => b.onclick = () => {
      const k = b.dataset.set;
      S[k] = !S[k];
      b.querySelector(".sw").classList.toggle("on", S[k]);
      b.setAttribute("aria-checked", String(S[k]));
      if (k === "chat") document.body.classList.toggle("chat-off", !S.chat);
      if (k === "sound") { paintSound(); if (S.sound) FX.sCoin(); }
      Store.save();
    });
  },
  about() {
    openModal("C'est quoi NovaCasino ?", `
      <p><b>Un casino pour le plaisir du jeu, sans argent.</b> ${GAME_ORDER.length} jeux, un seul solde de crédits fictifs, et des tirages que tu peux vérifier.</p>
      <ul><li>Retour théorique affiché sur chaque jeu (99 % pour les Originals).</li><li>Aucun dépôt, aucun retrait, aucune publicité.</li><li>Ta progression est sauvegardée sur ton appareil et exportable.</li><li>Jouable sur ordinateur comme sur téléphone.</li></ul>
      <button class="btn btn-blue btn-block" data-act="close-go-games">Voir les jeux</button>`);
  },
  nobonus() {
    openModal("Pourquoi pas de bonus", `
      <p>Les « bonus de bienvenue » des casinos sont presque toujours assortis de conditions de mise qui te font rejouer ton argent des dizaines de fois avant de pouvoir le retirer.</p>
      <p>Ici on préfère un avantage maison minimal et affiché, et des crédits gratuits à volonté. <b>Pas de piège, pas de petites lignes.</b></p>`);
  },
  rules() {
    openModal("Règles des jeux", GAME_ORDER.map(id => {
      const g = GAMES[id];
      return `<div style="display:flex;gap:12px;align-items:flex-start"><span style="width:38px;height:38px;border-radius:9px;overflow:hidden;flex:0 0 auto;display:block;background:${ART.bgCSS(id)}">${ART.svg(id, true)}</span>
        <div><h5 style="margin:0">${g.name} <span style="color:var(--dim);font-weight:500">· ${g.rtp || 99} %</span></h5><p>${g.rules}</p></div></div>`;
    }).join(""));
  },
  install() {
    openModal("Jouer sur téléphone", `
      <p>NovaCasino s'adapte à l'écran du téléphone. Pour l'avoir comme une appli, ouvre le site sur ton téléphone puis :</p>
      <h5>iPhone (Safari)</h5><p>Touche <b>Partager</b>, puis <b>Sur l'écran d'accueil</b>.</p>
      <h5>Android (Chrome)</h5><p>Touche le menu <b>⋮</b>, puis <b>Ajouter à l'écran d'accueil</b>.</p>
      <h5>Garder sa progression</h5><p>Chaque navigateur a sa propre sauvegarde. Pour continuer sur le téléphone ce que tu as commencé sur l'ordinateur, exporte ton code puis importe-le de l'autre côté.</p>
      <button class="btn btn-gray btn-block" data-act="save">${IC.save}Exporter / importer</button>`);
  },
  responsible() {
    openModal("Jeu responsable", `
      <p>NovaCasino n'utilise que des crédits fictifs, mais les mécaniques sont celles des vrais jeux d'argent : sur la durée, <b>la maison gagne toujours</b>.</p>
      <ul><li>Fixe-toi une durée de jeu et fais des pauses.</li><li>Ne cherche jamais à « te refaire ».</li><li>Si tu joues de l'argent réel ailleurs, n'y mets que ce que tu peux perdre.</li></ul>
      <p>Besoin d'aide ou de conseils ? <b>Joueurs Info Service</b> : 09 74 75 13 13, appel non surtaxé, 7 j/7.</p>`);
  }
};
/* ---------- son ---------- */
function paintSound() {
  const b = $("#sndBtn");
  if (b) {
    b.innerHTML = (DB.settings.sound ? IC.sound : IC.mute) + '<span class="hide-s">Son</span>';
    b.setAttribute("aria-label", DB.settings.sound ? "Couper le son" : "Activer le son");
    b.setAttribute("aria-pressed", String(DB.settings.sound));
  }
}

