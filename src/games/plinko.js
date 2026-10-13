/* ------------------------------ PLINKO ---------------------------- */
(function () {
  const TABLES = {
    8: { faible: [5.6, 2.1, 1.1, 1, .5, 1, 1.1, 2.1, 5.6], moyen: [13, 3, 1.3, .7, .4, .7, 1.3, 3, 13], eleve: [29, 4, 1.5, .3, .2, .3, 1.5, 4, 29] },
    12: { faible: [10, 3, 1.6, 1.4, 1.1, 1, .5, 1, 1.1, 1.4, 1.6, 3, 10], moyen: [33, 11, 4, 2, 1.1, .6, .3, .6, 1.1, 2, 4, 11, 33], eleve: [170, 24, 8.1, 2, .7, .2, .2, .2, .7, 2, 8.1, 24, 170] },
    16: { faible: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, .5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16], moyen: [110, 41, 10, 5, 3, 1.5, 1, .5, .3, .5, 1, 1.5, 3, 5, 10, 41, 110], eleve: [1000, 130, 26, 9, 4, 2, .2, .2, .2, .2, .2, 2, 4, 9, 26, 130, 1000] }
  };
  const COLS = ["#ff3d5a", "#ff5a3d", "#ff7a2e", "#ff9a24", "#ffb21e", "#ffc53d", "#ffd65c"];
  const STEP = 100;
  let rows = 12, risk = "moyen", raf = null, balls = [], cvs = null, ctx = null, pegHit = {}, seq = 0;
  const table = () => TABLES[rows][risk];
  function bucketColor(i) { const n = rows + 1, mid = (n - 1) / 2; return COLS[Math.round((1 - Math.abs(i - mid) / mid) * (COLS.length - 1))]; }
  function drawBuckets() { const b = $("#pBuckets"); if (b) b.innerHTML = table().map((m, i) => `<div class="bk" style="background:${bucketColor(i)}">${m}×</div>`).join(""); }
  function resize() {
    if (!cvs) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = cvs.clientWidth, H = Math.round(W * .74);
    cvs.width = W * dpr; cvs.height = H * dpr; cvs.style.height = H + "px";
    ctx = cvs.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function geom() {
    const W = cvs.clientWidth, H = parseFloat(cvs.style.height);
    const sp = W / (rows + 3.2), top = 20, rowH = (H - top - 12) / rows;
    return { W, H, sp, top, rowH };
  }
  function lockSel(on) { ["#pRisk", "#pRows"].forEach(s => { const e = $(s); if (e) e.disabled = on || Shell._locked; }); }
  function ballPos(b, now, g) {
    const idx = Math.min(rows, Math.floor((now - b.t0) / STEP));
    const f = clamp(((now - b.t0) - idx * STEP) / STEP, 0, 1);
    const sumAt = i => { let s = 0; for (let k = 0; k < i; k++) s += b.bits[k]; return s; };
    const xAt = i => g.W / 2 + (2 * sumAt(i) - i) * g.sp / 2;
    const yAt = i => g.top + (i - 1) * g.rowH + g.rowH * .5;
    const x = xAt(idx) + (xAt(Math.min(rows, idx + 1)) - xAt(idx)) * f;
    const y0 = idx === 0 ? g.top - g.rowH * .6 : yAt(idx);
    const y = y0 + (yAt(idx + 1) - y0) * (f * f * .7 + f * .3);
    return { x, y: Math.min(y, g.H - 6), idx };
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!ctx) return;
    const g = geom(), now = performance.now();
    ctx.clearRect(0, 0, g.W, g.H);
    const rad = Math.max(1.8, g.sp * .085);
    for (let r = 0; r < rows; r++) for (let k = 0; k < r + 3; k++) {
      const x = g.W / 2 + (k - (r + 2) / 2) * g.sp, y = g.top + r * g.rowH;
      const h = pegHit[r + "_" + k], a = h ? Math.max(0, 1 - (now - h) / 260) : 0;
      if (a > 0) { ctx.beginPath(); ctx.arc(x, y, rad * 3.2, 0, 7); ctx.fillStyle = `rgba(255,197,61,${a * .35})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, rad + a * 1.4, 0, 7);
      ctx.fillStyle = a > 0 ? "#ffe39a" : "rgba(255,255,255,.72)"; ctx.fill();
    }
    balls.forEach(b => {
      const p = ballPos(b, now, g);
      if (b.last !== p.idx) {
        b.last = p.idx;
        if (p.idx >= 1 && p.idx <= rows) {
          let s0 = 0; for (let k = 0; k < p.idx - 1; k++) s0 += b.bits[k];
          pegHit[(p.idx - 1) + "_" + (s0 + 1)] = now;
          if (balls.length < 6) FX.tone(700 + Math.random() * 500, .025, { type: "square", vol: .012 });
        }
      }
      const br = Math.max(3.5, g.sp * .2);
      ctx.beginPath(); ctx.arc(p.x, p.y, br, 0, 7); ctx.fillStyle = "#ff5fa2"; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x - br * .3, p.y - br * .3, br * .35, 0, 7); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fill();
      if (p.idx >= rows && !b.landed) { b.landed = true; land(b); }
    });
    const before = balls.length;
    balls = balls.filter(b => !b.landed || now - b.t0 < (rows + 1) * STEP);
    if (before && !balls.length) lockSel(false);
  }
  function land(b) {
    const el = $$("#pBuckets .bk")[b.bucket];
    if (el) {
      el.classList.add("hit"); setTimeout(() => el.classList.remove("hit"), 180);
      const f = document.createElement("div");
      f.className = "fly"; f.textContent = b.m + "×";
      f.style.left = el.offsetLeft + "px"; f.style.width = el.offsetWidth + "px"; f.style.textAlign = "center"; f.style.top = (el.offsetTop - 8) + "px";
      el.parentElement.appendChild(f); setTimeout(() => f.remove(), 900);
    }
    clearPending(b.key);
    settle("plinko", b.amount, b.amount * b.m, b.m);
    Shell.result(b.amount, round2(b.amount * b.m));
    b.resolve({ payout: round2(b.amount * b.m) });
  }
  function drop(amount) {
    return new Promise(resolve => {
      if (balls.filter(b => !b.landed).length >= 16) return resolve({ payout: 0, skip: !Auto.running });
      if (!canBet(amount)) return resolve({ skip: true });
      takeBet(amount);
      const rf = nextRng();
      const bits = Array.from({ length: rows }, () => (rf() < .5 ? 0 : 1));
      const bucket = bits.reduce((a, c) => a + c, 0), m = table()[bucket], key = "plinko:" + (++seq);
      setPending("plinko", amount, m, key);
      balls.push({ t0: performance.now(), bits, bucket, m, amount, resolve, key, landed: false });
      lockSel(true);
    });
  }
  reg({
    id: "plinko", name: "Plinko", cat: "originals",
    rules: "Lâche une bille : elle rebondit sur les picots et tombe dans une case qui multiplie ta mise. Les bords paient le plus. Plus de rangées et un risque élevé = gains plus rares mais plus gros.",
    mount(S) {
      balls = []; pegHit = {};
      S.mid(`<div class="field"><label class="lbl" for="pRisk">Risque</label><div class="inp"><select id="pRisk">
          <option value="faible">Faible</option><option value="moyen">Moyen</option><option value="eleve">Élevé</option></select></div></div>
        <div class="field"><label class="lbl" for="pRows">Rangées</label><div class="inp"><select id="pRows"><option>8</option><option>12</option><option>16</option></select></div></div>`);
      $("#pRisk").value = risk; $("#pRows").value = String(rows);
      S.area.insertAdjacentHTML("beforeend", `<div class="plinko"><canvas id="pCanvas"></canvas><div class="buckets" id="pBuckets"></div></div>`);
      cvs = $("#pCanvas");
      resize(); drawBuckets();
      window.addEventListener("resize", resize);
      $("#pRisk").onchange = e => { risk = e.target.value; drawBuckets(); };
      $("#pRows").onchange = e => { rows = parseInt(e.target.value, 10); resize(); drawBuckets(); };
      S.setAction("Lâcher une bille");
      S.onAct(() => drop(S.amount()));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    },
    auto(amount) { return drop(amount); },
    unmount() {
      balls.forEach(b => { if (!b.landed) { b.landed = true; clearPending(b.key); closeRound("plinko", b.amount, b.m, true); b.resolve({ payout: 0, skip: true }); } });
      balls = [];
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cvs = null; ctx = null;
    }
  });
})();
