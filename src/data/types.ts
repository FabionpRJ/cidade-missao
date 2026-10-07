// Tipos dos arquivos de dados fictícios (public/dados) e do estado derivado.

export type LngLat = [number, number];
export type TrilhaId = 'fiscalista' | 'intelectual' | 'militante';
export type CamadaId = 'visitante' | 'militante' | 'autoridade' | 'direcao';
export type Familia = 'territorio' | 'servicos' | 'problemas' | 'partido' | 'prioridade';
export type ModoId = 'adm' | 'dem' | 'ren' | 'sau' | 'edu' | 'san' | 'ris' | 'zel' | 'pre' | 'ope' | 'lac' | 'ele';
export type IndicadorId =
  | 'pop' | 'dens' | 'renda' | 'saude' | 'educ' | 'san' | 'risco' | 'zel' | 'pres' | 'ops' | 'lac' | 'comp' | 'vul'
  | 'prontidao_media';

export interface IndicadorMeta {
  nome: string;
  unidade: string;
  fonte: string;
  ano: number;
  nivel: string;
  familia: Familia;
  dominio?: [number, number];
  dado_do_app?: boolean;
  desatualizado?: boolean;
  formula?: string;
  regra?: string;
  media_municipal?: number;
  media_estadual?: number;
  media_nacional?: number;
}

export interface Indicadores {
  pop: number; dens: number; renda: number; saude: number; educ: number; san: number; risco: number;
  zel: number; pres: number; ops: number; lac: number; comp: number; vul: number; eleit: number;
  militantes: number; nucleos: number; locais: number; km2: number; prontidao_media: number;
  filiacoes_mes: number; alertas_90d: number; tempo_resolucao_dias: number;
}

export interface LacComponentes { p_problemas: number; p_vulnerabilidade: number; p_presenca: number }

export interface SerieMensal { meses: string[]; pres: number[]; zel_mes: number[]; ops: number[] }

export interface Distrito {
  id: string;
  cod: string;
  nome: string;
  sub: string;
  ind: Indicadores;
  lacComp: LacComponentes;
  serie: SerieMensal;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number];
  rotulo: { lng: number; lat: number; r_m: number };
}

export interface Subprefeitura {
  id: string;
  nome: string;
  curto: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  rotulo: { lng: number; lat: number; r_m: number };
  distritos: string[];
}

export interface Ramo { nome: string; foco: string; titulo6: string }
/** [ação, ramo, V_base, verificação típica, multiplicador esperado] */
export type AcaoTrilha = [string, string | null, number, string, number];
export interface Trilha {
  nome: string;
  lema: string;
  titulos: (string | null)[];
  ramos: Record<string, Ramo>;
  poderes: string[];
  acoes: AcaoTrilha[];
}

export interface NivelRegra { nivel: number; carreira_min: number; prontidao_min: number; passagem: string; tempo_min_dias: number }
export interface Regras {
  pontos: string;
  m_verificacao: Record<VerificacaoId, number>;
  m_foco: { padrao: number; foco_da_temporada: number; territorio_prioritario_baixa_presenca: number };
  teto_semanal_pt_por_trilha: number;
  janela_prontidao_dias: number;
  niveis: NivelRegra[];
  nucleo_niveis: { nivel: NucleoNivel; requisito: string; desbloqueia: string }[];
  titulos_hibridos: { combinacao: string; titulo: string }[];
  cargos: { cargo: string; requisito: string; mandato: string }[];
  anti_exploit: string[];
}
export type VerificacaoId = 'autodeclarada_evidencia_fraca' | 'validada_por_par_ou_coordenador' | 'confirmada_por_fonte_externa';
export type NucleoNivel = 'Semente' | 'Raiz' | 'Tronco' | 'Copa' | 'em formação';

export interface Temporada {
  id: string; nome: string; inicio: string; fim: string; hoje: string; dias_restantes: number; escolhida_por: string; multiplicador: number;
}
export interface Campanha {
  id: string; nome: string; territorio: string[]; foco_temporada: boolean; coordenador: string; meta: string; progresso: number; prazo: string;
}
export interface Decisao {
  id: string; titulo: string; contexto: string; prazo: string; camada_minima: CamadaId;
  opcoes: { id: string; texto: string; efeitos: string; bloqueada?: boolean }[];
}
export type TipoAlertaCoord =
  | 'distrito_sem_nucleo' | 'missao_sem_voluntarios' | 'sobreposicao_de_missoes' | 'meta_em_risco' | 'delegacao_expirando' | 'prova_pendente_de_banca';
export interface AlertaCoordenacao {
  tipo: TipoAlertaCoord; texto: string; acao: string; distrito?: string; missao?: string; campanha?: string; militante?: string;
}
export interface ZonaAtuacao { id: string; nome: string; distritos: string[] }

