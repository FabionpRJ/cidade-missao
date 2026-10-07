// Atalhos (PROMPT 4.6): 1–0 painéis, M modos, L Ledger, [ ] mês, N minimapa, Esc fecha o nível mais alto,
// letras dos modos, Ctrl+Shift+L seletor de camada. Setas movem o mapa quando ele está focado (no próprio motor).
import { useEffect } from 'react';
import { MODOS } from '../data/indicators';
import { acessoModo, acessoRail } from '../domain/permissions';
import { abrirPainel, RAIL } from '../components/IconRail';
import { tentarModo } from '../components/ModeSelector';
import { useTips } from '../components/tipStore';
import { contextoDe, militanteEstado } from '../state/derived';
import { persona as acharPersona } from '../state/personas';
import { st } from '../state/store';

function ctxAtual() {
  const s = st();
  const p = acharPersona(s.dados, s.personaId);
  return contextoDe(s.camada, p?.militanteId ? militanteEstado(s.dados!, p.militanteId, s.lancamentos, s.passagens) : null);
}

/** Esc: fecha o nível mais alto (tooltip → janela → escolha de ponto → painel B → painel → seleção). */
export function fecharNivelMaisAlto(): boolean {
  const t = useTips.getState();
  if (t.pilha.length) { t.fechar(t.pilha[t.pilha.length - 1].nivel); return true; }
  const s = st();
  if (s.modal) { s.set({ modal: null }); return true; }
  if (s.escolhendoPonto) { s.set({ escolhendoPonto: null }); return true; }
  if (s.selB) { s.set({ selB: null }); return true; }
  if (s.abaMovel !== 'mapa' && window.innerWidth < 768) { s.set({ abaMovel: 'mapa', painel: s.painel === 'territorio' ? s.painel : null }); return true; }
  if (s.painel) { s.set({ painel: null }); return true; }
  if (s.sel) { s.set({ sel: null, folha: 'recolhida' }); return true; }
  return false;
}

export function useShortcuts() {
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) { e.preventDefault(); st().set({ modal: { tipo: 'dev' } }); return; }
      if (e.key === 'Escape') { if (fecharNivelMaisAlto()) e.preventDefault(); return; }
      const alvo = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT' || alvo.isContentEditable)) return;
      if (st().modal) return;
      const s = st();
      const k = e.key;
      const rail = RAIL.find((r) => r.k === k);
      if (rail) {
        const ac = acessoRail(rail.id, ctxAtual());
        if (ac.ok) abrirPainel(rail.id); else s.toast({ tipo: 'info', icon: 'lock', titulo: `${rail.nome} bloqueado`, texto: ac.motivo! });
        e.preventDefault(); return;
      }
      if (k === 'm' || k === 'M') { s.set({ modosAbertos: !s.modosAbertos }); e.preventDefault(); return; }
      if (k === 'l' || k === 'L') { abrirPainel('ledger'); e.preventDefault(); return; }
      if (k === 'n' || k === 'N') { s.set({ minimapa: !s.minimapa }); e.preventDefault(); return; }
      if (k === '[') { s.set({ mes: Math.max(0, s.mes - 1), tocando: false }); e.preventDefault(); return; }
      if (k === ']') { s.set({ mes: Math.min(11, s.mes + 1), tocando: false }); e.preventDefault(); return; }
      const modo = MODOS.find((m) => m.atalho.toLowerCase() === k.toLowerCase());
      if (modo) { const ac = acessoModo(modo.id, ctxAtual()); tentarModo(modo.id, ac.ok ? undefined : ac.motivo); e.preventDefault(); }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
}
