/* ---------- paris en direct ---------- */
const Feed = {
  tab: "all", timer: null,
  fake() {
    const g = pick(GAME_ORDER.filter(id => id !== "slots" || Math.random() < .5));
    const amount = pick([.5, 1, 2, 2, 5, 5, 10, 20, 25, 50, 100]);
    const r = Math.random();
    let mult = 0;
    if (r < .45) mult = 0;
    else if (r < .88) mult = 1.1 + Math.random() * 1.9;
    else if (r < .985) mult = 3 + Math.random() * 15;
    else mult = 20 + Math.random() * 300;
    mult = round2(mult);
    return { game: g, amount, mult, payout: round2(amount * mult), user: pick(Chat.BOTS), t: Date.now() };
  },
  row(r) {
    const me = !r.user, win = r.payout > r.amount;
    const name = me ? P().name : r.user;
    const col = me ? P().color : AV_COLORS[name.length % AV_COLORS.length];
    return `<tr>
      <td><a class="gm" href="#/jeu/${r.game}">${ART.icon(r.game)}${GAMES[r.game] ? GAMES[r.game].name : r.game}</a></td>
      <td class="hide-m"><span class="pl"><span class="avatar sm" style="background:${col}">${esc(initials(name))}</span>${esc(name)}</span></td>
      <td class="hide-m" style="color:var(--dim)">${new Date(r.t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
      <td class="r"><span class="amt tnum">${fmt(r.amount)}${COIN}</span></td>
      <td class="r tnum" style="color:var(--muted)">${fmtMult(r.mult)}</td>
      <td class="r"><span class="amt tnum ${win ? "pos" : "neg"}">${win ? "+" + fmt(r.payout - r.amount) : fmt(r.payout - r.amount)}${COIN}</span></td></tr>`;
  },
  html() {
    return `<div class="box" id="feedBox">
      <div class="box-head"><h2><i class="dot"></i>Paris en direct</h2>
        <div class="tabs" id="feedTabs"><button data-t="all" class="${this.tab === "all" ? "on" : ""}">Tous</button><button data-t="mine" class="${this.tab === "mine" ? "on" : ""}">Mes paris</button></div></div>
      <div class="tbl"><table><thead><tr><th>Jeu</th><th class="hide-m">Joueur</th><th class="hide-m">Heure</th><th class="r">Mise</th><th class="r">Multi.</th><th class="r">Gain</th></tr></thead>
      <tbody id="feedBody"></tbody></table></div></div>`;
  },
  fill() {
    const tb = $("#feedBody"); if (!tb) return;
    if (this.tab === "mine") {
      tb.innerHTML = state.myBets.length ? state.myBets.slice(0, 10).map(r => this.row(r)).join("")
        : `<tr><td colspan="6" style="color:var(--muted);padding:22px 14px;white-space:normal">Aucun pari pour l'instant. Lance un jeu, ton historique s'affichera ici.</td></tr>`;
    } else {
      tb.innerHTML = Array.from({ length: 10 }, () => this.row(this.fake())).join("");
    }
  },
  mount() {
    if (!$("#feedBody")) return;
    idle(() => this.fill());
    $$("#feedTabs button").forEach(b => b.onclick = () => {
      this.tab = b.dataset.t;
      $$("#feedTabs button").forEach(x => x.classList.toggle("on", x === b));
      this.fill();
    });
    this.stop();
    const tick = () => {
      this.timer = setTimeout(() => {
        if (!document.hidden && this.tab === "all") this.push(this.fake());
        tick();
      }, 1400 + Math.random() * 1600);
    };
    tick();
  },
  push(r) {
    const tb = $("#feedBody"); if (!tb) return;
    if (tb.firstElementChild && tb.firstElementChild.querySelector("td[colspan]")) tb.innerHTML = "";
    tb.insertAdjacentHTML("afterbegin", this.row(r));
    while (tb.children.length > 10) tb.lastElementChild.remove();
  },
  mine(rec) { this.push(rec); },
  stop() { clearTimeout(this.timer); this.timer = null; }
};
