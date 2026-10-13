// Serveur statique de test : sert dist/ comme un vrai hébergeur
// (404 personnalisée et en-têtes de sécurité de dist/_headers compris).
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const root = path.join(__dirname, "dist"), port = 5178;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json",
  ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
const SEC = {};
{
  let on = false;
  for (const line of fs.readFileSync(path.join(root, "_headers"), "utf8").split(/\r?\n/)) {
    if (line === "/*") { on = true; continue; }
    if (!line.trim()) { if (on) break; continue; }
    const m = on && line.match(/^\s+([^:]+):\s*(.*)$/);
    if (m && m[1] !== "Strict-Transport-Security") SEC[m[1]] = m[2];
  }
}
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  const f = path.join(root, u);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404, { ...SEC, "Content-Type": TYPES[".html"] });
      return res.end(fs.readFileSync(path.join(root, "404.html")));
    }
    const type = TYPES[path.extname(f)] || "application/octet-stream";
    const gz = /text|javascript|json|xml|svg|manifest/.test(type) && /gzip/.test(req.headers["accept-encoding"] || "");
    res.writeHead(200, { ...SEC, "Content-Type": type, "Cache-Control": "no-store", ...(gz ? { "Content-Encoding": "gzip", "Vary": "Accept-Encoding" } : {}) });
    res.end(gz ? zlib.gzipSync(data) : data);
  });
}).listen(port, () => console.log("NovaCasino (dist) sur http://localhost:" + port + " · en-têtes : " + Object.keys(SEC).join(", ")));
