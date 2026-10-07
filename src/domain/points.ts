// Pontos de Trilha (doc. 2.1–2.2): PT = V_base × M_verificação × M_foco, teto semanal por trilha.
import type { CalculoPT, Regras, TrilhaId, VerificacaoId } from '../data/types';

export const REGRAS_PADRAO: Pick<Regras, 'm_verificacao' | 'm_foco' | 'teto_semanal_pt_por_trilha' | 'janela_prontidao_dias'> = {
  m_verificacao: { autodeclarada_evidencia_fraca: 0.5, validada_por_par_ou_coordenador: 1.0, confirmada_por_fonte_externa: 1.5 },
  m_foco: { padrao: 1.0, foco_da_temporada: 1.25, territorio_prioritario_baixa_presenca: 1.5 },
  teto_semanal_pt_por_trilha: 150,
  janela_prontidao_dias: 120,
};
type RegrasPT = typeof REGRAS_PADRAO;

export const NOME_VERIFICACAO: Record<VerificacaoId, string> = {
  autodeclarada_evidencia_fraca: 'Autodeclarada com evidência fraca',
  validada_por_par_ou_coordenador: 'Validada por par ou coordenador',
  confirmada_por_fonte_externa: 'Confirmada por fonte externa (protocolo, resposta oficial, publicação)',
};

/** M_foco é um fator único: o maior que se aplica (decisão D2 do PLANO). */
export function mFoco(o: { foco_temporada: boolean; territorio_prioritario: boolean }, r: RegrasPT = REGRAS_PADRAO) {
  if (o.territorio_prioritario) return { valor: r.m_foco.territorio_prioritario_baixa_presenca, motivo: 'território prioritário com baixa presença' };
  if (o.foco_temporada) return { valor: r.m_foco.foco_da_temporada, motivo: 'ligada ao foco da temporada' };
  return { valor: r.m_foco.padrao, motivo: 'padrão' };
}

const arred = (v: number) => Math.round(v * 100) / 100;

export function calcularPT(o: {
  vBase: number;
  verificacao: VerificacaoId;
  foco_temporada: boolean;
  territorio_prioritario: boolean;
  /** PT já creditados nesta trilha, nesta semana */
  jaNaSemana: number;
  regras?: RegrasPT;
}): CalculoPT {
  const r = o.regras ?? REGRAS_PADRAO;
  const mV = r.m_verificacao[o.verificacao];
  const f = mFoco(o, r);
  const bruto = arred(o.vBase * mV * f.valor);
  const teto = r.teto_semanal_pt_por_trilha;
  const livre = Math.max(0, teto - o.jaNaSemana);
  const creditado = arred(Math.min(bruto, livre));
  return {
    vBase: o.vBase, mVerificacao: mV, mFoco: f.valor, focoMotivo: f.motivo, bruto,
    jaNaSemana: o.jaNaSemana, teto, creditado, naoCreditado: arred(bruto - creditado),
  };
}

/** Semana ISO ("2026-W41") de uma data AAAA-MM-DD. */
export function semanaISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dia = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dia);
  const ano = dt.getUTCFullYear();
  const inicio = new Date(Date.UTC(ano, 0, 1));
  const semana = Math.ceil(((dt.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
  return `${ano}-W${String(semana).padStart(2, '0')}`;
}

export interface LancamentoPT {
  id: string;
  militante: string;
  trilha: TrilhaId;
  data: string;
  creditado: number;
  entrega?: string;
  descricao: string;
}

export function ptNaSemana(lanc: LancamentoPT[], militante: string, trilha: TrilhaId, data: string) {
  const s = semanaISO(data);
  return arred(lanc.filter((l) => l.militante === militante && l.trilha === trilha && semanaISO(l.data) === s)
    .reduce((a, l) => a + l.creditado, 0));
}

export function diasEntre(a: string, b: string) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}
export function somarDias(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Texto curto da conta, usado no tooltip. */
export function contaPT(c: CalculoPT) {
  const f = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return `${f(c.vBase)} × ${f(c.mVerificacao)} × ${f(c.mFoco)} = ${f(c.bruto)} PT`;
}
