/* ------------------------------ TOWER ----------------------------- */
(function () {
  const MODES = {
    facile: { n: 4, safe: 3, l: "Facile · 1 piège sur 4" }, moyen: { n: 3, safe: 2, l: "Moyen · 1 piège sur 3" },
    difficile: { n: 2, safe: 1, l: "Difficile · 1 piège sur 2" }, expert: { n: 3, safe: 1, l: "Expert · 2 pièges sur 3" },
    maitre: { n: 4, safe: 1, l: "Maître · 3 pièges sur 4" }
  };
  const ROWS = 8;
  const STAR = '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" fill="#ffc53d"/></svg>';
  const SKULL = '<svg viewBox="0 0 24 24"><path d="M12 3c-4.4 0-7 2.8-7 6.4 0 2 .9 3.4 2 4.3V17h10v-3.3c1.1-.9 2-2.3 2-4.3C19 5.8 16.4 3 12 3Z" fill="#ff4f6d"/><circle cx="9.4" cy="10" r="1.6" fill="#1a1c3a"/><circle cx="14.6" cy="10" r="1.6" fill="#1a1c3a"/><path d="M9 17v3h6v-3" fill="#ff4f6d"/></svg>';
  let diff = "moyen", active = false, level = 0, bet = 0, layout = [];
  const cfg = () => MODES[diff];
  const multFor = l => (l === 0 ? 1 : .99 * Math.pow(cfg().n / cfg().safe, l));
  function build() {
    const box = $("#tTower"); if (!box) return;
    const c = cfg();
    let h = "";
    for (let r = 0; r < ROWS; r++) {
      h += `<div class="trow" data-r="${r}" style="grid-template-columns:repeat(${c.n},1fr)">` +
        Array.from({ length: c.n }, (_, i) => `<button class="tile" data-r="${r}" data-i="${i}" aria-label="Étage ${r + 1}, case ${i + 1}"></button>`).join("") + "</div>";
    }
    box.innerHTML = h;
    $$("#tTower .tile").forEach(t => t.onclick = () => pickTile(+t.dataset.r, +t.dataset.i));
    mark();
  }
  function mark() {
    const box = $("#tTower"); if (!box) return;
    box.classList.toggle("run", active);
    $$("#tTower .trow").forEach(r => { const k = +r.dataset.r; r.classList.toggle("cur", active && k === level); r.classList.toggle("done", k < level); });
  }
  function panel() {
    const a = $("#tCur"), b = $("#tNext"), p = $("#tProfit"), r = $("#tRand");
    if (a) a.textContent = fmtMult(multFor(level));
    if (b) b.textContent = level < ROWS ? fmtMult(multFor(level + 1)) : "—";
    if (p) p.value = fmt(active ? bet * multFor(level) - bet : Shell.amount() * multFor(1) - Shell.amount());
    if (r) r.disabled = !active;
  }
  function start(amount) {
    if (!canBet(amount)) return;
    takeBet(amount);
    const c = cfg(), rf = nextRng();
    layout = [];
    for (let r = 0; r < ROWS; r++) {
      const idx = Array.from({ length: c.n }, (_, i) => i);
      for (let i = c.n - 1; i > 0; i--) { const j = Math.floor(rf() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      layout.push(idx.slice(0, c.safe));
    }
    bet = amount; level = 0; active = true;
    setPending("tower", bet, 1);
    build();
    Shell.lock(true); Shell.setAction("Encaisser", "cash"); Shell.enable(false);
    panel();
  }
  function end() { active = false; bet = 0; level = 0; Shell.lock(false); Shell.setAction("Parier"); Shell.enable(true); mark(); panel(); }
  function revealRow(r, hit) {
    $$(`#tTower .tile[data-r="${r}"]`).forEach(t => {
      const i = +t.dataset.i;
      t.classList.add("rev");
      t.innerHTML = layout[r].includes(i) ? STAR : SKULL;
      if (hit !== undefined && i !== hit) t.classList.add("dim");
      if (hit === i) t.classList.add(layout[r].includes(i) ? "gem" : "boom");
      t.disabled = true;
    });
  }
  function pickTile(r, i) {
    if (!active || r !== level) return;
    const ok = layout[r].includes(i);
    revealRow(r, i);
    if (!ok) {
      for (let x = 0; x < ROWS; x++) if (x !== r) revealRow(x, -1);
      FX.noise(.3, .08, 300);
      const b = bet;
      settle("tower", b, 0, 0); Shell.result(b, 0);
      end();
      return;
    }
    level++;
    FX.tone(560 + level * 80, .09, { vol: .06 });
    const m = multFor(level);
    setPending("tower", bet, m);
    Shell.setAction("Encaisser " + fmtMult(m), "cash"); Shell.enable(true);
    mark(); panel();
    if (level >= ROWS) cash();
  }
  function cash() {
    if (!active || level === 0) return;
    const m = multFor(level), b = bet;
    for (let x = level; x < ROWS; x++) revealRow(x, -1);
    settle("tower", b, b * m, m); Shell.result(b, round2(b * m));
    end();
  }
  reg({
    id: "tower", name: "Tower", cat: "originals",
    rules: "Grimpe la tour étage par étage en choisissant une case sûre à chaque niveau. Chaque étage franchi multiplie le gain ; encaisse avant de tomber sur un piège. La difficulté règle le nombre de pièges par étage.",
    onAmount: panel,
    mount(S) {
      active = false; level = 0; bet = 0;
      S.mid(`<div class="field"><label class="lbl" for="tDiff">Difficulté</label><div class="inp"><select id="tDiff">${Object.keys(MODES).map(k => `<option value="${k}" ${k === diff ? "selected" : ""}>${MODES[k].l}</option>`).join("")}</select></div></div>
        <div class="field"><label class="lbl">Gain en cours</label><div class="inp ro"><input id="tProfit" readonly tabindex="-1"><span class="sfx">${COIN}</span></div></div>`);
      S.bot(`<button class="btn btn-gray btn-block" id="tRand" disabled>Case au hasard</button>
        <div class="mini-stats two"><div class="ms"><span>Multi. actuel</span><b id="tCur">1.00×</b></div><div class="ms"><span>Étage suivant</span><b id="tNext"></b></div></div>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="tower" id="tTower"></div>`);
      build();
      $("#tDiff").onchange = e => { diff = e.target.value; build(); panel(); };
      $("#tRand").onclick = () => { if (active) pickTile(level, Math.floor(Math.random() * cfg().n)); };
      S.setAction("Parier");
      S.onAct(() => { if (active) cash(); else start(S.amount()); });
      panel();
    },
    unmount() {
      if (active) {
        const m = multFor(level);
        closeRound("tower", bet, m, true);
        if (level) toast("Tower : encaissé automatiquement à " + fmtMult(m) + ".");
      }
      active = false;
    }
  });
})();
