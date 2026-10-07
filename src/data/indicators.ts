import type { Familia, IndicadorId, IndicadorMeta, ModoId, TipoPOI } from './types';

/** Data do relógio do protótipo (temporada.hoje). */
export const HOJE = '2026-10-07';
export const ANO_HOJE = 2026;

export const fmt = (n: number, dec = 0) =>
  Number(n).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
/** Até `max` casas, sem zeros à direita ("120", "112,5"). */
export const fmtN = (n: number, max = 2) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: max });
export const fmtData = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return d ? `${d}/${m}/${y}` : `${m}/${y}`;
};
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** "2026-10" → "out/26" */
export const mesCurto = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MESES_CURTOS[Number(m) - 1]}/${y.slice(2)}`;
};

export interface ModoDef {
  id: ModoId;
  nome: string;
  familia: Familia;
  /** família de exibição no seletor (Lacunas fica em Partido) */
  grupo: 'territorio' | 'servicos' | 'problemas' | 'partido';
  icon: string;
  atalho: string;
  indicador?: IndicadorId;
  categorico?: boolean;
  dec: number;
  prefixo?: string;
  sufixo?: string;
  /** o que colore (doc. 6) */
  colore: string;
  icones: string;
  tooltip: string;
  poi?: TipoPOI;
  serieMensal?: 'pres' | 'zel_mes' | 'ops';
  legendaPalavras?: [string, string];
}

export const MODOS: ModoDef[] = [
  { id: 'adm', nome: 'Político-administrativo', familia: 'territorio', grupo: 'territorio', icon: 'building', atalho: 'A', categorico: true, dec: 0,
    colore: 'subprefeitura (região administrativa)', icones: 'Prefeitura, Câmara, sedes de subprefeitura', tooltip: 'nome, área, população, subprefeitura' },
  { id: 'dem', nome: 'Demografia', familia: 'territorio', grupo: 'territorio', icon: 'people', atalho: 'D', indicador: 'dens', dec: 0,
    colore: 'densidade populacional', icones: '—', tooltip: 'população, densidade, domicílios' },
  { id: 'ren', nome: 'Renda e vulnerabilidade', familia: 'territorio', grupo: 'territorio', icon: 'coin', atalho: 'R', indicador: 'renda', dec: 0, prefixo: 'R$ ',
    colore: 'renda média por domicílio (per capita)', icones: 'CRAS', tooltip: 'renda, vulnerabilidade, comparação com a média municipal', poi: 'cras' },
  { id: 'sau', nome: 'Saúde', familia: 'servicos', grupo: 'servicos', icon: 'health', atalho: 'S', indicador: 'saude', dec: 0, sufixo: '%',
    colore: 'cobertura da atenção básica', icones: 'UBS', tooltip: 'unidades, cobertura estimada, alertas de saúde', poi: 'ubs' },
  { id: 'edu', nome: 'Educação', familia: 'servicos', grupo: 'servicos', icon: 'book', atalho: 'E', indicador: 'educ', dec: 1, sufixo: '%',
    colore: 'atendimento 0–5 anos (IDEB quando houver)', icones: 'escolas', tooltip: 'escolas, atendimento', poi: 'escola' },
  { id: 'san', nome: 'Saneamento e infraestrutura', familia: 'servicos', grupo: 'servicos', icon: 'drop', atalho: 'G', indicador: 'san', dec: 1, sufixo: '%',
    colore: '% de domicílios com esgoto adequado', icones: 'alertas de saneamento', tooltip: 'esgoto (Censo), alertas' },
  { id: 'ris', nome: 'Riscos', familia: 'servicos', grupo: 'servicos', icon: 'shield', atalho: 'I', indicador: 'risco', dec: 0,
    colore: 'domicílios em área de risco a prevenir', icones: 'alertas de alagamento recentes', tooltip: 'áreas mapeadas, ocorrências' },
  { id: 'zel', nome: 'Zeladoria', familia: 'problemas', grupo: 'problemas', icon: 'bell', atalho: 'Z', indicador: 'zel', dec: 1, serieMensal: 'zel_mes',
    colore: 'alertas confirmados por mil habitantes, últimos 90 dias', icones: 'alertas individuais (perto), agrupados, casos coletivos', tooltip: 'alertas por categoria, tempo médio de resolução, casos em andamento' },
  { id: 'pre', nome: 'Presença', familia: 'partido', grupo: 'partido', icon: 'target', atalho: 'P', indicador: 'pres', dec: 2, serieMensal: 'pres',
    colore: 'militantes ativos por mil eleitores', icones: 'núcleos com nível, sedes', tooltip: 'militantes por trilha, núcleos, coordenadores, Prontidão média' },
  { id: 'ope', nome: 'Operações', familia: 'partido', grupo: 'partido', icon: 'flag', atalho: 'O', indicador: 'ops', dec: 0, serieMensal: 'ops',
    colore: 'campanhas e missões ativas', icones: 'missões, rotas núcleo → missão, campanhas', tooltip: 'missões abertas, vagas, prazo, coordenador' },
  { id: 'lac', nome: 'Lacunas de cobertura', familia: 'prioridade', grupo: 'partido', icon: 'gap', atalho: 'C', indicador: 'lac', dec: 2,
    colore: 'índice de Lacunas (problemas altos e presença baixa)', icones: 'distritos prioritários', tooltip: 'componentes do índice com pesos',
    legendaPalavras: ['menor prioridade', 'maior prioridade'] },
  { id: 'ele', nome: 'Eleitoral agregado', familia: 'partido', grupo: 'partido', icon: 'urna', atalho: 'T', indicador: 'comp', dec: 1, sufixo: '%',
    colore: 'comparecimento por local de votação, agregado ao distrito', icones: 'locais de votação', tooltip: 'eleitorado, comparecimento', poi: 'local_votacao' },
];
export const MODO: Record<ModoId, ModoDef> = Object.fromEntries(MODOS.map((m) => [m.id, m])) as Record<ModoId, ModoDef>;
export const GRUPOS: { id: ModoDef['grupo']; nome: string }[] = [
  { id: 'territorio', nome: 'Território' },
  { id: 'servicos', nome: 'Serviços' },
  { id: 'problemas', nome: 'Problemas' },
  { id: 'partido', nome: 'Partido' },
];
export const NOME_FAMILIA: Record<Familia, string> = {
  territorio: 'Território', servicos: 'Serviços', problemas: 'Problemas', partido: 'Partido', prioridade: 'Partido · prioridade',
};

export function fmtValor(m: ModoDef, v: number) {
  return `${m.prefixo ?? ''}${fmt(v, m.dec)}${m.sufixo ?? ''}`;
}
export function fmtIndicador(id: IndicadorId, v: number) {
  const m = MODOS.find((x) => x.indicador === id);
  if (m) return fmtValor(m, v);
  if (id === 'vul') return fmt(v, 2);
  if (id === 'prontidao_media') return `${fmt(v)}%`;
  return fmt(v);
}

/** Selo "desatualizado": dados com mais de 3 anos (doc. 8.3), ou marcados assim nos dados. */
export function desatualizado(meta: IndicadorMeta, anoHoje = ANO_HOJE) {
  return !!meta.desatualizado || anoHoje - meta.ano > 3;
}
export const linhaFonte = (meta: IndicadorMeta) => `${meta.fonte} · ${meta.ano} · ${meta.nivel}`;

/** Indicadores públicos da aba Dados (oficiais) e do app (nunca misturados sem rótulo). */
export const IND_OFICIAIS: IndicadorId[] = ['pop', 'dens', 'renda', 'vul', 'saude', 'educ', 'san', 'risco'];
export const IND_APP: IndicadorId[] = ['zel', 'pres', 'ops', 'prontidao_media', 'lac'];
