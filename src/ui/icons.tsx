// Pictogramas de traço (grade 24) portados de referencias/codigo-dos-exemplos/engine.js, mais ícones de nível de núcleo e categorias.
import type { CSSProperties } from 'react';

export const IC: Record<string, string> = {
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2c2.1.7 3.5 2.8 3.5 5.8',
  home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6', flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0',
  lamp: 'M12 2.5v2M5.6 5.6L7 7M18.4 5.6L17 7M9.5 18h5M10.5 21h3M12 7a5 5 0 0 0-3 9h6a5 5 0 0 0-3-9z',
  road: 'M8 3L4 21M16 3l4 18M12 4.5v2.5M12 10.5v3M12 17v2.5', tree: 'M12 21v-6M12 16l-3-3M12 14l3-2.5M12 3a6 6 0 0 0-6 6c0 3 2.5 5 6 6 3.5-1 6-3 6-6a6 6 0 0 0-6-6z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6', drop: 'M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z', book: 'M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0zM20 5c-3-1.5-5.5-1.5-8 0v15c2.5-1.5 5-1.5 8 0z',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z', lupa: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21',
  mega: 'M3 10v4h3l8 5V5l-8 5zM17.5 9a4 4 0 0 1 0 6M6 14l1.5 6h3L9 15', building: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M7.5 10h1.5M11.25 10h1.5M15 10h1.5',
  people: 'M12 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8.5 22v-7l-2-1 1.2-5h8.6l1.2 5-2 1v7',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 6.5v11M14.6 9.3c-.5-.9-1.4-1.4-2.6-1.4-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.7-1.6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 11.5v1',
  ops: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  gap: 'M3 12a9 9 0 0 1 9-9M15.5 3.7a9 9 0 0 1 4.8 4.8M21 12a9 9 0 0 1-9 9M8.5 20.3a9 9 0 0 1-4.8-4.8M12 8.5v7M8.5 12h7',
  urna: 'M3 12h18v9H3zM7.5 12l1-8h7l1 8M10 8h4', star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z',
  layers: 'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5', ledger: 'M3 4h18v16H3zM3 9h18M3 14h18M9 4v16',
  scale: 'M12 3v18M7 21h10M4 6h16M6 6l-3 7a3 3 0 0 0 6 0zM18 6l-3 7a3 3 0 0 0 6 0z', clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  play: 'M7 4l13 8-13 8z', pause: 'M7 4h3v16H7zM14 4h3v16h-3z', next: 'M5 4l10 8-10 8zM18 4v16', prev: 'M19 4L9 12l10 8zM6 4v16',
  down: 'M6 9l6 6 6-6', up: 'M6 15l6-6 6 6', right: 'M9 6l6 6-6 6', back: 'M15 5l-7 7 7 7', close: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', check: 'M5 12.5l4.5 4.5L19 7',
  lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11', info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', cal: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  send: 'M3 11l18-8-8 18-2-8z', chart: 'M5 20V11M11 20V5M17 20v-7M2 20h20', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  menu: 'M4 6h16M4 12h16M4 18h16', locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 2v4M12 18v4M2 12h4M18 12h4M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  hands: 'M2 11l5-5 5 3 5-3 5 5-10 9zM9 13l3 2.5', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7', map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z', sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4', zoomin: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6',
  download: 'M12 3v12M7 10l5 5 5-5M4 20h16', split: 'M3 4h18v16H3zM12 4v16', camera: 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  medal: 'M8 3l4 6 4-6M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 12.5v4', sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z', wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20v.5',
  drag: 'M9 5v.5M15 5v.5M9 12v.5M15 12v.5M9 19v.5M15 19v.5', refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', news: 'M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4',
  merge: 'M6 3v6a6 6 0 0 0 6 6h6M18 3v18M14 11l4 4 4-4',
  calcada: 'M3 20h18M5 20l2-9h10l2 9M8 11l1-4h6l1 4M10 15h4',
  grate: 'M4 6h16v12H4zM8 6v12M12 6v12M16 6v12',
  // níveis de núcleo (Semente, Raiz, Tronco, Copa)
  semente: 'M12 20c-4 0-6-3-6-6 0-4 3-8 6-10 3 2 6 6 6 10 0 3-2 6-6 6zM12 9v8',
  raiz: 'M12 3v9M12 12l-5 7M12 12l5 7M12 15v6M9 8h6',
  tronco: 'M10 21V11M14 21V11M10 11l-4-4M14 11l4-4M12 11V4M7 21h10',
  copa: 'M12 21v-5M5 12a7 6 0 0 1 14 0c0 2.5-3 4-7 4s-7-1.5-7-4zM8 8a4 4 0 0 1 8 0',
};

export const ICONE_CATEGORIA: Record<string, string> = {
  poda: 'tree', boca_de_lobo: 'grate', buraco: 'road', calcada: 'calcada', entulho: 'trash', iluminacao: 'lamp', alagamento: 'drop',
};
export const NOME_CATEGORIA: Record<string, string> = {
  poda: 'Poda', boca_de_lobo: 'Bueiro', buraco: 'Buraco', calcada: 'Calçada', entulho: 'Entulho', iluminacao: 'Iluminação', alagamento: 'Alagamento',
};
export const ICONE_NUCLEO: Record<string, string> = { Semente: 'semente', Raiz: 'raiz', Tronco: 'tronco', Copa: 'copa', 'em formação': 'semente' };
export const ICONE_TRILHA: Record<string, string> = { fiscalista: 'lupa', intelectual: 'book', militante: 'mega', fis: 'lupa', int: 'book', mil: 'mega' };
export const ICONE_POI: Record<string, string> = { ubs: 'health', escola: 'book', cras: 'hands', local_votacao: 'urna' };

export function Icon({ n, s = 18, className, style, title }: { n: string; s?: number; className?: string; style?: CSSProperties; title?: string }) {
  return (
    <svg className={`ic ic-${n}${className ? ' ' + className : ''}`} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} style={style}>
      {title ? <title>{title}</title> : null}
      <path d={IC[n] ?? IC.info} />
    </svg>
  );
}

/** Ícone como markup SVG, para o overlay do mapa (string). */
export function icSVG(name: string, size: number, color: string, sw = 2) {
  return `<g transform="translate(${-size / 2},${-size / 2}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[name] ?? IC.info}"/></g>`;
}

/** Monograma provisório (theme_a.js): octógono déco em latão. Sem marcas do partido, da prefeitura, do Google ou da Paradox. */
export function Monograma({ s = 38 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M12 2h16l10 10v16L28 38H12L2 28V12z" fill="var(--mono-bg)" stroke="var(--mono-a)" strokeWidth="1.6" />
      <path d="M14 6h12l8 8v12l-8 8H14l-8-8V14z" fill="none" stroke="var(--mono-b)" />
      <path d="M20 9l3 8h-6zM20 31l-3-8h6zM9 20l8-3v6zM31 20l-8 3v-6z" fill="var(--mono-c)" />
      <circle cx="20" cy="20" r="2.5" fill="var(--mono-bg)" stroke="var(--mono-c)" />
    </svg>
  );
}
