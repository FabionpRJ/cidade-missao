import { create } from 'zustand';
import type { CalculoPT } from '../data/types';

export type TipConteudo =
  | { tipo: 'termo'; id: string }
  | { tipo: 'numero'; titulo: string; valor: string; unidade?: string; fonte: string; ano: number | string; nivel: string; formula?: string; nota?: string; app?: boolean; desatualizado?: boolean; medias?: { mun?: string; est?: string; nac?: string }; termo?: string }
  | { tipo: 'lacunas'; distrito: string }
  | { tipo: 'distrito'; distrito: string }
  | { tipo: 'pt'; titulo: string; calculo: CalculoPT }
  | { tipo: 'texto'; titulo: string; texto: string; fonte?: string };

export interface TipItem { nivel: number; c: TipConteudo; x: number; y: number; fixo: boolean; origem: string; ancora?: { x: number; y: number } }

interface TipState {
  pilha: TipItem[];
  dentro: number;
  abrir: (t: TipItem) => void;
  fechar: (nivel: number) => void;
  fixar: (nivel: number) => void;
  topo: () => TipItem | undefined;
}
export const useTips = create<TipState>((set, get) => ({
  pilha: [],
  dentro: 0,
  abrir: (t) => set((s) => ({ pilha: [...s.pilha.filter((x) => x.nivel < t.nivel), t] })),
  fechar: (n) => set((s) => ({ pilha: s.pilha.filter((x) => x.nivel < n) })),
  fixar: (n) => set((s) => ({ pilha: s.pilha.map((x) => (x.nivel === n ? { ...x, fixo: true } : x)) })),
  topo: () => get().pilha[get().pilha.length - 1],
}));

/** Alt pressionado (fixa o tooltip aberto). */
export const teclas = { alt: false };
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
      teclas.alt = true;
      const t = useTips.getState().topo();
      if (t && !t.fixo) { e.preventDefault(); useTips.getState().fixar(t.nivel); }
    }
  });
  window.addEventListener('keyup', (e) => { if (e.key === 'Alt') teclas.alt = false; });
}
