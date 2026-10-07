// Renderizador próprio (sem chave do Google): SVG + d3-geo (Web Mercator ajustada a SP), fundo esquemático de engine.js.
import type { Dados, LngLat } from '../data/types';
import { CENA_VAZIA, Emissor, nivelDoZoom, SP_BOUNDS, type Bounds, type EventosMapa, type MapEngine, type NivelZoom, type Ouvinte, type Padding, type Scene, type View } from './MapEngine';
import { renderOverlay } from './OverlayLayer';
import { anelParaPath, deMundo, metrosPorPx, mundo, pathMundo, Z_REF } from './projection';

const NS = 'http://www.w3.org/2000/svg';
const Z_MIN = 9.6, Z_MAX = 16.5;
const reduzido = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
}

export class FallbackMapEngine implements MapEngine {
  readonly tipo = 'proprio' as const;
  private ev = new Emissor();
  private root!: HTMLDivElement;
  private world!: SVGGElement;
  private overlay!: SVGGElement;
  private ruas!: SVGPathElement;
  private choro = new Map<string, SVGPathElement>();
  private dados!: Dados;
  private c: [number, number] = [0, 0];
  private z = 11;
  private w = 1;
  private h = 1;
  private scene: Scene = CENA_VAZIA;
  private raf = 0;
  private ruasTimer = 0;
  private nivel: NivelZoom = 'far';
  private ro?: ResizeObserver;
  private noGo: Path2D[] = [];
  private metade?: Path2D;
  private yMetade = 0;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private ponteiros = new Map<number, { x: number; y: number }>();
  private arraste: { x: number; y: number; movido: boolean; alvo: Element | null; pinca?: { d: number; z: number } } | null = null;
  private anim = 0;
  private limpar: (() => void)[] = [];
  /** camada movida por CSS durante gestos (compositor), redesenhada quando o gesto assenta */
  private pane!: HTMLDivElement;
  private rc: [number, number] = [0, 0];
  private rz = 11;
  private commitTimer = 0;
  private rapido = 0;

