/* ------------------------- effets & sons ------------------------- */
const FX = {
  ac: null, master: null, cvs: null, ctx: null, parts: [], raf: null, sprites: null, counting: false,
  get snd() { return DB.settings.sound; },
  get anim() { return DB.settings.fx; },
  init() {
    this.cvs = $("#fx");
    this.ctx = this.cvs.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cvs.width = innerWidth * dpr; this.cvs.height = innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },
  buildSprites() {
    try {
      this.sprites = [];
      for (let i = 0; i < 10; i++) {
        const c = document.createElement("canvas");
        c.width = c.height = 48;
        const x = c.getContext("2d");
        const rx = Math.max(1.5, 21 * Math.abs(Math.cos((i / 10) * Math.PI)));
        x.translate(24, 24);
        x.beginPath(); x.ellipse(0, 0, rx, 21, 0, 0, 7); x.fillStyle = "#e39a12"; x.fill();
        x.beginPath(); x.ellipse(0, 0, rx * .86, 18, 0, 0, 7); x.fillStyle = "#ffc53d"; x.fill();
        x.beginPath(); x.ellipse(0, 0, rx * .56, 11.5, 0, 0, 7); x.fillStyle = "#f0a91c"; x.fill();
        x.beginPath(); x.ellipse(-rx * .3, -9, rx * .18, 4, -.5, 0, 7); x.fillStyle = "rgba(255,255,255,.6)"; x.fill();
        this.sprites.push(c);
      }
    } catch (e) { this.sprites = null; }
  },
  audio() {
    if (!this.snd) return null;
    try {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ac = new AC();
        this.master = this.ac.createGain(); this.master.gain.value = .8;
        this.master.connect(this.ac.destination);
      }
      if (this.ac.state === "suspended") this.ac.resume();
      return this.ac;
    } catch (e) { return null; }
  },
  tone(f, dur, o) {
    const ac = this.audio(); if (!ac) return;
    o = o || {};
    const t = ac.currentTime + (o.at || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || "triangle";
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol == null ? .08 : o.vol, t + (o.atk || .01));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur + .05);
  },
  noise(dur, vol, hp) {
    const ac = this.audio(); if (!ac) return;
    try {
      const n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = hp ? "highpass" : "lowpass"; f.frequency.value = hp || 900;
      const g = ac.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(this.master); src.start();
    } catch (e) { }
  },
  sTick() { this.tone(900, .04, { type: "square", vol: .025 }); },
  sClick() { this.tone(620, .05, { type: "sine", vol: .05 }); },
  sCoin() { this.tone(1180, .08, { type: "square", vol: .035 }); this.tone(1720, .1, { type: "square", vol: .03, at: .06 }); },
  sLose() { this.tone(220, .22, { type: "sine", vol: .06, slide: 110 }); },
  sChime(n) { const b = [523, 659, 784, 1047, 1319, 1568]; for (let i = 0; i < Math.min(6, n); i++) this.tone(b[i], .22, { vol: .07, at: i * .07 }); },
  buzz(p) { if (DB.settings.vib && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } },

  /* particules */
  burst(n, x, y, power, confetti) {
    if (!this.anim) return;
    if (!this.sprites) this.buildSprites();
    const cols = ["#4f5bff", "#ff5fa2", "#35d07f", "#ffc53d", "#2cb5f5", "#fff"];
    for (let i = 0; i < n && this.parts.length < 500; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * (power || 8);
      const coin = !confetti || Math.random() < .5;
      this.parts.push({ c: coin, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, g: .25 + Math.random() * .12,
        s: coin ? 7 + Math.random() * 6 : 4 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .35,
        col: pick(cols), life: 0, max: 110 + Math.random() * 60 });
    }
    this.run();
  },
  rain(n) {
    if (!this.anim) return;
    if (!this.sprites) this.buildSprites();
    for (let i = 0; i < n && this.parts.length < 500; i++) {
      this.parts.push({ c: Math.random() < .7, x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .8,
        vx: (Math.random() - .5) * 1.5, vy: 3 + Math.random() * 3, g: .12, s: 6 + Math.random() * 6, r: Math.random() * 6,
        vr: (Math.random() - .5) * .3, col: pick(["#4f5bff", "#ff5fa2", "#35d07f", "#ffc53d"]), life: 0, max: 400 });
    }
    this.run();
  },
  run() {
    if (this.raf) return;
    const step = () => {
      const x = this.ctx, W = innerWidth, H = innerHeight;
      x.clearRect(0, 0, W, H);
      this.parts = this.parts.filter(p => {
        p.life++; p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y > H + 40 || p.life > p.max) return false;
        x.save(); x.translate(p.x, p.y);
        x.globalAlpha = clamp((p.max - p.life) / 30, 0, 1);
        if (p.c && this.sprites) {
          x.drawImage(this.sprites[Math.floor(Math.abs(p.r / Math.PI) % 1 * this.sprites.length)], -p.s, -p.s, p.s * 2, p.s * 2);
        } else { x.rotate(p.r); x.fillStyle = p.col; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.6); }
        x.restore();
        return true;
      });
      if (this.parts.length) this.raf = requestAnimationFrame(step);
      else { x.clearRect(0, 0, W, H); this.raf = null; }
    };
    this.raf = requestAnimationFrame(step);
  },

  countTo(target, dur) {
    const el = $("#balTxt"); if (!el) return;
    const from = parseAmt(el.textContent.replace("−", "-")) || 0;
    cancelAnimationFrame(this._cr);
    if (!this.anim || Math.abs(target - from) < .005) { this.counting = false; el.textContent = fmt(target); return; }
    const t0 = performance.now(); dur = dur || 600;
    this.counting = true;
    el.classList.toggle("up", target > from);
    const step = () => {
      const k = clamp((performance.now() - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (target - from) * e);
      if (k < 1) this._cr = requestAnimationFrame(step);
      else { el.textContent = fmt(state.balance); this.counting = false; setTimeout(() => el.classList.remove("up"), 500); }
    };
    this._cr = requestAnimationFrame(step);
  },
  bigWin(label, amount, mult, dur) {
    const b = $("#bigwin");
    $("#bwT").textContent = label;
    $("#bwM").textContent = fmtMult(mult);
    const a = $("#bwA");
    b.classList.add("on");
    cancelAnimationFrame(this._bw);
    const t0 = performance.now();
    let last = 0;
    const step = () => {
      const k = clamp((performance.now() - t0) / dur, 0, 1);
      a.textContent = "+" + fmt(amount * (1 - Math.pow(1 - k, 2.4)));
      if (k - last > .08) { last = k; this.tone(500 + k * 900, .04, { type: "square", vol: .025 }); }
      if (k < 1) this._bw = requestAnimationFrame(step);
    };
    this._bw = requestAnimationFrame(step);
    clearTimeout(this._bt);
    this._bt = setTimeout(() => b.classList.remove("on"), dur + 1400);
  },
  stagePulse(cls) {
    const a = $("#area"); if (!a || !this.anim) return;
    a.classList.remove("won", "lost"); void a.offsetWidth; a.classList.add(cls);
  },
  result(mult, net, amount) {
    const area = $("#area");
    const r = area ? area.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (net <= 0) {
      this.countTo(state.balance, 300);
      if (mult <= 0) { this.sLose(); this.stagePulse("lost"); this.buzz(30); }
      else this.sTick();
      return;
    }
    const quiet = typeof Auto !== "undefined" && Auto.running;
    this.stagePulse("won");
    if (mult < 2 || (quiet && mult < 10)) { this.sCoin(); this.countTo(state.balance, 420); if (!quiet) this.burst(8, cx, cy, 6); return; }
    if (mult < 10) {
      this.sChime(3); this.buzz([20, 30, 20]);
      this.countTo(state.balance, 700);
      this.burst(26, cx, cy, 9);
      return;
    }
    const tier = mult >= 250 ? 3 : mult >= 50 ? 2 : 1;
    const dur = [0, 1300, 2000, 2800][tier];
    this.sChime(6); this.buzz([40, 40, 40, 40, 120]);
    this.bigWin(["", "Gros gain", "Énorme gain", "Gain légendaire"][tier], net, mult, dur);
    this.countTo(state.balance, dur);
    this.burst(60 + tier * 30, cx, cy, 12, true);
    this.rain(40 + tier * 50);
  }
};
