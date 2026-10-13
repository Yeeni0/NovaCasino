const TICKET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 9V6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V15a3 3 0 0 0 0-6Z"/><path d="M14 5v14" stroke-dasharray="2 2.5"/></svg>';

const fmtC = n => Math.round(n).toLocaleString("fr-FR");
const Draw = (function () {
  const FREE_MS = 12 * 3600 * 1000;
  const TICKET_COST = 250;
  const GRAND_HOUR = 20;
  const NB_PRIZES = 13;
  /* La largeur de chaque part est proportionnelle à sa probabilité (total 100). */
  const SEG = [
    { w: 22, k: "c", v: 50, t: "50", c: "#343766" },
    { w: 12, k: "c", v: 500, t: "500", c: "#4f5bff" },
    { w: 20, k: "c", v: 100, t: "100", c: "#2b2d55" },
    { w: 8, k: "c", v: 1000, t: "1 000", c: "#7a4bff" },
    { w: 16, k: "c", v: 250, t: "250", c: "#343766" },
    { w: 1, k: "c", v: 5000, t: "5 000", c: "#ffc53d" },
    { w: 10, k: "t", v: 1, t: "1 ticket", c: "#1f9d62" },
    { w: 4, k: "c", v: 2500, t: "2 500", c: "#a86bff" },
    { w: 5, k: "t", v: 3, t: "3 tickets", c: "#22b574" },
    { w: 2, k: "t", v: 10, t: "10 tickets", c: "#0d7a48" }
  ];
  const P = (r, a) => { const t = (a - 90) * Math.PI / 180; return [200 + r * Math.cos(t), 200 + r * Math.sin(t)]; };
  const D = () => state.draw;
  let spinning = false, timer = null;

  /* ---------- temps ---------- */
  const freeReady = () => Date.now() - (D().lastFree || 0) >= FREE_MS;
  const freeIn = () => Math.max(0, FREE_MS - (Date.now() - (D().lastFree || 0)));
  function nextGrand(from) {
    const base = from || Date.now(), d = new Date(base);
    d.setHours(GRAND_HOUR, 0, 0, 0);
    if (d.getTime() <= base) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  function hms(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(x => String(x).padStart(2, "0"));
  }
  /* valeurs stables pour une même journée */
  const dayKey = ts => { const d = new Date(ts); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const seeded = n => { const x = Math.sin(n * 1.37) * 10000; return x - Math.floor(x); };
  const potFor = ts => 60000 + Math.round(seeded(dayKey(ts)) * 180) * 500;
  const fieldFor = ts => 6000 + Math.round(seeded(dayKey(ts) + 7) * 9000);
  function prizesFor(ts) {
    const pot = potFor(ts);
    const l = [{ r: 1, v: pot }, { r: 2, v: Math.round(pot / 4 / 100) * 100 }, { r: 3, v: Math.round(pot / 10 / 100) * 100 }];
    for (let i = 0; i < NB_PRIZES - 3; i++) l.push({ r: 4 + i, v: 1000 });
    return l;
  }
  function chancePct(tickets, field) {
    if (!tickets) return 0;
    return (1 - Math.pow(field / (field + tickets), NB_PRIZES)) * 100;
  }

  /* ---------- roue ---------- */
  function wheelSVG() {
    const R1 = 192, R2 = 60;
    let out = "", a0 = 0;
    SEG.forEach(s => {
      const a1 = a0 + s.w * 3.6, mid = (a0 + a1) / 2;
      const [x1, y1] = P(R1, a0), [x2, y2] = P(R1, a1), [x3, y3] = P(R2, a1), [x4, y4] = P(R2, a0);
      out += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${R1} ${R1} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}L${x3.toFixed(1)} ${y3.toFixed(1)}A${R2} ${R2} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)}Z" fill="${s.c}" stroke="#12132b" stroke-width="2"/>`;
      out += `<g transform="rotate(${mid.toFixed(2)} 200 200)"><text x="200" y="80" transform="rotate(90 200 80)" text-anchor="middle" dominant-baseline="central"
        font-family="Rubik,Arial,sans-serif" font-size="16" font-weight="800" fill="${s.c === "#ffc53d" ? "#3d2500" : "#fff"}">${s.t}</text></g>`;
      a0 = a1;
    });
    return `<svg viewBox="0 0 400 400" aria-hidden="true"><g id="dwG" style="transform-origin:200px 200px">${out}</g>
      <circle cx="200" cy="200" r="196" fill="none" stroke="#2b2d55" stroke-width="8"/>
      <circle cx="200" cy="200" r="60" fill="#12132b"/></svg>`;
  }
  function bulbsHTML(n) {
    let h = "";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI;
      h += `<i style="left:${(50 + 50 * Math.sin(a)).toFixed(2)}%;top:${(50 - 50 * Math.cos(a)).toFixed(2)}%"></i>`;
    }
    return h;
  }
  const midAngle = i => SEG.slice(0, i).reduce((a, s) => a + s.w * 3.6, 0) + SEG[i].w * 1.8;
  function pickSeg() {
    const r = Math.random() * 100;
    let a = 0;
    for (let i = 0; i < SEG.length; i++) { a += SEG[i].w; if (r < a) return i; }
    return 0;
  }

  /* ---------- roue gratuite ---------- */
  function spinFree() {
    if (spinning || !freeReady()) return;
    const d = D();
    spinning = true;
    const box = $("#wheelBox"); if (box) box.classList.add("spinning");
    const btn = $("#drawSpin"); if (btn) { btn.disabled = true; btn.textContent = "La roue tourne…"; }
    const i = pickSeg(), seg = SEG[i];
    const now = Date.now();
    d.streak = (d.lastFree && now - d.lastFree < FREE_MS * 3) ? Math.min(7, (d.streak || 0) + 1) : 1;
    d.lastFree = now;
    const bonus = 1 + (d.streak - 1) * 0.1;
    const gain = seg.k === "c" ? Math.round(seg.v * bonus) : seg.v;
    /* le lot est acquis tout de suite : fermer la page pendant l'animation ne le fait pas perdre */
    if (seg.k === "c") state.balance = round2(state.balance + gain); else d.tickets += gain;
    d.hist.unshift({ t: now, k: seg.k === "c" ? "w" : "wt", v: gain, streak: d.streak });
    if (d.hist.length > 40) d.hist.length = 40;
    Store.save();
    Analytics.track("Roue gratuite", { lot: seg.t });
    const g = $("#dwG"), ptr = $("#dPtr");
    const start = 0, jitter = (Math.random() - .5) * SEG[i].w * 3.6 * .6;
    const end = 360 * 6 + (360 - midAngle(i)) - jitter;
    let lastTick = 0;
    const done = () => {
      spinning = false;
      if (box) box.classList.remove("spinning");
      if (seg.k === "c") FX.countTo(state.balance, 900); else updateBalance();
      const hub = $("#dHub");
      if (hub) {
        hub.dataset.done = "1";
        hub.innerHTML = `<b>${seg.k === "c" ? fmtC(gain) : gain + (gain > 1 ? " tickets" : " ticket")}</b><span>${seg.k === "c" ? "CRÉDITS" : "GAGNÉS"}</span>`;
        hub.classList.remove("hit"); void hub.offsetWidth; hub.classList.add("hit");
      }
      FX.sChime(4);
      FX.buzz([30, 40, 30]);
      const r = box ? box.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      FX.burst(seg.v >= 2500 ? 70 : 28, r.left + r.width / 2, r.top + r.height / 2, 11, true);
      if (seg.k === "c" && gain >= 2500) { FX.bigWin("Roue gratuite", gain, 1, 1400); FX.rain(60); }
      toast(seg.k === "c"
        ? `Roue gratuite : +${fmtC(gain)} crédits${d.streak > 1 ? ` (série ${d.streak} : +${(d.streak - 1) * 10} %)` : ""}.`
        : `Roue gratuite : +${gain} ticket${gain > 1 ? "s" : ""} pour le grand tirage.`);
      paint();
      paintBadge();
      if (typeof Chat !== "undefined" && !P().guest && seg.v >= 1000)
        Chat.add(`<span class="u" style="color:var(--gold)">${esc(P().name)}</span> a gagné <span class="g">${seg.k === "c" ? "+" + fmtC(gain) : gain + " tickets"}</span> à la roue gratuite`, "win");
    };
    if (!FX.anim) { if (g) g.style.transform = `rotate(${end}deg)`; return done(); }
    tween(5200, k => {
      const W = start + (end - start) * easeOutQuart(k);
      if (g) g.style.transform = `rotate(${W}deg)`;
      if (W - lastTick > 12) {
        lastTick = W;
        if (ptr) { ptr.classList.add("tick"); setTimeout(() => ptr.classList.remove("tick"), 60); }
        FX.tone(1150 + Math.random() * 280, .028, { type: "square", vol: .014 + .02 * (1 - k) });
      }
    }, done);
  }

  /* ---------- grand tirage ---------- */
  function runDue() {
    const d = D();
    if (!d.next) { d.next = nextGrand(); Store.save(); return null; }
    let last = null, guard = 0;
    while (Date.now() >= d.next && guard++ < 40) {
      const ts = d.next, tickets = d.tickets, field = fieldFor(ts), prizes = prizesFor(ts);
      let won = null;
      if (tickets > 0) for (const p of prizes) { if (Math.random() < tickets / (tickets + field)) { won = p; break; } }
      const rec = { t: ts, k: "g", v: won ? won.v : 0, rank: won ? won.r : 0, tickets };
      if (won) state.balance = round2(state.balance + won.v);
      if (tickets > 0) { d.hist.unshift(rec); last = rec; }
      d.tickets = 0;
      d.next = nextGrand(ts);
    }
    if (d.hist.length > 40) d.hist.length = 40;
    Store.save();
    return last;
  }
  function resultModal(rec) {
    const won = rec.v > 0;
    openModal(won ? "Tu as gagné au grand tirage !" : "Résultat du grand tirage", `
      <div class="dresult">
        <span class="note">Tirage du ${new Date(rec.t).toLocaleDateString("fr-FR")} à 20 h · ${rec.tickets} ticket${rec.tickets > 1 ? "s" : ""} joué${rec.tickets > 1 ? "s" : ""}</span>
        ${won ? `<div class="big">${COIN}<span>+${fmtC(rec.v)}</span></div><span class="tk-chip">${rec.rank}${rec.rank === 1 ? "er" : "e"} lot remporté</span>`
        : `<div class="big" style="color:var(--muted)">Pas cette fois</div><span class="note">Tes tickets sont repartis à zéro. Rejoue pour en gagner d'autres.</span>`}
      </div>
      <button class="btn btn-gold btn-block" data-act="go-draw">Voir le prochain tirage</button>`);
    if (won) {
      FX.sChime(6); FX.buzz([60, 50, 60, 50, 140]);
      FX.countTo(state.balance, 1600);
      FX.bigWin("Grand tirage", rec.v, 1, 2000);
      FX.rain(140);
      FX.burst(80, innerWidth / 2, innerHeight * .4, 13, true);
    }
  }

  /* ---------- tickets gagnés en jouant ---------- */
  function addWager(amount) {
    const d = D();
    if (!d) return;
    d.prog = round2((d.prog || 0) + amount);
    let n = 0;
    while (d.prog >= TICKET_COST && d.tickets < 99999) { d.prog = round2(d.prog - TICKET_COST); d.tickets++; n++; }
    if (n) {
      toast(`+${n} ticket${n > 1 ? "s" : ""} pour le grand tirage de 20 h.`);
      paintBadge();
      paint();
    }
  }

  /* ---------- pastilles ---------- */
  function paintBadge() {
    const on = freeReady();
    $$("[data-drawdot]").forEach(host => {
      const dot = host.querySelector(".ready-dot");
      if (on && !dot) host.insertAdjacentHTML("beforeend", '<span class="ready-dot"></span>');
      if (!on && dot) dot.remove();
    });
  }

  /* ---------- gagnants simulés ---------- */
  function winnersFor(ts) {
    const prizes = prizesFor(ts), out = [];
    const names = Chat.BOTS;
    prizes.forEach((p, i) => {
      const n = names[Math.floor(seeded(dayKey(ts) + i * 13) * names.length)];
      out.push({ name: n, rank: p.r, v: p.v });
    });
    return out;
  }

  /* ---------- page ---------- */
  function render() {
    const d = D();
    const field = fieldFor(d.next), pot = potFor(d.next);
    const prizes = prizesFor(d.next);
    const lastGrand = d.hist.find(h => h.k === "g");
    const winners = winnersFor(lastGrand ? lastGrand.t : d.next - 86400000);
    const histRow = h => {
      const lbl = h.k === "g" ? (h.v > 0 ? `Grand tirage · ${h.rank}${h.rank === 1 ? "er" : "e"} lot` : "Grand tirage · perdu")
        : h.k === "wt" ? `Roue gratuite · ${h.v} ticket${h.v > 1 ? "s" : ""}` : "Roue gratuite";
      return `<div class="winner"><div><div>${lbl}</div><small>${ago(h.t)}</small></div>
        ${h.k === "wt" ? `<b style="color:#b3b9ff">+${h.v} ${TICKET}</b>` : h.v > 0 ? `<b>+${fmtC(h.v)}${COIN}</b>` : `<b style="color:var(--dim)">—</b>`}</div>`;
    };
    $("#view").innerHTML = `<div class="wrap">
      <section class="draw-hero rv">
        <h1>Tirage <em>gratuit</em></h1>
        <p>Une roue gratuite toutes les 12 heures, des tickets gagnés simplement en jouant, et un grand tirage chaque soir à 20 h. Zéro euro, jamais : tout se gagne en jouant.</p>
        <div class="draw-stats">
          <div><span>Cagnotte de ce soir</span><b class="tnum">${fmtC(pot)}</b></div>
          <div><span>Mes tickets</span><b class="tnum" id="dTk">${d.tickets}</b></div>
          <div><span>Mes chances</span><b class="tnum" id="dCh">${chancePct(d.tickets, field).toFixed(2)} %</b></div>
          <div><span>Prochaine roue</span><b class="tnum" id="dFree">${freeReady() ? "Prête" : hms(freeIn()).slice(0, 2).join(" : ")}</b></div>
        </div>
      </section>

      <div class="draw-grid">
        <section class="box draw-card rv">
          <h2>Ta roue gratuite</h2>
          <p class="note">Une rotation offerte toutes les 12 h. Chaque jour d'affilée ajoute +10 % sur les crédits gagnés.</p>
          <div class="wheelbox" id="wheelBox">
            <div class="glow"></div>
            <div class="dwheel">${wheelSVG()}</div>
            <div class="bulbs">${bulbsHTML(24)}</div>
            <div class="dptr" id="dPtr"><svg viewBox="0 0 32 42"><path d="M16 41C10 28 3 21 3 13a13 13 0 0 1 26 0c0 8-7 15-13 28Z" fill="#ffd76b" stroke="#a5720a" stroke-width="2"/><circle cx="16" cy="13" r="5" fill="#3d2500"/></svg></div>
            <div class="dhub" id="dHub"><b>${freeReady() ? "Prête !" : hms(freeIn()).slice(0, 2).join(":")}</b><span>ROUE GRATUITE</span></div>
          </div>
          <div class="cdown" id="dCount"></div>
          <button class="btn btn-gold btn-block" id="drawSpin" style="height:48px;margin-top:8px">Tourner la roue</button>
          <div class="streaks" id="dStreak"></div>
          <p class="note" style="text-align:center;margin-top:8px">Série : <b style="color:var(--text)" id="dStreakN">${d.streak || 0}</b> / 7 jours</p>
        </section>

        <section class="box draw-card rv">
          <h2>Grand tirage de 20 h</h2>
          <p class="note">Chaque ticket est une chance. Les tickets partent tous au tirage, puis le compteur repart à zéro.</p>
          <div class="pot" style="margin-top:14px">${COIN}<span class="tnum">${fmtC(pot)}</span></div>
          <div class="cdown" id="gCount"></div>
          <div class="tkline">
            <span class="tk-chip">${TICKET}<span id="dTk2">${d.tickets}</span> ticket${d.tickets > 1 ? "s" : ""}</span>
            <span class="note">${fieldFor(d.next).toLocaleString("fr-FR")} tickets en jeu · <b style="color:var(--text)" id="dCh2">${chancePct(d.tickets, field).toFixed(2)} %</b> de chances</span>
          </div>
          <div class="tick-bar"><i id="dProg" style="width:${((d.prog || 0) / TICKET_COST * 100).toFixed(1)}%"></i></div>
          <p class="note" style="margin-top:6px">1 ticket offert tous les <b style="color:var(--text)">${TICKET_COST}</b> crédits misés sur les jeux.</p>
          <div class="prizes">
            ${prizes.slice(0, 3).map(p => `<div class="prize"><i class="g${p.r}">${p.r}${p.r === 1 ? "er" : "e"}</i>${p.r === 1 ? "Gros lot" : p.r === 2 ? "Deuxième lot" : "Troisième lot"}<b>${fmtC(p.v)}${COIN}</b></div>`).join("")}
            <div class="prize"><i>×10</i>Lots de consolation<b>${fmtC(1000)}${COIN}</b></div>
          </div>
          <a class="linkish" href="#/jeux" style="margin-top:12px">Gagner des tickets en jouant</a>
        </section>
      </div>

      <section class="sec rv"><div class="box">
        <div class="box-head"><h2>Gagnants du dernier tirage</h2><span class="note">${lastGrand ? ago(lastGrand.t) : "hier soir"}</span></div>
        <div class="winners" style="padding:6px">
          ${lastGrand && lastGrand.v > 0 ? `<div class="winner me">${avatar(P(), "sm")}<div><div>${esc(P().name)}</div><small>${lastGrand.rank}${lastGrand.rank === 1 ? "er" : "e"} lot</small></div><b>+${fmtC(lastGrand.v)}${COIN}</b></div>` : ""}
          ${winners.slice(0, 6).map(w => `<div class="winner"><span class="avatar sm" style="background:${AV_COLORS[w.name.length % AV_COLORS.length]}">${esc(initials(w.name))}</span>
            <div><div>${esc(w.name)}</div><small>${w.rank}${w.rank === 1 ? "er" : "e"} lot</small></div><b>+${fmtC(w.v)}${COIN}</b></div>`).join("")}
        </div></div></section>

      <section class="sec rv"><div class="box">
        <div class="box-head"><h2>Mes tirages</h2></div>
        <div class="winners" style="padding:6px">${d.hist.length ? d.hist.slice(0, 12).map(histRow).join("")
        : `<div class="empty" style="border:0;background:none">Aucun tirage pour l'instant. Tourne ta roue gratuite !</div>`}</div>
      </div></section>
    </div>`;
    $("#drawSpin").onclick = spinFree;
    paint();
    start();
    revealInit();
  }

  /* ---------- rafraîchissement ---------- */
  function paint() {
    const d = D();
    if (!$("#drawSpin")) return;
    const field = fieldFor(d.next);
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set("#dTk", d.tickets); set("#dTk2", d.tickets);
    set("#dCh", chancePct(d.tickets, field).toFixed(2) + " %");
    set("#dCh2", chancePct(d.tickets, field).toFixed(2) + " %");
    const prog = $("#dProg"); if (prog) prog.style.width = ((d.prog || 0) / TICKET_COST * 100).toFixed(1) + "%";
    set("#dStreakN", d.streak || 0);
    const st = $("#dStreak");
    if (st) st.innerHTML = Array.from({ length: 7 }, (_, i) => `<i class="${i < (d.streak || 0) ? "on" : ""}"></i>`).join("");
    const btn = $("#drawSpin"), ready = freeReady();
    if (btn && !spinning) {
      btn.disabled = !ready;
      btn.textContent = ready ? "Tourner la roue" : "Roue déjà utilisée";
      btn.className = "btn btn-block " + (ready ? "btn-gold" : "btn-gray");
    }
    tickClocks();
  }
  function tickClocks() {
    const d = D();
    const f = hms(freeIn()), g = hms(Math.max(0, d.next - Date.now()));
    const box = (el, arr, labels) => {
      if (!el) return;
      el.innerHTML = arr.map((v, i) => `<div><b>${v}</b><span>${labels[i]}</span></div>`).join("");
    };
    const dc = $("#dCount");
    if (freeReady()) { if (dc) dc.innerHTML = '<div style="min-width:190px"><b style="font-size:15px;color:var(--green)">Rotation disponible</b><span>offerte, maintenant</span></div>'; }
    else box(dc, f, ["heures", "min", "sec"]);
    box($("#gCount"), g, ["heures", "min", "sec"]);
    const hub = $("#dHub");
    if (hub && !spinning && !(hub.dataset.done === "1" && !freeReady())) hub.innerHTML = freeReady() ? "<b>Prête !</b><span>ROUE GRATUITE</span>" : `<b>${f[0]}:${f[1]}:${f[2]}</b><span>PROCHAINE ROUE</span>`;
    const fr = $("#dFree"); if (fr) fr.textContent = freeReady() ? "Prête" : f[0] + " : " + f[1];
  }
  function start() { stop(); timer = setInterval(() => { if (!document.hidden) { tickClocks(); checkDue(); } }, 1000); }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (spinning) { spinning = false; updateBalance(); }
  }
  function checkDue() {
    if (Date.now() < D().next) return;
    const rec = runDue();
    if (rec) resultModal(rec);
    if ($("#drawSpin")) render();
  }

  function init() {
    const d = D();
    if (!d.next) d.next = nextGrand();
    const rec = runDue();
    paintBadge();
    if ($("#drawSpin")) render();
    if (rec) setTimeout(() => resultModal(rec), 900);
    setInterval(paintBadge, 30000);
    Store.save();
  }

  /* ---------- bannière d'accueil ---------- */
  function homeBanner() {
    const d = D(), pot = potFor(d.next || nextGrand()), ready = freeReady();
    return `<a class="promo gold" href="#/tirage">
      <div class="pt-txt"><small>TIRAGE GRATUIT</small>
        <h2>${ready ? "Ta roue gratuite t'attend" : "Grand tirage ce soir à 20 h"}</h2>
        <p>${fmtC(pot)} crédits à gagner ce soir. Roue offerte toutes les 12 h, et 1 ticket tous les ${TICKET_COST} crédits misés.</p>
        <span class="btn">${ready ? "Tourner la roue" : "Voir le tirage"}</span></div>
      <div class="pa">${wheelSVG()}</div></a>`;
  }

  return { init, render, stop, paintBadge, addWager, homeBanner, freeReady, potFor, nextGrand, TICKET_COST };
})();
