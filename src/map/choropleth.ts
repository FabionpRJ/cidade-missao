// Rampas de 7 classes do pacote A (Gabinete Paulistano), intervalos iguais sobre o domínio de cada indicador.
import type { Familia } from '../data/types';

export const RAMPAS: Record<Familia | 'adm', string[]> = {
  territorio: ['#2B2A24', '#3F3C32', '#575243', '#706A56', '#8D8670', '#ABA48B', '#CFC8AC'],
  servicos: ['#12313A', '#164553', '#1B5B6B', '#237385', '#368EA0', '#5AAFBE', '#93D1DA'],
  problemas: ['#3A2412', '#573216', '#77441A', '#9A5A1E', '#BE7624', '#DD9A36', '#F2C46A'],
  partido: ['#2E2716', '#463A1E', '#604F28', '#7D6633', '#9C8041', '#BE9D57', '#E2C27E'],
  prioridade: ['#2A1F3D', '#3B2B57', '#4F3A72', '#654C8E', '#7E63AA', '#9C82C4', '#C2AEDF'],
  adm: ['#3F5A4C', '#5A4F3A', '#3E4E63', '#5B4057', '#4C5A35', '#635045'],
};

/** Rampa divergente para "comparar com": azul-petróleo (diminuiu) · neutro · latão (aumentou). Derivada das rampas de Serviços e Partido. */
export const DIVERGENTE = ['#93D1DA', '#368EA0', '#1B5B6B', '#2C3D35', '#7D6633', '#BE9D57', '#E2C27E'];

/** Classe 0..n−1 por intervalos iguais sobre o domínio. Fora do domínio vai para a classe extrema. */
export function classe(valor: number, dominio: [number, number], n = 7) {
  const [a, b] = dominio;
  if (!(b > a)) return 0;
  const t = (valor - a) / (b - a);
  return Math.max(0, Math.min(n - 1, Math.floor(t * n)));
}
export function corPorValor(valor: number, dominio: [number, number], rampa: string[]) {
  return rampa[classe(valor, dominio, rampa.length)];
}
/** Classe divergente: diferença simétrica em torno de zero (limite = maior |diferença|). */
export function classeDivergente(diff: number, limite: number) {
  if (limite <= 0) return 3;
  const t = Math.max(-1, Math.min(1, diff / limite));
  if (Math.abs(t) < 1 / 7) return 3;
  return Math.max(0, Math.min(6, Math.round(3 + t * 3)));
}
export function corAdm(indiceSub: number) {
  const r = RAMPAS.adm;
  return r[(indiceSub * 5) % r.length];
}
/** Limites das classes (para a legenda e testes). */
export function limitesClasses(dominio: [number, number], n = 7) {
  const [a, b] = dominio;
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

/** L* (CIELAB) de uma cor hexadecimal, para verificar rampas monotônicas. */
export function luminanciaL(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const Y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
}
