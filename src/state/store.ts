import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Alerta, CamadaId, CategoriaAlerta, Dados, Entrega, EvidenciaTipo, LngLat, Missao, ModoId, TrilhaId, VerificacaoId } from '../data/types';
import { HOJE } from '../data/indicators';
import type { AbaId, RailId } from '../domain/permissions';
import { PESOS_PADRAO, type PesosLacunas } from '../domain/lacunas';
import type { LancamentoPT } from '../domain/points';
import { armazenamentoSeguro, CHAVE } from './persistence';
import { PERSONA_PADRAO } from './personas';

export type Modal =
  | { tipo: 'decisao'; id: string }
  | { tipo: 'registrar-alerta'; categoria?: CategoriaAlerta; ponto?: { lng: number; lat: number; distrito: string } }
  | { tipo: 'convite' }
  | { tipo: 'municipio' }
  | { tipo: 'dev' }
  | { tipo: 'entrega'; missao: string }
  | { tipo: 'validar'; entrega: string }
  | { tipo: 'missao'; id: string }
  | { tipo: 'alerta'; id: string }
  | { tipo: 'passagem'; militante: string; trilha: TrilhaId }
  | { tipo: 'pesos' }
  | { tipo: 'campanha'; id: string }
  | { tipo: 'banca'; militante: string; trilha: TrilhaId };

export interface Toast { id: number; tipo: 'info' | 'ok' | 'warn'; titulo: string; texto: string; quando: string; icon?: string; painel?: RailId }
export interface Evento { id: string; quando: string; quem: string; camada: CamadaId; tipo: string; texto: string; distritos?: string[] }
export interface Inscricao { status: 'aceita' | 'checkin' | 'entregue'; aceitaEm: string; checkinEm?: string; entrega?: string }
export interface Passagem { nivel: number; ramo?: string | null; status: 'aprovada' | 'pendente_banca'; banca?: string[]; pedidoEm: string; aprovadaEm?: string }
export interface EstadoCoord { dispensadoAte?: string; resolvido?: { quem: string; quando: string; resultado: string } }
export interface DecisaoRegistrada { id: string; opcao: string; texto: string; quem: string; camada: CamadaId; quando: string; missoes: string[] }
export interface MudancaPesos { quem: string; quando: string; antes: PesosLacunas; depois: PesosLacunas }

export interface Acoes {
  alertasCriados: (Alerta & { autor: string })[];
  confirmacoes: Record<string, string[]>;
  inscricoes: Record<string, Record<string, Inscricao>>;
  missoesCriadas: Missao[];
  missoesAlteradas: Record<string, Partial<Missao>>;
  entregasCriadas: Entrega[];
  entregasAlteradas: Record<string, Partial<Entrega>>;
  lancamentos: LancamentoPT[];
  passagens: Record<string, Partial<Record<TrilhaId, Passagem>>>;
  decisoes: DecisaoRegistrada[];
  pesos: PesosLacunas;
  pesosLog: MudancaPesos[];
  coord: Record<string, EstadoCoord>;
  consentimento: Record<string, { aceito: boolean; quando: string }>;
  historico: Evento[];
  delegacoes: Record<string, { ate: string; status: 'ativa' | 'encerrada' }>;
}

export const ACOES_INICIAIS: Acoes = {
  alertasCriados: [], confirmacoes: {}, inscricoes: {}, missoesCriadas: [], missoesAlteradas: {}, entregasCriadas: [], entregasAlteradas: {},
  lancamentos: [], passagens: {}, decisoes: [], pesos: { ...PESOS_PADRAO }, pesosLog: [], coord: {}, consentimento: {}, historico: [], delegacoes: {},
};

export type Folha = 'recolhida' | 'meia' | 'cheia';
export type AbaMovel = 'mapa' | 'acompanhar' | 'numeros' | 'perfil';
export interface LedgerUI { indicador: string; ordem: 'asc' | 'desc'; zona: string | null; sub: string | null; busca: string; comparar: string[]; largo: boolean }

export interface UI {
  dados: Dados | null;
  camada: CamadaId;
  personaId: string;
  modo: ModoId;
  tema: 'escuro' | 'claro';
  economia: boolean;
  sel: string | null;
  selB: string | null;
  fixado: boolean;
  hover: string | null;
  painel: RailId | null;
  aba: AbaId;
  mes: number;
  comparar: number | null;
  tocando: boolean;
  modosAbertos: boolean;
  minimapa: boolean;
  outlinerAberto: boolean;
  folha: Folha;
  abaMovel: AbaMovel;
  modal: Modal | null;
  toasts: Toast[];
  ledger: LedgerUI;
  fichaId: string | null;
  nucleoId: string | null;
  escolhendoPonto: CategoriaAlerta | null;
  ordemOutliner: Partial<Record<CamadaId, string[]>>;
  outlinerFechadas: string[];
  observados: string[];
  zoom: number;
  verDispensados: boolean;
  coordIdx: number;
  coordAberto: boolean;
}

