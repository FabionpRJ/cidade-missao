// Permissões por camada e nível (doc. 1, 6, 6.2, 7.4, 9; `camadas` dos dados).
import type { CamadaId, IndicadorId, ModoId, TrilhaId } from '../data/types';

export const ORDEM_CAMADA: Record<CamadaId, number> = { visitante: 0, militante: 1, autoridade: 2, direcao: 3 };
export const NOME_CAMADA: Record<CamadaId, string> = { visitante: 'Visitante', militante: 'Militante', autoridade: 'Autoridade', direcao: 'Direção' };

export interface NivelCtx { nivel: number; emReserva: boolean }
export interface Contexto {
  camada: CamadaId;
  /** níveis efetivos do militante (só camada Militante) */
  niveis?: Record<TrilhaId, NivelCtx>;
}
export interface Acesso { ok: boolean; motivo?: string; variante?: 'simplificada' | 'detalhada' | 'nucleo' | 'completa' }

const OK: Acesso = { ok: true };
const no = (motivo: string): Acesso => ({ ok: false, motivo });
const aPartir = (c: CamadaId) => `Disponível a partir da camada ${NOME_CAMADA[c]}`;
const temNivel = (ctx: Contexto, t: TrilhaId, n: number, ativo = true) => {
  const x = ctx.niveis?.[t];
  return !!x && x.nivel >= n && (!ativo || !x.emReserva);
};
const autoridadeOuMais = (ctx: Contexto) => ORDEM_CAMADA[ctx.camada] >= ORDEM_CAMADA.autoridade;

export function acessoModo(modo: ModoId, ctx: Contexto): Acesso {
  const { camada } = ctx;
  switch (modo) {
    case 'adm': case 'dem': case 'ren': case 'sau': case 'edu': case 'san': case 'ris':
      return OK;
    case 'zel':
      if (camada === 'visitante') return { ok: true, variante: 'simplificada' };
      if (camada === 'militante') return { ok: true, variante: temNivel(ctx, 'fiscalista', 2, false) ? 'detalhada' : 'simplificada' };
      return { ok: true, variante: 'detalhada' };
    case 'pre':
      return camada === 'visitante' ? no(aPartir('militante') + ' (modos do partido)') : OK;
    case 'ope':
      if (camada === 'visitante') return no(aPartir('militante') + ' (modos do partido)');
      return { ok: true, variante: camada === 'militante' ? 'nucleo' : 'completa' };
    case 'lac':
      if (autoridadeOuMais(ctx)) return OK;
      if (camada === 'visitante') return no(aPartir('militante') + ' com Fiscalista 4+ ou Militante 4+');
      if (temNivel(ctx, 'fiscalista', 4) || temNivel(ctx, 'militante', 4)) return OK;
      if (temNivel(ctx, 'fiscalista', 4, false) || temNivel(ctx, 'militante', 4, false))
        return no('Nível 4 alcançado, mas em reserva: recupere a Prontidão mínima (100 PT em 120 dias) para usar este poder');
      return no('Requer Fiscalista 4+ ou Militante 4+ com Prontidão ativa (ou camadas Autoridade e Direção)');
    case 'ele':
      return autoridadeOuMais(ctx) ? OK : no(aPartir('autoridade') + ' · uso de planejamento ⚖');
  }
}

/** Rotas tracejadas núcleo → missão no modo Operações (Militante 4+, doc. 3.3). */
export function acessoRotas(ctx: Contexto): Acesso {
  if (autoridadeOuMais(ctx)) return OK;
  if (ctx.camada === 'visitante') return no(aPartir('militante'));
  if (temNivel(ctx, 'militante', 4)) return OK;
  if (temNivel(ctx, 'militante', 4, false)) return no('Militante 4 em reserva: recupere a Prontidão para ver as rotas');
  return no('Rotas de porta a porta: requer Militante 4 (Organizador) com Prontidão ativa');
}

