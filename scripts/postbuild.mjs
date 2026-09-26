// Post-build: genera _headers (CSP con hash degli script inline) e sitemap.xml.
// Si esegue dopo `astro build`. Fallisce se trova stili inline che violerebbero la CSP.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://vittorio-francesco-ardente.github.io';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const hashes = new Set();
const problems = [];

for (const f of htmlFiles) {
  const html = await readFile(f, 'utf8');
  // Script inline eseguibili (esclusi JSON e script con src)
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1];
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue;
    if (!m[2].trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  }
  if (/<style[\s>]/.test(html)) problems.push(`${relative(DIST, f)}: <style> inline`);
  if (/\sstyle="/.test(html)) problems.push(`${relative(DIST, f)}: attributo style=""`);
}

if (problems.length) {
  console.error('CSP: trovati stili inline non consentiti:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// Immagini: ogni src/srcset locale deve esistere in dist (niente card vuote, niente 404)
const { existsSync } = await import('node:fs');
const missingImg = new Set();
for (const f of htmlFiles) {
  const html = await readFile(f, 'utf8');
  const urls = [];
  for (const m of html.matchAll(/\s(?:src|srcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u && u.startsWith('/') && !u.startsWith('//')) urls.push(u.split(/[?#]/)[0]);
    }
  }
  for (const u of urls) if (!existsSync(join(DIST, decodeURIComponent(u)))) missingImg.add(`${relative(DIST, f)} → ${u}`);
}
if (missingImg.size) {
  console.error('Immagini mancanti in dist:\n  ' + [...missingImg].join('\n  '));
  process.exit(1);
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`.trim(),
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const headers = `# Generato da scripts/postbuild.mjs — non modificare a mano.
/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-DNS-Prefetch-Control: off

/_assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=604800
/*.svg
  Cache-Control: public, max-age=604800
/*.ico
  Cache-Control: public, max-age=604800
`;
await writeFile(join(DIST, '_headers'), headers);

// Sitemap: pagine pubbliche (esclusa la 404)
const today = new Date().toISOString().slice(0, 10);
const urls = htmlFiles
  .map((f) => '/' + relative(DIST, f).replace(/\\/g, '/'))
  .filter((p) => !p.endsWith('/404.html'))
  .map((p) => (p === '/index.html' ? '/' : p.replace(/\.html$/, '')))
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
const prio = (u) => (u === '/' ? '1.0' : u.startsWith('/esperienza-') ? '0.8' : '0.3');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${prio(u)}</priority></url>`).join('\n')}
</urlset>
`;
await writeFile(join(DIST, 'sitemap.xml'), sitemap);

console.log(`postbuild: ${htmlFiles.length} pagine, ${hashes.size} hash script inline, sitemap con ${urls.length} URL.`);
