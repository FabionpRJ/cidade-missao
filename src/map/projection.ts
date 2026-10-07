// Web Mercator com a mesma escala de zoom do Google (decisão D16). Coordenadas de "mundo" no zoom 12,
// com origem no centro de São Paulo, para manter boa precisão numérica no SVG.
import { geoMercator, geoPath, geoTransform } from 'd3-geo';
import type { LngLat } from '../data/types';
import { SP_CENTRO } from './MapEngine';

export const Z_REF = 12;
const TILE = 256;
const merc = geoMercator().scale((TILE * 2 ** Z_REF) / (2 * Math.PI)).translate([0, 0]);
const O = merc(SP_CENTRO)!;

/** lon/lat → coordenadas de mundo (px no zoom 12, origem no centro de SP). */
export function mundo(ll: LngLat): [number, number] {
  const p = merc(ll)!;
  return [p[0] - O[0], p[1] - O[1]];
}
export function deMundo(x: number, y: number): LngLat {
  const ll = merc.invert!([x + O[0], y + O[1]])!;
  return [ll[0], ll[1]];
}

/** Gerador de path SVG em coordenadas de mundo (planar: não depende do sentido dos anéis do GeoJSON). */
const transf = geoTransform({
  point(this: { stream: { point(x: number, y: number): void } }, lng: number, lat: number) {
    const [x, y] = mundo([lng, lat]);
    this.stream.point(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  },
});
export const pathMundo = geoPath(transf);

export function anelParaPath(aneis: LngLat[][], fechar: boolean) {
  return aneis.map((r) => 'M' + r.map((ll) => mundo(ll).map((n) => n.toFixed(2)).join(',')).join('L') + (fechar ? 'Z' : '')).join('');
}

/** metros por pixel no zoom z e latitude lat (escala do Google). */
export const metrosPorPx = (z: number, lat: number) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** z;
