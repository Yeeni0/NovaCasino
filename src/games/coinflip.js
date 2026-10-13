/* ---------------------------- COIN FLIP --------------------------- */
(function () {
  const M = 1.98;
  let side = "pile", streak = 0, bet = 0, active = false, busy = false, seq = [], rot = 0, curM = 1;
  function refresh() {
    const c = $("#fMult"), p = $("#fProfit"), sq = $("#fSeq"), s = $("#fStreak");
    const m = Math.pow(M, streak);
    if (c) c.textContent = fmtMult(active && streak ? m : M);
    if (p) p.value = fmt(active ? bet * m - bet : Shell.amount() * M - Shell.amount());
    if (sq) sq.textContent = streak;
    if (s) s.innerHTML = seq.length ? seq.map(x => `<div class="sdot ${x === "pile" ? "P" : "F"}">${x === "pile" ? "P" : "F"}</div>`).join("") : '<div class="sdot">–</div>';
  }
  async function flip() {
    if (busy) return;
    if (!active) {
      const amount = Shell.amount();
      if (!canBet(amount)) return;
      takeBet(amount);
      bet = amount; streak = 0; seq = []; active = true; curM = 1;
    }
    busy = true;
    Shell.lock(true); Shell.enable(false);
    const sec = $("#fAgain"); if (sec) sec.disabled = true;
    const res = nextRng()() < .5 ? "pile" : "face", ok = res === side;
    if (ok) { streak++; seq.push(res); curM = Math.pow(M, streak); } else curM = 0;
    setPending("coinflip", bet, curM);
    const coin = $("#fCoin");
    if (coin) {
      rot = Math.floor(rot / 360) * 360 + 360 * (FX.anim ? 5 + Math.floor(Math.random() * 3) : 1) + (res === "face" ? 180 : 0);
      coin.style.transition = FX.anim ? "" : "none";
      coin.style.transform = `rotateY(${rot}deg)`;
    }
    FX.noise(.25, .03, 2400);
    await sleep(FX.anim ? 1000 : 120);
    if (!active || !$("#fCoin")) { busy = false; return; }
    if (ok) {
      FX.sCoin();
      Shell.setAction("Encaisser " + fmtMult(curM), "cash"); Shell.enable(true);
      if (sec) { sec.disabled = false; sec.textContent = "Relancer · " + fmtMult(Math.pow(M, streak + 1)); }
      Shell.flash((res === "pile" ? "Pile" : "Face") + " · " + fmtMult(curM), true);
    } else {
      const b = bet;
      settle("coinflip", b, 0, 0); Shell.result(b, 0);
      active = false; streak = 0; seq = []; bet = 0;
      Shell.lock(false); Shell.setAction("Parier"); Shell.enable(true);
      if (sec) sec.textContent = "Relancer";
    }
    busy = false;
    refresh();
  }
  function cash() {
    if (!active || streak === 0 || busy) return;
    const m = Math.pow(M, streak), b = bet;
    settle("coinflip", b, b * m, m); Shell.result(b, round2(b * m));
    active = false; streak = 0; seq = []; bet = 0;
    Shell.lock(false); Shell.setAction("Parier"); Shell.enable(true);
    const sec = $("#fAgain"); if (sec) { sec.disabled = true; sec.textContent = "Relancer"; }
    refresh();
  }
  reg({
    id: "coinflip", name: "Coin Flip", cat: "originals",
    rules: "Choisis pile ou face. Chaque bon côté multiplie ta mise par 1,98. Après un succès, encaisse ou relance pour doubler encore ; un seul mauvais côté et la série est perdue.",
    onAmount: refresh,
    mount(S) {
      active = false; streak = 0; seq = []; busy = false; bet = 0;
      S.mid(`<div class="field"><span class="lbl">Ton côté</span><div class="seg" id="fSide"><button class="${side === "pile" ? "on" : ""}" data-s="pile">Pile</button><button class="${side === "face" ? "on" : ""}" data-s="face">Face</button></div></div>
        <div class="field"><label class="lbl">Gain potentiel</label><div class="inp ro"><input id="fProfit" readonly tabindex="-1"><span class="sfx">${COIN}</span></div></div>`);
      S.bot(`<button class="btn btn-gray btn-block" id="fAgain" disabled>Relancer</button>
        <div class="mini-stats two"><div class="ms"><span>Multi. en jeu</span><b id="fMult">1.98×</b></div><div class="ms"><span>Série</span><b id="fSeq">0</b></div></div>`);
      const edges = Array.from({ length: 18 }, (_, i) => `<div class="edge" style="transform:rotateZ(${i * 20}deg) translateY(-68px) rotateX(90deg)"></div>`).join("");
      S.area.insertAdjacentHTML("beforeend", `<div class="coinstage"><div class="coin3d" id="fCoin" style="transform:rotateY(${rot}deg)">${edges}<div class="face h">PILE</div><div class="face t">FACE</div></div></div><div class="streak" id="fStreak"></div>`);
      $$("#fSide button").forEach(b => b.onclick = () => {
        if (busy || active) return;
        side = b.dataset.s;
        $$("#fSide button").forEach(x => x.classList.toggle("on", x === b));
      });
      $("#fAgain").onclick = () => { if (active && !busy) flip(); };
      S.setAction("Parier");
      S.onAct(() => { if (active) cash(); else flip(); });
      refresh();
    },
    unmount() {
      if (active) {
        closeRound("coinflip", bet, curM, true);
        if (curM > 1) toast("Coin Flip : encaissé automatiquement à " + fmtMult(curM) + ".");
      }
      active = false; busy = false;
    }
  });
})();
