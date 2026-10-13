import fs from "node:fs";
const pngs = [16, 32, 48].map(size => ({ size, buf: fs.readFileSync(`tools/render/fav-${size}.png`) }));
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
const dir = Buffer.alloc(16 * pngs.length);
let off = 6 + dir.length;
pngs.forEach((p, i) => {
  const o = i * 16;
  dir.writeUInt8(p.size, o); dir.writeUInt8(p.size, o + 1); dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
  dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6); dir.writeUInt32LE(p.buf.length, o + 8); dir.writeUInt32LE(off, o + 12);
  off += p.buf.length;
});
fs.writeFileSync("src/static/favicon.ico", Buffer.concat([head, dir, ...pngs.map(p => p.buf)]));
console.log("favicon.ico", fs.statSync("src/static/favicon.ico").size, "octets");
