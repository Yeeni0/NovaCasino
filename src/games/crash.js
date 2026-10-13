/* ------------------------------ CRASH ----------------------------- */
(function () {
  const K = 0.00022;
  let raf = null, running = false, t0 = 0, crashAt = 2, cur = 1, bet = 0, cashed = false, H = 320;
  let hist = [], others = [], cvs = null, ctx = null, stars = [], boomT = 0;
  function resize() {
    if (!cvs) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    H = innerWidth < 760 ? 240 : 320;
    cvs.width = cvs.clientWidth * dpr; cvs.height = H * dpr;
    cvs.style.height = H + "px";
    ctx = cvs.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(running ? performance.now() - t0 : 0);
  }
  function draw(el) {
    if (!ctx) return;
    const W = cvs.clientWidth;
    ctx.clearRect(0, 0, W, H);
    if (!stars.length) stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.3, p: Math.random() * 6 }));
    const tw = performance.now() / 700;
    stars.forEach(s => { ctx.globalAlpha = .15 + .45 * Math.abs(Math.sin(tw + s.p)); ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fillStyle = "#dfe2ff"; ctx.fill(); });
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { const y = (H / 5) * i; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const tMax = Math.max(6000, el * 1.05), mMax = Math.max(2, cur * 1.25), pts = 90;
    const px = i => (el * (i / pts) / tMax) * (W - 30) + 14;
    const py = i => H - 16 - (K * el * (i / pts) / Math.log(mMax)) * (H - 50);
    const col = cashed ? "53,208,127" : running ? "79,91,255" : "255,79,109";
    ctx.beginPath(); ctx.moveTo(14, H - 16);
    for (let i = 0; i <= pts; i++) ctx.lineTo(px(i), py(i));
    ctx.lineTo(px(pts), H - 16); ctx.closePath();
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, `rgba(${col},.32)`); grd.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = grd; ctx.fill();
    ctx.beginPath(); ctx.moveTo(14, H - 16);
    for (let i = 0; i <= pts; i++) ctx.lineTo(px(i), py(i));
    ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();
    const tx = px(pts), ty = py(pts);
    const ang = Math.atan2(ty - py(pts - 2), tx - px(pts - 2)) || -0.5;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
    if (running) {
      const fl = 8 + Math.random() * 10;
      ctx.beginPath(); ctx.moveTo(-8, -4.5); ctx.lineTo(-8 - fl, 0); ctx.lineTo(-8, 4.5); ctx.closePath();
      ctx.fillStyle = "#ffb02e"; ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.quadraticCurveTo(4, -8, -8, -6); ctx.lineTo(-8, 6); ctx.quadraticCurveTo(4, 8, 14, 0);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(3, 0, 2.6, 0, 7); ctx.fillStyle = "#4f5bff"; ctx.fill();
    ctx.restore();
    if (boomT) {
      const k = (performance.now() - boomT) / 600;
      if (k < 1) {
        ctx.save(); ctx.translate(tx, ty); ctx.globalAlpha = 1 - k;
        ctx.beginPath(); ctx.arc(0, 0, 8 + k * 56, 0, 7); ctx.strokeStyle = "#ff4f6d"; ctx.lineWidth = 5 * (1 - k) + 1; ctx.stroke();
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, d = 10 + k * 64; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 4 * (1 - k) + 1, 0, 7); ctx.fillStyle = i % 2 ? "#ffc53d" : "#ff4f6d"; ctx.fill(); }
        ctx.restore(); ctx.globalAlpha = 1;
      } else boomT = 0;
    }
  }
  function setHist() { const h = $("#cHist"); if (h) h.innerHTML = hbadges(hist, x => `<span class="hb ${x >= 2 ? "w" : ""}">${x.toFixed(2)}×</span>`); }
  function loop() {
    const el = performance.now() - t0;
    cur = Math.exp(K * el);
    if (cur >= crashAt) { cur = crashAt; bust(); return; }
    const d = $("#cMult"); if (d) d.firstChild.nodeValue = cur.toFixed(2) + "×";
    others.forEach(o => {
      if (!o.done && cur >= o.at) {
        o.done = true;
        const lc = $("#cLive");
        if (lc) { lc.insertAdjacentHTML("afterbegin", `<div><span>${esc(o.n)}</span><b>${o.at.toFixed(2)}×</b></div>`); if (lc.children.length > 6) lc.lastElementChild.remove(); }
      }
    });
    if (!cashed && bet > 0) {
      const a = parseAmt(($("#cAuto") || {}).value);
      if (a > 1 && cur >= a) cashout(a);
      else Shell.label("Encaisser " + cur.toFixed(2) + "×");
    }
    draw(el);
    raf = requestAnimationFrame(loop);
  }
  function bust() {
    running = false;
    cancelAnimationFrame(raf);
    boomT = performance.now();
    const el0 = Math.log(crashAt) / K;
    const bl = () => { if (!ctx || !boomT) return; draw(el0); raf = requestAnimationFrame(bl); };
    raf = requestAnimationFrame(bl);
    const d = $("#cMult"); if (d) { d.firstChild.nodeValue = crashAt.toFixed(2) + "×"; d.className = "crashmult bust"; }
    if (!cashed && bet > 0) { settle("crash", bet, 0, 0); Shell.result(bet, 0); }
    hist.unshift(crashAt); hist = hist.slice(0, 8); setHist();
    bet = 0;
    Shell.lock(false); Shell.setAction("Parier"); Shell.enable(true);
    Shell.onAct(() => start(Shell.amount()));
  }
  function cashout(at) {
    if (!running || cashed || bet <= 0) return;
    cashed = true;
    const m = at ? round2(at) : Math.floor(cur * 100) / 100;
    settle("crash", bet, bet * m, m);
    Shell.result(bet, round2(bet * m));
    const d = $("#cMult"); if (d) d.className = "crashmult cashed";
    Shell.setAction("Encaissé à " + fmtMult(m), "cash");
    Shell.enable(false);
  }
  function start(amount) {
    if (running) return;
    if (!canBet(amount)) return;
    takeBet(amount);
    bet = amount; cashed = false; cur = 1; running = true; boomT = 0;
    crashAt = clamp(Math.floor((0.99 / Math.max(1e-9, 1 - nextRng()())) * 100) / 100, 1, 1e5);
    setPending("crash", bet, 0);
    others = Array.from({ length: 6 }, () => ({ n: pick(Chat.BOTS), at: round2(1.1 + Math.random() * 4.5), done: false }));
    const lc = $("#cLive"); if (lc) lc.innerHTML = "";
    const d = $("#cMult"); if (d) d.className = "crashmult";
    Shell.lock(true);
    Shell.setAction("Encaisser 1.00×", "cash");
    Shell.onAct(() => cashout());
    t0 = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }
  reg({
    id: "crash", name: "Crash", cat: "originals",
    rules: "Mise, puis regarde le multiplicateur grimper. Encaisse avant qu'il ne s'écrase : tu gagnes ta mise multipliée par la valeur au moment de l'encaissement. Il peut s'arrêter dès 1.00×.",
    mount(S) {
      running = false; cashed = false; bet = 0; boomT = 0;
      S.mid(`<div class="field"><label class="lbl" for="cAuto">Encaissement automatique</label><div class="inp"><input id="cAuto" inputmode="decimal" value="2.00"><span class="sfx">×</span></div></div>
        <p class="note">Mets 0 pour encaisser toi-même.</p>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="hist" id="cHist"></div>
        <div class="crashwrap"><canvas id="cCanvas"></canvas><div class="crashmult" id="cMult">1.00×<small>EN ATTENTE</small></div><div class="livecash" id="cLive"></div></div>`);
      cvs = $("#cCanvas");
      resize();
      window.addEventListener("resize", resize);
      setHist();
      S.setAction("Parier");
      S.onAct(() => start(S.amount()));
    },
    unmount() {
      if (running && !cashed && bet > 0) closeRound("crash", bet, 0, true);
      running = false; bet = 0;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cvs = null; ctx = null;
    }
  });
})();