  async mount(host: HTMLElement, dados: Dados, view: View) {
    this.dados = dados;
    this.root = document.createElement('div');
    this.root.className = 'fb-map';
    this.root.tabIndex = 0;
    this.root.setAttribute('role', 'application');
    this.root.setAttribute('aria-label', 'Mapa de São Paulo por distrito. Setas movem o mapa; + e − aproximam e afastam.');
    host.appendChild(this.root);

    this.pane = document.createElement('div');
    this.pane.className = 'fb-pane';
    this.root.appendChild(this.pane);
    const base = el('svg', { class: 'fb-base', width: '100%', height: '100%' }, this.pane);
    this.world = el('g', { class: 'fb-world' }, base);
    const W = this.world;
    const f = dados.fundo;
    const g = (cls: string) => el('g', { class: cls }, W);
    const gv = g('fb-parks');
    for (const k in f.verdes) el('path', { d: anelParaPath(f.verdes[k], true), class: 'fb-park' }, gv);
    this.ruas = el('path', { class: 'fb-street', d: '' }, W);
    const ga = g('fb-waters');
    for (const k in f.represas) el('path', { d: anelParaPath(f.represas[k], true), class: 'fb-water' }, ga);
    for (const k in f.rios) el('path', { d: anelParaPath(f.rios[k], false), class: 'fb-river' }, ga);
    const gr = g('fb-roads');
    for (const k in f.vias) el('path', { d: anelParaPath(f.vias[k], false), class: 'fb-road' }, gr);
    const gc = g('fb-choro');
    for (const d of dados.distritos) {
      const p = el('path', { d: pathMundo(d.geometry) ?? '', class: 'fb-d', 'data-id': d.id }, gc);
      const t = el('title', {}, p); t.textContent = d.nome;
      this.choro.set(d.id, p);
    }
    const gs = g('fb-subs');
    for (const s of dados.subprefeituras) el('path', { d: pathMundo(s.geometry) ?? '', class: 'fb-sub' }, gs);
    const cidade = anelParaPath(f.cidade, true);
    el('path', { d: `M-100000,-100000H100000V100000H-100000Z${cidade}`, class: 'fb-mask', 'fill-rule': 'evenodd' }, W);
    el('path', { d: cidade, class: 'fb-city' }, W);

    const ov = el('svg', { class: 'fb-overlay', width: '100%', height: '100%' }, this.pane);
    const defs = el('defs', {}, ov);
    const fl = el('filter', { id: 'ovglow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    el('feGaussianBlur', { stdDeviation: '5' }, fl);
    this.overlay = el('g', { class: 'ov' }, ov);

    // áreas sem malha viária (represas, serras, Marsilac, sul de Parelheiros)
    this.ctx2d = document.createElement('canvas').getContext('2d');
    this.noGo = [f.represas.Guarapiranga, f.represas.Billings, f.verdes['Serra do Mar'], f.verdes.Cantareira].filter(Boolean).map((r) => new Path2D(anelParaPath(r, true)));
    const mar = dados.distritoPorId.MAR;
    if (mar) this.noGo.push(new Path2D(pathMundo(mar.geometry) ?? ''));
    const plh = dados.distritoPorId.PLH;
    if (plh) { this.metade = new Path2D(pathMundo(plh.geometry) ?? ''); this.yMetade = mundo([-46.7, -23.773])[1]; }

    this.c = mundo(view.center);
    this.z = view.zoom;
    this.ligarEventos();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.root);
    this.resize();
  }

  destroy() {
    cancelAnimationFrame(this.raf); cancelAnimationFrame(this.anim); cancelAnimationFrame(this.rapido); clearTimeout(this.ruasTimer); clearTimeout(this.commitTimer);
    this.ro?.disconnect();
    this.limpar.forEach((f) => f());
    this.root?.remove();
  }

  on<K extends keyof EventosMapa>(ev: K, cb: Ouvinte<K>) { return this.ev.on(ev, cb); }

  resize() {
    const r = this.root.getBoundingClientRect();
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.agendar(true);
  }

  private get k() { return 2 ** (this.z - Z_REF); }
  private get t(): [number, number] { return [this.w / 2 - this.c[0] * this.k, this.h / 2 - this.c[1] * this.k]; }
  project(ll: LngLat): [number, number] {
    const [x, y] = mundo(ll), k = this.k, t = this.t;
    return [x * k + t[0], y * k + t[1]];
  }
  private unproject(x: number, y: number): LngLat {
    const k = this.k, t = this.t;
    return deMundo((x - t[0]) / k, (y - t[1]) / k);
  }
  getView(): View { return { center: deMundo(this.c[0], this.c[1]), zoom: this.z }; }
  getBounds(): Bounds {
    const a = this.unproject(0, this.h), b = this.unproject(this.w, 0);
    return [a[0], a[1], b[0], b[1]];
  }

  private limitar() {
    this.z = Math.max(Z_MIN, Math.min(Z_MAX, this.z));
    const a = mundo([SP_BOUNDS[0], SP_BOUNDS[3]]), b = mundo([SP_BOUNDS[2], SP_BOUNDS[1]]);
    this.c = [Math.max(a[0] - 40, Math.min(b[0] + 40, this.c[0])), Math.max(a[1] - 40, Math.min(b[1] + 40, this.c[1]))];
  }

  setView(v: Partial<View>, animar = false) {
    cancelAnimationFrame(this.anim);
    const alvoC = v.center ? mundo(v.center) : this.c, alvoZ = v.zoom ?? this.z;
    if (!animar || reduzido()) { this.c = alvoC; this.z = alvoZ; this.limitar(); this.agendar(true); return; }
    const c0 = this.c, z0 = this.z, t0 = performance.now(), dur = 380;
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - (1 - p) ** 3;
      this.z = z0 + (alvoZ - z0) * e;
      this.c = [c0[0] + (alvoC[0] - c0[0]) * e, c0[1] + (alvoC[1] - c0[1]) * e];
      this.limitar();
      if (p < 1) { this.mover(); this.anim = requestAnimationFrame(passo); } else this.agendar(true);
    };
    this.anim = requestAnimationFrame(passo);
  }
  fitBounds(b: Bounds, padding: number | Padding = 40) {
    const p = typeof padding === 'number' ? { top: padding, right: padding, bottom: padding, left: padding } : padding;
    const a = mundo([b[0], b[3]]), c = mundo([b[2], b[1]]);
    const bw = Math.max(1e-6, c[0] - a[0]), bh = Math.max(1e-6, c[1] - a[1]);
    const k = Math.max(1e-3, Math.min((this.w - p.left - p.right) / bw, (this.h - p.top - p.bottom) / bh));
    // centro do retângulo útil desloca o centro do mapa
    const cx = (a[0] + c[0]) / 2 - (p.left - p.right) / 2 / k, cy = (a[1] + c[1]) / 2 - (p.top - p.bottom) / 2 / k;
    this.setView({ center: deMundo(cx, cy), zoom: Z_REF + Math.log2(k) }, true);
  }
  panBy(dx: number, dy: number) {
    this.c = [this.c[0] + dx / this.k, this.c[1] + dy / this.k];
    this.limitar(); this.mover();
  }
  zoomBy(d: number, cx = this.w / 2, cy = this.h / 2) {
    const antes = this.unproject(cx, cy);
    this.z += d; this.limitar();
    const [x, y] = mundo(antes), k = this.k;
    this.c = [x - (cx - this.w / 2) / k, y - (cy - this.h / 2) / k];
    this.limitar(); this.mover();
  }