export type AbaId = 'geral' | 'dados' | 'problemas' | 'partido' | 'historico';
export function acessoAba(aba: AbaId, ctx: Contexto): Acesso {
  if (aba === 'partido' && ctx.camada === 'visitante') return no(aPartir('militante') + ': o visitante não vê dados do partido');
  if (aba === 'partido' && ctx.camada === 'militante') return { ok: true, variante: 'nucleo' };
  return OK;
}

export type RailId = 'mapa' | 'territorio' | 'nucleo' | 'missoes' | 'ficha' | 'alertas' | 'ledger' | 'decisoes' | 'delegacoes' | 'relatorios' | 'config';
export function acessoRail(item: RailId, ctx: Contexto): Acesso {
  const c = ctx.camada;
  if (['nucleo', 'missoes', 'ficha', 'relatorios'].includes(item) && c === 'visitante') return no(aPartir('militante'));
  if (['decisoes', 'delegacoes'].includes(item) && ORDEM_CAMADA[c] < ORDEM_CAMADA.autoridade) return no(aPartir('autoridade'));
  return OK;
}

export const veFichas = (ctx: Contexto) => ctx.camada !== 'visitante';
export const recebeAlertasCoordenacao = (ctx: Contexto) => autoridadeOuMais(ctx);
export function acessoPesos(ctx: Contexto): Acesso {
  return ctx.camada === 'direcao' ? OK : no('Somente a direção municipal ajusta os pesos do índice de Lacunas');
}
export function acessoDecisao(camadaMinima: CamadaId, ctx: Contexto): Acesso {
  return ORDEM_CAMADA[ctx.camada] >= ORDEM_CAMADA[camadaMinima] ? OK : no(aPartir(camadaMinima));
}

/** Indicadores do partido (nunca para visitantes). */
export const IND_PARTIDO: (IndicadorId | 'militantes' | 'nucleos' | 'filiacoes_mes')[] = ['pres', 'ops', 'prontidao_media', 'militantes', 'nucleos', 'filiacoes_mes', 'lac'];

/** Uma coluna/indicador pode aparecer na tabela (e no CSV) para este contexto? */
export function acessoIndicador(id: string, ctx: Contexto): Acesso {
  if (id === 'lac' || id.startsWith('p_')) return acessoModo('lac', ctx);
  if (id === 'comp' || id === 'eleit' || id === 'locais') return acessoModo('ele', ctx);
  if ((IND_PARTIDO as string[]).includes(id)) return ctx.camada === 'visitante' ? no(aPartir('militante')) : OK;
  return OK;
}

/** Colunas exportáveis: respeita permissões e não combina eleitoral com dados de militância (doc. 6.2 ⚖). */
export function colunasPermitidas(cols: string[], ctx: Contexto): string[] {
  const ok = cols.filter((c) => acessoIndicador(c, ctx).ok);
  if (ok.some((c) => c === 'comp' || c === 'eleit')) return ok.filter((c) => !(IND_PARTIDO as string[]).includes(c));
  return ok;
}

/** Validador (decisão D7): outra pessoa, de outro núcleo, Fiscalista 3+ ou nível 3+ na trilha da entrega, sem reserva. */
export function podeValidar(
  validador: { id: string; nucleo: string; niveis: Record<TrilhaId, NivelCtx> },
  entrega: { trilha: TrilhaId; militante: string; nucleoAutor: string },
): Acesso {
  if (validador.id === entrega.militante) return no('Ninguém valida a própria entrega');
  if (validador.nucleo === entrega.nucleoAutor) return no('O validador precisa ser de outro núcleo (anti-exploit, doc. 4.6)');
  const ctx: Contexto = { camada: 'militante', niveis: validador.niveis };
  if (temNivel(ctx, 'fiscalista', 3) || temNivel(ctx, entrega.trilha, 3)) return OK;
  if (temNivel(ctx, 'fiscalista', 3, false) || temNivel(ctx, entrega.trilha, 3, false)) return no('Nível 3 em reserva: o poder de validar exige Prontidão ativa');
  return no('Requer Fiscalista 3+ ou nível 3+ na trilha da entrega');
}
