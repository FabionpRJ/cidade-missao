// Layout responsivo: medidas calculadas a partir da largura e da altura reais da janela.
// Computador (≥ 1200): gaveta e coluna direita reservam espaço; o mapa fica no meio.
// Intermediário (768–1199): a gaveta vira sobreposição; coluna direita mais estreita, sem minimapa.
// Celular (< 768, ou janela baixa como celular deitado): mapa em tela cheia, folha e navegação inferior.
import { useEffect, useState } from 'react';

export type TipoLayout = 'desk' | 'mid' | 'mob';
export interface Layout {
  tipo: TipoLayout;
  w: number;
  h: number;
  /** celular deitado: a folha vira painel lateral */
  paisagem: boolean;
  /** largura da gaveta simples */
  dw: number;
  /** largura da coluna direita (outliner, modos, minimapa) */
  rw: number;
  /** minimapa cabe na coluna direita */
  mini: boolean;
}

export function calcularLayout(w: number, h: number): Layout {
  const mob = w < 768 || (h < 560 && w < 1100);
  if (mob) return { tipo: 'mob', w, h, paisagem: w > h, dw: 0, rw: 0, mini: false };
  const tipo: TipoLayout = w < 1200 ? 'mid' : 'desk';
  const dw = tipo === 'mid' ? Math.min(448, w - 64 - 24) : w >= 1680 ? 448 : w >= 1440 ? 416 : w >= 1280 ? 384 : 360;
  const rw = w >= 1680 ? 336 : w >= 1440 ? 312 : 288;
  // modos (~200) + outliner mínimo (~150) + minimapa (rw × 210/330) precisam caber abaixo da barra
  const mini = tipo === 'desk' && h >= 800;
  return { tipo, w, h, paisagem: false, dw, rw, mini };
}

export function useLayout(): Layout {
  const [l, setL] = useState(() => calcularLayout(window.innerWidth, window.innerHeight));
  useEffect(() => {
    let raf = 0;
    const f = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setL(calcularLayout(window.innerWidth, window.innerHeight))); };
    window.addEventListener('resize', f);
    window.addEventListener('orientationchange', f);
    return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); cancelAnimationFrame(raf); };
  }, []);
  return l;
}
