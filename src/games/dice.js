/* ------------------------------ DICE ------------------------------ */
(function () {
  let target = 50.5, mode = "over", busy = false, hist = [];
  const chance = () => (mode === "over" ? 100 - target : target);
  const mult = () => 99 / chance();
  function paint() {
    const tr = $("#dTrack"); if (!tr) return;
    const t = target;
    tr.style.background = mode === "over"
      ? `linear-gradient(90deg,var(--red) 0 ${t}%,var(--green) ${t}% 100%)`
      : `linear-gradient(90deg,var(--green) 0 ${t}%,var(--red) ${t}% 100%)`;
    $("#dThumb").style.left = t + "%";
    $("#dRange").value = t;
    $("#dMult").value = mult().toFixed(4);
    $("#dTarget").value = t.toFixed(2);
    $("#dChance").value = chance().toFixed(2);
    $("#dModeL").textContent = mode === "over" ? "Plus grand que" : "Plus petit que";
    $("#dProfit").value = fmt(Shell.amount() * mult() - Shell.amount());
    $("#sMult").textContent = mult().toFixed(4) + "×";
    $("#sTar").textContent = (mode === "over" ? "> " : "< ") + t.toFixed(2);
    $("#sCh").textContent = chance().toFixed(2) + " %";
  }
  function setTarget(v) { target = clamp(Math.round(v * 100) / 100, 2, 98); paint(); }
  function play(amount) {
    if (!canBet(amount)) return Promise.resolve({ skip: true });
    takeBet(amount);
    const roll = Math.floor(nextRng()() * 10001) / 100;
    const win = mode === "over" ? roll > target : roll < target;
    const m = win ? mult() : 0;
    const rv = $("#dRoll");
    if (rv) { rv.style.left = clamp(roll, 4, 96) + "%"; rv.textContent = roll.toFixed(2); rv.className = "droll show" + (win ? "" : " l"); }
    hist.unshift({ roll, win }); hist = hist.slice(0, 8);
    const h = $("#dHist"); if (h) h.innerHTML = hbadges(hist, x => `<span class="hb ${x.win ? "w" : ""}">${x.roll.toFixed(2)}</span>`);
    settle("dice", amount, amount * m, m);
    Shell.result(amount, round2(amount * m));
    return Promise.resolve({ payout: round2(amount * m) });
  }
  reg({
    id: "dice", name: "Dice", cat: "originals",
    rules: "Choisis une cible entre 2 et 98 et parie que le tirage (0 à 100) sera au-dessus ou en dessous. Plus la chance est faible, plus le multiplicateur est élevé (99 ÷ chance).",
    onAmount: paint,
    mount(S) {
      busy = false;
      S.mid(`<div class="grid2">
        <div class="field"><label class="lbl" for="dMult">Multiplicateur</label><div class="inp"><input id="dMult" inputmode="decimal"><span class="sfx">×</span></div></div>
        <div class="field"><label class="lbl" id="dModeL" for="dTarget">Plus grand que</label><div class="inp"><input id="dTarget" inputmode="decimal"><button class="mini" id="dSwap" aria-label="Inverser">⇅</button></div></div>
        <div class="field"><label class="lbl" for="dChance">Chance de gain</label><div class="inp"><input id="dChance" inputmode="decimal"><span class="sfx">%</span></div></div>
        <div class="field"><label class="lbl">Gain potentiel</label><div class="inp ro"><input id="dProfit" readonly tabindex="-1"></div></div></div>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="hist" id="dHist"></div>
        <div class="dicebox"><div class="dtrack-wrap">
          <div class="dscale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          <div class="dtrack" id="dTrack"><div class="droll" id="dRoll">50.00</div><div class="dthumb" id="dThumb"><i></i><i></i><i></i></div>
            <input id="dRange" type="range" min="2" max="98" step="0.01" value="50.5" aria-label="Cible"></div></div>
          <div class="mini-stats"><div class="ms"><span>Multiplicateur</span><b id="sMult"></b></div><div class="ms"><span>Cible</span><b id="sTar"></b></div><div class="ms"><span>Chance</span><b id="sCh"></b></div></div></div>`);
      let lastTick = 0;
      $("#dRange").addEventListener("input", e => {
        setTarget(parseFloat(e.target.value));
        if (performance.now() - lastTick > 45) { lastTick = performance.now(); FX.sTick(); }
      });
      $("#dSwap").onclick = () => { mode = mode === "over" ? "under" : "over"; setTarget(100 - target); };
      $("#dTarget").onchange = e => setTarget(parseAmt(e.target.value) || 50.5);
      $("#dChance").onchange = e => { const c = clamp(parseAmt(e.target.value) || 49.5, 2, 98); setTarget(mode === "over" ? 100 - c : c); };
      $("#dMult").onchange = e => { const c = 99 / clamp(parseAmt(e.target.value) || 2, 1.0102, 49.5); setTarget(mode === "over" ? 100 - c : c); };
      S.setAction("Parier");
      S.onAct(async () => {
        if (busy) return;
        busy = true; S.enable(false);
        await play(S.amount());
        setTimeout(() => { busy = false; S.enable(true); }, 160);
      });
      paint();
    },
    auto(amount) { return play(amount); }
  });
})();
