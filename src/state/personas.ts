import type { CamadaId, Dados } from '../data/types';

export interface Persona {
  id: string;
  camada: CamadaId;
  nome: string;
  descricao: string;
  /** militante dos dados (camada Militante) */
  militanteId?: string;
  /** zonas de atuação (Autoridade) */
  zonas?: string[];
  /** distrito de referência ("Seu distrito" do visitante, ou o do militante) */
  distrito?: string;
}

/** Personas simuladas (seletor de desenvolvedor). Todas fictícias. */
export const PERSONAS_FIXAS: Persona[] = [
  { id: 'VIS-A', camada: 'visitante', nome: 'Visitante A (anônimo)', descricao: 'Morador fictício; sem cadastro.', distrito: 'BRL' },
  { id: 'VIS-B', camada: 'visitante', nome: 'Visitante B (anônimo)', descricao: 'Segundo morador simulado, para confirmar alertas.', distrito: 'BRL' },
  { id: 'VIS-C', camada: 'visitante', nome: 'Visitante C (anônimo)', descricao: 'Terceiro morador simulado, para confirmar alertas.', distrito: 'FRE' },
  { id: 'AUT-1', camada: 'autoridade', nome: 'Vereadora Helena Prado (fictícia)', descricao: 'Zona de atuação Sul 1 e Sul 2.', zonas: ['ZA-SUL-1', 'ZA-SUL-2'], distrito: 'CRE' },
  { id: 'DIR-1', camada: 'direcao', nome: 'Roberto Lima (fictício)', descricao: 'Dirigente municipal; visão multi-município: futuro.' },
];

export const PERSONA_PADRAO: Record<CamadaId, string> = { visitante: 'VIS-A', militante: 'MIL-0001', autoridade: 'AUT-1', direcao: 'DIR-1' };
/** Atalhos no seletor: militante nível 1 (bloqueios) e validador de outro núcleo. */
export const MILITANTE_NIVEL1 = 'MIL-0026';
export const VALIDADOR_PADRAO = 'MIL-0013';

export function personas(dados: Dados | null): Persona[] {
  const mil: Persona[] = (dados?.militantes ?? []).map((m) => ({
    id: m.id, camada: 'militante', nome: m.nome, militanteId: m.id, distrito: m.distrito,
    descricao: `${(['fiscalista', 'intelectual', 'militante'] as const).map((t) => `${t[0].toUpperCase()}${t.slice(1)} ${m.trilhas[t].nivel}`).join(' · ')} — ${dados?.nucleoPorId[m.nucleo]?.nome ?? m.nucleo}`,
  }));
  return [...PERSONAS_FIXAS.filter((p) => p.camada === 'visitante'), ...mil, ...PERSONAS_FIXAS.filter((p) => p.camada !== 'visitante')];
}
export function persona(dados: Dados | null, id: string): Persona | undefined {
  return personas(dados).find((p) => p.id === id);
}
