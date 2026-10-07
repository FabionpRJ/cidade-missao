// Minimapa (pacote A §5): geometria própria (sem segunda instância do Google), coropleta do modo e retângulo da vista.
import { useMemo, useRef } from 'react';
import { useEscala } from '../components/Legend';
import { useVista } from '../state/coord';
import { useDados } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { Icon } from '../ui/icons';
import { motorAtual } from './MapView';
import { anelParaPath, deMundo, mundo, pathMundo } from './projection';

const W = 330, H = 210;

export function Minimap() {
  const dados = useDados();
  const esc = useEscala();
  const bounds = useVista((s) => s.bounds);
  const svg = useRef<SVGSVGElement>(null);
  const arr = useRef(false);
  const geo = useMemo(() => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const d of dados.distritos) {
      const a = mundo([d.bbox[0], d.bbox[3]]), b = mundo([d.bbox[2], d.bbox[1]]);
      x0 = Math.min(x0, a[0]); y0 = Math.min(y0, a[1]); x1 = Math.max(x1, b[0]); y1 = Math.max(y1, b[1]);
    }
    const s = Math.min((W - 16) / (x1 - x0), (H - 16) / (y1 - y0));
    const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - (y1 - y0) * s) / 2 - y0 * s;
    return { s, ox, oy, paths: dados.distritos.map((d) => ({ id: d.id, d: pathMundo(d.geometry) ?? '' })), cidade: anelParaPath(dados.fundo.cidade, true), agua: Object.values(dados.fundo.represas).map((r) => anelParaPath(r, true)) };
  }, [dados]);
  const vista = useMemo(() => {
    if (!bounds) return null;
    const a = mundo([bounds[0], bounds[3]]), b = mundo([bounds[2], bounds[1]]);
    return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] };
  }, [bounds]);
  const mover = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) * (W / r.width) - geo.ox) / geo.s, y = ((e.clientY - r.top) * (H / r.height) - geo.oy) / geo.s;
    const m = motorAtual.m;
    if (m) m.setView({ center: deMundo(x, y) }, false);
  };
  return (
    <div className="cm-mini" aria-label="Minimapa: clique ou arraste para mover o mapa" data-testid="minimapa">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Minimapa de São Paulo"
        onPointerDown={(e) => { arr.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); mover(e); }}
        onPointerMove={(e) => { if (arr.current) mover(e); }}
        onPointerUp={() => { arr.current = false; }}>
        <rect width={W} height={H} fill="var(--s0)" />
        <g transform={`translate(${geo.ox} ${geo.oy}) scale(${geo.s})`}>
          {geo.paths.map((p) => <path key={p.id} d={p.d} fill={esc.cores[p.id]} fillOpacity={0.85} stroke="var(--map-border)" strokeOpacity={0.5} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />)}
          {geo.agua.map((d, i) => <path key={i} d={d} fill="var(--map-water)" />)}
          <path d={geo.cidade} fill="none" stroke="var(--map-city)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {vista && <rect x={vista.x} y={vista.y} width={vista.w} height={vista.h} fill="var(--map-mini-view)" fillOpacity={0.14} stroke="var(--map-mini-view)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />}
        </g>
      </svg>
      <div className="mini-ctl">
        <button title="Aproximar" aria-label="Aproximar" onClick={() => mapBus.emit({ tipo: 'zoom', delta: 1 })}><Icon n="plus" s={14} /></button>
        <button title="Afastar" aria-label="Afastar" onClick={() => mapBus.emit({ tipo: 'zoom', delta: -1 })}><Icon n="minus" s={14} /></button>
        <button title="Centralizar no município" aria-label="Centralizar no município" onClick={() => mapBus.emit({ tipo: 'municipio' })}><Icon n="locate" s={14} /></button>
      </div>
      <span className="mini-l">Visão da cidade · <kbd>N</kbd></span>
    </div>
  );
}
