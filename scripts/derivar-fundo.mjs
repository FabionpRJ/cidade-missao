// Converte o fundo esquemático de referencias/codigo-dos-exemplos/data.json (coordenadas
// projetadas próprias, "equiretangular local, 1 unidade ≈ 72 m") para lon/lat, por ajuste afim
// sobre as caixas dos 96 distritos. Gera public/dados/fundo_esquematico.json.
// Uso: npm run fundo
import { readFileSync, writeFileSync } from 'node:fs';

const ref = JSON.parse(readFileSync('referencias/codigo-dos-exemplos/data.json', 'utf8'));
const geo = JSON.parse(readFileSync('dados/sp_distritos_ficticio.geojson', 'utf8'));

const nums = (d) => (d.match(/-?\d+\.?\d*/g) || []).map(Number);
function bboxXY(d) {
  const n = nums(d); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
  return [x0, y0, x1, y1];
}
function bboxLL(geom) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const p of polys) for (const ring of p) for (const [x, y] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}
// mínimos quadrados de u = a·x + b
function fit(pairs) {
  const n = pairs.length; let sx = 0, su = 0, sxx = 0, sxu = 0;
  for (const [x, u] of pairs) { sx += x; su += u; sxx += x * x; sxu += x * u; }
  const a = (n * sxu - sx * su) / (n * sxx - sx * sx); const b = (su - a * sx) / n;
  const res = Math.sqrt(pairs.reduce((s, [x, u]) => s + (a * x + b - u) ** 2, 0) / n);
  return { a, b, res };
}
const byId = Object.fromEntries(geo.features.map((f) => [f.properties.id, f]));
const px = [], py = [];
for (const d of ref.distritos) {
  const f = byId[d.id]; if (!f) continue;
  const a = bboxXY(d.d), b = bboxLL(f.geometry);
  px.push([a[0], b[0]], [a[2], b[2]]); py.push([a[1], b[3]], [a[3], b[1]]);
}
const FX = fit(px), FY = fit(py);
console.log('ajuste lon: a=%s b=%s resíduo=%s°', FX.a, FX.b, FX.res.toFixed(5));
console.log('ajuste lat: a=%s b=%s resíduo=%s°', FY.a, FY.b, FY.res.toFixed(5));
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const ll = (x, y) => [r5(FX.a * x + FX.b), r5(FY.a * y + FY.b)];
const M_POR_UNIDADE = 72; // meta.projecao do data.json

function subpaths(d) {
  const out = []; let cur = null;
  for (const m of d.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (m[1] === 'M') { cur = []; out.push(cur); }
    if (m[1] === 'Z') continue;
    const n = nums(m[2]);
    for (let i = 0; i < n.length; i += 2) cur.push(ll(n[i], n[i + 1]));
  }
  return out;
}
const conv = (obj) => Object.fromEntries(Object.entries(obj).map(([k, d]) => [k, subpaths(d)]));
const curto = Object.fromEntries(ref.subprefeituras.map((s) => [s.nome, s.curto]));

const out = {
  aviso: 'Fundo ESQUEMÁTICO (traçado à mão nos exemplos de referência): rios, represas, parques e vias não são cartografia oficial. Convertido para lon/lat por ajuste afim (scripts/derivar-fundo.mjs).',
  cidade: subpaths(ref.cidade),
  rios: conv(ref.rios),
  represas: conv(ref.represas),
  verdes: conv(ref.verdes),
  vias: conv(ref.vias),
  vizinhos: ref.vizinhos.map((v) => { const [lng, lat] = ll(v.x, v.y); return { nome: v.nome, lng, lat }; }),
  rotulos: {
    distritos: Object.fromEntries(ref.distritos.map((d) => { const [lng, lat] = ll(d.lx, d.ly); return [d.id, { lng, lat, r_m: Math.round(d.r * M_POR_UNIDADE) }]; })),
    subprefeituras: Object.fromEntries(ref.subprefeituras.map((s) => { const [lng, lat] = ll(s.lx, s.ly); return [s.nome, { lng, lat, r_m: Math.round(s.r * M_POR_UNIDADE), curto: curto[s.nome] }]; })),
  },
};
writeFileSync('public/dados/fundo_esquematico.json', JSON.stringify(out));
console.log('ok: public/dados/fundo_esquematico.json');
