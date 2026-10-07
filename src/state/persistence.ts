// localStorage com try/catch: sem armazenamento (janela privada, bloqueio), o app funciona só em memória.
import type { StateStorage } from 'zustand/middleware';

export const CHAVE = 'cidade-missao-3.0:prototipo:v1';

const memoria = new Map<string, string>();
export const armazenamentoSeguro: StateStorage = {
  getItem: (k) => {
    try { return window.localStorage.getItem(k); } catch { return memoria.get(k) ?? null; }
  },
  setItem: (k, v) => {
    try { window.localStorage.setItem(k, v); } catch { memoria.set(k, v); }
  },
  removeItem: (k) => {
    try { window.localStorage.removeItem(k); } catch { memoria.delete(k); }
  },
};
