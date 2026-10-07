// Copia dados/ para public/dados/ sem espaços (mesmo conteúdo) e gera o fundo esquemático.
// Uso: npm run dados
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

for (const f of ['cidade_missao_ficticio.json', 'sp_distritos_ficticio.geojson', 'sp_subprefeituras.geojson']) {
  const obj = JSON.parse(readFileSync(`dados/${f}`, 'utf8'));
  const out = JSON.stringify(obj);
  writeFileSync(`public/dados/${f}`, out);
  console.log(`${f}: ${readFileSync(`dados/${f}`).length} → ${Buffer.byteLength(out)} bytes`);
}
execFileSync(process.execPath, ['scripts/derivar-fundo.mjs'], { stdio: 'inherit' });
