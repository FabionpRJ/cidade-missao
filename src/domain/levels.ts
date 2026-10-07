// Carreira, Prontidão, níveis, títulos e títulos híbridos (doc. 2.1, 2.3, 3, 4.2).
import type { NivelRegra, Trilha, TrilhaId, TrilhaMilitante } from '../data/types';
import { diasEntre, type LancamentoPT } from './points';

export const NIVEIS_PADRAO: NivelRegra[] = [
  { nivel: 1, carreira_min: 0, prontidao_min: 0, passagem: 'Filiação comprovada', tempo_min_dias: 0 },
  { nivel: 2, carreira_min: 100, prontidao_min: 20, passagem: 'Módulo introdutório da trilha', tempo_min_dias: 0 },
  { nivel: 3, carreira_min: 350, prontidao_min: 50, passagem: 'Escolha de ramo + módulo do ramo', tempo_min_dias: 30 },
  { nivel: 4, carreira_min: 900, prontidao_min: 100, passagem: 'Prova de passagem do ramo', tempo_min_dias: 60 },
  { nivel: 5, carreira_min: 2000, prontidao_min: 150, passagem: 'Prova de passagem + mentoria de 2 militantes até o nível 3', tempo_min_dias: 90 },
  { nivel: 6, carreira_min: 4000, prontidao_min: 200, passagem: 'Prova de passagem + avaliação 360° + homologação pela direção municipal', tempo_min_dias: 120 },
];
export const TRILHAS: TrilhaId[] = ['fiscalista', 'intelectual', 'militante'];
export const NOME_TRILHA: Record<TrilhaId, string> = { fiscalista: 'Fiscalista', intelectual: 'Intelectual', militante: 'Militante' };
export const SIGLA_TRILHA: Record<TrilhaId, 'fis' | 'int' | 'mil'> = { fiscalista: 'fis', intelectual: 'int', militante: 'mil' };

/** Maior nível cuja Carreira mínima foi alcançada. */
export function nivelPorCarreira(carreira: number, niveis = NIVEIS_PADRAO) {
  let n = 1;
  for (const r of niveis) if (carreira >= r.carreira_min) n = Math.max(n, r.nivel);
  return n;
}
export const regraNivel = (n: number, niveis = NIVEIS_PADRAO) => niveis.find((r) => r.nivel === n) ?? niveis[0];

/** Prontidão = PT creditados nos últimos `janela` dias (doc. 2.1). */
export function prontidaoDeLancamentos(lanc: LancamentoPT[], militante: string, trilha: TrilhaId, hoje: string, janela = 120) {
  return lanc
    .filter((l) => l.militante === militante && l.trilha === trilha)
    .filter((l) => { const d = diasEntre(l.data, hoje); return d >= 0 && d < janela; })
    .reduce((a, l) => a + l.creditado, 0);
}

/** "Em reserva": Prontidão abaixo do mínimo do nível; o título continua, os poderes ficam suspensos. */
export function emReserva(prontidao: number, nivel: number, niveis = NIVEIS_PADRAO) {
  return prontidao < regraNivel(nivel, niveis).prontidao_min;
}

/** Prontidão em 4 pontos (decisão D4 do PLANO): ⌈P ÷ (2 × mínimo) × 4⌉, entre 0 e 4. */
export function pontosProntidao(prontidao: number, nivel: number, niveis = NIVEIS_PADRAO) {
  const min = regraNivel(nivel, niveis).prontidao_min || regraNivel(2, niveis).prontidao_min;
  return Math.max(0, Math.min(4, Math.ceil((prontidao / (2 * min)) * 4)));
}

export function titulo(trilha: Trilha, nivel: number, ramo: string | null) {
  if (nivel >= 6) return (ramo && trilha.ramos[ramo]?.titulo6) || 'Título do ramo';
  return trilha.titulos[nivel - 1] ?? '';
}

