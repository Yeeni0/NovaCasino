/* ---------------------------- ROULETTE ---------------------------- */
(function () {
  const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colorOf = n => (n === 0 ? "green" : RED.has(n) ? "red" : "black");
  const A = 360 / 37;
  const P = (r, a) => { const t = a * Math.PI / 180; return [200 + r * Math.sin(t), 200 - r * Math.cos(t)]; };
  let bets = {}, undoStack = [], rmode = "place", spinning = false, past = [], wheelRot = 0, token = 0, pend = null;
  const total = () => round2(Object.values(bets).reduce((a, b) => a + b, 0));
  function wheelSVG() {
    const R1 = 170, R2 = 122;
    let sec = "", lab = "";
    ORDER.forEach((n, i) => {
      const a0 = i * A, a1 = (i + 1) * A;
      const [x1, y1] = P(R1, a0), [x2, y2] = P(R1, a1), [x3, y3] = P(R2, a1), [x4, y4] = P(R2, a0);
      const c = colorOf(n);
      sec += `<path d="M${x1} ${y1}A${R1} ${R1} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${R2} ${R2} 0 0 0 ${x4} ${y4}Z" fill="${c === "red" ? "#d33a4a" : c === "green" ? "#1f9d62" : "#23254a"}" stroke="#c9a86a" stroke-width="1.2"/>`;
      lab += `<text x="200" y="${200 - 150}" transform="rotate(${a0 + A / 2} 200 200)" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="800" fill="#fff" font-family="Rubik,Arial,sans-serif">${n}</text>`;
    });
    return `<svg viewBox="0 0 400 400" id="rSvg">
      <circle cx="200" cy="200" r="199" fill="#2b1a10"/><circle cx="200" cy="200" r="192" fill="#171831"/><circle cx="200" cy="200" r="182" fill="#0f1024"/>
      <g id="rWheelG">${sec}
        <circle cx="200" cy="200" r="122" fill="#34375f"/><circle cx="200" cy="200" r="80" fill="#2a2c4d"/>
        <circle cx="200" cy="200" r="30" fill="#e0a82e"/><path d="M200 164v72M164 200h72" stroke="#e0a82e" stroke-width="8" stroke-linecap="round"/>
        <circle cx="200" cy="200" r="13" fill="#ffd36b"/>${lab}</g>
      <circle id="rShadow" cx="200" cy="18" r="7" fill="#000" opacity=".35"/><circle id="rBall" cx="200" cy="18" r="7" fill="#f4f5ff"/></svg>`;
  }
  function setBall(ang, r) {
    const [x, y] = P(r, ang), b = $("#rBall"), s = $("#rShadow");
    if (b) { b.setAttribute("cx", x.toFixed(1)); b.setAttribute("cy", y.toFixed(1)); }
    if (s) { s.setAttribute("cx", (x + 2).toFixed(1)); s.setAttribute("cy", (y + 3).toFixed(1)); }
  }
  function chipTxt(v) { return v >= 1000 ? (Math.round(v / 100) / 10) + "k" : String(round2(v)); }
  function paintBets() {
    $$("#rGrid [data-k], #rOut [data-k]").forEach(el => {
      const old = el.querySelector(".chip"); if (old) old.remove();
      const k = el.dataset.k;
      if (bets[k]) el.insertAdjacentHTML("beforeend", `<span class="chip">${chipTxt(bets[k])}</span>`);
    });
    const t = $("#rTotal"); if (t) t.value = fmt(total());
  }
  function add(k) {
    if (spinning) return;
    if (rmode === "remove") return removeChip(k);
    const a = Shell.amount();
    if (!(a > 0)) return toast("Choisis la valeur du jeton.", true);
    if (total() + a > state.balance + 1e-9) return toast("Solde insuffisant.", true);
    bets[k] = round2((bets[k] || 0) + a);
    undoStack.push({ k, a });
    $$(".rn.won").forEach(x => x.classList.remove("won"));
    FX.sTick();
    paintBets();
  }
  function removeChip(k) {
    if (spinning || !bets[k]) return;
    const a = Shell.amount();
    bets[k] = round2(bets[k] - (a > 0 ? a : bets[k]));
    if (bets[k] <= .001) delete bets[k];
    FX.sTick();
    paintBets();
  }
  function payoutFor(k, n) {
    if (/^n\d+$/.test(k)) return +k.slice(1) === n ? 36 : 0;
    if (n === 0) return 0;
    switch (k) {
      case "red": return colorOf(n) === "red" ? 2 : 0;
      case "black": return colorOf(n) === "black" ? 2 : 0;
      case "odd": return n % 2 === 1 ? 2 : 0;
      case "even": return n % 2 === 0 ? 2 : 0;
      case "low": return n <= 18 ? 2 : 0;
      case "high": return n >= 19 ? 2 : 0;
      case "d1": return n <= 12 ? 3 : 0;
      case "d2": return n >= 13 && n <= 24 ? 3 : 0;
      case "d3": return n >= 25 ? 3 : 0;
      case "c1": return n % 3 === 1 ? 3 : 0;
      case "c2": return n % 3 === 2 ? 3 : 0;
      case "c3": return n % 3 === 0 ? 3 : 0;
      default: return 0;
    }
  }
  function status(t, live) { const s = $("#rStatus"); if (s) { s.textContent = t; s.classList.toggle("live", !!live); } }
  function spin() {
    if (spinning) return;
    const stake = total();
    if (stake <= 0) return toast("Pose au moins un jeton sur le tapis.", true);
    if (!canBet(stake)) return;
    takeBet(stake);
    spinning = true;
    Shell.lock(true); Shell.enable(false);
    status("RIEN NE VA PLUS", true);
    const my = ++token, idx = Math.floor(nextRng()() * 37), n = ORDER[idx];
    let pay = 0;
    Object.keys(bets).forEach(k => { pay += bets[k] * payoutFor(k, n); });
    pay = round2(pay);
    const m = pay / stake;
    pend = { stake, m };
    setPending("roulette", stake, m);
    const pocket = idx * A + A / 2, start = wheelRot, end = start + 360 * 3 + Math.random() * 180, rel = 360 * 7;
    const g = $("#rWheelG");
    let lastF = 0, lastT = 0;
    FX.noise(.5, .04, 2600);
    tween(FX.anim ? 5200 : 300, k => {
      if (my !== token) return;
      const W = start + (end - start) * easeOutQuart(k);
      wheelRot = W;
      if (g) g.setAttribute("transform", `rotate(${W} 200 200)`);
      const B = W + pocket - rel * (1 - (1 - Math.pow(1 - k, 3.1)));
      let r = 181;
      if (k > .55) { const p = Math.min(1, (k - .55) / .45); r = 146 + 35 * Math.abs(Math.cos(p * Math.PI * 2.5)) * (1 - p); }
      setBall(B, r);
      const f = Math.floor((B - W) / A), now = performance.now();
      if (f !== lastF && now - lastT > 40 && k < .98) { lastF = f; lastT = now; FX.tone(1500 + Math.random() * 600, .025, { type: "square", vol: .02 * (1 - k) + .005 }); }
    }, () => {
      if (my !== token) return;
      spinning = false; pend = null;
      const cell = $(`#rGrid [data-k="n${n}"]`); if (cell) cell.classList.add("won");
      past.unshift(n); past = past.slice(0, 12);
      const pl = $("#rLast"); if (pl) pl.innerHTML = past.map(x => `<i class="${colorOf(x)}">${x}</i>`).join("");
      status(n + " · " + { red: "ROUGE", black: "NOIR", green: "VERT" }[colorOf(n)] + (pay > 0 ? " · +" + fmt(pay - stake) : ""), pay > stake);
      undoStack = [];
      settle("roulette", stake, pay, m); Shell.result(stake, pay);
      Shell.lock(false); Shell.enable(true);
    });
  }
  reg({
    id: "roulette", name: "Roulette", cat: "originals", table: true, rtp: 97.3, betLabel: "Valeur du jeton",
    rules: "Roulette européenne à un zéro. Pose des jetons sur les numéros (36×) ou sur les chances simples, douzaines et colonnes, puis lance la bille. Les jetons restent sur le tapis pour rejouer ; clic droit ou mode « Retirer » pour enlever un jeton.",
    mount(S) {
      bets = {}; spinning = false; undoStack = []; rmode = "place"; pend = null;
      S.mid(`<div class="field"><label class="lbl">Total sur le tapis</label><div class="inp ro"><input id="rTotal" readonly tabindex="-1" value="0.00"><span class="sfx">${COIN}</span></div></div>
        <div class="seg"><button id="rUndo">Annuler</button><button id="rDouble">Doubler</button><button id="rClear">Effacer</button></div>
        <div class="seg"><button id="rPlace" class="on">Poser</button><button id="rRemove">Retirer</button></div>`);
      const pos = n => {
        const dc = Math.ceil(n / 3) + 1, dr = n % 3 === 0 ? 1 : n % 3 === 2 ? 2 : 3;
        return `--c:${dc};--r:${dr};--mc:${((n - 1) % 3) + 1};--mr:${Math.ceil(n / 3) + 1}`;
      };
      let nums = `<button class="rn green" data-k="n0" style="--c:1;--r:1 / span 3;--mc:1 / span 3;--mr:1">0</button>`;
      for (let n = 1; n <= 36; n++) nums += `<button class="rn ${colorOf(n)}" data-k="n${n}" style="${pos(n)}">${n}</button>`;
      S.area.insertAdjacentHTML("beforeend", `<div class="rtable">
          <div class="rwheel">${wheelSVG()}<div class="rstatus" id="rStatus">FAITES VOS JEUX</div></div>
          <div class="rlast" id="rLast">${past.map(x => `<i class="${colorOf(x)}">${x}</i>`).join("")}</div>
          <div class="numgrid" id="rGrid">${nums}</div>
          <div class="outside" id="rOut">
            <button class="obet wide" data-k="d1">1 à 12</button><button class="obet wide" data-k="d2">13 à 24</button><button class="obet wide" data-k="d3">25 à 36</button>
            <button class="obet" data-k="low">1-18</button><button class="obet" data-k="even">Pair</button><button class="obet red" data-k="red">Rouge</button>
            <button class="obet black" data-k="black">Noir</button><button class="obet" data-k="odd">Impair</button><button class="obet" data-k="high">19-36</button>
            <button class="obet wide" data-k="c1">Colonne 1</button><button class="obet wide" data-k="c2">Colonne 2</button><button class="obet wide" data-k="c3">Colonne 3</button>
          </div></div>`);
      const wr = ORDER.indexOf(past[0] || 0);
      wheelRot = 0;
      setBall(wr * A + A / 2, 146);
      $$("#rGrid [data-k], #rOut [data-k]").forEach(el => {
        el.onclick = () => add(el.dataset.k);
        el.oncontextmenu = ev => { ev.preventDefault(); removeChip(el.dataset.k); };
      });
      const setMode = m => { rmode = m; $("#rPlace").classList.toggle("on", m === "place"); $("#rRemove").classList.toggle("on", m === "remove"); };
      $("#rPlace").onclick = () => setMode("place");
      $("#rRemove").onclick = () => setMode("remove");
      $("#rUndo").onclick = () => {
        if (spinning) return;
        const last = undoStack.pop();
        if (!last) return toast("Rien à annuler.", true);
        bets[last.k] = round2((bets[last.k] || 0) - last.a);
        if (bets[last.k] <= .001) delete bets[last.k];
        paintBets();
      };
      $("#rClear").onclick = () => { if (!spinning) { bets = {}; undoStack = []; paintBets(); } };
      $("#rDouble").onclick = () => {
        if (spinning) return;
        if (!total()) return toast("Pose d'abord un jeton.", true);
        if (total() * 2 > state.balance + 1e-9) return toast("Solde insuffisant pour doubler.", true);
        Object.keys(bets).forEach(k => { bets[k] = round2(bets[k] * 2); });
        paintBets();
      };
      S.setAction("Lancer la bille");
      S.onAct(spin);
      paintBets();
    },
    unmount() {
      token++;
      if (spinning && pend) closeRound("roulette", pend.stake, pend.m, true);
      spinning = false; pend = null; bets = {};
    }
  });
})();