export interface Nucleo {
  id: string; nome: string; distrito: string; lng: number; lat: number; militantes_ativos: number; nivel: NucleoNivel;
  coordenador: string | null; reuniao: string;
}
export type StatusMissao = 'aberta' | 'em_curso' | 'agendada' | 'concluida' | 'unificada';
export interface Missao {
  id: string; titulo: string; trilha: TrilhaId; ramo: string | null; distrito: string; nucleo: string | null; lng: number; lat: number;
  status: StatusMissao; prazo: string; vagas: number; inscritos: number; v_base: number; verificacao_tipica: string;
  m_verificacao_esperado: number; foco_temporada: boolean; territorio_prioritario: boolean; nivel_minimo: number; campanha: string | null;
  criada_por?: string; origem?: string;
}
export type StatusEntrega = 'pendente_validacao' | 'validada' | 'contestada';
export type EvidenciaTipo = 'foto' | 'protocolo' | 'ata' | 'link de publicação';
export interface Entrega {
  id: string; militante: string; missao: string; trilha: TrilhaId; ramo: string | null; acao: string; v_base: number; status: StatusEntrega;
  verificacao: VerificacaoId | null; evidencia: EvidenciaTipo; foco_temporada: boolean; territorio_prioritario: boolean; criada_em: string;
  evidencia_detalhe?: string;
  validador?: string; validada_em?: string; calculo?: CalculoPT;
}
export type CategoriaAlerta = 'poda' | 'boca_de_lobo' | 'buraco' | 'calcada' | 'entulho' | 'iluminacao' | 'alagamento';
export type StatusAlerta = 'novo' | 'confirmado' | 'protocolado' | 'caso_coletivo' | 'resolvido';
export interface Alerta {
  id: string; categoria: CategoriaAlerta; distrito: string; lng: number; lat: number; confirmacoes: number; status: StatusAlerta;
  protocolo: string | null; criado_em: string; descricao?: string; doApp?: boolean;
}
export type TipoPOI = 'ubs' | 'escola' | 'cras' | 'local_votacao';
export interface PontoInteresse { id: string; tipo: TipoPOI; nome: string; distrito: string; lng: number; lat: number }

export interface TrilhaMilitante { nivel: number; ramo: string | null; titulo: string; carreira: number; prontidao_120d: number; em_reserva: boolean }
export interface Militante {
  id: string; nome: string; nucleo: string; distrito: string; militante_desde: string;
  trilhas: Record<TrilhaId, TrilhaMilitante>;
  titulo_principal: string; medalhas: string[]; mentor: string | null; mentorados: number;
  cargos: { cargo: string; ate: string }[];
  proxima_passagem: { trilha: TrilhaId; nivel: number; titulo: string; falta: string } | null;
}

export interface CalculoPT {
  vBase: number; mVerificacao: number; mFoco: number; focoMotivo: string; bruto: number; jaNaSemana: number; teto: number; creditado: number; naoCreditado: number;
}

export interface Fundo {
  aviso: string;
  cidade: LngLat[][];
  rios: Record<string, LngLat[][]>;
  represas: Record<string, LngLat[][]>;
  verdes: Record<string, LngLat[][]>;
  vias: Record<string, LngLat[][]>;
  vizinhos: { nome: string; lng: number; lat: number }[];
  rotulos: {
    distritos: Record<string, { lng: number; lat: number; r_m: number }>;
    subprefeituras: Record<string, { lng: number; lat: number; r_m: number; curto: string }>;
  };
}

export interface DadosBrutos {
  meta: { municipio: string; uf: string; meses: string[]; documento: string; aviso: string; limites: string; unidade_de_jogo: string };
  indicadores: Record<IndicadorId, IndicadorMeta>;
  camadas: Record<CamadaId, Record<string, unknown>>;
  trilhas: Record<TrilhaId, Trilha>;
  regras: Regras;
  temporada: Temporada;
  campanhas: Campanha[];
  decisoes: Decisao[];
  alertas_de_coordenacao: AlertaCoordenacao[];
  zonas_de_atuacao: ZonaAtuacao[];
  nucleos: Nucleo[];
  missoes: Missao[];
  entregas: Entrega[];
  alertas: Alerta[];
  pontos_de_interesse: PontoInteresse[];
  militantes: Militante[];
}

export interface Dados extends DadosBrutos {
  distritos: Distrito[];
  distritoPorId: Record<string, Distrito>;
  subprefeituras: Subprefeitura[];
  subPorNome: Record<string, Subprefeitura>;
  fundo: Fundo;
  nucleoPorId: Record<string, Nucleo>;
  militantePorId: Record<string, Militante>;
}
