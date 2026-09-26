// @ts-check
import { defineConfig } from 'astro/config';

// Sito statico per Cloudflare Pages.
// - build.format 'file'  → /esperienza-ips.html servita come /esperienza-ips (URL invariati)
// - inlineStylesheets 'never' → nessun <style> inline: la CSP resta style-src 'self'
export default defineConfig({
  // Sito di produzione attuale (GitHub Pages, repository utente: nessun base path).
  // Per passare a un dominio personalizzato: cambia qui, in src/data/profile.ts,
  // in public/robots.txt e in scripts/postbuild.mjs.
  site: 'https://vittorio-francesco-ardente.github.io',
  trailingSlash: 'never',
  compressHTML: true,
  build: {
    format: 'file',
    assets: '_assets',
    inlineStylesheets: 'never',
  },
  devToolbar: { enabled: false },
});
