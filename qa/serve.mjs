/* Minimal static server for site/, matching Netlify's behaviour closely
   enough for QA: /dir/ → /dir/index.html, unknown paths → 404.html (404).
   Usage: node serve.mjs [port]   (default 4173) */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "site");
const PORT = Number(process.argv[2] || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain"
};

async function resolve(path) {
  let file = normalize(join(ROOT, decodeURIComponent(path)));
  if (!file.startsWith(ROOT)) return null;
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, "index.html");
    await stat(file);
    return file;
  } catch { return null; }
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  let file = await resolve(url.pathname);
  let status = 200;
  if (!file) { file = join(ROOT, "404.html"); status = 404; }
  try {
    const body = await readFile(file);
    res.writeHead(status, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(500); res.end("error");
  }
}).listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