  setScene(s: Scene) {
    const ant = this.scene;
    this.scene = s;
    for (const [id, p] of this.choro) {
      const cor = s.cores[id] ?? '#2C343C';
      if (p.getAttribute('fill') !== cor) p.setAttribute('fill', cor);
      p.classList.toggle('is-sel', id === s.sel || id === s.selB);
      p.classList.toggle('is-dim', s.esmaecer && !s.destaque.includes(id) && id !== s.sel);
    }
    this.root.classList.toggle('eco', s.economia);
    if (ant.economia !== s.economia) this.agendarRuas();
    this.agendar();
  }

  /* ---------- desenho ---------- */
  /** Caminho rápido durante gestos e animações: move a camada já desenhada com transformação CSS. */
  private mover() {
    if (this.rapido) return;
    this.rapido = requestAnimationFrame(() => {
      this.rapido = 0;
      const s = 2 ** (this.z - this.rz);
      const kR = 2 ** (this.rz - Z_REF), t = this.t;
      const tR = [this.w / 2 - this.rc[0] * kR, this.h / 2 - this.rc[1] * kR];
      const ox = t[0] - tR[0] * s, oy = t[1] - tR[1] * s;
      // mudou o nível de detalhe ou a camada saiu muito do lugar: redesenha já
      if (nivelDoZoom(this.z) !== this.nivel || Math.abs(ox) > this.w * 0.45 || Math.abs(oy) > this.h * 0.45 || s < 0.6 || s > 1.7) { this.agendar(); return; }
      this.pane.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${s.toFixed(4)})`;
      this.ev.emit('view', this.getView());
      clearTimeout(this.commitTimer);
      this.commitTimer = window.setTimeout(() => this.agendar(), 140);
    });
  }
  private agendar(ruas = false) {
    if (ruas) this.agendarRuas();
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.desenhar(); });
  }
  private desenhar() {
    clearTimeout(this.commitTimer);
    cancelAnimationFrame(this.rapido); this.rapido = 0;
    this.rc = [this.c[0], this.c[1]]; this.rz = this.z;
    this.pane.style.transform = '';
    const k = this.k, t = this.t;
    this.world.setAttribute('transform', `translate(${t[0].toFixed(2)} ${t[1].toFixed(2)}) scale(${k.toFixed(5)})`);
    const nv = nivelDoZoom(this.z);
    if (nv !== this.nivel) {
      this.root.classList.remove('lv-far', 'lv-mid', 'lv-near');
      this.nivel = nv;
      this.agendarRuas();
      this.ev.emit('nivel', nv);
    }
    this.root.classList.add('lv-' + nv);
    this.overlay.innerHTML = renderOverlay({ project: (ll) => this.project(ll), w: this.w, h: this.h, zoom: this.z, nivel: nv, scene: this.scene, dados: this.dados, motor: 'proprio' });
    this.ev.emit('view', this.getView());
    this.agendarRuas(400);
    if (this.scene !== CENA_VAZIA && !performance.getEntriesByName('cm:mapa-desenhado').length) performance.mark('cm:mapa-desenhado');
  }
  private agendarRuas(ms = 120) {
    clearTimeout(this.ruasTimer);
    this.ruasTimer = window.setTimeout(() => this.gerarRuas(), ms);
  }
  /** Malha viária procedural (fundo do Google representado), em coordenadas de mundo. Porta de engine.js#streets. */
  private gerarRuas() {
    const nv = nivelDoZoom(this.z);
    if (nv === 'far' || this.scene.economia || !this.ctx2d) { this.ruas.setAttribute('d', ''); return; }
    const F = 72 / metrosPorPx(Z_REF, -23.6); // 1 unidade da referência ≈ 72 m
    const cell = (nv === 'near' ? 5 : 8) * F, gap = (nv === 'near' ? 1.25 : 2.6) * F;
    const k = this.k, t = this.t, m = 200;
    const vx0 = (-m - t[0]) / k, vy0 = (-m - t[1]) / k, vx1 = (this.w + m - t[0]) / k, vy1 = (this.h + m - t[1]) / k;
    const X0 = Math.floor(vx0 / cell) * cell, Y0 = Math.floor(vy0 / cell) * cell;
    if (((vx1 - X0) / cell) * ((vy1 - Y0) / cell) > 9000) { this.ruas.setAttribute('d', ''); return; }
    const ctx = this.ctx2d;
    let d = '';
    for (let cx = X0; cx < vx1; cx += cell) for (let cy = Y0; cy < vy1; cy += cell) {
      const mx = cx + cell / 2, my = cy + cell / 2;
      if (this.noGo.some((p) => ctx.isPointInPath(p, mx, my))) continue;
      const r = rng(((Math.round(cx / F) * 73856093) ^ (Math.round(cy / F) * 19349663)) >>> 0);
      if (this.metade && my > this.yMetade && ctx.isPointInPath(this.metade, mx, my) && r() < 0.75) continue;
      if (r() < 0.06) continue;
      const a = Math.sin((cx / F) * 0.031) * 0.9 + Math.cos((cy / F) * 0.027) * 0.7 + (r() - 0.5) * 0.25;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (const dir of [0, 1]) {
        const ux = dir ? -sa : ca, uy = dir ? ca : sa, nx = -uy, ny = ux;
        const gg = gap * (dir ? 1.35 : 1) * (0.9 + r() * 0.3);
        for (let q = -cell; q <= cell; q += gg) {
          const ox = mx + nx * q, oy = my + ny * q;
          let t0 = -cell, t1 = cell, ok = true;
          const P = [-ux, ux, -uy, uy], Q = [ox - cx, cx + cell - ox, oy - cy, cy + cell - oy];
          for (let i = 0; i < 4; i++) {
            if (P[i] === 0) { if (Q[i] < 0) ok = false; } else { const tt = Q[i] / P[i]; if (P[i] < 0) t0 = Math.max(t0, tt); else t1 = Math.min(t1, tt); }
          }
          if (!ok || t1 - t0 < 0.4 * F) continue;
          d += `M${(ox + ux * t0).toFixed(1)},${(oy + uy * t0).toFixed(1)}L${(ox + ux * t1).toFixed(1)},${(oy + uy * t1).toFixed(1)}`;
        }
      }
    }
    this.ruas.setAttribute('d', d);
  }

  /* ---------- interação: roda, arraste, pinça, teclado ---------- */
  private ligarEventos() {
    const R = this.root;
    const loc = (e: { clientX: number; clientY: number }) => { const r = R.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as [number, number]; };
    const on = <K extends keyof HTMLElementEventMap>(t: K, f: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) => {
      R.addEventListener(t, f as EventListener, o); this.limpar.push(() => R.removeEventListener(t, f as EventListener));
    };
    on('wheel', (e) => {
      e.preventDefault();
      const [x, y] = loc(e);
      const unid = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
      this.zoomBy(Math.max(-0.6, Math.min(0.6, (-e.deltaY * unid) / 400)), x, y);
    }, { passive: false });
    on('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const [x, y] = loc(e);
      this.ponteiros.set(e.pointerId, { x, y });
      if (this.ponteiros.size === 1) this.arraste = { x, y, movido: false, alvo: e.target as Element };
      if (this.ponteiros.size === 2 && this.arraste) {
        const [a, b] = [...this.ponteiros.values()];
        this.arraste.pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.z };
        this.arraste.movido = true;
      }
      try { R.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
    });
    on('pointermove', (e) => {
      const [x, y] = loc(e);
      const p = this.ponteiros.get(e.pointerId);
      if (!p || !this.arraste) {
        const alvo = e.target as Element;
        const id = alvo?.getAttribute?.('data-id') && alvo.classList.contains('fb-d') ? alvo.getAttribute('data-id') : null;
        this.ev.emit('hover', { id, x: e.clientX, y: e.clientY });
        return;
      }
      if (this.arraste.pinca && this.ponteiros.size === 2) {
        p.x = x; p.y = y;
        const [a, b] = [...this.ponteiros.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const alvoZ = this.arraste.pinca.z + Math.log2(d / this.arraste.pinca.d);
        this.zoomBy(alvoZ - this.z, (a.x + b.x) / 2, (a.y + b.y) / 2);
        return;
      }
      const dx = x - p.x, dy = y - p.y;
      if (!this.arraste.movido && Math.hypot(x - this.arraste.x, y - this.arraste.y) > 4) { this.arraste.movido = true; R.classList.add('is-drag'); this.ev.emit('hover', { id: null, x: 0, y: 0 }); }
      if (this.arraste.movido) this.panBy(-dx, -dy);
      p.x = x; p.y = y;
    });
    const fim = (e: PointerEvent) => {
      const a = this.arraste;
      this.ponteiros.delete(e.pointerId);
      if (this.ponteiros.size > 0) return;
      this.arraste = null;
      R.classList.remove('is-drag');
      if (a?.movido) this.agendar();
      if (!a || a.movido || e.type === 'pointercancel') return;
      const [x, y] = loc(e);
      const mk = a.alvo?.closest?.('[data-mk]');
      if (mk) { this.ev.emit('marker', { tipo: mk.getAttribute('data-mk')!, id: mk.getAttribute('data-id')!, x: e.clientX, y: e.clientY }); return; }
      const alvo = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n.classList?.contains('fb-d'));
      this.ev.emit('click', { id: alvo?.getAttribute('data-id') ?? null, lngLat: this.unproject(x, y), x: e.clientX, y: e.clientY });
    };
    on('pointerup', fim);
    on('pointercancel', fim);
    on('pointerleave', () => { if (!this.arraste) this.ev.emit('hover', { id: null, x: 0, y: 0 }); });
    on('dblclick', (e) => { const [x, y] = loc(e); this.zoomBy(1, x, y); });
    on('keydown', (e) => {
      const passo = 90;
      const mapa: Record<string, () => void> = {
        ArrowLeft: () => this.panBy(-passo, 0), ArrowRight: () => this.panBy(passo, 0), ArrowUp: () => this.panBy(0, -passo), ArrowDown: () => this.panBy(0, passo),
        '+': () => this.zoomBy(0.5), '=': () => this.zoomBy(0.5), '-': () => this.zoomBy(-0.5), _: () => this.zoomBy(-0.5),
      };
      const f = mapa[e.key];
      if (f && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); f(); }
    });
  }
}
