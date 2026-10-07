// Estado derivado: dados de demonstração + o que o usuário fez no protótipo.
import { useMemo } from 'react';
import type { Alerta, Dados, Entrega, Indicadores, LacComponentes, Missao, Militante, TrilhaId } from '../data/types';
import { HOJE } from '../data/indicators';
import { calcularLacunas, type PesosLacunas } from '../domain/lacunas';
import { estadoTrilha, prontidaoDeLancamentos, TRILHAS, type EstadoTrilha } from '../domain/levels';
import type { Contexto } from '../domain/permissions';
import { diasEntre, type LancamentoPT } from '../domain/points';
import { persona as acharPersona, type Persona } from './personas';
import { useStore, type Acoes, type Passagem } from './store';

/** Memoização simples por identidade dos argumentos (último resultado). */
function memo<A extends unknown[], R>(f: (...a: A) => R): (...a: A) => R {
  let ultA: A | null = null, ultR: R;
  return (...a: A) => {
    if (ultA && a.length === ultA.length && a.every((x, i) => x === ultA![i])) return ultR;
    ultA = a; ultR = f(...a); return ultR;
  };
}

export interface AlertaEf extends Alerta {
  confirmTotal: number;
  confirmadores: string[];
  autor?: string;
  criadoNoApp: boolean;
  recente: boolean;
  /** passou a contar em Zeladoria por confirmações feitas no protótipo */
  confirmadoNoApp: boolean;
}

export const alertasEfetivos = memo((dados: Dados, criados: Acoes['alertasCriados'], conf: Acoes['confirmacoes']): AlertaEf[] => {
  const base = dados.alertas.map((a): AlertaEf => {
    const extra = conf[a.id] ?? [];
    const total = a.confirmacoes + extra.length;
    const vira = a.status === 'novo' && total >= 3;
    return {
      ...a, confirmTotal: total, confirmadores: extra, criadoNoApp: false, status: vira ? 'confirmado' : a.status,
      recente: diasEntre(a.criado_em, HOJE) <= 7 && diasEntre(a.criado_em, HOJE) >= 0, confirmadoNoApp: vira && a.confirmacoes < 3,
    };
  });
  const novos = criados.map((a): AlertaEf => {
    const quem = [a.autor, ...(conf[a.id] ?? [])];
    const total = quem.length;
    return { ...a, confirmacoes: total, confirmTotal: total, confirmadores: quem, criadoNoApp: true, status: total >= 3 ? 'confirmado' : 'novo', recente: true, confirmadoNoApp: total >= 3 };
  });
  return [...novos, ...base];
});

export type IndEf = Indicadores & { lacComp: LacComponentes; zelAjustado: boolean };

export const indicadoresEfetivos = memo((dados: Dados, alertas: AlertaEf[], pesos: PesosLacunas): Record<string, IndEf> => {
  const extra: Record<string, number> = {};
  for (const a of alertas) if (a.confirmadoNoApp) extra[a.distrito] = (extra[a.distrito] ?? 0) + 1;
  const ind: Record<string, IndEf> = {};
  for (const d of dados.distritos) {
    const e = extra[d.id] ?? 0;
    const a90 = d.ind.alertas_90d + e;
    ind[d.id] = { ...d.ind, alertas_90d: a90, zel: e ? Math.round((a90 / d.ind.pop) * 1000 * 100) / 100 : d.ind.zel, lacComp: d.lacComp, zelAjustado: e > 0 };
  }
  const lac = calcularLacunas(dados.distritos.map((d) => ({ id: d.id, problemas: ind[d.id].zel, vulnerabilidade: ind[d.id].vul, presenca: ind[d.id].pres })), pesos);
  for (const d of dados.distritos) {
    const l = lac[d.id];
    ind[d.id].lac = Math.round(l.valor * 1000) / 1000;
    ind[d.id].lacComp = { p_problemas: l.pProblemas, p_vulnerabilidade: l.pVulnerabilidade, p_presenca: l.pPresenca };
  }
  return ind;
});

export const missoesEfetivas = memo((dados: Dados, criadas: Missao[], alteradas: Acoes['missoesAlteradas']): Missao[] =>
  [...criadas, ...dados.missoes].map((m) => (alteradas[m.id] ? { ...m, ...alteradas[m.id] } : m)));

