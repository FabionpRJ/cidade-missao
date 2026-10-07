// Marcadores do mapa (discos com anel de latão, estrela para sedes, losango para missão; pacote A / theme_a.js).
import { ICONE_NUCLEO, icSVG } from '../ui/icons';
import type { Mark } from './MapEngine';

export const COR_TRILHA = { fis: '#E8A33A', int: '#93A4F2', mil: '#66C886' } as const;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function markerSVG(m: Mark, X: number, Y: number): string {
  const tr = `transform="translate(${X.toFixed(1)},${Y.toFixed(1)})"`;
  const data = m.id ? ` data-mk="${m.t}" data-id="${esc(m.id)}"` : '';
  const tit = m.titulo ? `<title>${esc(m.titulo)}</title>` : '';
  const g = (cls: string, inner: string) => `<g class="mk mk-${cls}${m.id ? ' is-click' : ''}" ${tr}${data}>${tit}${inner}</g>`;
  switch (m.t) {
    case 'nucleo': {
      // disco escuro com anel de latão; ícone do nível do núcleo na cor da trilha; contagem em medalha
      const r = m.small ? 10 : 15, c = COR_TRILHA[m.tr];
      return g('nucleo', `<circle r="${r + 3}" fill="#0B1210" fill-opacity=".85"/><circle r="${r}" fill="#1A1610" stroke="#C9A15E" stroke-width="${m.mine ? 2.6 : 1.6}"/>${m.mine ? `<circle r="${r + 5}" fill="none" stroke="#F3D58F" stroke-width="1" stroke-dasharray="2 3"/>` : ''}${icSVG(ICONE_NUCLEO[m.nivel] ?? 'home', r * 1.15, c, 2)}${m.small ? '' : `<g transform="translate(${r - 2},${-r + 1})"><circle r="9" fill="#C9A15E"/><text y="3.8" text-anchor="middle" class="mk-n" font-size="10.5">${m.n}</text></g>`}`);
    }
    case 'count': {
      const r = m.big ? 13 : 10;
      return g('count', `<circle r="${r + 2}" fill="#0B1210"/><circle r="${r}" fill="${m.warn ? '#3A2A10' : '#22302A'}" stroke="${m.warn ? '#E8B04E' : '#B8955A'}" stroke-width="1.5"/><text y="${m.big ? 4.6 : 3.8}" text-anchor="middle" class="mk-n" font-size="${m.big ? 14 : 11.5}" style="fill:#F3E3BC">${m.n}</text>`);
    }
    case 'star':
      return g('star', `<path d="M0-13l3.8 7.9 8.6 1-6.3 5.9 1.7 8.5L0 6.1l-7.8 4.2 1.7-8.5-6.3-5.9 8.6-1z" fill="${m.deleg ? '#F3D58F' : '#C9A15E'}" stroke="#0B1210" stroke-width="2" paint-order="stroke"/>`);
    case 'mission':
      return g('mission', `<path d="M0-8l8 8-8 8-8-8z" fill="${m.warn ? '#E8B04E' : COR_TRILHA[m.tr]}" stroke="${m.mine ? '#F3D58F' : '#0B1210'}" stroke-width="2" paint-order="stroke"/>`);
    case 'alert': {
      const fresh = !!m.fresh;
      const pulso = fresh ? `<circle class="pulse" cy="-17" r="11" style="animation-delay:-${Date.now() % 1800}ms"/>` : '';
      const casoTag = m.caso ? '<circle cx="9" cy="-26" r="4.5" fill="#E8B04E" stroke="#0B1210" stroke-width="1.5"/>' : '';
      const op = m.resolvido ? ' opacity=".55"' : '';
      return g('alert' + (fresh ? ' is-fresh' : ''), `<g${op}>${pulso}<path d="M0 0c-3-5-11-9-11-17a11 11 0 0 1 22 0c0 8-8 12-11 17z" fill="${fresh ? '#E8B04E' : '#1A1610'}" stroke="${fresh ? '#0B1210' : '#C9A15E'}" stroke-width="1.5"/><g transform="translate(0,-17)">${icSVG(m.c, 13, fresh ? '#1A1205' : '#F2C46A', 2.2)}</g>${casoTag}</g>`);
    }
    case 'cluster':
      return g('cluster', `<circle r="19" fill="#0B1210" fill-opacity=".8"/><circle r="16" fill="#3A2412" stroke="#DD9A36" stroke-width="2"/><text y="4.5" text-anchor="middle" class="mk-n" font-size="13" style="fill:#F7E2B4">${m.n}</text>`);
    case 'poi':
      return g('poi', `<circle r="11" fill="#0B1210" fill-opacity=".85"/><circle r="9" fill="#12313A" stroke="#93D1DA" stroke-width="1.2"/>${icSVG(m.icon, 11, '#CFEDF1', 1.8)}`);
    case 'campanha':
      return g('campanha', `<circle r="14" fill="#0B1210" fill-opacity=".85"/><circle r="12" fill="#2C2315" stroke="#C9A15E" stroke-width="1.6"/>${icSVG('flag', 13, '#F3D58F', 1.8)}${m.foco ? '<circle cx="9" cy="-9" r="4" fill="#E8B04E" stroke="#0B1210"/>' : ''}`);
    case 'prio':
      return g('prio', `<circle r="14" fill="#0B1210" fill-opacity=".85"/><circle r="12" fill="#3B2B57" stroke="#C2AEDF" stroke-width="1.6"/><text y="4.5" text-anchor="middle" class="mk-n" font-size="13" style="fill:#F1E9FB">${m.n}</text>`);
    case 'me':
      return `<g ${tr}><circle r="14" fill="#8FB5DB" fill-opacity=".2"/><circle r="6" fill="#8FB5DB" stroke="#F5E6C2" stroke-width="2"/></g>`;
    case 'pick':
      return `<g ${tr} class="mk-pick"><circle r="16" fill="none" stroke="#F3D58F" stroke-width="2"/><path d="M0-24v14M0 10v14M-24 0h14M10 0h14" stroke="#F3D58F" stroke-width="2"/><circle r="3" fill="#F3D58F"/></g>`;
  }
}
