import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const css = await (await fetch("https://fonts.googleapis.com/css2?family=Rubik:wght@400..900&display=swap", { headers: { "User-Agent": UA } })).text();
const blocks = css.split("/* ").slice(1);
for (const b of blocks) {
  const subset = b.slice(0, b.indexOf(" */"));
  if (subset !== "latin" && subset !== "latin-ext") continue;
  const url = b.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const range = b.match(/unicode-range:\s*([^;]+);/)[1];
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(`src/static/fonts/rubik-${subset}.woff2`, buf);
  fs.writeFileSync(`src/static/fonts/rubik-${subset}.range.txt`, range.trim());
  console.log(subset, buf.length, "octets");
}