export const entregasEfetivas = memo((dados: Dados, criadas: Entrega[], alteradas: Acoes['entregasAlteradas']): Entrega[] =>
  [...criadas, ...dados.entregas].map((e) => (alteradas[e.id] ? { ...e, ...alteradas[e.id] } : e)));

export interface MilitanteEf {
  m: Militante;
  trilhas: Record<TrilhaId, EstadoTrilha>;
  passagens: Partial<Record<TrilhaId, Passagem>>;
}
export function militanteEstado(dados: Dados, id: string, lanc: LancamentoPT[], passagens: Acoes['passagens']): MilitanteEf | null {
  const m = dados.militantePorId[id];
  if (!m) return null;
  const p = passagens[id] ?? {};
  const trilhas = Object.fromEntries(TRILHAS.map((t) => {
    const ptExtra = lanc.filter((l) => l.militante === id && l.trilha === t).reduce((a, l) => a + l.creditado, 0);
    const pr = prontidaoDeLancamentos(lanc, id, t, HOJE, dados.regras.janela_prontidao_dias);
    const pas = p[t];
    return [t, estadoTrilha({
      trilhaId: t, trilha: dados.trilhas[t], base: m.trilhas[t], ptExtra, prontidaoExtra: pr,
      nivelPassagem: pas?.status === 'aprovada' ? pas.nivel : undefined, ramo: pas?.status === 'aprovada' && pas.ramo !== undefined ? pas.ramo : undefined,
      niveis: dados.regras.niveis,
    })];
  })) as Record<TrilhaId, EstadoTrilha>;
  return { m, trilhas, passagens: p };
}

export function contextoDe(camada: Contexto['camada'], mil: MilitanteEf | null): Contexto {
  if (camada !== 'militante' || !mil) return { camada };
  return { camada, niveis: Object.fromEntries(TRILHAS.map((t) => [t, { nivel: mil.trilhas[t].nivel, emReserva: mil.trilhas[t].emReserva }])) as Contexto['niveis'] };
}

/* ---------- hooks ---------- */
export function useDados(): Dados {
  const d = useStore((s) => s.dados);
  if (!d) throw new Error('dados não carregados');
  return d;
}
export function useAlertas() {
  const dados = useDados();
  const criados = useStore((s) => s.alertasCriados), conf = useStore((s) => s.confirmacoes);
  return alertasEfetivos(dados, criados, conf);
}
export function useIndicadores() {
  const dados = useDados();
  const alertas = useAlertas();
  const pesos = useStore((s) => s.pesos);
  return indicadoresEfetivos(dados, alertas, pesos);
}
export function useMissoes() {
  const dados = useDados();
  const c = useStore((s) => s.missoesCriadas), a = useStore((s) => s.missoesAlteradas);
  return missoesEfetivas(dados, c, a);
}
export function useEntregas() {
  const dados = useDados();
  const c = useStore((s) => s.entregasCriadas), a = useStore((s) => s.entregasAlteradas);
  return entregasEfetivas(dados, c, a);
}
export function usePersona(): Persona {
  const dados = useDados();
  const id = useStore((s) => s.personaId);
  return acharPersona(dados, id) ?? { id, camada: 'visitante', nome: 'Visitante', descricao: '' };
}
export function useMilitante(id: string | null | undefined): MilitanteEf | null {
  const dados = useDados();
  const lanc = useStore((s) => s.lancamentos), pas = useStore((s) => s.passagens);
  return useMemo(() => (id ? militanteEstado(dados, id, lanc, pas) : null), [dados, id, lanc, pas]);
}
export function useContexto(): Contexto {
  const camada = useStore((s) => s.camada);
  const p = usePersona();
  const mil = useMilitante(camada === 'militante' ? p.militanteId : null);
  return useMemo(() => contextoDe(camada, mil), [camada, mil]);
}
/** Zona de atuação da persona Autoridade (lista de distritos). */
export function useZonaPersona(): string[] {
  const dados = useDados();
  const p = usePersona();
  return useMemo(() => (p.zonas ?? []).flatMap((z) => dados.zonas_de_atuacao.find((x) => x.id === z)?.distritos ?? []), [dados, p]);
}
