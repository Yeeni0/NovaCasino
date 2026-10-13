/* ------------------------------ MINES ----------------------------- */
(function () {
  const GEM = '<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9Z" fill="#35c9ff"/><path d="M6 3h12l4 6H2Z" fill="#9deaff"/><path d="M8.5 9h7L12 21Z" fill="#62d7ff"/><path d="M2 9h6.5L12 21Z" fill="#1aa6e6"/></svg>';
  const BOMB = '<svg viewBox="0 0 24 24"><circle cx="11" cy="14" r="7.5" fill="#1a1c3a" stroke="#ff4f6d" stroke-width="1.6"/><circle cx="8.5" cy="11.5" r="2" fill="#fff" opacity=".3"/><path d="M15.5 8.5 18 6" stroke="#c9a36a" stroke-width="2" stroke-linecap="round"/><circle cx="19" cy="5" r="2.3" fill="#ffc53d"/></svg>';
  let mines = 3, active = false, field = [], picked = 0, bet = 0;
  const comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
  const multFor = k => (k === 0 ? 1 : .99 * comb(25, k) / comb(25 - mines, k));
  function panel() {
    const a = $("#mCur"), b = $("#mNext"), p = $("#mProfit"), r = $("#mRand");
    if (a) a.textContent = fmtMult(multFor(picked));
    if (b) b.textContent = picked < 25 - mines ? fmtMult(multFor(picked + 1)) : "—";
    if (p) p.value = fmt(active ? bet * multFor(picked) - bet : Shell.amount() * multFor(1) - Shell.amount());
    if (r) r.disabled = !active;
  }
  function build() {
    const g = $("#mGrid"); if (!g) return;
    g.innerHTML = Array.from({ length: 25 }, (_, i) => `<button class="tile" data-i="${i}" aria-label="Case ${i + 1}"></button>`).join("");
    $$("#mGrid .tile").forEach(t => t.onclick = () => pickTile(+t.dataset.i));
  }
  function start(amount) {
    if (!canBet(amount)) return;
    takeBet(amount);
    bet = amount; picked = 0; active = true;
    const rf = nextRng(), idx = Array.from({ length: 25 }, (_, i) => i);
    for (let i = 24; i > 0; i--) { const j = Math.floor(rf() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    field = Array(25).fill(false);
    idx.slice(0, mines).forEach(i => { field[i] = true; });
    setPending("mines", bet, 1);
    build();
    Shell.lock(true); Shell.setAction("Encaisser", "cash"); Shell.enable(false);
    panel();
  }
  function revealAll(hit) {
    $$("#mGrid .tile").forEach((t, i) => {
      t.disabled = true;
      if (t.classList.contains("rev")) return;
      t.classList.add("rev");
      if (i !== hit) t.classList.add("dim");
      t.innerHTML = field[i] ? BOMB : GEM;
    });
  }
  function end() { active = false; bet = 0; picked = 0; Shell.lock(false); Shell.setAction("Parier"); Shell.enable(true); panel(); }
  function pickTile(i) {
    if (!active) return;
    const t = $$("#mGrid .tile")[i];
    if (!t || t.classList.contains("rev")) return;
    if (field[i]) {
      t.classList.add("rev", "boom"); t.innerHTML = BOMB;
      FX.noise(.3, .08, 300);
      revealAll(i);
      const b = bet;
      settle("mines", b, 0, 0); Shell.result(b, 0);
      end();
      return;
    }
    t.classList.add("rev", "gem"); t.innerHTML = GEM; t.disabled = true;
    picked++;
    FX.tone(620 + picked * 70, .09, { vol: .06 });
    const m = multFor(picked);
    setPending("mines", bet, m);
    Shell.setAction("Encaisser " + fmtMult(m), "cash"); Shell.enable(true);
    panel();
    if (picked === 25 - mines) cashout();
  }
  function cashout() {
    if (!active || picked === 0) return;
    const m = multFor(picked), b = bet;
    revealAll(-1);
    settle("mines", b, b * m, m); Shell.result(b, round2(b * m));
    end();
  }
  reg({
    id: "mines", name: "Mines", cat: "originals",
    rules: "Une grille de 25 cases cache des gemmes et des mines. Retourne des cases : chaque gemme augmente le multiplicateur. Encaisse quand tu veux ; une mine et la mise est perdue. Plus il y a de mines, plus chaque gemme rapporte.",
    onAmount: panel,
    mount(S) {
      active = false; picked = 0; bet = 0;
      S.mid(`<div class="grid2"><div class="field"><label class="lbl" for="mCount">Mines</label><div class="inp"><select id="mCount">${Array.from({ length: 24 }, (_, i) => i + 1).map(n => `<option ${n === mines ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
        <div class="field"><label class="lbl">Gemmes</label><div class="inp ro"><input id="mGems" readonly tabindex="-1" value="${25 - mines}"></div></div></div>
        <div class="field"><label class="lbl">Gain en cours</label><div class="inp ro"><input id="mProfit" readonly tabindex="-1"><span class="sfx">${COIN}</span></div></div>`);
      S.bot(`<button class="btn btn-gray btn-block" id="mRand" disabled>Case au hasard</button>
        <div class="mini-stats two"><div class="ms"><span>Multi. actuel</span><b id="mCur">1.00×</b></div><div class="ms"><span>Case suivante</span><b id="mNext"></b></div></div>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="mgrid" id="mGrid"></div>`);
      build();
      $("#mCount").onchange = e => { mines = +e.target.value; $("#mGems").value = 25 - mines; panel(); };
      $("#mRand").onclick = () => {
        if (!active) return;
        const free = $$("#mGrid .tile").map((t, i) => (t.classList.contains("rev") ? -1 : i)).filter(i => i >= 0);
        if (free.length) pickTile(pick(free));
      };
      S.setAction("Parier");
      S.onAct(() => { if (active) cashout(); else start(S.amount()); });
      panel();
    },
    unmount() {
      if (active) {
        const m = multFor(picked);
        closeRound("mines", bet, m, true);
        if (picked) toast("Mines : encaissé automatiquement à " + fmtMult(m) + ".");
      }
      active = false;
    }
  });
})();
