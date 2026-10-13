const SLOT = (function () {
  const SYM = {
    C: '<svg viewBox="0 0 48 48"><path d="M24 8c-2 8-8 12-10 20M24 8c3 7 8 10 11 18" stroke="#2e9a4f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 8c5-3 10-2 13 1-4 3-9 3-13-1Z" fill="#38b85c"/><circle cx="14" cy="32" r="9" fill="#e5304a"/><circle cx="35" cy="30" r="9" fill="#e5304a"/><circle cx="11" cy="29" r="2.5" fill="#fff" opacity=".6"/><circle cx="32" cy="27" r="2.5" fill="#fff" opacity=".6"/></svg>',
    L: '<svg viewBox="0 0 48 48"><path d="M6 25c0-9 8-15 18-15s18 6 18 15-8 14-18 14S6 34 6 25Z" fill="#ffd93d"/><path d="M4 25l4-3v6ZM44 25l-4-3v6Z" fill="#f2c200"/><ellipse cx="18" cy="20" rx="6" ry="3" fill="#fff" opacity=".5"/></svg>',
    G: '<svg viewBox="0 0 48 48"><path d="M24 10c2-4 6-5 9-4" stroke="#2e9a4f" stroke-width="3" fill="none" stroke-linecap="round"/><g fill="#8b4ed8"><circle cx="17" cy="17" r="6"/><circle cx="29" cy="17" r="6"/><circle cx="23" cy="26" r="6"/><circle cx="11" cy="26" r="5.5"/><circle cx="35" cy="26" r="5.5"/><circle cx="17" cy="34" r="6"/><circle cx="29" cy="34" r="6"/><circle cx="23" cy="42" r="5"/></g><circle cx="15" cy="15" r="1.8" fill="#fff" opacity=".6"/><circle cx="27" cy="15" r="1.8" fill="#fff" opacity=".6"/></svg>',
    B: '<svg viewBox="0 0 48 48"><path d="M24 6c-9 0-13 8-13 16v8l-4 6h34l-4-6v-8c0-8-4-16-13-16Z" fill="#ffc53d"/><path d="M11 30h26" stroke="#e39a12" stroke-width="3"/><circle cx="24" cy="40" r="4.5" fill="#e39a12"/><circle cx="24" cy="5" r="2.5" fill="#e39a12"/><path d="M17 14c1-3 3-5 6-5" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/></svg>',
    S: '<svg viewBox="0 0 48 48"><path d="m24 4 5.9 12.1 13.3 1.9-9.6 9.4 2.3 13.2L24 34.4l-11.9 6.2 2.3-13.2-9.6-9.4 13.3-1.9Z" fill="#4f5bff" stroke="#2f39c9" stroke-width="2" stroke-linejoin="round"/><path d="m24 13 2.7 5.5 6 .9-4.3 4.2 1 6L24 26.8l-5.4 2.8 1-6-4.3-4.2 6-.9Z" fill="#9aa1ff"/></svg>',
    7: '<svg viewBox="0 0 48 48"><text x="24" y="40" text-anchor="middle" font-family="Rubik,Arial Black,sans-serif" font-weight="900" font-size="42" fill="#e5304a" stroke="#8a0f22" stroke-width="2.5" paint-order="stroke">7</text></svg>'
  };
  const REELS = [
    "C L G C B L S C G L 7 C L B G C L S G B".split(" "),
    "L C B G C L 7 G C S L B C G L C S L G B".split(" "),
    "G C L S C B L G C 7 L C G B L C S G L B".split(" ")
  ];
  const PAY = { 7: 60, S: 18, B: 10, G: 5, L: 2.8, C: 2 };
  const CHERRY2 = .4;
  const LINES = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
  /** Évalue une grille grid[reel][row] ; renvoie le multiplicateur total et les lignes gagnantes. */
  function evaluate(grid) {
    let m = 0;
    const wins = [];
    LINES.forEach((ln, li) => {
      const a = grid[0][ln[0]], b = grid[1][ln[1]], c = grid[2][ln[2]];
      if (a === b && b === c) { m += PAY[a] / 1; wins.push({ li, n: 3, s: a }); }
      else if (a === "C" && b === "C") { m += CHERRY2; wins.push({ li, n: 2, s: "C" }); }
    });
    return { m: round2(m), wins };
  }
  return { SYM, REELS, PAY, CHERRY2, LINES, evaluate };
})();

