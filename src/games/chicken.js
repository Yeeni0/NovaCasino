/* --------------------------- CHICKEN ROAD ------------------------- */
(function () {
  const D = {
    facile: { p: .96, n: 24, l: "Facile" }, moyen: { p: .9, n: 22, l: "Moyen" },
    difficile: { p: .82, n: 20, l: "Difficile" }, extreme: { p: .7, n: 15, l: "Extrême" }
  };
  const CAR = c => `<svg viewBox="0 0 40 62"><rect x="3" y="2" width="34" height="58" rx="9" fill="${c}"/><rect x="7" y="9" width="26" height="14" rx="4" fill="#15163a" opacity=".75"/><rect x="7" y="39" width="26" height="11" rx="4" fill="#15163a" opacity=".6"/><rect x="6" y="54" width="7" height="4" rx="2" fill="#fff6b0"/><rect x="27" y="54" width="7" height="4" rx="2" fill="#fff6b0"/></svg>`;
  const CAR_COLS = ["#ef4a58", "#4f5bff", "#ffc53d", "#a86bff", "#22b574", "#ff9a3c", "#2cb5f5"];
  const CHICK = '<svg viewBox="0 0 52 52"><ellipse cx="26" cy="46" rx="13" ry="3.5" fill="#000" opacity=".25"/><path d="M14 30c0-8 5-13 12-13s12 5 12 13-5 12-12 12-12-4-12-12Z" fill="#ffd75e"/><path d="M20 16c0-4 3-7 6-7s6 3 6 7-3 6-6 6-6-2-6-6Z" fill="#ffe28a"/><path d="M24 6c1-2 4-2 5 0 1 2-1 3-2.5 3S23 8 24 6Z" fill="#ef4a58"/><circle cx="23" cy="16" r="1.7" fill="#2b1c00"/><circle cx="30" cy="16" r="1.7" fill="#2b1c00"/><path d="M26 19.5 30 22l-4 2.2Z" fill="#ff9a3c"/><path d="M17 42h4l-1 5h-3Zm14 0h4l1 5h-3Z" fill="#ff9a3c"/></svg>';
  let diff = "moyen", pos = 0, bet = 0, active = false, busy = false, rf = null, dead = false, curM = 1;
  const cfg = () => D[diff];
  const mult = i => (i <= 0 ? 1 : .99 / Math.pow(cfg().p, i));
  const chickLeft = s => (s === 0 ? 14 : 80 + (s - 1) * 76 + 11);
  function build() {
    const box = $("#crIn"); if (!box) return;
    const c = cfg();
    let h = '<div class="kerb"></div>';
    for (let i = 0; i < c.n; i++) {
      h += `<div class="lane" data-i="${i + 1}"><div class="car run" style="animation-duration:${(2.4 + Math.random() * 2.6).toFixed(2)}s;animation-delay:${(-Math.random() * 4).toFixed(2)}s">${CAR(CAR_COLS[i % CAR_COLS.length])}</div>
        <div class="lm">${mult(i + 1).toFixed(2)}×</div></div>`;
    }
    h += `<div class="chick" id="crChick">${CHICK}</div><div class="crgold" id="crGold"></div>`;
    box.innerHTML = h;
    box.style.width = (80 + c.n * 76 + 40) + "px";
    $$("#crIn .lane").forEach(l => l.onclick = () => { if (active && +l.dataset.i === pos + 1) step(); });
    place(); marks();
  }
  function place() {
    const ch = $("#crChick"); if (ch) ch.style.left = chickLeft(pos) + "px";
    const road = $("#crRoad");
    if (road && road.scrollTo) road.scrollTo({ left: Math.max(0, chickLeft(pos) - road.clientWidth / 2 + 27), behavior: "smooth" });
  }
  function marks() {
    $$("#crIn .lane").forEach(l => { const i = +l.dataset.i; l.classList.toggle("done", i <= pos); l.classList.toggle("next", active && i === pos + 1); });
    const a = $("#crCur"), b = $("#crNext"), p = $("#crProfit"), s = $("#crStep");
    if (a) a.textContent = fmtMult(mult(pos));
    if (b) b.textContent = pos < cfg().n ? fmtMult(mult(pos + 1)) : "—";
    if (p) p.value = fmt(active ? bet * mult(pos) - bet : Shell.amount() * mult(1) - Shell.amount());
    if (s) s.disabled = !active || busy;
  }
  function feathers() {
    const ch = $("#crChick"), box = $("#crIn"); if (!ch || !box || !FX.anim) return;
    const x = chickLeft(pos) + 27, y = ch.offsetTop + 27;
    for (let i = 0; i < 14; i++) {
      const f = document.createElement("div");
      f.className = "feather"; f.style.left = x + "px"; f.style.top = y + "px";
      box.appendChild(f);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
      if (f.animate) f.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 20}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }],
        { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.4,1)" });
      setTimeout(() => f.remove(), 1200);
    }
  }
  function step() {
    if (!active || busy) return;
    busy = true;
    const target = pos + 1, lane = $(`#crIn .lane[data-i="${target}"]`), ch = $("#crChick");
    const survive = rf() < cfg().p;
    pos = target; dead = !survive; curM = survive ? mult(pos) : 0;
    setPending("chicken", bet, curM);
    if (ch) { ch.classList.remove("hop"); void ch.offsetWidth; ch.classList.add("hop"); }
    FX.sTick();
    place(); marks();
    Shell.enable(false);
    setTimeout(() => {
      if (!active || !$("#crChick")) return;
      if (survive) {
        busy = false; FX.sCoin(); marks();
        Shell.setAction("Encaisser " + fmtMult(curM), "cash"); Shell.enable(true);
        if (pos >= cfg().n) cashout();
        return;
      }
      const car = lane ? lane.querySelector(".car") : null;
      if (car) { car.classList.remove("run"); car.classList.add("hit"); car.style.transform = "translateY(160px)"; }
      setTimeout(() => {
        if (!active) return;
        const c2 = $("#crChick"); if (c2) c2.classList.add("dead");
        feathers(); FX.noise(.3, .08, 300);
        const b = bet;
        settle("chicken", b, 0, 0); Shell.result(b, 0);
        endRound();
      }, 170);
    }, 300);
  }
  function cashout() {
    if (!active || pos === 0 || busy) return;
    const m = mult(pos), b = bet, g = $("#crGold");
    if (g) { g.textContent = "+" + fmt(b * m - b); g.classList.remove("on"); void g.offsetWidth; g.classList.add("on"); }
    settle("chicken", b, b * m, m); Shell.result(b, round2(b * m));
    endRound();
  }
  function endRound() {
    active = false; busy = false; bet = 0;
    Shell.lock(false); Shell.setAction("Parier"); Shell.enable(true);
    marks();
    setTimeout(() => { if ($("#crIn") && !active) { pos = 0; dead = false; build(); } }, 1500);
  }
  function start(amount) {
    if (active || !canBet(amount)) return;
    takeBet(amount);
    bet = amount; pos = 0; dead = false; active = true; busy = false; curM = 1;
    rf = nextRng();
    setPending("chicken", bet, 1);
    build();
    Shell.lock(true); Shell.setAction("Encaisser", "cash"); Shell.enable(false);
    marks();
  }
  reg({
    id: "chicken", name: "Chicken Road", cat: "originals",
    rules: "Fais traverser la route au poulet, une voie après l'autre. Chaque voie franchie augmente le multiplicateur ; encaisse avant qu'une voiture ne l'écrase. La difficulté change le risque à chaque voie.",
    onAmount: marks,
    mount(S) {
      active = false; busy = false; pos = 0; bet = 0;
      S.mid(`<div class="field"><label class="lbl" for="crDiff">Difficulté</label><div class="inp"><select id="crDiff">${Object.keys(D).map(k => `<option value="${k}" ${k === diff ? "selected" : ""}>${D[k].l} · ${D[k].n} voies</option>`).join("")}</select></div></div>
        <div class="field"><label class="lbl">Gain en cours</label><div class="inp ro"><input id="crProfit" readonly tabindex="-1"><span class="sfx">${COIN}</span></div></div>`);
      S.bot(`<button class="btn btn-gray btn-block" id="crStep" disabled>Avancer d'une voie</button>
        <div class="mini-stats two"><div class="ms"><span>Multi. actuel</span><b id="crCur">1.00×</b></div><div class="ms"><span>Voie suivante</span><b id="crNext"></b></div></div>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="road" id="crRoad"><div class="roadin" id="crIn"></div></div>
        <p class="note" style="margin-top:12px;text-align:center">Touche la voie éclairée ou « Avancer » pour traverser.</p>`);
      build();
      $("#crDiff").onchange = e => { diff = e.target.value; if (!active) { pos = 0; build(); } };
      $("#crStep").onclick = step;
      S.setAction("Parier");
      S.onAct(() => { if (active) cashout(); else start(S.amount()); });
      marks();
    },
    unmount() {
      if (active) {
        closeRound("chicken", bet, curM, true);
        if (curM > 1) toast("Chicken Road : encaissé automatiquement à " + fmtMult(curM) + ".");
      }
      active = false; busy = false;
    }
  });
})();