export interface Hibrido { titulo: string; combinacao: string; habilita: string; alcancado: boolean; aCaminho: boolean; falta: string[] }
const HIBRIDOS: { titulo: string; combinacao: string; habilita: string; req: Partial<Record<TrilhaId, number>> }[] = [
  { titulo: 'Auditor(a) Cívico(a)', combinacao: 'Fiscalista 4 + Intelectual 4', habilita: 'Coordenação de dossiês para a bancada', req: { fiscalista: 4, intelectual: 4 } },
  { titulo: 'Liderança Territorial', combinacao: 'Fiscalista 4 + Militante 4', habilita: 'Coordenação de campanhas de bairro com recursos', req: { fiscalista: 4, militante: 4 } },
  { titulo: 'Quadro Orgânico', combinacao: 'Intelectual 4 + Militante 4', habilita: 'Coordenação de formação de núcleos', req: { intelectual: 4, militante: 4 } },
  { titulo: 'Quadro Completo', combinacao: 'As três trilhas em 4', habilita: 'Indicação prioritária a instâncias e pré-candidaturas', req: { fiscalista: 4, intelectual: 4, militante: 4 } },
  { titulo: 'Referência do Partido', combinacao: 'As três trilhas em 6', habilita: 'Registro honorário permanente no Arquivo', req: { fiscalista: 6, intelectual: 6, militante: 6 } },
];

/** Títulos híbridos (doc. 4.2). "A caminho": ao menos metade das trilhas exigidas já cumpre o requisito. */
export function titulosHibridos(niveis: Record<TrilhaId, number>): Hibrido[] {
  return HIBRIDOS.map((h) => {
    const req = Object.entries(h.req) as [TrilhaId, number][];
    const cumpre = req.filter(([t, n]) => niveis[t] >= n);
    const falta = req.filter(([t, n]) => niveis[t] < n).map(([t, n]) => `${NOME_TRILHA[t]} ${niveis[t]} → ${n}`);
    const alcancado = cumpre.length === req.length;
    return { titulo: h.titulo, combinacao: h.combinacao, habilita: h.habilita, alcancado, aCaminho: !alcancado && cumpre.length * 2 >= req.length, falta };
  });
}

export interface ProximaPassagem {
  nivel: number;
  titulo: string;
  carreiraMin: number;
  faltaCarreira: number;
  prontaCarreira: boolean;
  requisito: string;
  /** níveis 4 a 6: prova de passagem avaliada por banca do nível acima */
  exigeProva: boolean;
}
export function proximaPassagem(trilha: Trilha, nivel: number, carreira: number, ramo: string | null, niveis = NIVEIS_PADRAO): ProximaPassagem | null {
  if (nivel >= 6) return null;
  const r = regraNivel(nivel + 1, niveis);
  return {
    nivel: r.nivel, titulo: titulo(trilha, r.nivel, ramo), carreiraMin: r.carreira_min,
    faltaCarreira: Math.max(0, r.carreira_min - carreira), prontaCarreira: carreira >= r.carreira_min,
    requisito: r.passagem, exigeProva: r.nivel >= 4,
  };
}

export interface EstadoTrilha {
  trilha: TrilhaId;
  nivel: number;
  ramo: string | null;
  titulo: string;
  carreira: number;
  prontidao: number;
  emReserva: boolean;
  pontos: number;
  nivelPorCarreira: number;
  proxima: ProximaPassagem | null;
}

/** Estado efetivo de uma trilha: dados de demonstração + PT creditados no protótipo + passagens aprovadas. */
export function estadoTrilha(o: {
  trilhaId: TrilhaId; trilha: Trilha; base: TrilhaMilitante; ptExtra: number; prontidaoExtra: number; nivelPassagem?: number; ramo?: string | null; niveis?: NivelRegra[];
}): EstadoTrilha {
  const niveis = o.niveis ?? NIVEIS_PADRAO;
  const carreira = Math.round((o.base.carreira + o.ptExtra) * 100) / 100;
  const prontidao = Math.round((o.base.prontidao_120d + o.prontidaoExtra) * 100) / 100;
  const nivel = Math.max(o.base.nivel, o.nivelPassagem ?? 0);
  const ramo = o.ramo !== undefined ? o.ramo : o.base.ramo;
  return {
    trilha: o.trilhaId, nivel, ramo, titulo: titulo(o.trilha, nivel, ramo), carreira, prontidao,
    emReserva: emReserva(prontidao, nivel, niveis), pontos: pontosProntidao(prontidao, nivel, niveis),
    nivelPorCarreira: nivelPorCarreira(carreira, niveis), proxima: proximaPassagem(o.trilha, nivel, carreira, ramo, niveis),
  };
}
