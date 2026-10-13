/* ---------- écran de jeu ---------- */
const Shell = {
  game: null, area: null, mode: "manual", _label: "Parier", _cls: "", _onAct: null, _locked: false,
  init(g) {
    this.game = g; this.area = $("#area"); this._act = $("#actBtn"); this._amt = $("#betAmt");
    this._onAct = null; this._locked = false; this.mode = "manual";
    $$("[data-mul]").forEach(b => b.onclick = () => {
      if (this._amt.disabled) return;
      const m = b.dataset.mul;
      let v = m === "max" ? state.balance : this.amount() * parseFloat(m);
      this.setAmount(clamp(v, .01, 1e9));
      FX.sClick();
    });
    this._amt.addEventListener("input", () => this.refresh());
    this._amt.addEventListener("blur", () => { const v = this.amount(); this._amt.value = v > 0 ? v.toFixed(2) : "0.00"; this.refresh(); });
    this._amt.addEventListener("focus", () => { try { this._amt.select(); } catch (e) { } });
    this._act.onclick = () => {
      if (this.mode === "auto") { Auto.running ? Auto.stop() : Auto.start(); return; }
      if (this._onAct) this._onAct();
    };
    if (g.auto) {
      $$("#modeTabs button").forEach(b => b.onclick = () => {
        if (Auto.running || this._locked) return;
        $$("#modeTabs button").forEach(x => x.classList.toggle("on", x === b));
        this.mode = b.dataset.m;
        $("#autoBox").classList.toggle("hidden", this.mode !== "auto");
        this.paintAct();
      });
    } else $("#modeTabs").classList.add("hidden");
  },
  amount() { const v = parseAmt(this._amt.value); return v > 0 ? round2(v) : 0; },
  setAmount(v) { this._amt.value = round2(v).toFixed(2); this.refresh(); },
  refresh() {
    const v = parseAmt(this._amt.value), hint = $("#betHint");
    const msg = !(v > 0) ? "Saisis un montant supérieur à 0." : v > state.balance + 1e-9 ? "Solde insuffisant : recharge-toi depuis la caisse." : "";
    if (hint) hint.textContent = msg;
    const box = this._amt.closest(".inp");
    if (box) box.classList.toggle("bad", !!msg);
    this._amt.setAttribute("aria-invalid", msg ? "true" : "false");
    if (this.game && this.game.onAmount) this.game.onAmount(this);
  },
  top(h) { $("#ctlTop").innerHTML = h; },
  mid(h) { $("#ctlMid").innerHTML = h; },
  bot(h) { $("#ctlBot").innerHTML = h; },
  paintAct() {
    if (!this._act) return;
    const auto = this.mode === "auto";
    this._act.textContent = auto ? (Auto.running ? "Arrêter l'auto" : "Lancer l'auto") : this._label;
    this._act.className = "act o-act" + (auto ? (Auto.running ? " stop" : "") : (this._cls ? " " + this._cls : ""));
  },
  setAction(label, cls) { this._label = label; this._cls = cls || ""; this.paintAct(); },
  label(text) { if (this._act && this.mode !== "auto") this._act.textContent = text; },
  onAct(fn) { this._onAct = fn; },
  enable(on) { if (this._act) this._act.disabled = !on; },
  lock(on) {
    this._locked = on;
    if (this._amt) this._amt.disabled = on;
    $$("#ctlTop input,#ctlTop select,#ctlTop button,#ctlMid input,#ctlMid select,#ctlMid button,#modeTabs button,[data-mul]").forEach(e => { if (!e.dataset.keep) e.disabled = on; });
  },
  flash(text, win) {
    const f = $("#flash"); if (!f) return;
    f.textContent = text;
    f.className = "flash show " + (win ? "win" : "lose");
    clearTimeout(this._ft);
    this._ft = setTimeout(() => { f.className = "flash"; }, 1600);
  },
  result(amount, payout) {
    const net = payout - amount;
    this.flash(net > 0 ? "+" + fmt(net) : net === 0 ? "Remboursé" : fmt(net), net > 0);
  }
};
const hbadges = (list, fn) => list.map(fn).join("");
/* ---------- mode automatique ---------- */
const Auto = {
  running: false,
  num(id, d) { const el = $(id); const v = el ? parseAmt(el.value) : NaN; return isFinite(v) ? v : d; },
  async start() {
    const g = Shell.game;
    if (!g || !g.auto) return;
    const base = Shell.amount();
    if (!canBet(base)) return;
    const rounds = Math.max(0, Math.floor(this.num("#aRounds", 0)));
    const onWin = this.num("#aWin", 0), onLoss = this.num("#aLoss", 0);
    const stopP = this.num("#aStopP", 0), stopL = this.num("#aStopL", 0);
    let amt = base, done = 0, net = 0;
    this.running = true;
    Shell.lock(true); Shell.paintAct();
    $$("#autoBox input").forEach(e => e.disabled = true);
    while (this.running && (rounds === 0 || done < rounds)) {
      amt = round2(amt);
      if (amt <= 0) amt = base;
      if (amt > state.balance + 1e-9) { toast("Solde insuffisant : auto arrêté.", true); break; }
      let res;
      try { res = await g.auto(amt); } catch (e) { break; }
      if (!res || res.skip) break;
      net = round2(net + res.payout - amt); done++;
      const st = $("#aNet");
      if (st) { st.textContent = (net >= 0 ? "+" : "") + fmt(net); st.style.color = net >= 0 ? "var(--green)" : "var(--red)"; }
      const cd = $("#aDone"); if (cd) cd.textContent = done;
      amt = res.payout > amt ? (onWin > 0 ? amt * (1 + onWin / 100) : base) : (onLoss > 0 ? amt * (1 + onLoss / 100) : base);
      if (stopP > 0 && net >= stopP) { toast("Objectif de gain atteint."); break; }
      if (stopL > 0 && -net >= stopL) { toast("Limite de perte atteinte."); break; }
      if (!this.running) break;
      await sleep(260);
    }
    this.stop();
  },
  stop() {
    this.running = false;
    if (!$("#actBtn")) return;
    Shell.lock(false);
    $$("#autoBox input").forEach(e => e.disabled = false);
    Shell.paintAct();
    Shell.enable(true);
  }
};

