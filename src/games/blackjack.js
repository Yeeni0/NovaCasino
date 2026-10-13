/* ---------------------------- BLACKJACK --------------------------- */
(function () {
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const SUITS = [["♠", "b"], ["♥", "r"], ["♦", "r"], ["♣", "b"]];
  let shoe = [], dealer = [], hands = [], hi = 0, staked = 0, base = 0, active = false, busy = false, shownD = 0, token = 0;
  function newShoe() {
    const rf = nextRng();
    shoe = [];
    for (let d = 0; d < 6; d++) for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s: s[0], c: s[1] });
    for (let i = shoe.length - 1; i > 0; i--) { const j = Math.floor(rf() * (i + 1)); const t = shoe[i]; shoe[i] = shoe[j]; shoe[j] = t; }
  }
  const draw = () => shoe.pop();
  function val(h) {
    let t = 0, a = 0;
    for (const c of h) { if (c.r === "A") { a++; t += 11; } else if ("JQK".includes(c.r)) t += 10; else t += +c.r; }
    while (t > 21 && a > 0) { t -= 10; a--; }
    return t;
  }
  const isBJ = h => h.length === 2 && val(h) === 21;
  const cval = c => (c.r === "A" ? 11 : "JQK".includes(c.r) || c.r === "10" ? 10 : +c.r);
  const anyLive = () => hands.some(h => val(h.cards) <= 21);
  function dealerFinal() {
    const d = dealer.slice(), sh = shoe.slice();
    if (anyLive() && !(hands.length === 1 && isBJ(hands[0].cards))) while (val(d) < 17 && sh.length) d.push(sh.pop());
    return d;
  }
  function computeRet(d) {
    const dv = val(d), dbj = isBJ(d);
    let ret = 0;
    hands.forEach(h => {
      const pv = val(h.cards);
      if (pv > 21) return;
      if (isBJ(h.cards) && hands.length === 1) { ret += dbj ? h.bet : h.bet * 2.5; return; }
      if (dbj) return;
      if (dv > 21 || pv > dv) ret += h.bet * 2;
      else if (pv === dv) ret += h.bet;
    });
    return round2(ret);
  }
  /* si la page se ferme, la main est réglée comme si le joueur restait */
  function savePend() { if (active) setPending("blackjack", staked, computeRet(dealerFinal()) / staked); }
  function cardHTML(c, hidden, isNew, k) {
    const st = isNew ? ` style="animation-delay:${(k || 0) * 110}ms"` : "";
    if (hidden) return `<div class="pc back${isNew ? " new" : ""}"${st}></div>`;
    return `<div class="pc ${c.c}${isNew ? " new" : ""}"${st}><div class="tl">${c.r}<small>${c.s}</small></div><div class="mid">${c.s}</div></div>`;
  }
  const scoreCls = (h, dv) => { const v = val(h); return v > 21 ? "bust" : isBJ(h) ? "bj" : dv !== undefined && (dv > 21 || v > dv) ? "win" : ""; };
  function render(reveal, final) {
    const d = $("#bjDealer"); if (!d) return;
    d.innerHTML = dealer.map((c, i) => cardHTML(c, i === 1 && !reveal, i >= shownD, i - shownD)).join("");
    shownD = dealer.length;
    const ds = $("#bjDScore");
    if (!dealer.length) { ds.textContent = "–"; ds.className = "score"; }
    else if (reveal) { ds.textContent = val(dealer); ds.className = "score " + (val(dealer) > 21 ? "bust" : isBJ(dealer) ? "bj" : ""); }
    else { ds.textContent = cval(dealer[0]); ds.className = "score"; }
    const dv = final ? val(dealer) : undefined;
    $("#bjHands").innerHTML = hands.length ? hands.map((h, i) => `
      <div class="bjhand ${active && hands.length > 1 && i === hi ? "act" : ""}">
        <div class="bjcards">${h.cards.map((c, k) => cardHTML(c, false, k >= h.shown, k - h.shown)).join("")}</div>
        <div class="score ${scoreCls(h.cards, dv)}">${val(h.cards)}</div>
        <div class="bjlabel">${fmt(h.bet)}${h.dbl ? " · doublée" : ""}</div></div>`).join("")
      : `<div class="bjhand"><div class="bjcards"></div><div class="score">–</div></div>`;
    hands.forEach(h => { h.shown = h.cards.length; });
    buttons();
    savePend();
  }
  function buttons() {
    const h = hands[hi], can = active && h && !h.done && !busy, two = can && h.cards.length === 2;
    const set = (id, on) => { const b = $(id); if (b) b.disabled = !on; };
    set("#bjHit", can); set("#bjStand", can);
    set("#bjDouble", two && state.balance >= h.bet - 1e-9);
    set("#bjSplit", two && hands.length === 1 && cval(h.cards[0]) === cval(h.cards[1]) && state.balance >= base - 1e-9);
  }
  function banner(text, color) {
    const r = $("#bjRes"); if (!r) return;
    r.textContent = text; r.style.color = color;
    r.classList.add("on");
    clearTimeout(r._t); r._t = setTimeout(() => r.classList.remove("on"), 1800);
  }
  function finish() {
    const ret = computeRet(dealer);
    active = false; busy = false;
    render(true, true);
    const m = ret / staked;
    settle("blackjack", staked, ret, m); Shell.result(staked, ret);
    if (ret > staked) banner("Gagné +" + fmt(ret - staked), "var(--green)");
    else if (Math.abs(ret - staked) < 1e-9) banner("Égalité", "var(--gold)");
    else banner("Perdu", "var(--red)");
    Shell.lock(false); Shell.setAction("Distribuer"); Shell.enable(true);
    buttons();
  }
  async function dealerPlay() {
    busy = true;
    const my = token;
    render(true);
    await sleep(450);
    if (anyLive()) {
      while (val(dealer) < 17) {
        if (my !== token || !$("#bjDealer")) return;
        dealer.push(draw());
        render(true); FX.sTick();
        await sleep(520);
      }
    }
    if (my !== token) return;
    finish();
  }
  function next() {
    const i = hands.findIndex(h => !h.done);
    if (i === -1) { dealerPlay(); return; }
    hi = i; render(false);
  }
  function hit() {
    const h = hands[hi]; if (!h || h.done || busy || !active) return;
    h.cards.push(draw()); FX.sTick();
    if (val(h.cards) >= 21) { h.done = true; render(false); busy = true; setTimeout(() => { busy = false; if (active) next(); }, 420); }
    else render(false);
  }
  function stand() { const h = hands[hi]; if (!h || h.done || busy || !active) return; h.done = true; next(); }
  function double() {
    const h = hands[hi]; if (!h || h.done || busy || h.cards.length !== 2) return;
    if (!canBet(h.bet)) return;
    takeBet(h.bet); staked += h.bet; h.bet *= 2; h.dbl = true;
    h.cards.push(draw()); h.done = true; FX.sCoin();
    render(false);
    busy = true; setTimeout(() => { busy = false; if (active) next(); }, 500);
  }
  function split() {
    const h = hands[hi];
    if (!h || busy || hands.length !== 1 || h.cards.length !== 2 || cval(h.cards[0]) !== cval(h.cards[1])) return;
    if (!canBet(base)) return;
    takeBet(base); staked += base;
    const c2 = h.cards.pop();
    h.cards.push(draw()); h.shown = 1;
    const nh = { cards: [c2, draw()], bet: base, done: false, shown: 1, dbl: false };
    hands.push(nh);
    if (h.cards[0].r === "A") { h.done = true; nh.done = true; }
    FX.sCoin();
    render(false);
    if (hands.every(x => x.done)) setTimeout(() => { if (active) next(); }, 600);
  }
  function deal(amount) {
    if (active || busy) return;
    if (!canBet(amount)) return;
    takeBet(amount);
    newShoe();
    base = amount; staked = amount;
    hands = [{ cards: [draw(), draw()], bet: amount, done: false, shown: 0, dbl: false }];
    dealer = [draw(), draw()];
    shownD = 0; hi = 0; active = true; token++;
    Shell.lock(true); Shell.enable(false);
    FX.sTick();
    render(false);
    if (isBJ(hands[0].cards) || isBJ(dealer)) {
      hands[0].done = true; busy = true; buttons();
      const my = token;
      setTimeout(() => { if (my === token && $("#bjDealer")) finish(); }, 800);
    }
  }
  reg({
    id: "blackjack", name: "Blackjack", cat: "originals", table: true, rtp: 99.4,
    rules: "Approche-toi de 21 sans dépasser et bats le croupier. Le croupier tire jusqu'à 17. Blackjack payé 3 pour 2, doublement sur les deux premières cartes, séparation d'une paire. Si tu quittes une main en cours, elle est jouée comme si tu restais.",
    mount(S) {
      active = false; busy = false; hands = []; dealer = []; staked = 0; shownD = 0; token++;
      S.bot(`<div class="acts"><button id="bjHit" disabled>Tirer</button><button id="bjStand" disabled>Rester</button><button id="bjSplit" disabled>Séparer</button><button id="bjDouble" disabled>Doubler</button></div>`);
      S.area.insertAdjacentHTML("beforeend", `<div class="bjres" id="bjRes"></div>
        <div class="bjtable">
          <div class="bjrow"><div class="bjlabel">Croupier · tire jusqu'à 17</div><div class="bjcards" id="bjDealer"></div><div class="score" id="bjDScore">–</div></div>
          <div class="bjrow"><div class="bjhands" id="bjHands"></div><div class="bjlabel">Blackjack payé 3:2</div></div></div>`);
      $("#bjHit").onclick = hit; $("#bjStand").onclick = stand; $("#bjDouble").onclick = double; $("#bjSplit").onclick = split;
      S.setAction("Distribuer");
      S.onAct(() => deal(S.amount()));
      render(false);
    },
    unmount() {
      token++;
      if (active) {
        const ret = computeRet(dealerFinal());
        closeRound("blackjack", staked, ret / staked, true);
        toast("Blackjack : main en cours jouée automatiquement (" + (ret > staked ? "+" + fmt(ret - staked) : ret === staked ? "égalité" : "perdue") + ").");
      }
      active = false; busy = false;
    }
  });
})();
