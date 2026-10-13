/* ------------------------------- KENO ----------------------------- */
(function () {
  const PAY = {
    faible: { 1: [.7, 1.85], 2: [0, 2, 3.8], 3: [0, 1.1, 1.38, 26], 4: [0, 0, 2.2, 7.9, 90], 5: [0, 0, 1.5, 4.2, 13, 300], 6: [0, 0, 1.1, 2, 6.2, 100, 700], 7: [0, 0, 1.1, 1.6, 3.5, 15, 225, 700], 8: [0, 0, 1.1, 1.5, 2, 5.6, 39.6, 100, 800], 9: [0, 0, 1.1, 1.3, 1.7, 2.5, 7.5, 50, 250, 1000], 10: [0, 0, 1.1, 1.2, 1.3, 1.8, 3.5, 13, 50, 250, 1000] },
    moyen: { 1: [.4, 2.75], 2: [0, 1.8, 5.1], 3: [0, 0, 2.8, 50], 4: [0, 0, 1.7, 10, 100], 5: [0, 0, 1.4, 4, 14, 390], 6: [0, 0, 0, 3, 9, 180, 710], 7: [0, 0, 0, 2, 7, 30, 400, 800], 8: [0, 0, 0, 2, 4, 11, 67, 400, 900], 9: [0, 0, 0, 2, 2.5, 5, 15, 100, 500, 1000], 10: [0, 0, 0, 1.6, 2, 4, 7, 26, 100, 500, 1000] },
    eleve: { 1: [0, 3.96], 2: [0, 0, 17.1], 3: [0, 0, 0, 81.5], 4: [0, 0, 0, 10, 259], 5: [0, 0, 0, 4.5, 48, 450], 6: [0, 0, 0, 0, 11, 350, 710], 7: [0, 0, 0, 0, 7, 90, 400, 800], 8: [0, 0, 0, 0, 5, 20, 270, 600, 900], 9: [0, 0, 0, 0, 4, 11, 56, 500, 800, 1000], 10: [0, 0, 0, 0, 3.5, 8, 13, 63, 500, 800, 1000] }
  };
  const TOTAL = 40, DRAW = 10, MAXP = 10;
  let risk = "moyen", picks = [], busy = false, token = 0, pend = null;
  const tableFor = () => PAY[risk][picks.length] || null;
  function paintTable(hits) {
    const box = $("#kPay"); if (!box) return;
    const t = tableFor();
    box.innerHTML = t ? t.map((m, h) => `<div class="pt ${hits === h ? "on" : ""}"><b>${m}×</b>${h}</div>`).join("")
      : `<div class="pt" style="flex:1;padding:9px">Choisis de 1 à 10 numéros</div>`;
  }
  function paintTiles() {
    $$("#kGrid .ktile").forEach(t => { t.className = "ktile" + (picks.includes(+t.dataset.n) ? " sel" : ""); t.disabled = false; });
    const c = $("#kCount"); if (c) c.textContent = picks.length + " / " + MAXP;
    paintTable(-1);
    Shell.enable(picks.length > 0);
  }
  function play(amount) {
    return new Promise(async res => {
      if (!picks.length) { toast("Choisis au moins un numéro.", true); return res({ skip: true }); }
      if (busy) return res({ skip: true });
      if (!canBet(amount)) return res({ skip: true });
      busy = true; takeBet(amount); Shell.enable(false);
      const my = ++token, rf = nextRng(), pool = Array.from({ length: TOTAL }, (_, i) => i + 1);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rf() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      const drawn = pool.slice(0, DRAW), hits = drawn.filter(n => picks.includes(n)).length;
      const t = tableFor(), m = t ? (t[hits] || 0) : 0;
      pend = { amount, m };
      setPending("keno", amount, m);
      $$("#kGrid .ktile").forEach(el => { el.disabled = true; el.className = "ktile" + (picks.includes(+el.dataset.n) ? " selmiss" : ""); });
      let h = 0;
      for (const n of drawn) {
        if (my !== token) return res({ skip: true });
        const el = $(`#kGrid .ktile[data-n="${n}"]`), good = picks.includes(n);
        if (good) { h++; FX.tone(700 + h * 80, .08, { vol: .05 }); } else FX.sTick();
        if (el) el.className = "ktile " + (good ? "hit" : "miss");
        await sleep(Auto.running ? 35 : 80);
      }
      if (my !== token) return res({ skip: true });
      pend = null;
      paintTable(hits);
      settle("keno", amount, amount * m, m); Shell.result(amount, round2(amount * m));
      busy = false; Shell.enable(true);
      setTimeout(() => { if ($("#kGrid") && !busy) paintTiles(); }, Auto.running ? 250 : 1200);
      res({ payout: round2(amount * m) });
    });
  }
  reg({
    id: "keno", name: "Keno", cat: "originals",
    rules: "Choisis de 1 à 10 numéros sur 40. Dix numéros sont tirés : ton gain dépend du nombre de numéros trouvés, selon le tableau affiché sous la grille et le niveau de risque.",
    mount(S) {
      picks = []; busy = false; pend = null;
      S.mid(`<div class="field"><label class="lbl" for="kRisk">Risque</label><div class="inp"><select id="kRisk">
          <option value="faible">Faible</option><option value="moyen">Moyen</option><option value="eleve">Élevé</option></select></div></div>
        <div class="seg"><button id="kAuto">Choix auto</button><button id="kClear">Effacer</button></div>
        <p class="note">Numéros choisis : <b id="kCount" style="color:var(--text)">0 / 10</b></p>`);
      $("#kRisk").value = risk;
      S.area.insertAdjacentHTML("beforeend", `<div class="keno" id="kGrid">${Array.from({ length: TOTAL }, (_, i) => `<button class="ktile" data-n="${i + 1}">${i + 1}</button>`).join("")}</div><div class="paytable" id="kPay"></div>`);
      $$("#kGrid .ktile").forEach(t => t.onclick = () => {
        if (busy || Auto.running) return;
        const n = +t.dataset.n;
        if (picks.includes(n)) picks = picks.filter(x => x !== n);
        else if (picks.length < MAXP) picks.push(n);
        else return toast("10 numéros maximum.", true);
        FX.sTick();
        paintTiles();
      });
      $("#kRisk").onchange = e => { risk = e.target.value; paintTable(-1); };
      $("#kAuto").onclick = () => {
        if (busy) return;
        const pool = Array.from({ length: TOTAL }, (_, i) => i + 1);
        picks = [];
        for (let i = 0; i < MAXP; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        paintTiles();
      };
      $("#kClear").onclick = () => { if (!busy) { picks = []; paintTiles(); } };
      S.setAction("Parier");
      S.onAct(() => play(S.amount()));
      paintTiles();
    },
    auto(amount) { return play(amount); },
    unmount() {
      token++;
      if (busy && pend) closeRound("keno", pend.amount, pend.m, true);
      busy = false; pend = null;
    }
  });
})();
