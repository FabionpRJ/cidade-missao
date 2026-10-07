// Interface própria do mapa. Duas implementações: GoogleMapEngine (com chave) e FallbackMapEngine (renderizador próprio).
//
// Para acrescentar uma terceira (ex.: MapLibre GL + OSM, doc. 10.1):
//  1. crie `MapLibreMapEngine implements MapEngine` em src/map/;
//  2. em `mount`, crie o `maplibregl.Map` e adicione os distritos como fonte GeoJSON com uma camada `fill`
//     cuja cor vem de `feature-state` (atualizada em `setScene` a partir de `scene.cores`);
//  3. reaproveite `renderOverlay` (OverlayLayer.ts) num SVG posicionado sobre o canvas, usando `map.project`
//     como função `project` e redesenhando no evento `render`;
//  4. traduza `click`/`mousemove` da camada `fill` para os eventos `click`/`hover` desta interface;
//  5. registre-a em `criarMotor` (src/map/criarMotor.ts).
import type { Dados, LngLat } from '../data/types';

export type NivelZoom = 'far' | 'mid' | 'near';
/** Longe ≤ 11, médio 12–13, perto ≥ 14 (pacote A; decisão D16). */
export const nivelDoZoom = (z: number): NivelZoom => (z < 11.5 ? 'far' : z < 13.5 ? 'mid' : 'near');
export const NOME_NIVEL: Record<NivelZoom, string> = { far: 'longe', mid: 'médio', near: 'perto' };

export interface MarkBase { lng: number; lat: number; niveis: NivelZoom[]; id?: string; titulo?: string }
export type Mark = MarkBase & (
  | { t: 'nucleo'; tr: 'fis' | 'int' | 'mil'; n: number; nivel: string; mine?: boolean; small?: boolean }
  | { t: 'count'; n: number; big?: boolean; warn?: boolean }
  | { t: 'star'; deleg?: boolean }
  | { t: 'mission'; tr: 'fis' | 'int' | 'mil'; warn?: boolean; mine?: boolean }
  | { t: 'alert'; c: string; fresh?: boolean; caso?: boolean; resolvido?: boolean }
  | { t: 'cluster'; n: number }
  | { t: 'poi'; icon: string }
  | { t: 'campanha'; foco?: boolean }
  | { t: 'prio'; n: number }
  | { t: 'me' }
  | { t: 'pick' }
);
export interface Route { a: LngLat; b: LngLat; cor: string }

export interface Scene {
  cores: Record<string, string>;
  sel: string | null;
  selB: string | null;
  hover: string | null;
  /** distritos realçados (comparação no Ledger, zona de atuação); os demais esmaecem se `esmaecer` */
  destaque: string[];
  esmaecer: boolean;
  marks: Mark[];
  routes: Route[];
  economia: boolean;
  modo: string;
}
export const CENA_VAZIA: Scene = { cores: {}, sel: null, selB: null, hover: null, destaque: [], esmaecer: false, marks: [], routes: [], economia: false, modo: 'adm' };

export interface View { center: LngLat; zoom: number }
export interface Padding { top: number; right: number; bottom: number; left: number }
export type Bounds = [number, number, number, number];

export interface EventosMapa {
  click: { id: string | null; lngLat: LngLat; x: number; y: number };
  hover: { id: string | null; x: number; y: number };
  marker: { tipo: string; id: string; x: number; y: number };
  view: View;
  nivel: NivelZoom;
}
export type Ouvinte<K extends keyof EventosMapa> = (e: EventosMapa[K]) => void;

export interface MapEngine {
  readonly tipo: 'google' | 'proprio';
  mount(el: HTMLElement, dados: Dados, view: View): Promise<void>;
  destroy(): void;
  setScene(s: Scene): void;
  getView(): View;
  setView(v: Partial<View>, animar?: boolean): void;
  fitBounds(b: Bounds, padding?: number | Padding): void;
  panBy(dx: number, dy: number): void;
  zoomBy(d: number): void;
  project(ll: LngLat): [number, number];
  getBounds(): Bounds;
  resize(): void;
  on<K extends keyof EventosMapa>(ev: K, cb: Ouvinte<K>): () => void;
}

/** Emissor simples de eventos, compartilhado pelas implementações. */
export class Emissor {
  private m = new Map<string, Set<(e: unknown) => void>>();
  on<K extends keyof EventosMapa>(ev: K, cb: Ouvinte<K>) {
    if (!this.m.has(ev)) this.m.set(ev, new Set());
    this.m.get(ev)!.add(cb as (e: unknown) => void);
    return () => { this.m.get(ev)?.delete(cb as (e: unknown) => void); };
  }
  emit<K extends keyof EventosMapa>(ev: K, e: EventosMapa[K]) { this.m.get(ev)?.forEach((cb) => cb(e)); }
}

/** Centro e limites do município (para centralizar e limitar o arraste). */
export const SP_BOUNDS: Bounds = [-46.83, -24.01, -46.36, -23.36];
export const SP_CENTRO: LngLat = [-46.6, -23.65];