function renderGame(id) {
  const g = GAMES[id];
  $("#view").innerHTML = `<div class="wrap">
    <div class="crumbs"><a href="#/jeux">Jeux</a>${IC.back.replace("<svg", '<svg style="transform:scaleX(-1)"')}<span style="color:var(--text)">${g.name}</span></div>
    <div class="game">
      <div class="game-main">
        <div class="panel">
          <div class="seg o-mode" id="modeTabs"><button class="on" data-m="manual">Manuel</button><button data-m="auto">Auto</button></div>
          <div class="o-top" id="ctlTop"></div>
          <div class="field o-bet"><label class="lbl" for="betAmt">${g.betLabel || "Montant du pari"}</label>
            <div class="inp"><input id="betAmt" type="text" inputmode="decimal" autocomplete="off" aria-describedby="betHint" value="${Math.min(state.lastAmount, Math.max(state.balance, .01)).toFixed(2)}">
              <span class="sfx">${COIN}</span><button class="mini" type="button" data-mul="0.5" aria-label="Diviser la mise par deux">½</button><button class="mini" type="button" data-mul="2" aria-label="Doubler la mise">2×</button><button class="mini" type="button" data-mul="max" aria-label="Miser tout le solde">Max</button></div>
            <p class="err" id="betHint" aria-live="polite"></p></div>
          <div class="o-mid" id="ctlMid"></div>
          <div class="o-auto hidden" id="autoBox" style="display:flex;flex-direction:column;gap:10px">
            <div class="grid2">
              <div class="field"><label class="lbl" for="aRounds">Nombre de paris</label><div class="inp"><input id="aRounds" inputmode="numeric" value="10"></div></div>
              <div class="field"><span class="lbl">Joués · net</span><div class="auto-info"><span id="aDone">0</span><span id="aNet" class="tnum">+0.00</span></div></div>
              <div class="field"><label class="lbl" for="aWin">Si gain, mise +%</label><div class="inp"><input id="aWin" inputmode="decimal" value="0"></div></div>
              <div class="field"><label class="lbl" for="aLoss">Si perte, mise +%</label><div class="inp"><input id="aLoss" inputmode="decimal" value="0"></div></div>
              <div class="field"><label class="lbl" for="aStopP">Stop si gain de</label><div class="inp"><input id="aStopP" inputmode="decimal" value="0"></div></div>
              <div class="field"><label class="lbl" for="aStopL">Stop si perte de</label><div class="inp"><input id="aStopL" inputmode="decimal" value="0"></div></div>
            </div><p class="note">0 = illimité. Après un gain ou une perte, la mise revient à la mise de départ si le pourcentage vaut 0.</p></div>
          <button class="act o-act" id="actBtn">Parier</button>
          <div class="o-bot" id="ctlBot"></div>
        </div>
        <div class="stage" id="area"><div class="flash" id="flash"></div></div>
      </div>
      <div class="game-bar">
        <div class="gname">${ART.icon(id)}<h1 class="gtitle">${g.name}</h1><small class="hide-s">RTP ${String(g.rtp || 99).replace(".", ",")} %</small></div>
        <button type="button" data-act="fair" aria-label="Équité vérifiable">${IC.shield}<span class="hide-s">Équité</span></button>
        <button type="button" id="sndBtn"></button>
        <button type="button" data-act="rule" data-g="${id}" aria-label="Règles de ${g.name}">${IC.book}<span class="hide-s">Règles</span></button>
      </div>
    </div>
    <section class="sec rv">${Feed.html()}</section></div>`;
  $("#sndBtn").onclick = () => { DB.settings.sound = !DB.settings.sound; paintSound(); if (DB.settings.sound) FX.sCoin(); Store.save(); };
  paintSound();
  Shell.init(g);
  currentGame = g;
  g.mount(Shell);
  Shell.refresh();
  Feed.mount();
}