type Estado = UI & Acoes & {
  set: (p: Partial<UI>) => void;
  acao: (f: (s: Acoes) => Partial<Acoes>) => void;
  toast: (t: Omit<Toast, 'id' | 'quando'>) => void;
  fecharToast: (id: number) => void;
  registrar: (e: Omit<Evento, 'id' | 'quando' | 'quem' | 'camada'>, quem: string) => void;
  restaurarDemo: () => void;
};

export const MODO_INICIAL: Record<CamadaId, ModoId> = { visitante: 'zel', militante: 'pre', autoridade: 'lac', direcao: 'lac' };

let toastSeq = 1;
let idSeq = Date.now() % 100000;
export const novoId = (p: string) => `${p}-${(idSeq++).toString(36).toUpperCase()}`;
/** Data do protótipo (relógio fixo em temporada.hoje) com a hora real, para registros. */
export const agora = () => {
  const d = new Date();
  return `${HOJE}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const fmtQuando = (iso: string) => {
  const [data, hora] = iso.split('T');
  const [y, m, d] = data.split('-');
  return `${d}/${m}/${y}${hora ? ' ' + hora : ''}`;
};

export const UI_INICIAL: Omit<UI, 'dados'> = {
  camada: 'militante', personaId: PERSONA_PADRAO.militante, modo: 'pre', tema: 'escuro', economia: false,
  sel: null, selB: null, fixado: false, hover: null, painel: null, aba: 'geral', mes: 11, comparar: null, tocando: false,
  modosAbertos: true, minimapa: true, outlinerAberto: true, folha: 'recolhida', abaMovel: 'mapa', modal: null, toasts: [],
  ledger: { indicador: 'lac', ordem: 'desc', zona: null, sub: null, busca: '', comparar: [], largo: false },
  fichaId: null, nucleoId: null, escolhendoPonto: null, ordemOutliner: {}, outlinerFechadas: [], observados: ['CRE', 'BRL'], zoom: 11,
  verDispensados: false, coordIdx: 0, coordAberto: true,
};

export const useStore = create<Estado>()(
  persist(
    (set) => ({
      dados: null,
      ...UI_INICIAL,
      ...ACOES_INICIAIS,
      set: (p) => set(p),
      acao: (f) => set((s) => f(s)),
      toast: (t) => {
        const id = toastSeq++;
        const quando = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        set((s) => ({ toasts: [...s.toasts, { ...t, id, quando }].slice(-3) }));
        if (t.tipo !== 'warn') setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 8000);
      },
      fecharToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
      registrar: (e, quem) => set((s) => ({ historico: [{ ...e, id: novoId('EV'), quando: agora(), quem, camada: s.camada }, ...s.historico].slice(0, 300) })),
      restaurarDemo: () => {
        armazenamentoSeguro.removeItem(CHAVE);
        set((s) => ({ ...ACOES_INICIAIS, pesos: { ...PESOS_PADRAO }, ...UI_INICIAL, dados: s.dados, toasts: [] }));
      },
    }),
    {
      name: CHAVE,
      version: 1,
      storage: createJSONStorage(() => armazenamentoSeguro),
      partialize: (s) => ({
        camada: s.camada, personaId: s.personaId, modo: s.modo, tema: s.tema, economia: s.economia, ordemOutliner: s.ordemOutliner,
        outlinerFechadas: s.outlinerFechadas, observados: s.observados, minimapa: s.minimapa,
        alertasCriados: s.alertasCriados, confirmacoes: s.confirmacoes, inscricoes: s.inscricoes, missoesCriadas: s.missoesCriadas,
        missoesAlteradas: s.missoesAlteradas, entregasCriadas: s.entregasCriadas, entregasAlteradas: s.entregasAlteradas, lancamentos: s.lancamentos,
        passagens: s.passagens, decisoes: s.decisoes, pesos: s.pesos, pesosLog: s.pesosLog, coord: s.coord, consentimento: s.consentimento,
        historico: s.historico, delegacoes: s.delegacoes,
      }),
    },
  ),
);

export const st = () => useStore.getState();
export type { Estado, LngLat, EvidenciaTipo, VerificacaoId };
