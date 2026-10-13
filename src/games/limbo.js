/* ------------------------------ LIMBO ----------------------------- */
(function () {
  let target = 2, hist = [], busy = false;
  function paint() {
    const c = $("#lChance"); if (!c) return;
    c.value = (99 / target).toFixed(4);
    $("#lProfit").value = fmt(Shell.amount() * target - Shell.amount());
  }
  function play(amount) {
    return new Promise(res => {
      if (!canBet(amount)) return res({ skip: true });
      takeBet(amount);
      const r = nextRng()();
      const out = clamp(Math.floor((0.99 / Math.max(1e-9, 1 - r)) * 100) / 100, 1, 1e6);
      const win = out >= target, m = win ? target : 0;
      setPending("limbo", amount, m);
      const d = $("#lOut");
      const done = () => {
        if (d) { d.textContent = out.toFixed(2) + "×"; d.className = "limbo pop " + (win ? "w" : "l"); }
        hist.unshift({ out, win }); hist = hist.slice(0, 8);
        const h = $("#lHist"); if (h) h.innerHTML = hbadges(hist, x => `<span class="hb ${x.win ? "w" : ""}">${x.out.toFixed(2)}×</span>`);
        settle("limbo", amount, amount * m, m);
        Shell.result(amount, round2(amount * m));
        res({ payout: round2(amount * m) });
      };
      if (!d || !FX.anim) return done();
      d.className = "limbo";
      const lo = Math.log(out);
      tween(Auto.running ? 200 : 360, k => { d.textContent = Math.exp(lo * easeOutQuart(k)).toFixed(2) + "×"; }, done);
    });
  }
  reg({
    id: "limbo", name: "Limbo", cat: "originals",
    rules: "Fixe un multiplicateur cible. Un multiplicateur est tiré au hasard : s'il atteint ou dépasse ta cible, tu gagnes ta mise multipliée par la cible.",
    onAmount: paint,
    mount(S) {
      busy = false;
      S.mid(`<div class="grid2">
        <div class="field"><label class="lbl" for="lTarget">Multiplicateur cible</label><div class="inp"><input id="lTarget" inputmode="decimal" value="${target.toFixed(2)}"><span class="sfx">×</span></div></div>
        <div class="field"><label class="lbl">Chance de gain</label><div class="inp ro"><input id="lChance" readonly tabindex="-1"><span class="sfx">%</span></div></div></div>
        <div class="field"><label class="lbl">Gain potentiel</label><div class="inp ro"><input id="lProfit" readonly tabindex="-1"><span class="sfx">${COIN}</span></div></div>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="hist" id="lHist"></div><div class="limbo" id="lOut">1.00×</div>
        <p class="note" style="margin-top:16px;text-align:center">Cible : <b id="lTgt" style="color:var(--text)">${target.toFixed(2)}×</b></p>`);
      $("#lTarget").onchange = e => {
        target = clamp(round2(parseAmt(e.target.value) || 2), 1.01, 1e6);
        e.target.value = target.toFixed(2);
        $("#lTgt").textContent = target.toFixed(2) + "×";
        paint();
      };
      S.setAction("Parier");
      S.onAct(async () => { if (busy) return; busy = true; S.enable(false); await play(S.amount()); busy = false; S.enable(true); });
      paint();
    },
    auto(amount) { return play(amount); }
  });
})();