(function () {
  const { SYM, REELS, PAY, LINES, evaluate } = SLOT;
  let stops = [0, 5, 10], spinning = false, token = 0, pend = null;
  const windowOf = (r, s) => [0, 1, 2].map(k => REELS[r][(s + k) % 20]);
  const cellH = () => { const r = $(".reel"); return r ? r.clientHeight / 3 : 88; };
  function stripHTML(list) { return list.map(s => `<div class="sym">${SYM[s]}</div>`).join(""); }
  function paintStatic() {
    $$(".reel .strip").forEach((st, r) => { st.style.transition = "none"; st.style.transform = "translateY(0)"; st.innerHTML = stripHTML(windowOf(r, stops[r])); });
    const pl = $("#slLines"); if (pl) pl.innerHTML = "";
  }
  function drawWins(wins) {
    const pl = $("#slLines"); if (!pl) return;
    const cx = [50, 150, 250], cy = [50, 150, 250];
    pl.innerHTML = wins.map(w => `<polyline points="${LINES[w.li].slice(0, w.n).map((row, r) => cx[r] + "," + cy[row]).join(" ")}" fill="none" stroke="#ffc53d" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".9"/>`).join("");
    wins.forEach(w => LINES[w.li].slice(0, w.n).forEach((row, r) => {
      const cell = $$(".reel")[r].querySelectorAll(".sym")[row];
      if (cell) cell.classList.add("hit");
    }));
  }
  function spin(amount) {
    return new Promise(res => {
      if (spinning) return res({ skip: true });
      if (!canBet(amount)) return res({ skip: true });
      takeBet(amount);
      spinning = true;
      Shell.lock(true); Shell.enable(false);
      const my = ++token, rf = nextRng();
      const old = stops.slice();
      stops = [0, 1, 2].map(() => Math.floor(rf() * 20));
      const grid = stops.map((s, r) => windowOf(r, s));
      const { m, wins } = evaluate(grid);
      pend = { amount, m };
      setPending("slots", amount, m);
      const box = $("#slot"); if (box) box.classList.add("spin");
      const pl = $("#slLines"); if (pl) pl.innerHTML = "";
      const h = cellH(), fast = Auto.running || !FX.anim;
      const reels = $$(".reel .strip");
      reels.forEach((st, r) => {
        const filler = Array.from({ length: (fast ? 6 : 14) + r * (fast ? 3 : 6) }, () => REELS[r][Math.floor(Math.random() * 20)]);
        const list = [...grid[r], ...filler, ...windowOf(r, old[r])];
        st.style.transition = "none";
        st.innerHTML = stripHTML(list);
        st.style.transform = `translateY(${-(list.length - 3) * h}px)`;
        void st.offsetHeight;
        const dur = (fast ? 450 : 900) + r * (fast ? 180 : 380);
        st.style.transition = `transform ${dur}ms cubic-bezier(.3,.85,.35,1.04)`;
        st.style.transform = "translateY(0)";
        setTimeout(() => { if (my === token) FX.tone(420 - r * 40, .07, { type: "square", vol: .04 }); }, dur);
      });
      const total = (fast ? 450 : 900) + 2 * (fast ? 180 : 380) + 80;
      setTimeout(() => {
        if (my !== token) return res({ skip: true });
        spinning = false; pend = null;
        if (box) box.classList.remove("spin");
        paintStatic();
        drawWins(wins);
        settle("slots", amount, amount * m, m); Shell.result(amount, round2(amount * m));
        Shell.lock(false); Shell.enable(true);
        res({ payout: round2(amount * m) });
      }, total);
    });
  }
  reg({
    id: "slots", name: "Nova Fruits", cat: "slots", rtp: 96.5, isNew: true,
    rules: "Machine à sous à 3 rouleaux et 5 lignes (3 horizontales, 2 diagonales). Trois symboles identiques sur une ligne paient le multiple de ta mise totale indiqué dans le tableau ; deux cerises en début de ligne paient 0,4×. Les gains de plusieurs lignes s'additionnent.",
    mount(S) {
      spinning = false; pend = null;
      S.mid(`<p class="note">Mise totale répartie sur 5 lignes. Les gains sont exprimés en multiples de la mise totale.</p>`);
      const pays = [["7", PAY[7]], ["S", PAY.S], ["B", PAY.B], ["G", PAY.G], ["L", PAY.L], ["C", PAY.C]]
        .map(([s, v]) => `<div>${SYM[s]}${SYM[s]}${SYM[s]}<b>${String(v).replace(".", ",")}×</b></div>`).join("") + `<div>${SYM.C}${SYM.C}<b>0,4×</b></div>`;
      S.area.insertAdjacentHTML("beforeend", `<div class="slot" id="slot">
          <div class="slot-top"><i class="lamp"></i>NOVA FRUITS<i class="lamp"></i></div>
          <div class="reels">${[0, 1, 2].map(() => '<div class="reel"><div class="strip"></div></div>').join("")}
            <div class="paylines"><svg viewBox="0 0 300 300" preserveAspectRatio="none" id="slLines"></svg></div></div>
          <div class="slot-pay">${pays}</div></div>`);
      paintStatic();
      S.setAction("Lancer");
      S.onAct(() => spin(S.amount()));
    },
    auto(amount) { return spin(amount); },
    unmount() {
      token++;
      if (spinning && pend) closeRound("slots", pend.amount, pend.m, true);
      spinning = false; pend = null;
    }
  });
})();
