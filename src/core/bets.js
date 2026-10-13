/* ------------------------- mises ------------------------- */
function updateBalance() {
  const el = $("#balTxt");
  if (el && !FX.counting) el.textContent = fmt(state.balance);
}
function canBet(a) {
  if (!(a > 0)) { toast("Saisis un montant supérieur à 0.", true); return false; }
  if (a > state.balance + 1e-9) { toast("Solde insuffisant. Recharge-toi depuis la caisse.", true); return false; }
  return true;
}
function takeBet(a) {
  a = round2(a);
  state.lastAmount = a;
  state.balance = round2(state.balance - a);
  state.wagered = round2(state.wagered + a);
  state.count++;
  updateBalance();
  Store.save();
}
/** Partie en cours : on mémorise le multiplicateur acquis pour ne rien perdre si la page se ferme. */
function setPending(game, bet, mult, key) {
  key = key || game;
  state.pend = state.pend.filter(p => p.key !== key);
  state.pend.push({ key, game, bet, mult });
  Store.save();
}
function clearPending(key) { state.pend = state.pend.filter(p => p.key !== key); }
/** Ferme une partie interrompue : remboursement si rien n'a été joué, sinon règlement au multiplicateur acquis. */
function closeRound(game, bet, mult, quiet) {
  clearPending(game);
  if (mult === 1) {
    state.balance = round2(state.balance + bet);
    state.wagered = round2(Math.max(0, state.wagered - bet));
    state.count = Math.max(0, state.count - 1);
    updateBalance(); Store.save();
    return;
  }
  settle(game, bet, bet * mult, mult, quiet);
}
function resolvePending() {
  const list = state.pend || [];
  if (!list.length) return;
  state.pend = [];
  list.forEach(p => closeRound(p.game, p.bet, p.mult, true));
  const p = list[0], n = GAMES[p.game] ? GAMES[p.game].name : p.game;
  const msg = list.length > 1 ? `${list.length} parties interrompues ont été réglées automatiquement.`
    : p.mult === 1 ? `Partie de ${n} interrompue : mise remboursée.`
      : p.mult > 0 ? `Partie de ${n} récupérée : réglée à ${fmtMult(p.mult)}.` : `Partie de ${n} interrompue : mise perdue.`;
  setTimeout(() => toast(msg, list.length === 1 && p.mult === 0), 700);
}
/** Règle un pari (payout = 0 pour une perte). */
function settle(gameId, amount, payout, mult, quiet) {
  payout = round2(payout);
  const net = round2(payout - amount);
  state.balance = round2(state.balance + payout);
  state.profit = round2(state.profit + net);
  if (net > 0) state.wins++;
  if (net > state.best) state.best = net;
  if (mult > state.bestMult) state.bestMult = mult;
  const pg = state.perGame[gameId] || (state.perGame[gameId] = { n: 0, w: 0, wag: 0, net: 0, best: 0 });
  pg.n++; pg.wag = round2(pg.wag + amount); pg.net = round2(pg.net + net);
  if (net > 0) pg.w++;
  if (mult > pg.best) pg.best = mult;
  const rec = { game: gameId, amount, payout, mult, t: Date.now() };
  state.myBets.unshift(rec);
  if (state.myBets.length > 100) state.myBets.length = 100;
  if (net > 0) {
    state.topWins.push(rec);
    state.topWins.sort((a, b) => (b.payout - b.amount) - (a.payout - a.amount));
    if (state.topWins.length > 10) state.topWins.length = 10;
  }
  if (!quiet && typeof Draw !== "undefined") Draw.addWager(amount);
  clearPending(gameId);
  Store.save();
  if (!quiet) {
    if (typeof Feed !== "undefined") Feed.mine(rec);
    FX.result(mult, net, amount);
    if (typeof Chat !== "undefined") Chat.react(rec);
  } else updateBalance();
  return rec;
}
