/* Cidade Missão — motor de telas estáticas (mapa SVG + componentes). Dados fictícios. */
(function () {
'use strict';
const D = window.CM_DATA, T = window.CM_THEME;
const byId = Object.fromEntries(D.distritos.map(d => [d.id, d]));
const subIdx = Object.fromEntries(D.subprefeituras.map((s, i) => [s.nome, i]));
const fmt = (n, dec = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* ---------------- ícones (grade 24, traço) ---------------- */
const IC = {
 users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2c2.1.7 3.5 2.8 3.5 5.8',
 home:'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6', flag:'M5 21V4M5 4h11l-2 4 2 4H5',
 bell:'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0',
 lamp:'M12 2.5v2M5.6 5.6L7 7M18.4 5.6L17 7M9.5 18h5M10.5 21h3M12 7a5 5 0 0 0-3 9h6a5 5 0 0 0-3-9z',
 road:'M8 3L4 21M16 3l4 18M12 4.5v2.5M12 10.5v3M12 17v2.5', tree:'M12 21v-6M12 16l-3-3M12 14l3-2.5M12 3a6 6 0 0 0-6 6c0 3 2.5 5 6 6 3.5-1 6-3 6-6a6 6 0 0 0-6-6z',
 trash:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6', drop:'M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z',
 health:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z', book:'M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0zM20 5c-3-1.5-5.5-1.5-8 0v15c2.5-1.5 5-1.5 8 0z',
 shield:'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z', lupa:'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21',
 mega:'M3 10v4h3l8 5V5l-8 5zM17.5 9a4 4 0 0 1 0 6M6 14l1.5 6h3L9 15', building:'M4 21V8l8-5 8 5v13M9 21v-6h6v6M7.5 10h1.5M11.25 10h1.5M15 10h1.5',
 people:'M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8.5 22v-7l-2-1 1.2-5h8.6l1.2 5-2 1v7',
 coin:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 6.5v11M14.6 9.3c-.5-.9-1.4-1.4-2.6-1.4-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.7-1.6',
 target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 11.5v1',
 ops:'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
 gap:'M3 12a9 9 0 0 1 9-9M15.5 3.7a9 9 0 0 1 4.8 4.8M21 12a9 9 0 0 1-9 9M8.5 20.3a9 9 0 0 1-4.8-4.8M12 8.5v7M8.5 12h7',
 urna:'M3 12h18v9H3zM7.5 12l1-8h7l1 8M10 8h4', star:'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z',
 layers:'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5', ledger:'M3 4h18v16H3zM3 9h18M3 14h18M9 4v16',
 scale:'M12 3v18M7 21h10M4 6h16M6 6l-3 7a3 3 0 0 0 6 0zM18 6l-3 7a3 3 0 0 0 6 0z', clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
 play:'M7 4l13 8-13 8z', pause:'M7 4h3v16H7zM14 4h3v16h-3z', next:'M5 4l10 8-10 8zM18 4v16', prev:'M19 4L9 12l10 8zM6 4v16',
 down:'M6 9l6 6 6-6', right:'M9 6l6 6-6 6', back:'M15 5l-7 7 7 7', close:'M6 6l12 12M18 6L6 18', plus:'M12 5v14M5 12h14', check:'M5 12.5l4.5 4.5L19 7',
 lock:'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11', info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
 pin:'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', cal:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
 send:'M3 11l18-8-8 18-2-8z', chart:'M5 20V11M11 20V5M17 20v-7M2 20h20', gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
 menu:'M4 6h16M4 12h16M4 18h16', locate:'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 2v4M12 18v4M2 12h4M18 12h4M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
 hands:'M2 11l5-5 5 3 5-3 5 5-10 9zM9 13l3 2.5', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
 doc:'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7', map:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15', eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
 filter:'M3 5h18l-7 8v6l-4 2v-8z', sort:'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4', zoomin:'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6',
};
function ic(name, size = 18, extra = '') {
  return `<svg class="ic ic-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${T.icon.sw}" stroke-linecap="${T.icon.cap}" stroke-linejoin="${T.icon.join}" aria-hidden="true" ${extra}><path d="${IC[name]}"/></svg>`;
}

/* ---------------- modos ---------------- */
const MODES = [
 { id:'adm', fam:'territorio', nome:'Administrativo', icon:'building', cat:true, unit:'subprefeituras e distritos', fonte:'GeoSampa · limites 2024 [verificar ano] · distrito' },
 { id:'dem', fam:'territorio', nome:'Demografia', icon:'people', key:'dens', dom:[1000,16000], unit:'hab./km²', fmt:v=>fmt(v), fonte:'Censo IBGE · 2022 · distrito (valor fictício)' },
 { id:'ren', fam:'territorio', nome:'Renda', icon:'coin', key:'renda', dom:[1200,9000], unit:'R$ per capita/mês', fmt:v=>'R$ '+fmt(v), fonte:'Censo IBGE · 2022 · distrito (valor fictício)' },
 { id:'sau', fam:'servicos', nome:'Saúde', icon:'health', key:'saude', dom:[25,90], unit:'% cobertura ESF', fmt:v=>fmt(v)+'%', fonte:'SMS-SP · 2025 · distrito (valor fictício)' },
 { id:'edu', fam:'servicos', nome:'Educação', icon:'book', key:'educ', dom:[75,96], unit:'% atendimento 0–5 anos', fmt:v=>fmt(v,1)+'%', fonte:'SME-SP · 2025 · distrito (valor fictício)' },
 { id:'san', fam:'servicos', nome:'Saneamento', icon:'drop', key:'san', dom:[60,100], unit:'% domicílios com esgoto', fmt:v=>fmt(v,1)+'%', fonte:'Censo IBGE · 2022 · distrito (valor fictício)' },
 { id:'ris', fam:'servicos', nome:'Riscos', icon:'shield', key:'risco', dom:[0,60], unit:'domicílios a prevenir /mil', fmt:v=>fmt(v), fonte:'Defesa Civil · 2025 · distrito (valor fictício)' },
 { id:'zel', fam:'problemas', nome:'Zeladoria', icon:'bell', key:'zel', dom:[1,10], unit:'alertas confirmados /mil hab.', fmt:v=>fmt(v,1), fonte:'Cidade Missão · out/2026 · distrito (fictício)' },
 { id:'pre', fam:'partido', nome:'Presença', icon:'target', key:'pres', dom:[0.3,3], unit:'militantes /mil eleitores', fmt:v=>fmt(v,2), fonte:'Cadastro interno · out/2026 · distrito (fictício)' },
 { id:'ope', fam:'partido', nome:'Operações', icon:'flag', key:'ops', dom:[0,10], unit:'missões ativas', fmt:v=>fmt(v), fonte:'Cidade Missão · out/2026 · distrito (fictício)' },
 { id:'lac', fam:'prioridade', nome:'Lacunas', icon:'gap', key:'lac', dom:[15,85], unit:'índice de prioridade 0–100', fmt:v=>fmt(v), fonte:'Índice composto · out/2026 · distrito (fictício)' },
 { id:'ele', fam:'partido', nome:'Eleitoral', icon:'urna', key:'comp', dom:[75,87], unit:'% comparecimento (agregado por local)', fmt:v=>fmt(v,1)+'%', fonte:'TSE · 2024 · local de votação (valor fictício)', lock:'Visitante' },
];
const FAM = { territorio:'Território', servicos:'Serviços', problemas:'Problemas', partido:'Partido', prioridade:'Partido' };
const M = Object.fromEntries(MODES.map(m => [m.id, m]));
function color(mode, d) {
  const m = M[mode];
  if (m.cat) { const r = T.ramps.adm; return r[(subIdx[d.sub] * 5) % r.length]; }
  const r = T.ramps[m.fam];
  const t = Math.max(0, Math.min(0.9999, (d[m.key] - m.dom[0]) / (m.dom[1] - m.dom[0])));
  return r[Math.floor(t * r.length)];
}
function rampHTML(mode, cls = '') {
  const m = M[mode]; const r = m.cat ? T.ramps.adm : T.ramps[m.fam];
  const n = r.length;
  const ticks = m.cat ? '' : `<div class="ramp-ticks"><span>${m.fmt(m.dom[0])}</span><span>${m.fmt((m.dom[0]+m.dom[1])/2)}</span><span>${m.fmt(m.dom[1])}${m.id==='lac'?'':'+'}</span></div>`;
  return `<div class="ramp ${cls}"><div class="ramp-bar">${r.map(c => `<i style="background:${c}"></i>`).join('')}</div>${ticks}</div>`;
}

/* ---------------- geometria ---------------- */
const P2 = {}; // Path2D por distrito, criado sob demanda
function path2(id) { return P2[id] || (P2[id] = new Path2D(byId[id].d)); }
const ctx = document.createElement('canvas').getContext('2d');
const noGo = [D.represas.Guarapiranga, D.represas.Billings, D.verdes['Serra do Mar'], D.verdes.Cantareira, byId.MAR.d].map(p => new Path2D(p));
const half = new Path2D(byId.PLH.d);
function inPath(p, x, y) { return ctx.isPointInPath(p, x, y); }
function randomIn(id, n, seed, ex) {
  const d = byId[id], r = rng(seed), out = [];
  const nums = d.d.match(/-?\d+\.?\d*/g).map(Number);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < nums.length; i += 2) { x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i]); y0 = Math.min(y0, nums[i+1]); y1 = Math.max(y1, nums[i+1]); }
  let guard = 0;
  while (out.length < n && guard++ < n * 200) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); if (inPath(path2(id), x, y) && !(ex && Math.abs(x - ex[0]) < ex[2] && Math.abs(y - ex[1]) < ex[3])) out.push([x, y]); }
  return out;
}
function tf(dstr, v) { // transforma path M/L em coordenadas de tela
  return dstr.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${((+x - v.x) * v.s).toFixed(1)},${((+y - v.y) * v.s).toFixed(1)}`);
}
function streets(v, w, h, level) {
  // malha viária procedural (fundo do Google Maps representado), em coordenadas de mundo
  const cell = level === 'near' ? 5 : 8, gap = level === 'near' ? 1.25 : 2.6;
  const X0 = Math.floor(v.x / cell) * cell, Y0 = Math.floor(v.y / cell) * cell, X1 = v.x + w / v.s, Y1 = v.y + h / v.s;
  let d = '';
  for (let cx = X0; cx < X1; cx += cell) for (let cy = Y0; cy < Y1; cy += cell) {
    const mx = cx + cell / 2, my = cy + cell / 2;
    if (noGo.some(p => inPath(p, mx, my))) continue;
    const r = rng(((cx * 73856093) ^ (cy * 19349663)) >>> 0);
    if (inPath(half, mx, my) && my > 640 && r() < 0.75) continue;
    if (r() < 0.06) continue; // praças, quadras grandes
    const a = Math.sin(cx * 0.031) * 0.9 + Math.cos(cy * 0.027) * 0.7 + (r() - 0.5) * 0.25;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (const dir of [0, 1]) {
      const ux = dir ? -sa : ca, uy = dir ? ca : sa, nx = -uy, ny = ux;
      const g = gap * (dir ? 1.35 : 1) * (0.9 + r() * 0.3);
      for (let k = -cell; k <= cell; k += g) {
        const ox = mx + nx * k, oy = my + ny * k;
        // recorte do segmento infinito à célula (Liang–Barsky)
        let t0 = -cell, t1 = cell; const p = [-ux, ux, -uy, uy], q = [ox - cx, cx + cell - ox, oy - cy, cy + cell - oy];
        let ok = true;
        for (let i = 0; i < 4; i++) { if (p[i] === 0) { if (q[i] < 0) ok = false; } else { const t = q[i] / p[i]; if (p[i] < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); } }
        if (!ok || t1 - t0 < 0.4) continue;
        d += `M${(ox + ux * t0).toFixed(2)},${(oy + uy * t0).toFixed(2)}L${(ox + ux * t1).toFixed(2)},${(oy + uy * t1).toFixed(2)}`;
      }
    }
  }
  return d;
}

/* ---------------- mapa ---------------- */
let uid = 0;
function mapSVG(o) {
  // o: {w,h, cx,cy (mundo), px,py (tela), s, mode, sel, hover, level, marks:[], routes:[], dim}
  const id = 'm' + (uid++), mp = T.map;
  const v = { s: o.s, x: o.cx - o.px / o.s, y: o.cy - o.py / o.s };
  const W = o.w, H = o.h, lv = o.level;
  const op = T.chOp[lv];
  const sx = x => (x - v.x) * v.s, sy = y => (y - v.y) * v.s;
  const g = `transform="translate(${(-v.x * v.s).toFixed(2)} ${(-v.y * v.s).toFixed(2)}) scale(${v.s})"`;
  let s = `<svg class="map" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de São Paulo, modo ${M[o.mode].nome}">`;
  s += `<defs><filter id="${id}glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${mp.glow}"/></filter>`;
  s += `<clipPath id="${id}city"><path d="${D.cidade}"/></clipPath></defs>`;
  s += `<rect width="${W}" height="${H}" fill="${mp.land}"/>`;
  s += `<g ${g}>`;
  for (const k in D.verdes) s += `<path d="${D.verdes[k]}" fill="${mp.park}"/>`;
  if (lv !== 'far') s += `<path d="${streets(v, W, H, lv)}" stroke="${mp.street}" stroke-width="${lv === 'near' ? mp.streetW[1] : mp.streetW[0]}" fill="none" vector-effect="non-scaling-stroke"/>`;
  for (const k in D.represas) s += `<path d="${D.represas[k]}" fill="${mp.water}"/>`;
  for (const k in D.rios) s += `<path d="${D.rios[k]}" stroke="${mp.water}" stroke-width="${lv === 'far' ? 2 : lv === 'mid' ? 3.5 : 7}" fill="none" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  for (const k in D.vias) s += `<path d="${D.vias[k]}" stroke="${mp.road}" stroke-width="${lv === 'far' ? 1 : lv === 'mid' ? 1.8 : 3.6}" fill="none" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  // coropleta
  s += `<g>`;
  for (const d of D.distritos) {
    const sel = d.id === o.sel, dim = o.dim && !sel && !(o.dimKeep || []).includes(d.id);
    s += `<path d="${d.d}" fill="${color(o.mode, d)}" fill-opacity="${dim ? op * T.dimFactor : sel ? Math.min(1, op + (lv === 'near' ? 0.06 : T.selBoost)) : op}" stroke="${mp.border}" stroke-opacity="${mp.borderOp}" stroke-width="${mp.borderW[lv]}" vector-effect="non-scaling-stroke"/>`;
  }
  s += `</g>`;
  for (const sb of D.subprefeituras) s += `<path d="${sb.d}" fill="none" stroke="${mp.sub}" stroke-opacity="${mp.subOp}" stroke-width="${mp.subW[lv]}" ${mp.subDash ? `stroke-dasharray="${mp.subDash}"` : ''} vector-effect="non-scaling-stroke"/>`;
  // máscara fora do município
  s += `<path d="M-2000,-2000H3000V3000H-2000Z${D.cidade}" fill="${mp.mask}" fill-opacity="${mp.maskOp}" fill-rule="evenodd"/>`;
  s += `<path d="${D.cidade}" fill="none" stroke="${mp.city}" stroke-width="${mp.cityW}" vector-effect="non-scaling-stroke"/>`;
  if (o.hover) { const d = byId[o.hover]; s += `<path d="${d.d}" fill="${mp.hoverFill}" fill-opacity=".14" stroke="${mp.hover}" stroke-width="${mp.selW * 0.7}" vector-effect="non-scaling-stroke"/>`; }
  if (o.sel) {
    const d = byId[o.sel];
    s += `<path d="${d.d}" fill="none" stroke="${mp.selGlowC}" stroke-width="${mp.selW * 3}" stroke-opacity=".55" filter="url(#${id}glow)" vector-effect="non-scaling-stroke"/>`;
    if (mp.selDouble) s += `<path d="${d.d}" fill="none" stroke="${mp.selDouble}" stroke-width="${mp.selW + 3}" vector-effect="non-scaling-stroke"/>`;
    s += `<path d="${d.d}" fill="none" stroke="${mp.sel}" stroke-width="${mp.selW}" ${mp.selDash ? `stroke-dasharray="${mp.selDash}"` : ''} stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }
  s += `</g>`;
  // rotas tracejadas (mundo -> tela)
  for (const r of (o.routes || [])) {
    const [a, b, c] = r; const x1 = sx(a[0]), y1 = sy(a[1]), x2 = sx(b[0]), y2 = sy(b[1]);
    const qx = (x1 + x2) / 2 + (y2 - y1) * 0.18, qy = (y1 + y2) / 2 - (x2 - x1) * 0.18;
    s += `<path d="M${x1},${y1}Q${qx},${qy} ${x2},${y2}" fill="none" stroke="${c || mp.route}" stroke-width="${mp.routeW}" stroke-dasharray="${mp.routeDash}" stroke-linecap="round" opacity=".95"/>`;
  }
  // rótulos de vias (perto)
  if (lv === 'near') for (const k of ['Estr. de Itapecerica', 'Av. Eng. Caetano Álvares', 'Marginal Tietê', 'Av. Sapopemba']) {
    s += `<path id="${id}v${k.length}" d="${tf(D.vias[k], v)}" fill="none"/><text class="lbl-road" fill="${mp.roadLabel}" stroke="${mp.halo}" stroke-width="3" paint-order="stroke"><textPath href="#${id}v${k.length}" startOffset="18%">${k}</textPath></text>`;
  }
  // municípios vizinhos
  if (lv !== 'near') for (const n of D.vizinhos) { const X = sx(n.x), Y = sy(n.y); if (X > 20 && X < W - 20 && Y > 20 && Y < H - 20) s += `<text class="lbl-viz" x="${X}" y="${Y}" text-anchor="middle" fill="${mp.vizLabel}">${n.nome}</text>`; }
  // rótulos de território (com prevenção de colisão, como nos jogos de estratégia)
  const placed = [], selLbl = [];
  const fits = (b) => !placed.some(p => b[0] < p[2] + 4 && b[2] > p[0] - 4 && b[1] < p[3] + 3 && b[3] > p[1] - 3);
  const k = T.label.upper ? 0.66 : 0.54;
  const lab = (txt, X, Y, fs, ls, cls, fill, op, forced) => {
    const w = txt.length * fs * k + Math.max(0, txt.length - 1) * ls;
    const b = [X - w / 2, Y - fs * 0.75, X + w / 2, Y + fs * 0.3];
    if (!forced && !fits(b)) return '';
    placed.push(b);
    const hs = forced && mp.selHalo ? mp.selHalo : mp.halo, hw = forced && mp.selHalo ? T.label.haloW * 2.2 : T.label.haloW;
    return `<text class="${cls}" x="${X.toFixed(1)}" y="${Y.toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}" fill="${fill}" ${op ? `fill-opacity="${op}"` : ''} stroke="${hs}" stroke-width="${hw}" stroke-linejoin="round" paint-order="stroke" ${ls ? `letter-spacing="${ls.toFixed(1)}"` : ''}>${txt}</text>`;
  };
  if (lv === 'far') {
    const subs = [...D.subprefeituras].sort((a, b) => b.r - a.r);
    for (const sb of subs) {
      const X = sx(sb.lx), Y = sy(sb.ly), txt = T.label.upper ? sb.curto.toUpperCase() : sb.curto;
      let fs = Math.min(T.label.farMax, sb.r * v.s * 0.5);
      const per = k + (T.label.subSpacing || 0);
      fs = Math.min(fs, (2.5 * sb.r * v.s) / (txt.length * per));
      if (fs < T.label.farMin * 0.8) continue;
      fs = Math.max(fs, T.label.farMin);
      s += lab(txt, X, Y + fs * 0.35, fs, fs * (T.label.subSpacing || 0), 'lbl-sub', mp.label);
    }
  } else {
    const ds = [...D.distritos].sort((a, b) => (b.id === o.sel) - (a.id === o.sel) || b.r - a.r);
    for (const d of ds) {
      const X = sx(d.lx), Y = sy(d.ly); if (X < -40 || X > W + 40 || Y < -20 || Y > H + 20) continue;
      const isSel = d.id === o.sel, txt = T.label.upper ? d.nome.toUpperCase() : d.nome;
      let fs = Math.min(T.label.midMax, d.r * v.s * 0.34) * (isSel ? 1.3 : 1);
      const per = k + (T.label.distSpacing || 0);
      if (!isSel) fs = Math.min(fs, (2.6 * d.r * v.s) / (txt.length * per));
      if (!isSel && fs < T.label.midMin * 0.85) continue;
      fs = Math.max(fs, T.label.midMin);
      if (lv === 'near' && !isSel) { s += lab(txt, X, Y, fs * 0.82, 0, 'lbl-dist', mp.label, '.72'); continue; }
      const t = lab(txt, X, Y + fs * 0.35, fs, fs * (T.label.distSpacing || 0), 'lbl-dist' + (isSel ? ' is-sel' : ''), isSel ? mp.selLabel : mp.label, '', isSel);
      if (isSel) selLbl.push(t); else s += t;
    }
  }
  // marcadores
  for (const mk of (o.marks || [])) s += marker(mk, sx(mk.x), sy(mk.y));
  s += selLbl.join('');
  s += `</svg>`;
  return s;
}
function marker(mk, X, Y) {
  const mp = T.map, H = { icSVG, IC, tracks: T.tracks };
  if (mk.t === 'nucleo') return `<g class="mk mk-nucleo" transform="translate(${X},${Y})">${T.mk.nucleo(mk, H)}</g>`;
  if (mk.t === 'count') return `<g class="mk mk-count" transform="translate(${X},${Y})">${T.mk.count(mk, H)}</g>`;
  if (mk.t === 'star') return `<g class="mk mk-star" transform="translate(${X},${Y})">${T.mk.star(mk, H)}</g>`;
  if (mk.t === 'alert') return `<g class="mk mk-alert" transform="translate(${X},${Y})">${T.mk.alert(mk, H)}</g>`;
  if (mk.t === 'cluster') return `<g class="mk mk-cluster" transform="translate(${X},${Y})">${T.mk.cluster(mk, H)}</g>`;
  if (mk.t === 'mission') return `<g class="mk mk-mission" transform="translate(${X},${Y})">${T.mk.mission(mk, H)}</g>`;
  if (mk.t === 'me') return `<g transform="translate(${X},${Y})"><circle r="14" fill="${mp.me}" fill-opacity=".2"/><circle r="6" fill="${mp.me}" stroke="#fff" stroke-width="2"/></g>`;
  return '';
}
// SVG de ícone dentro do mapa
function icSVG(name, size, color, sw) { return `<g transform="translate(${-size / 2},${-size / 2}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${sw || T.icon.sw}" stroke-linecap="${T.icon.cap}" stroke-linejoin="${T.icon.join}"><path d="${IC[name]}"/></g>`; }

/* ---------------- dados de interface (fictícios) ---------------- */
const MESES = D.meta.meses;
const FICT = `<span class="fict">dados fictícios</span>`;
const src = (t) => `<span class="src">${ic('doc', 12)}${t}</span>`;
const TR = { fis: 'Fiscalista', int: 'Intelectual', mil: 'Militante' };

/* ---------------- componentes ---------------- */
function topbar(o) {
  const res = o.res.map(r => `<div class="res" tabindex="0" title="${r.l}">${ic(r.i, 18)}<b>${r.v}</b>${r.d ? `<em class="${r.g === undefined ? (r.d[0] === '−' ? 'neg' : 'pos') : (r.g ? 'pos' : 'neg')}">${r.d}</em>` : ''}<small>${r.l}</small></div>`).join('');
  return `<header class="cm-top">
   <div class="brand">${T.brand()}<div class="brand-t"><b>Cidade Missão</b><small>São Paulo · SP</small></div></div>
   <div class="res-row">${res}</div>
   <div class="top-mid"><span class="layer-badge">${ic(o.layerIcon, 14)}Camada <b>${o.layer}</b></span>${FICT}</div>
   <div class="top-right">
     ${o.counters.map(c => `<button class="cnt ${c.cls || ''}" title="${c.l}">${ic(c.i, 16)}<span class="num">${c.n}</span></button>`).join('')}
     <div class="date-ctl"><div class="date"><b>Outubro de 2026</b><small>dados de ${MESES[11]} · mensal</small></div>
       <div class="time-btns"><button title="Mês anterior">${ic('prev', 14)}</button><button class="is-on" title="Pausado">${ic('pause', 14)}</button><button title="Próximo mês" disabled>${ic('next', 14)}</button></div></div>
     <button class="icon-btn" title="Menu">${ic('menu', 18)}</button>
   </div></header>`;
}
function rail(active, locked = []) {
  const items = [['map', 'Mapa'], ['building', 'Território'], ['home', 'Núcleo'], ['flag', 'Missões'], ['user', 'Ficha e trilhas'], ['bell', 'Alertas'], ['ledger', 'Ledger'], ['scale', 'Decisões'], ['send', 'Delegações'], ['chart', 'Relatórios']];
  return `<nav class="cm-rail" aria-label="Painéis">${items.map(([i, l]) => {
    const lk = locked.includes(i);
    return `<button class="rail-b ${i === active ? 'is-sel' : ''} ${lk ? 'is-lock' : ''}" title="${l}${lk ? ' — disponível a partir da camada Autoridade' : ''}" ${lk ? 'aria-disabled="true"' : ''}>${ic(i, 20)}${lk ? `<span class="lk">${ic('lock', 10)}</span>` : ''}${i === 'bell' ? '<span class="badge-n">7</span>' : ''}</button>`;
  }).join('')}<div class="rail-sep"></div><button class="rail-b" title="Configurações">${ic('gear', 20)}</button></nav>`;
}
function spark(vals, w = 120, h = 28, cls = '') {
  const mn = Math.min(...vals), mx = Math.max(...vals), k = (mx - mn) || 1;
  const pts = vals.map((v, i) => [i * w / (vals.length - 1), h - 3 - (v - mn) / k * (h - 6)]);
  const d = 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join('L');
  const last = pts[pts.length - 1];
  return `<svg class="spark ${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}L${w},${h}L0,${h}Z" class="sp-area"/><path d="${d}" class="sp-line" fill="none"/><circle cx="${last[0]}" cy="${last[1]}" r="2.6" class="sp-dot"/></svg>`;
}
function drawerCR() {
  const d = byId.CRE;
  const tabs = ['Visão geral', 'Serviços', 'Partido', 'Fontes'];
  const kpi = (i, l, v, u, extra = '') => `<div class="kpi">${ic(i, 22)}<div><b>${v}</b><small>${u}</small></div><span class="kpi-l">${l}</span>${extra}</div>`;
  const demand = [['lamp', 'Iluminação', 312], ['road', 'Buracos', 248], ['tree', 'Poda', 131], ['trash', 'Entulho', 96], ['drop', 'Drenagem', 64]];
  const deliv = [['hands', 'Mutirões', 14], ['lupa', 'Vistorias', 22], ['doc', 'Pedidos à SUB', 37], ['users', 'Rodas de estudo', 9], ['check', 'Alertas resolvidos', 418]];
  const row = ([i, l, n], cls) => `<div class="pair-row ${cls}">${ic(i, 18)}<span>${l}</span><b>${fmt(n)}</b></div>`;
  return `<aside class="cm-drawer" aria-label="Painel do território">
   <div class="dr-head">${T.orn.head || ''}
     <button class="icon-btn round" title="Voltar">${ic('back', 18)}</button>
     <div class="dr-title"><small class="eyebrow">${T.codes ? '<span class="code">D-' + d.cod + ' · CRE</span>' : ''}Distrito · Subprefeitura <u class="tt-term">Campo Limpo</u></small><h2>Capão Redondo</h2></div>
     <button class="icon-btn round" title="Fechar">${ic('close', 18)}</button>
   </div>
   <div class="tabs" role="tablist">${tabs.map((t, i) => `<button role="tab" class="tab ${i === 2 ? 'is-sel' : ''}" aria-selected="${i === 2}">${t}</button>`).join('')}</div>
   <div class="dr-body">
     <div class="mode-strip">${ic('target', 16)}<span>Modo <b>Presença</b></span>${rampHTML('pre', 'mini')}<span class="pos-mark" style="--p:${((d.pres - 0.3) / 2.7 * 100).toFixed(0)}%"></span></div>
     <div class="kpis">
       ${kpi('target', 'Presença', fmt(d.pres, 2), 'militantes /mil eleitores', `<span class="delta pos">▲ 0,21 em 12 meses</span>`)}
       ${kpi('users', 'Militantes', fmt(d.militantes), 'filiados ativos', `<span class="delta pos">▲ 31</span>`)}
       ${kpi('home', 'Núcleos', d.nucleos, 'em funcionamento', '<span class="delta">1 em formação</span>')}
       ${kpi('flag', 'Operações', d.ops, 'missões ativas', '<span class="delta pos">▲ 2 no mês</span>')}
     </div>
     <div class="block">
       <div class="block-h"><span>Presença em 12 meses</span>${src('Cadastro interno · distrito')}</div>
       <div class="spark-row">${spark(d.serie.pres, 300, 46, 'big')}<div class="spark-lbl"><b>${fmt(d.pres, 2)}</b><small>cidade: 1,57</small></div></div>
       <div class="months"><span>${MESES[0]}</span><span>${MESES[11]}</span></div>
     </div>
     <div class="block pair">
       <div><div class="pair-h">Maiores demandas <small>alertas, 12 meses</small></div>${demand.map(r => row(r, 'neg')).join('')}</div>
       <div><div class="pair-h">Mais entregue <small>2026</small></div>${deliv.map(r => row(r, 'pos')).join('')}</div>
     </div>
     <div class="block">
       <div class="block-h"><span>Composição por trilha</span><small>${fmt(d.militantes)} militantes</small></div>
       <div class="trackbar"><i class="t-fis" style="width:38%"></i><i class="t-int" style="width:24%"></i><i class="t-mil" style="width:38%"></i></div>
       <div class="track-legend"><span><i class="dot t-fis"></i>Fiscalista 38%</span><span><i class="dot t-int"></i>Intelectual 24%</span><span><i class="dot t-mil"></i>Militante 38%</span></div>
     </div>
     <div class="block">
       <div class="block-h"><span>Núcleos</span><button class="link">Ver os 3 ${ic('right', 12)}</button></div>
       ${[['Núcleo Valo Velho', 58, 'qui 19h', 'mil'], ['Núcleo Parque Fernanda', 47, 'sáb 10h', 'fis'], ['Núcleo Jardim Comercial', 35, 'ter 19h30', 'int']].map(([n, m, r, t], i) => `<div class="nuc-row ${i === 0 ? 'is-mine' : ''}"><span class="nuc-ic t-${t}">${ic('home', 16)}</span><div><b>${n}</b><small>${m} membros · reunião ${r}${i === 0 ? ' · <em>seu núcleo</em>' : ''}</small></div><span class="chev">${ic('right', 14)}</span></div>`).join('')}
     </div>
     <div class="dr-foot">${src('Todos os números deste painel são fictícios · protótipo')}</div>
   </div>
  </aside>`;
}
function outliner(sections) {
  return `<aside class="cm-outliner" aria-label="Acompanhamento">${sections.map(s => `
   <section class="ol-sec ${s.open ? 'is-open' : ''} ${s.cls || ''}">
     <button class="ol-h" aria-expanded="${!!s.open}">${ic(s.icon, 16)}<span>${s.t}</span>${s.n != null ? `<em>${s.n}</em>` : ''}<span class="ol-chev">${ic(s.open ? 'down' : 'right', 14)}</span></button>
     ${s.open ? `<div class="ol-body">${s.rows.map(r => `<div class="ol-row ${r.cls || ''}">${r.ic ? `<span class="ol-ic ${r.icCls || ''}">${ic(r.ic, 14)}</span>` : ''}<span class="ol-l">${r.l}</span>${r.bar != null ? `<span class="ol-bar"><i style="width:${r.bar}%"></i></span>` : ''}<span class="ol-v">${r.v}</span></div>`).join('')}</div>` : ''}
   </section>`).join('')}</aside>`;
}
function modes(active, locked = []) {
  const fams = [['territorio', ['adm', 'dem', 'ren']], ['servicos', ['sau', 'edu', 'san', 'ris']], ['problemas', ['zel']], ['partido', ['pre', 'ope', 'lac', 'ele']]];
  return `<div class="cm-modes" role="radiogroup" aria-label="Modos de mapa"><div class="modes-h">${ic('layers', 14)}Modos de mapa<kbd>M</kbd></div>${fams.map(([f, ids]) => `<div class="mode-fam"><span class="fam-l">${FAM[f]}</span><div class="mode-btns">${ids.map(id => {
    const lk = locked.includes(id);
    return `<button role="radio" aria-checked="${id === active}" class="mode-b ${id === active ? 'is-sel' : ''} ${lk ? 'is-lock' : ''}" title="${M[id].nome}${lk ? ' — bloqueado nesta camada' : ''}">${ic(lk ? 'lock' : M[id].icon, 16)}<span>${M[id].nome}</span></button>`;
  }).join('')}</div></div>`).join('')}</div>`;
}
function minimap(o) {
  const W = o.w, H = o.h, s = Math.min((W - 16) / D.meta.w, (H - 16) / D.meta.h);
  const ox = (W - D.meta.w * s) / 2, oy = (H - D.meta.h * s) / 2;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${T.map.miniBg}"/><g transform="translate(${ox} ${oy}) scale(${s})">`;
  for (const d of D.distritos) svg += `<path d="${d.d}" fill="${color(o.mode, d)}" fill-opacity="${T.chOp.far}" stroke="${T.map.border}" stroke-opacity=".5" stroke-width=".5" vector-effect="non-scaling-stroke"/>`;
  for (const k in D.represas) svg += `<path d="${D.represas[k]}" fill="${T.map.water}"/>`;
  svg += `<path d="${D.cidade}" fill="none" stroke="${T.map.city}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  const vx = o.view;
  if (vx) svg += `<rect x="${vx[0]}" y="${vx[1]}" width="${vx[2]}" height="${vx[3]}" fill="${T.map.miniView}" fill-opacity=".12" stroke="${T.map.miniView}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
  svg += `</g></svg>`;
  return `<div class="cm-mini" aria-label="Minimapa">${svg}<div class="mini-ctl"><button title="Aproximar">${ic('plus', 14)}</button><button title="Afastar"><svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${T.icon.sw}"><path d="M5 12h14"/></svg></button><button title="Centralizar">${ic('locate', 14)}</button></div><span class="mini-l">Visão da cidade</span></div>`;
}
function timeline(cur = 11, marks = [3, 7, 10]) {
  return `<div class="cm-timeline" aria-label="Linha do tempo mensal"><button class="tl-play" title="Reproduzir 12 meses">${ic('play', 14)}</button>
   <div class="tl-track">${MESES.map((m, i) => `<button class="tl-m ${i === cur ? 'is-sel' : ''} ${i > cur ? 'is-future' : ''}" title="${m}"><span class="tl-tick"></span>${marks.includes(i) ? '<span class="tl-ev"></span>' : ''}<span class="tl-lbl">${m}</span></button>`).join('')}</div>
   <span class="tl-note">${ic('clock', 13)}Comparar com <b>out/25</b></span></div>`;
}
function actions(list) {
  return `<div class="cm-actions">${list.map((a, i) => `<button class="act ${a.cls || ''}" title="${a.l}">${ic(a.i, 24)}<span class="act-l">${a.l}</span>${a.n ? `<span class="badge-n">${a.n}</span>` : ''}</button>`).join('')}</div>`;
}
function toasts(list) {
  return `<div class="cm-toasts">${list.map(t => `<div class="toast ${t.cls || ''}">${ic(t.i, 18)}<div><b>${t.t}</b><p>${t.p}</p></div><time>${t.d}</time></div>`).join('')}</div>`;
}
function legend(mode, extra = '') {
  const m = M[mode];
  return `<div class="cm-legend"><div class="lg-h">${ic(m.icon, 16)}<b>${m.nome}</b><span class="fam-tag">${FAM[m.fam]}</span></div><div class="lg-u">${m.unit}</div>${rampHTML(mode)}${extra}<div class="lg-src">${src(m.fonte)}</div></div>`;
}
function missionCard(o) {
  return `<article class="mission ${o.cls || ''}"><div class="ms-head"><span class="ms-track t-${o.tr}">${ic(o.tr === 'fis' ? 'lupa' : o.tr === 'int' ? 'book' : 'mega', 16)}</span><div><small>${TR[o.tr]} · ${o.where}</small><b>${o.t}</b></div><span class="ms-state st-${o.st}">${o.stl}</span></div>
   <p>${o.p}</p>
   <div class="ms-prog"><span class="ms-bar"><i style="width:${o.pct}%"></i></span><span>${o.prog}</span></div>
   <div class="ms-foot"><span>${ic('cal', 13)}${o.when}</span><span>${ic('users', 13)}${o.who}</span><span class="xp">+${o.xp} XP</span></div></article>`;
}

/* ---------------- telas ---------------- */
const DW = 1920, DH = 1080;
function screenD1() {
  const d = byId.CRE;
  const marks = [];
  const EX = [d.lx, d.ly, 24, 8];
  const nucPts = randomIn('CRE', 3, 11, EX); const nucT = ['mil', 'fis', 'int'];
  nucPts.forEach((p, i) => marks.push({ t: 'nucleo', x: p[0], y: p[1], tr: nucT[i], n: [58, 47, 35][i], mine: i === 0 }));
  // núcleos vizinhos e contadores
  for (const z of D.distritos) {
    if (z.id === 'CRE') continue; if (z.nucleos) marks.push({ t: 'nucleo', x: z.lx - 6, y: z.ly + 9, tr: ['fis', 'int', 'mil'][z.cod % 3], n: z.nucleos, small: true });
    if (z.ops) marks.push({ t: 'count', x: z.lx + 9, y: z.ly + 9, n: z.ops });
  }
  marks.push({ t: 'count', x: d.lx + 14, y: d.ly + 12, n: d.ops, big: true });
  marks.push({ t: 'star', x: byId.CLM.lx + 3, y: byId.CLM.ly - 9, l: 'Sede regional Campo Limpo' });
  const ms = randomIn('CRE', 6, 77, EX);
  ms.forEach((p, i) => marks.push({ t: 'mission', x: p[0], y: p[1], tr: ['fis', 'mil', 'int', 'fis', 'mil', 'mil'][i] }));
  const routes = ms.slice(0, 4).map((p, i) => [nucPts[i % 3], p, T.tracks[['mil', 'fis', 'int'][i % 3]]]);
  const S = 3.5, px = 800, py = 560;
  const map = mapSVG({ w: DW, h: DH, cx: d.lx + 4, cy: d.ly + 2, px, py, s: S, mode: 'pre', sel: 'CRE', level: 'mid', marks, routes });
  const vw = [d.lx + 4 - px / S, d.ly + 2 - py / S, DW / S, DH / S];
  return `<div class="screen desk" style="width:${DW}px;height:${DH}px">${map}
   ${topbar({ layer: 'Militante', layerIcon: 'mega', res: [{ i: 'users', v: '14.582', l: 'Militantes ativos', d: '+312' }, { i: 'home', v: '206', l: 'Núcleos', d: '+4' }, { i: 'flag', v: '482', l: 'Missões ativas' }, { i: 'bell', v: '6.641', l: 'Alertas confirmados (30 dias)', d: '−4%', g: true }, { i: 'hands', v: '128', l: 'Entregas em 2026' }],
     counters: [{ i: 'flag', n: 3, l: 'Suas missões' }, { i: 'bell', n: 7, l: 'Alertas novos', cls: 'warn' }] })}
   ${rail('building', ['send'])}
   ${drawerCR()}
   ${legend('pre', `<div class="lg-sel">${ic('target', 13)}Capão Redondo: <b>${fmt(d.pres, 2)}</b> · 66º de 96</div>`)}
   ${outliner([
     { t: 'Meu núcleo', icon: 'home', open: true, rows: [{ ic: 'home', icCls: 't-mil', l: '<b>Núcleo Valo Velho</b>', v: '58 membros' }, { ic: 'cal', l: 'Próxima reunião', v: 'qui, 8/out, 19h' }, { ic: 'flag', l: 'Missões do núcleo', bar: 66, v: '4 de 6' }] },
     { t: 'Minhas missões', icon: 'flag', n: 3, open: true, rows: [{ ic: 'lupa', icCls: 't-fis', l: 'Vistoria de iluminação', bar: 75, v: '9/12' }, { ic: 'mega', icCls: 't-mil', l: 'Mutirão Pq. Fernanda', bar: 40, v: 'sáb' }, { ic: 'book', icCls: 't-int', l: 'Leitura: Plano Diretor', bar: 20, v: '1/5' }] },
     { t: 'Acompanhando', icon: 'eye', n: 5, open: true, rows: ['CRE', 'JDA', 'CLM', 'JDS', 'VAN'].map(id => ({ l: byId[id].nome, v: `${fmt(byId[id].pres, 2)} <i class="tr ${byId[id].serie.pres[11] >= byId[id].serie.pres[8] ? 'up' : 'dn'}">${byId[id].serie.pres[11] >= byId[id].serie.pres[8] ? '▲' : '▼'}</i>`, cls: id === 'CRE' ? 'is-sel' : '' })) },
     { t: 'Trilha', icon: 'lupa', open: true, rows: [{ ic: 'lupa', icCls: 't-fis', l: 'Fiscalista · nível 4', bar: 62, v: '62%' }] },
     { t: 'Subprefeituras', icon: 'building', n: 32 }, { t: 'Delegações', icon: 'lock', n: 'Autoridade', cls: 'is-lock' },
   ])}
   ${modes('pre', ['ele'])}
   ${minimap({ w: 300, h: 210, mode: 'pre', view: vw })}
   ${toasts([{ i: 'check', t: 'Missão concluída', p: 'Vistoria na Estr. de Itapecerica: 12 pontos registrados.', d: '6 out', cls: 'ok' }, { i: 'users', t: 'Novo membro no seu núcleo', p: 'Valo Velho agora tem 58 militantes.', d: '5 out' }])}
   ${actions([{ i: 'flag', l: 'Nova missão' }, { i: 'bell', l: 'Registrar alerta' }, { i: 'send', l: 'Convocar', n: 2 }, { i: 'home', l: 'Meu núcleo' }, { i: 'chart', l: 'Relatório' }])}
   ${timeline(11)}
  </div>`;
}
function ledger() {
  const rows = [...D.distritos].sort((a, b) => b.lac - a.lac).slice(0, 18);
  const r = rng(5);
  return `<aside class="cm-drawer ledger" aria-label="Ledger de territórios">
   <div class="dr-head">${T.orn.head || ''}<button class="icon-btn round" title="Voltar">${ic('back', 18)}</button>
     <div class="dr-title"><small class="eyebrow">${T.codes ? '<span class="code">LDG-01</span>' : ''}Tabela comparativa · 96 distritos</small><h2>Ledger de territórios</h2></div>
     <button class="icon-btn round" title="Fechar">${ic('close', 18)}</button></div>
   <div class="tabs"><button class="tab is-sel">Distritos</button><button class="tab">Subprefeituras</button><button class="tab">Núcleos</button></div>
   <div class="dr-body">
     <div class="filters"><button class="chip is-sel">${ic('filter', 12)}Minhas delegações</button><button class="chip">Todas as subprefeituras ${ic('down', 12)}</button><button class="chip">${ic('sort', 12)}Lacunas ↓</button></div>
     <table class="tbl"><thead><tr><th>#</th><th>Distrito</th><th class="num is-sort">Lacunas</th><th class="num">Zelad.</th><th class="num">Vulner.</th><th class="num">Presença</th><th class="num">Δ 3m</th></tr></thead><tbody>
     ${rows.map((d, i) => { const dl = Math.round((r() - 0.6) * 9); return `<tr class="${d.id === 'CDU' ? 'is-hover' : ''} ${['CDU', 'GRA', 'SOC', 'JDA', 'JDS', 'CRE', 'CLM', 'VAN'].includes(d.id) ? 'is-deleg' : ''}"><td>${i + 1}</td><td><b>${d.nome}</b><small>${d.sub}</small></td><td class="num"><span class="cell-sw" style="background:${color('lac', d)}"></span>${d.lac}</td><td class="num">${fmt(d.zel, 1)}</td><td class="num">${fmt(d.vul * 100)}</td><td class="num">${fmt(d.pres, 2)}</td><td class="num ${dl < 0 ? 'pos' : dl > 0 ? 'neg' : ''}">${dl > 0 ? '+' : ''}${dl}</td></tr>`; }).join('')}
     </tbody></table>
     <div class="dr-foot">${src('Índice composto · out/2026 · distrito')} ${FICT}</div>
   </div></aside>`;
}
function tooltipLac(id, hx, hy) {
  const d = byId[id];
  const L = Math.min(880, hx + 40), Tp = Math.max(250, Math.min(hy - 190, 520));
  const zn = d.zel / 11.5, pn = d.pres / 3.9;
  const parts = [['Problemas de zeladoria', 40, zn, 'bell'], ['Vulnerabilidade social', 35, d.vul, 'people'], ['Presença baixa do partido', 25, 1 - pn, 'target']];
  return `<svg class="tip-lead" width="${DW}" height="${DH}" style="position:absolute;left:0;top:0;pointer-events:none;z-index:6"><path d="M${hx},${hy}L${L},${Tp + 40}" stroke="${T.map.hover}" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${hx}" cy="${hy}" r="4" fill="${T.map.hover}"/></svg>
  <div class="cm-tip lvl1" role="tooltip" style="left:${L}px;top:${Tp}px">
    <div class="tip-h"><b>${d.nome}</b><small>${d.sub} · distrito</small></div>
    <div class="tip-big"><span class="tip-sw" style="background:${color('lac', d)}"></span><b>${d.lac}</b><span>Prioridade <u class="tt-term">alta</u> de presença e serviço</span></div>
    <div class="tip-sub">Como o <u class="tt-term is-open">índice de Lacunas</u> é composto</div>
    ${parts.map(([l, w, v, i]) => `<div class="tip-part">${ic(i, 14)}<span>${l}</span><span class="tp-w">peso ${w}%</span><span class="tp-bar"><i style="width:${(v * 100).toFixed(0)}%"></i></span><b>${(v * w).toFixed(0)}</b></div>`).join('')}
    <div class="tip-sum"><span>Soma ponderada</span><b>${d.lac}</b></div>
    <div class="tip-foot">${src("Índice composto · out/2026 · distrito")}<span class="tip-hint">Segure <kbd>Alt</kbd> ou espere para fixar</span></div>
  </div>
  <svg width="${DW}" height="${DH}" style="position:absolute;left:0;top:0;pointer-events:none;z-index:8"><path d="M${L + 250},${Tp + 122}L${L + 392},${Tp + 122}" stroke="${T.map.hover}" stroke-width="1.5"/></svg>
  <div class="cm-tip lvl2 is-pinned" role="tooltip" style="left:${L + 392}px;top:${Tp + 96}px">
    <div class="tip-pin">${ic('pin', 12)}fixado</div>
    <div class="tip-h"><b>Índice de Lacunas</b><small>termo do glossário</small></div>
    <p>Mostra onde o partido deve <b>chegar primeiro</b>: combina problemas confirmados, <u class="tt-term">vulnerabilidade social</u> e baixa presença. Um valor alto <b>não</b> descreve o bairro; indica prioridade de presença e de serviço.</p>
    <div class="tip-src"><span>Problemas</span><b>alertas confirmados /mil hab., 12 meses</b><span>Vulnerabilidade</span><b><u class="tt-term">IPVS</u> (Seade) · 2010 · setor → distrito [verificar]</b><span>Presença</span><b>militantes /mil eleitores · cadastro interno</b></div>
    <div class="tip-foot">${FICT}<span class="tip-hint">Clique num termo sublinhado para abrir outra camada</span></div>
  </div>`;
}
function screenD2() {
  const marks = [];
  for (const sb of ['Campo Limpo', "M'Boi Mirim", 'Capela do Socorro']) { const z = D.subprefeituras[subIdx[sb]]; marks.push({ t: 'star', x: z.lx + 14, y: z.ly - 16, l: sb, deleg: true }); }
  for (const d of D.distritos) if (d.ops >= 6 && d.lac > 62) marks.push({ t: 'count', x: d.lx, y: d.ly + 10, n: d.ops });
  const gp = randomIn('GRA', 2, 9);
  gp.forEach(p => marks.push({ t: 'mission', x: p[0], y: p[1], tr: 'mil', warn: true }));
  const S = 0.86, px = 990, py = 595, cx = D.meta.w / 2 + 20, cy = D.meta.h / 2 + 20;
  const HOV = 'CDU';
  const map = mapSVG({ w: DW, h: DH, cx, cy, px, py, s: S, mode: 'lac', hover: HOV, level: 'far', marks, routes: [[gp[0], gp[1], T.map.warn]] });
  const hx = (byId[HOV].lx - (cx - px / S)) * S, hy = (byId[HOV].ly - (cy - py / S)) * S;
  return `<div class="screen desk" style="width:${DW}px;height:${DH}px">${map}
   ${topbar({ layer: 'Autoridade', layerIcon: 'building', res: [{ i: 'users', v: '14.582', l: 'Militantes ativos', d: '+312' }, { i: 'home', v: '206', l: 'Núcleos' }, { i: 'flag', v: '482', l: 'Missões ativas' }, { i: 'doc', v: '37', l: 'Pedidos abertos à prefeitura', d: '−5', g: true }, { i: 'send', v: '3', l: 'Subprefeituras delegadas a você' }],
     counters: [{ i: 'scale', n: 2, l: 'Decisões pendentes' }, { i: 'bell', n: 2, l: 'Alertas de coordenação', cls: 'warn' }] })}
   ${rail('ledger')}
   ${ledger()}
   ${legend('lac', `<div class="lg-words"><span>menor prioridade</span><span>maior prioridade</span></div>`)}
   <div class="cm-alert" role="alert"><div class="al-ic">${ic('ops', 22)}</div><div class="al-body"><small>Alerta de coordenação · Capela do Socorro</small><b>Duas missões disputam o mesmo trecho em Grajaú</b><p>Os núcleos Cocaia e Parque Residencial convocaram mutirões de limpeza para sáb., 17/out, na mesma área. Unificar evita retrabalho e dobra o efetivo.</p>
     <div class="al-act"><button class="btn primary">${ic('check', 14)}Unificar missões</button><button class="btn">${ic('send', 14)}Delegar</button><button class="btn ghost">${ic('map', 14)}Ver no mapa</button></div></div><button class="icon-btn" title="Dispensar">${ic('close', 16)}</button><span class="al-count">1 de 2</span></div>
   ${tooltipLac(HOV, hx, hy)}
   ${outliner([
     { t: 'Delegações', icon: 'send', n: 3, open: true, rows: ['Campo Limpo', "M'Boi Mirim", 'Capela do Socorro'].map(sb => { const ds = D.distritos.filter(d => d.sub === sb); const m = Math.round(ds.reduce((a, d) => a + d.lac, 0) / ds.length); return { ic: 'building', l: sb, bar: m, v: `${m}` }; }) },
     { t: 'Pedidos à subprefeitura', icon: 'doc', n: 37, open: true, rows: [{ ic: 'lamp', l: 'Iluminação · Jd. São Luís', v: '<span class="chip-s ok">respondido</span>' }, { ic: 'drop', l: 'Drenagem · Grajaú', v: '<span class="chip-s wait">em análise</span>' }, { ic: 'road', l: 'Recapeamento · Socorro', v: '<span class="chip-s late">atrasado</span>' }] },
     { t: 'Coordenação', icon: 'ops', n: 2, open: true, rows: [{ ic: 'ops', icCls: 'warn', l: 'Sobreposição em Grajaú', v: 'agora', cls: 'is-sel' }, { ic: 'users', l: 'Núcleo sem coordenador · Pedreira', v: '2 d' }] },
     { t: 'Núcleos sob coordenação', icon: 'home', n: 19 }, { t: 'Acompanhando', icon: 'eye', n: 8 }, { t: 'Decisões pendentes', icon: 'scale', n: 2 },
   ])}
   ${modes('lac')}
   ${minimap({ w: 300, h: 210, mode: 'lac', view: [cx - px / S, cy - py / S, DW / S, DH / S] })}
   ${toasts([{ i: 'doc', t: "Pedido respondido · M'Boi Mirim", p: 'Subprefeitura agendou reparo de 14 pontos de iluminação.', d: '7 out', cls: 'ok' }])}
   ${actions([{ i: 'send', l: 'Delegar' }, { i: 'doc', l: 'Pedido à subprefeitura' }, { i: 'users', l: 'Convocar coordenação' }, { i: 'ledger', l: 'Ledger', cls: 'is-sel' }, { i: 'chart', l: 'Relatório mensal' }])}
   ${timeline(11, [2, 6, 9])}
  </div>`;
}
const MW = 390, MH = 844;
function statusbar() { return `<div class="m-status"><span>12:14</span><span class="m-sys"><i></i><i></i><i></i><b>78%</b></span></div>`; }
function screenM1() {
  const d = byId.BRL; const r = rng(42);
  const cats = [['lamp', 'Iluminação'], ['road', 'Buraco'], ['trash', 'Entulho'], ['tree', 'Poda'], ['drop', 'Alagamento']];
  const marks = randomIn('BRL', 26, 31).map((p, i) => ({ t: 'alert', x: p[0], y: p[1], c: cats[Math.floor(r() * 5)][0], fresh: i < 4 }));
  for (const id of ['FRE', 'CAC', 'JAR', 'PIR', 'LIM']) { const z = byId[id]; marks.push({ t: 'cluster', x: z.lx, y: z.ly + 6, n: Math.round(z.zel * z.pop / 1000 / 12) }); }
  marks.push({ t: 'me', x: d.lx + 6, y: d.ly + 16 });
  const S = 7.2, px = 200, py = 250;
  const map = mapSVG({ w: MW, h: MH, cx: d.lx + 4, cy: d.ly, px, py, s: S, mode: 'zel', sel: 'BRL', level: 'near', marks });
  const top = [['lamp', 'Iluminação', 41], ['road', 'Buracos', 33], ['trash', 'Entulho', 22], ['tree', 'Poda', 15]];
  return `<div class="screen mob" style="width:${MW}px;height:${MH}px">${map}${statusbar()}
   <div class="m-top"><div class="m-search">${ic('lupa', 18)}<span>Buscar distrito ou endereço</span><button class="m-avatar" title="Entrar">${ic('user', 16)}</button></div>
     <div class="m-chips"><button class="chip is-sel">${ic('bell', 13)}Zeladoria ${ic('down', 12)}</button><span class="chip layer">${ic('eye', 13)}Visitante</span>${FICT}</div></div>
   <div class="m-fab"><button title="Modos de mapa">${ic('layers', 20)}</button><button title="Minha localização">${ic('locate', 20)}</button></div>
   <div class="m-legend">${rampHTML('zel', 'mini')}<small>alertas /mil hab.</small></div>
   <section class="m-sheet mid" aria-label="Distrito selecionado"><div class="sh-handle"></div>
     <div class="sh-head"><div><small class="eyebrow">${T.codes ? '<span class="code">D-' + d.cod + ' · BRL</span>' : ''}Distrito · Freguesia/Brasilândia</small><h3>Brasilândia</h3></div><button class="icon-btn round" title="Fechar">${ic('close', 18)}</button></div>
     <div class="sh-stat"><div class="sh-big"><b>${fmt(d.zel, 1)}</b><span>alertas confirmados por mil habitantes, 12 meses<br>${src('Cidade Missão · distrito')}</span></div><div class="sh-cmp"><span>cidade <b>6,2</b></span><div class="sh-rw">${rampHTML('zel', 'mini')}<span class="pos-mark" style="--p:${((d.zel - 1) / 9).toFixed(2)}"></span></div></div></div>
     <div class="sh-cats">${top.map(([i, l, n]) => `<div class="cat">${ic(i, 18)}<b>${n}</b><small>${l}</small></div>`).join('')}</div>
     <div class="sh-sub"><span>Alertas recentes</span><small>últimos 30 dias</small></div>
     <div class="sh-list"><div class="al-row">${ic('lamp', 16)}<div><b>Poste apagado</b><small>R. Parapuã · confirmado por 6 pessoas</small></div><time>2 h</time></div>
       <div class="al-row">${ic('road', 16)}<div><b>Buraco na pista</b><small>Av. Dep. Cantídio Sampaio · 11 confirmações</small></div><time>ontem</time></div></div>
     <button class="m-cta">${ic('plus', 18)}Registrar alerta</button>
   </section>
   <nav class="m-nav">${[['map', 'Mapa', 1], ['bell', 'Alertas'], ['chart', 'Números'], ['user', 'Entrar']].map(([i, l, s]) => `<button class="${s ? 'is-sel' : ''}">${ic(i, 20)}<span>${l}</span></button>`).join('')}</nav>
  </div>`;
}
function screenM2() {
  const attrs = [['lupa', 'Fiscalização', 14, 'fis'], ['book', 'Formulação', 9, 'int'], ['mega', 'Mobilização', 11, 'mil'], ['send', 'Comunicação', 8], ['users', 'Coordenação', 10]];
  const traits = [['clock', 'Pontual'], ['doc', 'Leitora do Diário Oficial'], ['hands', 'Articuladora'], ['eye', 'Olho de vistoria']];
  const lv = { fis: 4, int: 2, mil: 3 };
  return `<div class="screen mob ficha-s" style="width:${MW}px;height:${MH}px">${statusbar()}
   <div class="m-appbar"><button class="icon-btn round">${ic('back', 18)}</button><b>Ficha do militante</b><span class="layer-badge sm">${ic('mega', 12)}Militante</span></div>
   <div class="ficha-scroll">
    <section class="f-hero">
      <div class="f-portrait">${T.portrait()}<span class="f-lvl">4</span></div>
      <div class="f-id"><small class="eyebrow">${T.codes ? '<span class="code">MIL-0412</span>' : ''}Núcleo Valo Velho · Capão Redondo</small><h3>Marina Alves Costa</h3>
        <div class="f-track t-fis">${ic('lupa', 14)}Fiscalista · nível 4</div><div class="f-branch">Ramo: <u class="tt-term">Orçamento e contratos</u></div></div>
    </section>
    <div class="f-xp"><div class="xp-bar"><i style="width:62%"></i></div><span><b>1.860</b> / 3.000 XP para o nível 5</span></div>
    <section class="f-attrs">${attrs.map(([i, l, n, t]) => `<div class="attr ${t ? 't-' + t : ''}">${ic(i, 18)}<b>${n}</b><small>${l}</small></div>`).join('')}</section>
    <section class="f-block"><div class="f-h">Traços</div><div class="traits">${traits.map(([i, l]) => `<span class="trait">${ic(i, 14)}${l}</span>`).join('')}</div></section>
    <section class="f-block"><div class="f-h">Trilhas <small>níveis 1 a 6</small></div>
      <div class="tree">${['fis', 'int', 'mil'].map(t => `<div class="tree-col t-${t}"><span class="tree-l">${TR[t]}</span><div class="nodes">${[1, 2, 3, 4, 5, 6].map(n => `<span class="node ${n <= lv[t] ? 'is-done' : n === lv[t] + 1 ? 'is-next' : ''}">${n <= lv[t] ? ic('check', 11) : n}</span>`).join('')}</div></div>`).join('')}</div></section>
    <section class="f-block"><div class="f-h">Missões em curso <small>2</small></div>
      ${missionCard({ tr: 'fis', where: 'Capão Redondo', t: 'Vistoria de iluminação na Estr. de Itapecerica', st: 'run', stl: 'em curso', p: 'Registrar com foto os pontos apagados e cruzar com os chamados abertos na prefeitura.', pct: 75, prog: '9 de 12 pontos', when: 'até sex, 9/out', who: '4 pessoas', xp: 120 })}
      ${missionCard({ tr: 'int', where: 'Núcleo Valo Velho', t: 'Roda de leitura: Plano Diretor', st: 'next', stl: 'agendada', p: 'Capítulo 2: zonas especiais de interesse social.', pct: 20, prog: '1 de 5 encontros', when: 'ter, 13/out', who: '11 inscritos', xp: 60 })}
    </section>
    <div class="f-foot">${FICT}<span>Pessoa e números fictícios</span></div>
   </div>
   <nav class="m-nav">${[['map', 'Mapa'], ['flag', 'Missões'], ['home', 'Núcleo'], ['user', 'Ficha', 1]].map(([i, l, s]) => `<button class="${s ? 'is-sel' : ''}">${ic(i, 20)}<span>${l}</span></button>`).join('')}</nav>
  </div>`;
}
function screenBoard() {
  const st = (lbl, html) => `<div class="bd-cell"><div class="bd-l">${lbl}</div>${html}</div>`;
  const btn = (c, l, i, extra = '') => `<button class="btn ${c}" ${extra}>${i ? ic(i, 14) : ''}${l}</button>`;
  return `<div class="screen desk board" style="width:${DW}px;height:760px">
   <div class="bd-title"><b>Prancha de componentes e estados</b><span>${FICT}</span></div>
   <div class="bd-grid">
    <div class="bd-col">
      ${st('Janela de decisão · camada Direção', `<div class="cm-decision static"><div class="dc-head">${T.orn.head || ''}<small class="eyebrow">Decisão · Diretório municipal</small><h3>Para onde vai o mutirão de novembro?</h3></div>
        <p class="dc-body">O diretório tem efetivo para um grande mutirão no mês. As três subprefeituras abaixo têm o maior índice de Lacunas entre as suas delegações. Cada escolha muda as missões sugeridas para os núcleos.</p>
        <div class="dc-opts">
         <button class="dc-opt is-focus"><span class="dc-k">A</span><div><b>Concentrar em M'Boi Mirim</b><small>+3 missões sugeridas · 4 núcleos envolvidos · <u class="tt-term">custo de coordenação</u> alto</small></div></button>
         <button class="dc-opt"><span class="dc-k">B</span><div><b>Dividir entre Capela do Socorro e Campo Limpo</b><small>+2 missões em cada · 6 núcleos envolvidos</small></div></button>
         <button class="dc-opt is-lock" aria-disabled="true"><span class="dc-k">${ic('lock', 12)}</span><div><b>Convocar a cidade inteira</b><small>Exige aprovação da executiva estadual</small></div></button>
        </div><div class="dc-foot"><span>${ic('clock', 13)}Decidir até 20/out</span><span>${ic('users', 13)}3 dirigentes já opinaram</span></div></div>`)}
      ${st('Cartão de missão · estados', `<div class="bd-row">${missionCard({ tr: 'mil', where: 'Grajaú', t: 'Mutirão de limpeza no córrego', st: 'run', stl: 'em curso', p: 'Ponto de encontro na praça às 8h.', pct: 55, prog: '22 de 40 vagas', when: 'sáb, 17/out', who: '22 confirmados', xp: 150 })}${missionCard({ tr: 'fis', where: 'Sapopemba', t: 'Vistoria de UBS', st: 'done', stl: 'concluída', p: 'Relatório enviado à subprefeitura.', pct: 100, prog: 'entregue', when: '30/set', who: '3 pessoas', xp: 90, cls: 'is-done' })}</div>`)}
      ${st('Folha inferior no celular · recolhida, intermediária, expandida', `<div class="bd-sheets">${[['recolhida', 88], ['intermediária', 52], ['expandida', 12]].map(([l, t]) => `<div class="bd-phone"><div class="bd-ph-map"></div><div class="bd-ph-sheet" style="top:${t}%"><i></i></div><small>${l}</small></div>`).join('')}<p class="bd-note">Arrastar a alça alterna as três alturas. Na intermediária, o mapa continua navegável acima da folha; na expandida, a folha vira página com rolagem e o mapa recebe um botão de voltar.</p></div>`)}
    </div>
    <div class="bd-col">
      ${st('Botões · normal, foco, selecionado, desativado', `<div class="bd-row">${btn('primary', 'Unificar', 'check')}${btn('primary is-focus', 'Foco', 'check')}${btn('', 'Delegar', 'send')}${btn('is-sel', 'Selecionado', 'eye')}${btn('', 'Bloqueado', 'lock', 'disabled')}</div>`)}
      ${st('Trilho de ícones · normal, foco, selecionado, bloqueado por camada', `<div class="bd-row rail-demo"><button class="rail-b">${ic('map', 20)}</button><button class="rail-b is-focus">${ic('home', 20)}</button><button class="rail-b is-sel">${ic('flag', 20)}</button><button class="rail-b is-lock" aria-disabled="true">${ic('send', 20)}<span class="lk">${ic('lock', 10)}</span></button><span class="bd-note">Bloqueado: “Delegações abre na camada Autoridade”.</span></div>`)}
      ${st('Seletor de modos · camada Visitante (família Partido bloqueada)', modes('zel', ['ele', 'ope', 'pre', 'lac']).replace('cm-modes', 'cm-modes static'))}
      ${st('Notificação · padrão, sucesso, atenção', toasts([{ i: 'users', t: 'Novo membro no seu núcleo', p: 'Valo Velho agora tem 58 militantes.', d: 'agora' }, { i: 'check', t: 'Pedido respondido', p: 'Reparo agendado para 14 pontos.', d: '7 out', cls: 'ok' }, { i: 'ops', t: 'Coordenação necessária', p: 'Duas missões no mesmo trecho.', d: '7 out', cls: 'warn' }]).replace('cm-toasts', 'cm-toasts static'))}
      ${st('Ícones · grade 24 px, traço ' + T.icon.sw + ' px, terminação ' + (T.icon.cap === 'round' ? 'arredondada' : 'reta'), `<div class="bd-icons">${['map','building','home','flag','user','bell','ledger','scale','send','chart','lupa','book','mega','lamp','road','tree','trash','drop','health','shield','target','gap','urna','people','coin','layers','star','lock','info','pin'].map(n => `<span title="${n}">${ic(n, 22)}</span>`).join('')}</div>`)}
    </div>
    <div class="bd-col">
      ${st('Tooltip simples (nível 1) · termo sublinhado abre nível 2', `<div class="cm-tip static"><div class="tip-h"><b>Presença</b><small>modo de mapa · Partido</small></div><p>Militantes ativos por mil eleitores do distrito. <u class="tt-term">Militante ativo</u> é quem participou de ao menos uma missão em 90 dias.</p><div class="tip-foot">${src('Cadastro interno · out/2026 · distrito')}</div></div>`)}
      ${st('Abas do painel', `<div class="tabs static"><button class="tab">Visão geral</button><button class="tab is-sel">Serviços</button><button class="tab is-focus">Partido</button><button class="tab is-lock" disabled>${ic('lock', 11)} Eleitoral</button></div>`)}
      ${st('Rampas de coropleta (5 famílias)', ['adm', 'dem', 'sau', 'zel', 'pre', 'lac'].map(m => `<div class="bd-ramp"><span>${FAM[M[m].fam]} · ${M[m].nome}</span>${rampHTML(m, 'mini')}</div>`).join(''))}
      ${st('Marcadores do mapa', `<svg class="bd-marks" width="520" height="92" viewBox="0 0 520 92"><rect width="520" height="92" fill="${T.map.land}"/>${marker({ t: 'nucleo', tr: 'mil', n: 58, mine: true }, 50, 46)}${marker({ t: 'nucleo', tr: 'int', n: 2, small: true }, 120, 46)}${marker({ t: 'count', n: 6 }, 185, 46)}${marker({ t: 'star', l: 'Sede' }, 245, 46)}${marker({ t: 'mission', tr: 'fis' }, 305, 46)}${marker({ t: 'alert', c: 'lamp', fresh: true }, 365, 50)}${marker({ t: 'alert', c: 'road' }, 415, 50)}${marker({ t: 'cluster', n: 128 }, 475, 46)}</svg><div class="bd-note">núcleo (seu) · núcleo · missões ativas · sede · missão · alerta novo · alerta · agrupamento</div>`)}
    </div>
   </div></div>`;
}

/* ---------------- montagem ---------------- */
window.CM_ENGINE = { ic, IC };
const BUILD = { d1: screenD1, d2: screenD2, m1: screenM1, m2: screenM2, board: screenBoard };
document.querySelectorAll('[data-screen]').forEach(el => { el.innerHTML = BUILD[el.dataset.screen](); });
// escala das telas de computador para caber na coluna
function fit() {
  document.querySelectorAll('.frame').forEach(f => {
    const sc = f.querySelector('.screen'); if (!sc) return;
    const w = +sc.style.width.replace('px', ''), h = +sc.style.height.replace('px', '');
    const avail = f.clientWidth; const k = f.classList.contains('is-full') ? 1 : Math.min(1, avail / w);
    sc.style.transform = `scale(${k})`; f.style.height = (h * k) + 'px';
  });
}
window.addEventListener('resize', fit); fit();
if (document.fonts) document.fonts.ready.then(fit);
document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
  const f = document.getElementById(b.dataset.zoom); const on = f.classList.toggle('is-full');
  b.textContent = on ? 'Ajustar à largura' : 'Ver em 100%'; b.setAttribute('aria-pressed', on); fit();
}));
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
  const el = document.getElementById(b.dataset.copy); const txt = el.textContent;
  const done = () => { const o = b.textContent; b.textContent = 'Copiado'; setTimeout(() => b.textContent = o, 1600); };
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selecionado: use Ctrl+C'; });
}));
// rampas: luminância
document.querySelectorAll('[data-lum]').forEach(el => {
  const L = h => { const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); const Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y; };
  el.textContent = 'L* ' + el.dataset.lum.split(',').map(h => Math.round(L(h))).join(' · ');
});
window.CM = { MODES, M, color, ic, fmt };
})();
