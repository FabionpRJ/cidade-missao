// Overlay compartilhado pelos dois motores: seleção, hover, rotas, rótulos (com colisão) e marcadores.
// Ordem (pacote A §4): … máscara → seleção → rotas tracejadas → rótulos → marcadores → rótulo do selecionado.
import type { Dados, LngLat } from '../data/types';
import { Colisor, K_LARGURA, rotuloSVG } from './labels';
import type { NivelZoom, Scene } from './MapEngine';
import { markerSVG } from './markers';
import { metrosPorPx } from './projection';

export interface OverlayCtx {
  project: (ll: LngLat) => [number, number];
  w: number;
  h: number;
  zoom: number;
  nivel: NivelZoom;
  scene: Scene;
  dados: Dados;
  motor: 'google' | 'proprio';
}

const LBL = { farMin: 11, farMax: 22, midMin: 11, midMax: 19, subSpacing: 0.16, distSpacing: 0.06 };
const VIAS_ROTULADAS = ['Estr. de Itapecerica', 'Av. Eng. Caetano Álvares', 'Marginal Tietê', 'Av. Sapopemba', 'Marginal Pinheiros', 'Radial Leste', 'Av. 23 de Maio'];

function polyPath(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon, project: OverlayCtx['project']) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let d = '';
  for (const p of polys) for (const ring of p) {
    d += 'M' + ring.map((c) => project(c as LngLat).map((n) => n.toFixed(1)).join(',')).join('L') + 'Z';
  }
  return d;
}

let uid = 0;
export function renderOverlay(o: OverlayCtx): string {
  const { project, w, h, nivel, scene, dados } = o;
  const id = 'ov' + (uid++ % 1000);
  const dentro = (x: number, y: number, m = 40) => x > -m && x < w + m && y > -m && y < h + m;
  const pxm = 1 / metrosPorPx(o.zoom, -23.6);
  let s = '';

  // hover e seleção
  if (scene.hover && scene.hover !== scene.sel && scene.hover !== scene.selB) {
    const d = dados.distritoPorId[scene.hover];
    if (d) s += `<path class="ov-hover" d="${polyPath(d.geometry, project)}"/>`;
  }
  for (const [sid, cls] of [[scene.selB, 'ov-sel ov-sel-b'], [scene.sel, 'ov-sel']] as const) {
    if (!sid) continue;
    const d = dados.distritoPorId[sid];
    if (!d) continue;
    const p = polyPath(d.geometry, project);
    s += `<g class="${cls}"><path class="ov-sel-glow" d="${p}"/><path class="ov-sel-dark" d="${p}"/><path class="ov-sel-line" d="${p}"/></g>`;
  }

  // rotas tracejadas núcleo → missão
  for (const r of scene.routes) {
    const [x1, y1] = project(r.a), [x2, y2] = project(r.b);
    if (!dentro(x1, y1, 200) && !dentro(x2, y2, 200)) continue;
    const qx = (x1 + x2) / 2 + (y2 - y1) * 0.18, qy = (y1 + y2) / 2 - (x2 - x1) * 0.18;
    s += `<path class="ov-route" d="M${x1.toFixed(1)},${y1.toFixed(1)}Q${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" stroke="${r.cor}"/>`;
  }

  // rótulos de vias (perto; no Google, as vias vêm do próprio mapa)
  if (nivel === 'near' && o.motor === 'proprio') {
    for (const k of VIAS_ROTULADAS) {
      const via = dados.fundo.vias[k];
      if (!via) continue;
      for (const [i, seg] of via.entries()) {
        const pts = seg.map((ll) => project(ll));
        if (!pts.some(([x, y]) => dentro(x, y, 0))) continue;
        const pid = `${id}v${k.length}${i}`;
        s += `<path id="${pid}" d="M${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join('L')}" fill="none"/><text class="lbl-road"><textPath href="#${pid}" startOffset="20%">${k}</textPath></text>`;
      }
    }
  }
  // municípios vizinhos (só no renderizador próprio)
  if (nivel !== 'near' && o.motor === 'proprio') {
    for (const v of dados.fundo.vizinhos) {
      const [x, y] = project([v.lng, v.lat]);
      if (x > 20 && x < w - 20 && y > 20 && y < h - 20) s += `<text class="lbl-viz" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${v.nome}</text>`;
    }
  }

  // rótulos de território
  const col = new Colisor();
  const selLbl: string[] = [];
  if (nivel === 'far') {
    const subs = [...dados.subprefeituras].sort((a, b) => b.rotulo.r_m - a.rotulo.r_m);
    for (const sb of subs) {
      const [X, Y] = project([sb.rotulo.lng, sb.rotulo.lat]);
      if (!dentro(X, Y)) continue;
      const txt = sb.curto.toUpperCase();
      const r = sb.rotulo.r_m * pxm;
      let fs = Math.min(LBL.farMax, r * 0.5);
      fs = Math.min(fs, (2.5 * r) / (txt.length * (K_LARGURA + LBL.subSpacing)));
      if (fs < LBL.farMin * 0.8) continue;
      fs = Math.max(fs, LBL.farMin);
      s += rotuloSVG({ txt, x: X, y: Y + fs * 0.35, fs, ls: fs * LBL.subSpacing, cls: 'lbl-sub', colisor: col });
    }
    // na visão longe, o distrito selecionado ainda recebe o nome
    for (const sid of [scene.sel, scene.selB]) {
      const d = sid ? dados.distritoPorId[sid] : null;
      if (!d) continue;
      const [X, Y] = project([d.rotulo.lng, d.rotulo.lat]);
      selLbl.push(rotuloSVG({ txt: d.nome.toUpperCase(), x: X, y: Y + 6, fs: 15, ls: 1, cls: 'lbl-dist is-sel', forcado: true, colisor: col }));
    }
  } else {
    const sel = new Set([scene.sel, scene.selB].filter(Boolean) as string[]);
    const ds = [...dados.distritos].sort((a, b) => Number(sel.has(b.id)) - Number(sel.has(a.id)) || b.rotulo.r_m - a.rotulo.r_m);
    for (const d of ds) {
      const [X, Y] = project([d.rotulo.lng, d.rotulo.lat]);
      if (!dentro(X, Y)) continue;
      const isSel = sel.has(d.id), txt = d.nome.toUpperCase();
      const r = d.rotulo.r_m * pxm;
      let fs = Math.min(LBL.midMax, r * 0.34) * (isSel ? 1.3 : 1);
      if (!isSel) fs = Math.min(fs, (2.6 * r) / (txt.length * (K_LARGURA + LBL.distSpacing)));
      if (!isSel && fs < LBL.midMin * 0.85) continue;
      fs = Math.max(fs, LBL.midMin);
      if (nivel === 'near' && !isSel) { s += rotuloSVG({ txt, x: X, y: Y, fs: fs * 0.82, ls: 0, cls: 'lbl-dist', op: 0.72, colisor: col }); continue; }
      const t = rotuloSVG({ txt, x: X, y: Y + fs * 0.35, fs, ls: fs * LBL.distSpacing, cls: 'lbl-dist' + (isSel ? ' is-sel' : ''), forcado: isSel, colisor: col });
      if (isSel) selLbl.push(t); else s += t;
    }
  }

  // marcadores
  for (const m of scene.marks) {
    if (!m.niveis.includes(nivel)) continue;
    const [X, Y] = project([m.lng, m.lat]);
    if (!dentro(X, Y)) continue;
    s += markerSVG(m, X, Y);
  }
  s += selLbl.join('');
  return s;
}
