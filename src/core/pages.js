/* ---------- cartes ---------- */
function cardHTML(id) {
  const g = GAMES[id];
  return `<a class="gcard" href="#/jeu/${id}" aria-label="${g.name}">
    <div class="art" style="background:${ART.bgCSS(id)}">${ART.svg(id)}</div>
    <span class="rtp">${String(g.rtp || 99).replace(".", ",")} % RTP</span>${g.isNew ? '<span class="new">NOUVEAU</span>' : ""}
    <span class="nm">${g.name}</span><span class="by">${g.cat === "slots" ? "Nova Machines" : "NovaOriginals"}</span></a>`;
}
/* ---------- illustration du héros ---------- */
function heroScene() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = ["", "", ""];
  for (let i = 0; i < 90; i++) stars[i % 3] += `<circle cx="${(rnd() * 1440).toFixed(0)}" cy="${(rnd() * 300).toFixed(0)}" r="${(0.6 + rnd() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  const tower = (x, y, w, h, c, lit) => {
    let win = "";
    for (let r = y + 14; r < y + h - 10; r += 14) for (let k = x + 8; k < x + w - 10; k += 12) if (rnd() < lit) win += `<rect x="${k}" y="${r}" width="5" height="7" rx="1" fill="#ffd36b" opacity="${(0.55 + rnd() * .45).toFixed(2)}"/>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>${win}`;
  };
  return `<svg class="scene" viewBox="0 0 1440 470" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15123f"/><stop offset=".55" stop-color="#2e2673"/><stop offset="1" stop-color="#553a9a"/></linearGradient>
      <radialGradient id="hMoon"><stop offset="0" stop-color="#ffe9b8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe9b8" stop-opacity="0"/></radialGradient></defs>
    <rect width="1440" height="470" fill="url(#hSky)"/><g class="stars">${stars.map(s => `<g>${s}</g>`).join("")}</g>
    <circle cx="1140" cy="118" r="150" fill="url(#hMoon)"/><circle cx="1140" cy="118" r="58" fill="#ffe9b8"/><circle cx="1122" cy="104" r="11" fill="#f3d79a"/><circle cx="1158" cy="136" r="7" fill="#f3d79a"/>
    <path d="M0 330 140 262 260 300 400 236 560 296 700 250 860 292 1010 238 1160 290 1300 246 1440 280V470H0Z" fill="#3a2d80"/>
    <path d="M0 360 180 318 330 350 520 312 720 346 900 314 1080 348 1260 318 1440 340V470H0Z" fill="#2c2468"/>
    <g>${tower(250, 176, 70, 190, "#231d58", .5)}${tower(318, 128, 86, 238, "#1e1950", .55)}${tower(402, 196, 60, 170, "#231d58", .45)}
      <path d="M361 128v-34M346 128l15-26 15 26Z" fill="#1e1950" stroke="#1e1950" stroke-width="4"/><circle cx="361" cy="90" r="4" fill="#ff5fa2"/>
      <rect x="322" y="146" width="78" height="24" rx="5" fill="#15123f"/><text x="361" y="164" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-weight="900" font-size="16" fill="#ff7ab8" letter-spacing="2">NOVA</text></g>
    <g transform="rotate(12 1090 300)"><rect x="1040" y="206" width="104" height="146" rx="12" fill="#efeaff"/><rect x="1040" y="206" width="104" height="146" rx="12" fill="none" stroke="#c9bfff" stroke-width="3"/>
      <text x="1058" y="244" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="30" fill="#221b55">A</text>
      <path d="M1092 262c13 12 24 20 24 32a12 12 0 0 1-22 6l4 13h-12l4-13a12 12 0 0 1-22-6c0-12 11-20 24-32Z" fill="#221b55"/></g>
    <g class="fl1"><g transform="translate(560 214) rotate(-14)"><ellipse rx="30" ry="10" cy="8" fill="#b52f6a"/><ellipse rx="30" ry="10" fill="#ff5fa2"/><ellipse rx="15" ry="5" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="5 5"/></g></g>
    <g class="fl2"><g transform="translate(900 176) rotate(18)"><ellipse rx="22" ry="8" cy="6" fill="#3a44c9"/><ellipse rx="22" ry="8" fill="#6f79ff"/><ellipse rx="11" ry="4" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="4 4"/></g></g>
    <g class="fl3"><g transform="translate(1260 360)"><ellipse rx="44" ry="12" cy="22" fill="#c47a00"/><ellipse rx="44" ry="12" cy="12" fill="#ffc53d"/><ellipse rx="44" ry="12" cy="2" fill="#e39a12"/><ellipse rx="44" ry="12" cy="-8" fill="#ffc53d"/></g></g>
    <path d="M0 404 220 380 420 400 640 372 820 396 1040 370 1240 394 1440 376V470H0Z" fill="#1d1848"/>
    <path d="M690 470C700 430 720 400 760 372" stroke="#3b3480" stroke-width="26" fill="none" stroke-linecap="round"/>
  </svg>`;
}
/* ---------- pages ---------- */
function renderHome() {
  const p = P(), last = state.myBets[0], ready = Draw.freeReady();
  const mainHref = ready ? "#/tirage" : `#/jeu/${last ? last.game : "dice"}`;
  const mainTxt = ready ? "Tourner ma roue gratuite" : last ? "Reprendre " + GAMES[last.game].name : "Jouer gratuitement";
  const cta = `<a class="btn btn-blue btn-xl" href="${mainHref}">${mainTxt}</a>` +
    (p.guest ? `<button class="linkish" type="button" data-act="register">ou crée ton profil en 10 secondes</button>` : "");
  const originals = GAME_ORDER.filter(id => GAMES[id].cat === "originals");
  const live = `${Chat.online.toLocaleString("fr-FR")} joueurs en ligne`;
  const view = $("#view"), pre = view.querySelector(".hero[data-static]");
  const rest = `
  <div class="wrap">
    <section class="sec rv" style="margin-top:14px">${Draw.homeBanner()}</section>
    <section class="sec rv"><div class="sec-h"><h2><em>Nova</em>Originals</h2><a class="more hide-m" href="#/jeux/originals">Tout voir</a></div>
      <div class="cards">${originals.map(cardHTML).join("")}</div></section>
    <section class="sec rv"><a class="promo" href="#/jeu/slots">
      <div class="pt-txt"><small>NOUVEAU</small><h2>Nova Fruits</h2><p>La machine à sous maison : 3 rouleaux, 5 lignes, et le triple 7 qui paie 60× la mise.</p><span class="btn">Essayer</span></div>
      <div class="pa">${ART.svg("slots", true)}</div></a></section>
    <section class="sec rv"><div class="feat">
      <div>${IC.shield}<b>Vérifiable</b><p>Chaque tirage vient de tes graines. Change-les quand tu veux.</p></div>
      <div>${IC.save}<b>Sauvegardé</b><p>Ta progression reste sur ton appareil et s'exporte en un code.</p></div>
      <div>${IC.phone}<b>Sur téléphone</b><p>Tous les jeux sont jouables au doigt, en plein écran.</p></div>
      <div>${IC.wallet}<b>Zéro euro</b><p>Crédits fictifs et gratuits. Aucun paiement, jamais.</p></div></div></section>
    <section class="sec rv">${Feed.html()}</section>
    <section class="foot-cta rv"><div><h2>${ready ? "Ta roue gratuite t'attend" : "Prêt pour une partie ?"}</h2>
      <p>Une rotation offerte toutes les 12 h, des tickets pour le grand tirage de 20 h, et toujours zéro euro à sortir.</p></div>
      <a class="btn btn-blue btn-xl" href="${mainHref}">${mainTxt}</a></section>
  </div>`;
  /* premier affichage : le héros est déjà dans le HTML, on ne le redessine pas */
  if (pre) {
    pre.removeAttribute("data-static");
    pre.querySelector(".cta").innerHTML = cta;
    const l = pre.querySelector(".live");
    if (l && l.lastChild) l.lastChild.nodeValue = live;
    [...view.children].forEach(c => { if (c !== pre) c.remove(); });
    pre.insertAdjacentHTML("afterend", rest);
  } else {
    view.innerHTML = `<section class="hero">${heroScene()}<div class="hero-txt"><span class="live"><i class="dot"></i>${live}</span><h1>Le casino qui ne te prend<br>pas pour un pigeon.</h1><p>Du jeu à l'état pur : pas d'argent réel, pas de bonus piège, des tirages vérifiables.</p><div class="cta">${cta}</div></div></section>` + rest;
  }
  Feed.mount();
}
function renderGames(filter) {
  filter = ["originals", "casino"].includes(filter) ? filter : "all";
  $("#view").innerHTML = `<div class="wrap">
    <div class="ph"><h1>${filter === "originals" ? "NovaOriginals" : filter === "casino" ? "Casino" : "Tous les jeux"}</h1>
      <label class="search">${IC.search}<input id="gSearch" placeholder="Rechercher un jeu" aria-label="Rechercher un jeu"></label></div>
    <div class="chips" id="gChips" style="margin-bottom:16px">
      <button data-f="all">Tous</button><button data-f="originals">Originals</button><button data-f="casino">Tables & machines</button></div>
    <div class="cards" id="gGrid"></div>
    <section class="sec rv">${Feed.html()}</section></div>`;
  const draw = () => {
    const q = $("#gSearch").value.trim().toLowerCase();
    const ids = GAME_ORDER.filter(id => {
      const g = GAMES[id];
      const okF = filter === "all" || (filter === "originals" ? g.cat === "originals" : (g.table || g.cat === "slots"));
      return okF && (!q || g.name.toLowerCase().includes(q));
    });
    $("#gGrid").innerHTML = ids.length ? ids.map(cardHTML).join("") : "";
    if (!ids.length) $("#gGrid").insertAdjacentHTML("afterend", "");
    $("#gGrid").style.display = ids.length ? "" : "none";
    let e = $("#gEmpty");
    if (!ids.length && !e) $("#gGrid").insertAdjacentHTML("afterend", `<div class="empty" id="gEmpty">Aucun jeu ne correspond.</div>`);
    if (ids.length && e) e.remove();
  };
  $$("#gChips button").forEach(b => {
    b.classList.toggle("on", b.dataset.f === filter);
    b.onclick = () => { location.hash = b.dataset.f === "all" ? "#/jeux" : "#/jeux/" + b.dataset.f; };
  });
  $("#gSearch").oninput = draw;
  draw();
  Feed.mount();
}
function renderRecords() {
  const p = P(), s = state, lv = levelOf(s.wagered);
  const rate = s.count ? Math.round(s.wins / s.count * 100) : 0;
  const net = s.profit;
  const betRow = r => `<tr><td><a class="gm" href="#/jeu/${r.game}">${ART.icon(r.game)}${GAMES[r.game] ? GAMES[r.game].name : r.game}</a></td>
    <td class="hide-m" style="color:var(--dim)">${ago(r.t)}</td><td class="r"><span class="amt tnum">${fmt(r.amount)}${COIN}</span></td>
    <td class="r tnum" style="color:var(--muted)">${fmtMult(r.mult)}</td>
    <td class="r"><span class="amt tnum ${r.payout > r.amount ? "pos" : "neg"}">${r.payout > r.amount ? "+" : ""}${fmt(r.payout - r.amount)}${COIN}</span></td></tr>`;
  const none = n => `<tr><td colspan="${n}" style="color:var(--muted);padding:22px 14px;white-space:normal">Rien pour l'instant — va jouer !</td></tr>`;
  const games = GAME_ORDER.filter(id => s.perGame[id]).sort((a, b) => s.perGame[b].n - s.perGame[a].n);
  $("#view").innerHTML = `<div class="wrap">
    <div class="ph"><h1>Mes records</h1><button class="btn btn-gray" data-act="save">${IC.save}Sauvegarde</button></div>
    <div class="profile-card"><div class="lvring"><svg viewBox="0 0 80 80"><circle class="bgc" cx="40" cy="40" r="35"/><circle class="fgc" cx="40" cy="40" r="35" stroke-dasharray="219.9" stroke-dashoffset="${(219.9 * (1 - lv.pct / 100)).toFixed(1)}"/></svg><span class="av" style="background:${p.color}">${esc(initials(p.name))}</span></div><div class="who"><b>${esc(p.name)}</b>
      <small>${p.guest ? "Profil invité · crée un profil pour garder ton pseudo" : "Membre depuis le " + new Date(p.created).toLocaleDateString("fr-FR")}</small>
      <div class="lvl"><i style="width:${lv.pct.toFixed(1)}%"></i></div>
      <small>Niveau <b style="color:var(--text)">${lv.name}</b>${lv.next ? ` · encore ${fmt(lv.left)} misés pour ${lv.next}` : " · niveau maximum"}</small></div>
      ${p.guest ? '<button class="btn btn-blue" data-act="register">Créer mon profil</button>' : '<button class="btn btn-gray" data-act="login">Changer de profil</button>'}</div>
    <div class="stats">
      <div class="stat-c"><span>Solde</span><b class="tnum">${fmt(s.balance)}</b></div>
      <div class="stat-c"><span>Paris joués</span><b class="tnum">${s.count.toLocaleString("fr-FR")}</b></div>
      <div class="stat-c"><span>Total misé</span><b class="tnum">${fmt(s.wagered)}</b></div>
      <div class="stat-c"><span>Résultat net</span><b class="tnum" style="color:${net >= 0 ? "var(--green)" : "var(--red)"}">${net >= 0 ? "+" : ""}${fmt(net)}</b></div>
      <div class="stat-c"><span>Paris gagnants</span><b class="tnum">${rate} %</b></div>
      <div class="stat-c"><span>Meilleur multi.</span><b class="tnum">${fmtMult(s.bestMult)}</b></div>
      <div class="stat-c"><span>Plus gros gain</span><b class="tnum">${fmt(s.best)}</b></div>
      <div class="stat-c"><span>Recharges</span><b class="tnum">${s.refills}</b></div>
      <div class="stat-c"><span>Tickets de tirage</span><b class="tnum">${s.draw ? s.draw.tickets : 0}</b></div></div>
    <section class="sec rv"><div class="box"><div class="box-head"><h2>${IC.trophy.replace("<svg", '<svg width="16" height="16"')}Meilleurs gains</h2></div>
      <div class="tbl"><table><thead><tr><th>Jeu</th><th class="hide-m">Quand</th><th class="r">Mise</th><th class="r">Multi.</th><th class="r">Gain</th></tr></thead>
      <tbody>${s.topWins.length ? s.topWins.map(betRow).join("") : none(5)}</tbody></table></div></div></section>
    <section class="sec rv"><div class="box"><div class="box-head"><h2>Par jeu</h2></div>
      <div class="tbl"><table><thead><tr><th>Jeu</th><th class="r">Parties</th><th class="r hide-m">Misé</th><th class="r">Net</th><th class="r">Record</th></tr></thead>
      <tbody>${games.length ? games.map(id => { const g = s.perGame[id]; return `<tr><td><a class="gm" href="#/jeu/${id}">${ART.icon(id)}${GAMES[id].name}</a></td>
        <td class="r tnum">${g.n}</td><td class="r tnum hide-m">${fmt(g.wag)}</td><td class="r tnum ${g.net >= 0 ? "pos" : ""}" style="${g.net < 0 ? "color:var(--red)" : ""}">${g.net >= 0 ? "+" : ""}${fmt(g.net)}</td>
        <td class="r tnum">${fmtMult(g.best)}</td></tr>`; }).join("") : none(5)}</tbody></table></div></div></section>
    <section class="sec rv"><div class="box"><div class="box-head"><h2>Historique</h2><span class="note">${Math.min(30, s.myBets.length)} derniers paris</span></div>
      <div class="tbl"><table><thead><tr><th>Jeu</th><th class="hide-m">Quand</th><th class="r">Mise</th><th class="r">Multi.</th><th class="r">Gain</th></tr></thead>
      <tbody>${s.myBets.length ? s.myBets.slice(0, 30).map(betRow).join("") : none(5)}</tbody></table></div></div></section></div>`;
}
