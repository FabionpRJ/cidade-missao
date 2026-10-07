// Comandos para o mapa vindos da interface (centralizar distrito, município, ponto).
import type { LngLat } from '../data/types';

export type ComandoMapa =
  | { tipo: 'distrito'; id: string; zoom?: number }
  | { tipo: 'municipio' }
  | { tipo: 'ponto'; ll: LngLat; zoom?: number }
  | { tipo: 'zoom'; delta: number }
  | { tipo: 'view'; ll: LngLat; zoom: number };

type F = (c: ComandoMapa) => void;
const ouvintes = new Set<F>();
let pendente: ComandoMapa | null = null;
export const mapBus = {
  emit(c: ComandoMapa) {
    if (ouvintes.size === 0) { pendente = c; return; }
    ouvintes.forEach((f) => f(c));
  },
  on(f: F) {
    ouvintes.add(f);
    if (pendente) { const p = pendente; pendente = null; f(p); }
    return () => { ouvintes.delete(f); };
  },
};
