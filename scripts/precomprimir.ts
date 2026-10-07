// Plugin do Vite: gera .gz dos arquivos de texto do build (JS, CSS, JSON, GeoJSON) e o `vite preview`
// os serve com Content-Encoding: gzip. Em produção, o servidor de hospedagem deve comprimir do mesmo jeito.
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

const TEXTO = /\.(js|css|json|geojson|html|svg)$/;
const TIPOS: Record<string, string> = { js: 'text/javascript', css: 'text/css', json: 'application/json', geojson: 'application/geo+json', html: 'text/html', svg: 'image/svg+xml' };

function percorrer(dir: string, f: (p: string) => void) {
  for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) percorrer(p, f); else f(p); }
}

export function precomprimir(): Plugin {
  let outDir = 'dist';
  return {
    name: 'cm-precomprimir',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      percorrer(outDir, (p) => { if (TEXTO.test(p)) writeFileSync(p + '.gz', gzipSync(readFileSync(p), { level: 9 })); });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0];
        const arq = join(outDir, decodeURIComponent(url === '/' ? '/index.html' : url));
        const ext = arq.split('.').pop() ?? '';
        if (!/gzip/.test(String(req.headers['accept-encoding'] ?? '')) || !TIPOS[ext] || !existsSync(arq + '.gz')) return next();
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', TIPOS[ext] + '; charset=utf-8');
        res.setHeader('Vary', 'Accept-Encoding');
        createReadStream(arq + '.gz').pipe(res);
      });
    },
  };
}
