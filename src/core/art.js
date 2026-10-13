const ART = (function () {
  const P = (cx, cy, r, a) => { const t = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; };
  function ring(cx, cy, r1, r2, n, colorAt, stroke) {
    let s = "";
    const A = 360 / n;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = P(cx, cy, r1, i * A), [x2, y2] = P(cx, cy, r1, (i + 1) * A);
      const [x3, y3] = P(cx, cy, r2, (i + 1) * A), [x4, y4] = P(cx, cy, r2, i * A);
      s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${r1} ${r1} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}L${x3.toFixed(1)} ${y3.toFixed(1)}A${r2} ${r2} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)}Z" fill="${colorAt(i)}"${stroke ? ` stroke="${stroke}" stroke-width="1"` : ""}/>`;
    }
    return s;
  }
  const spark = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shadow = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#000" opacity=".18"/>`;

  const D = {};
  D.dice = {
    bg: "#8a4dff,#3b1a9f",
    svg: shadow(72, 128, 40, 7) + shadow(114, 156, 22, 4) +
      `<path d="M70 51 104 68 70 85 36 68Z" fill="#fff"/><path d="M36 68 70 85v40L36 108Z" fill="#ddd5ff"/><path d="M70 85 104 68v40l-34 17Z" fill="#b6a6ff"/>
       <ellipse cx="70" cy="68" rx="7" ry="4" fill="#4a23b8"/>
       <circle cx="46" cy="85" r="4.4" fill="#4a23b8"/><circle cx="60" cy="108" r="4.4" fill="#4a23b8"/>
       <circle cx="79" cy="91" r="4.2" fill="#3a1a96"/><circle cx="87" cy="98.5" r="4.2" fill="#3a1a96"/><circle cx="95.5" cy="106" r="4.2" fill="#3a1a96"/>
       <path d="M112 108 132 118 112 128 92 118Z" fill="#fff"/><path d="M92 118 112 128v24l-20-10Z" fill="#ddd5ff"/><path d="M112 128 132 118v24l-20 10Z" fill="#b6a6ff"/>
       <ellipse cx="112" cy="118" rx="4" ry="2.3" fill="#4a23b8"/>` + spark(30, 40, 6) + spark(122, 44, 4, "#d9ccff") + spark(24, 128, 3.5, "#d9ccff")
  };
  D.limbo = {
    bg: "#7b4bff,#2c1686",
    svg: shadow(76, 140, 42, 6) +
      `<path d="M58 106 70 142h12l12-36Z" fill="#c98a00"/>
       <g transform="rotate(-8 75 80)"><rect x="24" y="56" width="102" height="50" rx="12" fill="#b37400"/><rect x="24" y="50" width="102" height="50" rx="12" fill="#ffd23d"/>
       <text x="75" y="85" text-anchor="middle" font-family="Rubik,Arial Black,sans-serif" font-weight="900" font-size="28" fill="#4a2600">1000×</text></g>
       <path d="M96 42 118 24M118 24h-13M118 24v13" stroke="#ffd23d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
      spark(30, 34, 6) + spark(128, 122, 4, "#cdbfff")
  };
  D.crash = {
    bg: "#ff5a8f,#801547",
    svg: `<circle cx="28" cy="36" r="1.6" fill="#fff" opacity=".8"/><circle cx="54" cy="24" r="1.2" fill="#fff" opacity=".7"/><circle cx="124" cy="96" r="1.5" fill="#fff" opacity=".7"/><circle cx="30" cy="92" r="1.2" fill="#fff" opacity=".6"/>
       <path d="M14 150C60 146 88 118 112 56" stroke="#fff" stroke-opacity=".25" stroke-width="16" fill="none" stroke-linecap="round"/>
       <path d="M14 150C60 146 88 118 112 56" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
       <g transform="translate(112 52) rotate(35)">
         <path d="M-7 18q7 18 14 0Z" fill="#ffb02e"/><path d="M-4 18q4 10 8 0Z" fill="#fff2b0"/>
         <path d="M-13 8-6 -2v20h-7Z" fill="#ff3b5c"/><path d="M13 8 6 -2v20h7Z" fill="#ff3b5c"/>
         <path d="M0-28C9-18 9 6 7 18H-7C-9 6-9-18 0-28Z" fill="#fff"/><circle cx="0" cy="-6" r="5" fill="#4f5bff"/><circle cx="-1.5" cy="-7.5" r="1.6" fill="#fff" opacity=".8"/>
       </g>` + spark(40, 58, 5) + spark(128, 136, 4)
  };
  D.plinko = (function () {
    let pegs = "";
    for (let r = 0; r < 7; r++) for (let k = 0; k <= r + 1; k++) {
      const x = 75 + (k - (r + 1) / 2) * 15, y = 40 + r * 14;
      pegs += `<circle cx="${x}" cy="${y}" r="2.8" fill="#fff" opacity="${0.55 + r * 0.05}"/>`;
    }
    const cols = ["#ff5a3d", "#ff8a2e", "#ffb02e", "#ffd23d", "#ffb02e", "#ff8a2e", "#ff5a3d"];
    let b = "";
    cols.forEach((c, i) => { b += `<rect x="${24 + i * 14.9}" y="140" width="12.5" height="11" rx="3" fill="${c}"/>`; });
    return {
      bg: "#1bb9ab,#0a5566",
      svg: pegs + b + `<circle cx="84" cy="65" r="8" fill="#ff5fa2"/><circle cx="81" cy="62" r="2.6" fill="#fff" opacity=".7"/>
        <path d="M84 57c-3-8 2-14 0-22" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`
    };
  })();
  D.mines = {
    bg: "#3f73ff,#172a8c",
    svg: shadow(70, 136, 40, 6) +
      `<path d="M44 52h52l18 24-44 56-44-56Z" fill="#35c9ff"/><path d="M44 52h52l18 24H26Z" fill="#9deaff"/>
       <path d="M44 52 58 76h24l14-24Z" fill="#c9f4ff"/><path d="M26 76h32l12 56Z" fill="#1aa6e6"/><path d="M82 76h32l-44 56Z" fill="#62d7ff"/><path d="M58 76h24l-12 56Z" fill="#35c9ff"/>
       <circle cx="112" cy="128" r="17" fill="#1a1c3a"/><circle cx="106" cy="122" r="4.5" fill="#fff" opacity=".25"/>
       <path d="M121 114q6-8 12-6" stroke="#8a6a3a" stroke-width="3" fill="none" stroke-linecap="round"/>` + spark(134, 106, 6, "#ffd23d") + spark(34, 40, 5) + spark(118, 38, 3.5)
  };
  D.tower = {
    bg: "#ff8f3d,#8f2b10",
    svg: shadow(75, 152, 44, 6) +
      [[34, 128, 82], [42, 106, 66], [50, 84, 50], [57, 62, 36]].map(([x, y, w]) =>
        `<rect x="${x}" y="${y + 4}" width="${w}" height="20" rx="4" fill="#9c3e12"/><rect x="${x}" y="${y}" width="${w}" height="20" rx="4" fill="#ffe9cf"/><rect x="${x + 4}" y="${y + 4}" width="${w / 2 - 6}" height="12" rx="3" fill="#ffd2a1"/><rect x="${x + w / 2 + 2}" y="${y + 4}" width="${w / 2 - 6}" height="12" rx="3" fill="#ffd2a1"/>`
      ).join("") +
      `<path d="m75 20 6 12.5 13.6 2-9.8 9.6 2.3 13.6L75 51.3l-12.1 6.4 2.3-13.6-9.8-9.6 13.6-2Z" fill="#ffd23d" stroke="#c47a00" stroke-width="2" stroke-linejoin="round"/>` + spark(30, 44, 5) + spark(122, 52, 4)
  };
  D.keno = (function () {
    let t = "";
    const hot = { 1: "#35d07f", 6: "#35d07f", 11: "#4f5bff", 12: "#35d07f", 14: "#35d07f" };
    for (let i = 0; i < 16; i++) {
      const x = 33 + (i % 4) * 22, y = 44 + Math.floor(i / 4) * 22;
      t += `<rect x="${x}" y="${y + 2}" width="18" height="18" rx="4" fill="#c46a00"/><rect x="${x}" y="${y}" width="18" height="18" rx="4" fill="${hot[i] || "#fff3d6"}"/>`;
    }
    return {
      bg: "#ffb938,#a2520a",
      svg: shadow(75, 142, 46, 6) + `<g transform="rotate(-9 75 88)"><rect x="25" y="36" width="100" height="100" rx="12" fill="#8f4608"/>${t}</g>` + spark(124, 34, 6) + spark(28, 142, 4)
    };
  })();
  D.coinflip = {
    bg: "#5664ff,#1e238f",
    svg: shadow(75, 146, 34, 6) +
      `<ellipse cx="75" cy="78" rx="38" ry="40" fill="#c98a12"/><ellipse cx="71" cy="76" rx="36" ry="38" fill="#ffc53d"/><ellipse cx="71" cy="76" rx="26" ry="28" fill="#f0a91c"/>
       <path d="M62 91V61h6l11 16V61h6v30h-6L68 75v16Z" fill="#fff4cf"/>
       <g transform="rotate(-24 120 124)"><ellipse cx="120" cy="124" rx="16" ry="6" fill="#c98a12"/><ellipse cx="120" cy="121" rx="16" ry="6" fill="#ffc53d"/></g>
       <path d="M22 60q-6 16 4 32M128 44q8 14 2 30" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>` + spark(30, 36, 5) + spark(124, 30, 4)
  };
  D.wheel = (function () {
    const cols = ["#ffd23d", "#fff", "#4f5bff", "#fff", "#ff5fa2", "#fff", "#35d07f", "#fff"];
    return {
      bg: "#2cb5f5,#0c4f8f",
      svg: shadow(75, 150, 44, 6) + `<circle cx="75" cy="88" r="52" fill="#123a66"/>` + ring(75, 88, 46, 16, 8, i => cols[i], "#123a66") +
        `<circle cx="75" cy="88" r="15" fill="#123a66"/><circle cx="75" cy="88" r="7" fill="#fff"/>` +
        Array.from({ length: 8 }, (_, i) => { const [x, y] = P(75, 88, 49, i * 45); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#fff"/>`; }).join("") +
        `<path d="M66 28h18l-9 18Z" fill="#ff3b5c" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>` + spark(128, 40, 5) + spark(24, 136, 4)
    };
  })();
  D.chicken = {
    bg: "#5fce4f,#1b6a2a",
    svg: `<rect x="0" y="100" width="150" height="46" fill="#3a3d5c"/><path d="M0 123h150" stroke="#fff" stroke-width="3" stroke-dasharray="10 9" opacity=".7"/>
       <rect x="0" y="96" width="150" height="5" fill="#fff" opacity=".6"/>
       <g transform="translate(112 110)"><rect x="-13" y="-20" width="26" height="42" rx="7" fill="#ff3b5c"/><rect x="-10" y="-14" width="20" height="10" rx="3" fill="#1a1c3a" opacity=".75"/><rect x="-10" y="8" width="20" height="8" rx="3" fill="#1a1c3a" opacity=".75"/><rect x="-10" y="19" width="5" height="3" rx="1" fill="#fff6b0"/><rect x="5" y="19" width="5" height="3" rx="1" fill="#fff6b0"/></g>
       ${shadow(52, 98, 20, 4)}
       <path d="M32 78c0-14 9-22 20-22s20 8 20 22-9 20-20 20-20-7-20-20Z" fill="#ffd75e"/>
       <path d="M40 52c0-8 5-13 11-13s11 5 11 13-5 11-11 11-11-4-11-11Z" fill="#ffe28a"/>
       <path d="M47 36c2-5 7-5 9 0 2 4-2 6-4.5 6S45 40 47 36Z" fill="#ff3b5c"/>
       <circle cx="47" cy="51" r="2.3" fill="#2b1c00"/><circle cx="56" cy="51" r="2.3" fill="#2b1c00"/>
       <path d="M51 55 58 59l-7 3.5Z" fill="#ff8a2e"/><path d="M44 97h5l-1 7h-4Zm11 0h5l1 7h-4Z" fill="#ff8a2e"/>` + spark(122, 40, 6) + spark(28, 30, 4)
  };
  D.blackjack = {
    bg: "#22b574,#0b5236",
    svg: shadow(75, 146, 44, 6) +
      `<g transform="rotate(-12 58 88)"><rect x="30" y="46" width="54" height="78" rx="7" fill="#fff"/><text x="38" y="66" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="16" fill="#1b1c38">A</text><path d="M57 76c7 7 13 11 13 18a6.5 6.5 0 0 1-12 3.4l2 7h-6l2-7A6.5 6.5 0 0 1 44 94c0-7 6-11 13-18Z" fill="#1b1c38"/></g>
       <g transform="rotate(10 94 90)"><rect x="66" y="48" width="54" height="78" rx="7" fill="#fff"/><text x="74" y="68" font-family="Rubik,Arial,sans-serif" font-weight="800" font-size="16" fill="#d33a4a">K</text><path d="M93 108c-8-6-14-11-14-17a6.5 6.5 0 0 1 14-3 6.5 6.5 0 0 1 14 3c0 6-6 11-14 17Z" fill="#d33a4a"/></g>
       <g transform="translate(112 136)"><ellipse cx="0" cy="6" rx="18" ry="6" fill="#123"/><ellipse cx="0" cy="3" rx="18" ry="6" fill="#4f5bff"/><ellipse cx="0" cy="-2" rx="18" ry="6" fill="#ff3b5c"/><ellipse cx="0" cy="-2" rx="9" ry="3" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/></g>` + spark(28, 36, 5) + spark(128, 34, 4)
  };
  D.roulette = {
    bg: "#ef4a58,#7a1522",
    svg: shadow(75, 150, 46, 6) + `<circle cx="75" cy="88" r="56" fill="#5a2a10"/><circle cx="75" cy="88" r="50" fill="#3a1a08"/>` +
      ring(75, 88, 47, 33, 18, i => i === 0 ? "#1f9d62" : i % 2 ? "#d33a4a" : "#1c1d33") +
      `<circle cx="75" cy="88" r="33" fill="#b9c2d6"/><circle cx="75" cy="88" r="24" fill="#8d97ae"/><circle cx="75" cy="88" r="10" fill="#ffc53d"/>
       <path d="M75 70v36M57 88h36" stroke="#ffc53d" stroke-width="4" stroke-linecap="round"/><circle cx="75" cy="88" r="5" fill="#fff4cf"/>
       <circle cx="100" cy="52" r="5.5" fill="#fff"/>` + spark(128, 40, 5) + spark(22, 140, 4)
  };
  D.slots = {
    bg: "#e052d2,#5c1a88",
    svg: shadow(72, 150, 46, 6) +
      `<rect x="22" y="36" width="100" height="108" rx="14" fill="#2a1450"/><rect x="28" y="30" width="88" height="20" rx="8" fill="#ffd23d"/>
       <text x="72" y="45" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-weight="900" font-size="12" fill="#4a2600">NOVA</text>
       <rect x="30" y="62" width="84" height="44" rx="7" fill="#150a2c"/>
       <rect x="34" y="66" width="24" height="36" rx="4" fill="#fff"/><rect x="60" y="66" width="24" height="36" rx="4" fill="#fff"/><rect x="86" y="66" width="24" height="36" rx="4" fill="#fff"/>
       <text x="46" y="92" text-anchor="middle" font-family="Rubik,Arial Black,sans-serif" font-weight="900" font-size="22" fill="#ff3b5c">7</text>
       <text x="72" y="92" text-anchor="middle" font-family="Rubik,Arial Black,sans-serif" font-weight="900" font-size="22" fill="#ff3b5c">7</text>
       <text x="98" y="92" text-anchor="middle" font-family="Rubik,Arial Black,sans-serif" font-weight="900" font-size="22" fill="#ff3b5c">7</text>
       <rect x="40" y="116" width="64" height="14" rx="7" fill="#4f5bff"/>
       <path d="M124 90h8V58" stroke="#b9c2d6" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="132" cy="54" r="7" fill="#ff3b5c"/>` + spark(24, 26, 5) + spark(132, 132, 4)
  };

  function bgCSS(id) {
    const c = (D[id] ? D[id].bg : "#4f5bff,#1e238f").split(",");
    return `radial-gradient(circle at 50% 40%,rgba(255,255,255,.2),transparent 58%),linear-gradient(180deg,${c[0]},${c[1]})`;
  }
  function svg(id, crop) {
    return `<svg viewBox="${crop ? "15 22 120 120" : "0 0 150 200"}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${D[id] ? D[id].svg : ""}</svg>`;
  }
  /** Petite vignette carrée pour tableaux et barres. */
  function icon(id) { return `<i style="background:${bgCSS(id)}">${svg(id, true)}</i>`; }
  return { bgCSS, svg, icon };
})();
