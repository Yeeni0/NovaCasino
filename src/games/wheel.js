/* ------------------------------ WHEEL ----------------------------- */
(function () {
  const SETS = {
    faible: [0, 1.2, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.5],
    moyen: [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3],
    eleve: [0, 0, 0, 0, 0, 0, 0, 0, 0, 9.9]
  };
  const COL = m => (m === 0 ? "#2a2c4d" : m < 1.4 ? "#b9c2d6" : m < 1.8 ? "#35d07f" : m < 2.5 ? "#4f5bff" : m < 5 ? "#a86bff" : "#ffc53d");
  const P = (r, a) => { const t = a * Math.PI / 180; return [200 + r * Math.sin(t), 200 - r * Math.cos(t)]; };
  let risk = "moyen", rot = 0, spinning = false, token = 0, pend = null;
  const segs = () => SETS[risk];
  function svg() {
    const s = segs(), a = 360 / s.length, R1 = 186, R2 = 124;
    let out = "", pegs = "";
    s.forEach((m, i) => {
      const [x1, y1] = P(R1, i * a), [x2, y2] = P(R1, (i + 1) * a), [x3, y3] = P(R2, (i + 1) * a), [x4, y4] = P(R2, i * a);
      out += `<path d="M${x1} ${y1}A${R1} ${R1} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${R2} ${R2} 0 0 0 ${x4} ${y4}Z" fill="${COL(m)}" stroke="#171831" stroke-width="3"/>`;
      const [px, py] = P(192, i * a);
      pegs += `<circle cx="${px}" cy="${py}" r="4" fill="#fff"/>`;
    });
    return `<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="199" fill="#171831"/><g id="wG" style="transform-origin:200px 200px;transform:rotate(${rot}deg)">${out}${pegs}</g></svg>`;
  }
  function paint() {
    const b = $("#wSvg"); if (b) b.innerHTML = svg();
    const lg = $("#wLeg");
    if (lg) lg.innerHTML = [...new Set(segs())].sort((x, y) => x - y).map(m => `<span><i style="background:${COL(m)}"></i>${m.toFixed(2)}×</span>`).join("");
  }
  function spin(amount) {
    return new Promise(res => {
      if (spinning) return res({ skip: true });
      if (!canBet(amount)) return res({ skip: true });
      takeBet(amount);
      spinning = true;
      Shell.lock(true); Shell.enable(false);
      const my = ++token, s = segs(), a = 360 / s.length;
      const idx = Math.floor(nextRng()() * s.length), m = s[idx];
      pend = { amount, m };
      setPending("wheel", amount, m);
      const start = rot, target = -(idx * a + a / 2 - (Math.random() - .5) * a * .7);
      let end = start + 360 * (Auto.running ? 3 : 5);
      end += ((target - end) % 360 + 360) % 360;
      rot = end % 360;
      const g = $("#wG"), flap = $("#wFlap");
      let lastSeg = -1;
      tween(FX.anim ? (Auto.running ? 2200 : 4200) : 300, k => {
        if (my !== token) return;
        const W = start + (end - start) * easeOutQuart(k);
        if (g) g.style.transform = `rotate(${W}deg)`;
        const seg = Math.floor(((((-W) % 360) + 360) % 360) / a);
        if (seg !== lastSeg) {
          lastSeg = seg;
          if (flap) { flap.classList.add("tick"); setTimeout(() => flap.classList.remove("tick"), 60); }
          FX.tone(1100 + Math.random() * 300, .03, { type: "square", vol: .015 + .02 * (1 - k) });
        }
      }, () => {
        if (my !== token) return res({ skip: true });
        spinning = false; pend = null;
        Shell.lock(false); Shell.enable(true);
        const hub = $("#wHub");
        if (hub) { hub.classList.remove("hit"); void hub.offsetWidth; hub.classList.add("hit"); }
        const v = $("#wVal"); if (v) { v.textContent = m.toFixed(2) + "×"; v.style.color = m > 0 ? COL(m) === "#b9c2d6" ? "#fff" : COL(m) : "var(--muted)"; }
        settle("wheel", amount, amount * m, m); Shell.result(amount, round2(amount * m));
        res({ payout: round2(amount * m) });
      });
    });
  }
  reg({
    id: "wheel", name: "Wheel", cat: "originals",
    rules: "Fais tourner la roue : le segment sous le repère donne le multiplicateur appliqué à ta mise. Un segment sombre perd la mise. En risque élevé, un seul segment paie 9,90×.",
    mount(S) {
      spinning = false; pend = null;
      S.mid(`<div class="field"><label class="lbl" for="wRisk">Risque</label><div class="inp"><select id="wRisk">
        <option value="faible">Faible</option><option value="moyen">Moyen</option><option value="eleve">Élevé</option></select></div></div>`);
      $("#wRisk").value = risk;
      S.area.insertAdjacentHTML("beforeend", `<div class="wbox"><div class="wsvg" id="wSvg"></div>
          <div class="flapper" id="wFlap"><svg viewBox="0 0 26 34"><path d="M13 33C8 22 2 16 2 11a11 11 0 0 1 22 0c0 5-6 11-11 22Z" fill="#fff"/><circle cx="13" cy="11" r="4.5" fill="#4f5bff"/></svg></div>
          <div class="whub" id="wHub"><b id="wVal">–</b><span>RÉSULTAT</span></div></div>
        <div class="wlegend" id="wLeg"></div>`);
      paint();
      $("#wRisk").onchange = e => { risk = e.target.value; paint(); };
      S.setAction("Faire tourner");
      S.onAct(() => spin(S.amount()));
    },
    auto(amount) { return spin(amount); },
    unmount() {
      token++;
      if (spinning && pend) closeRound("wheel", pend.amount, pend.m, true);
      spinning = false; pend = null;
    }
  });
})();
