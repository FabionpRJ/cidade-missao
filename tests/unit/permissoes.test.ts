import { describe, expect, it } from 'vitest';
import { acessoAba, acessoModo, acessoPesos, acessoRotas, colunasPermitidas, podeValidar, type Contexto } from '../../src/domain/permissions';
import type { ModoId } from '../../src/data/types';

const niv = (f: number, i: number, m: number, reserva: Partial<Record<'fiscalista' | 'intelectual' | 'militante', boolean>> = {}) => ({
  fiscalista: { nivel: f, emReserva: !!reserva.fiscalista }, intelectual: { nivel: i, emReserva: !!reserva.intelectual }, militante: { nivel: m, emReserva: !!reserva.militante },
});
const TODOS: ModoId[] = ['adm', 'dem', 'ren', 'sau', 'edu', 'san', 'ris', 'zel', 'pre', 'ope', 'lac', 'ele'];
const vis: Contexto = { camada: 'visitante' };
const marina: Contexto = { camada: 'militante', niveis: niv(4, 2, 3, { militante: true }) };
const luana: Contexto = { camada: 'militante', niveis: niv(1, 2, 1) };
const aut: Contexto = { camada: 'autoridade' };
const dir: Contexto = { camada: 'direcao' };

describe('permissões de modo por camada e nível (doc. 6, 6.2, 7.4)', () => {
  it('visitante: Território, Serviços e Zeladoria simplificada; nunca modos do partido', () => {
    const ok = TODOS.filter((m) => acessoModo(m, vis).ok);
    expect(ok).toEqual(['adm', 'dem', 'ren', 'sau', 'edu', 'san', 'ris', 'zel']);
    expect(acessoModo('zel', vis).variante).toBe('simplificada');
  });
  it('militante com Fiscalista 4 vê Lacunas; nível 1 vê bloqueio com o requisito', () => {
    expect(acessoModo('lac', marina).ok).toBe(true);
    const l = acessoModo('lac', luana);
    expect(l.ok).toBe(false);
    expect(l.motivo).toMatch(/Fiscalista 4\+ ou Militante 4\+/);
    expect(acessoModo('ele', marina).ok).toBe(false);
    expect(acessoModo('pre', luana).ok).toBe(true);
    expect(acessoModo('ope', luana).variante).toBe('nucleo');
  });
  it('Lacunas exige Prontidão ativa no nível 4', () => {
    expect(acessoModo('lac', { camada: 'militante', niveis: niv(4, 1, 1, { fiscalista: true }) }).ok).toBe(false);
    expect(acessoModo('lac', { camada: 'militante', niveis: niv(1, 1, 4) }).ok).toBe(true);
  });
  it('rotas de Operações só a partir de Militante 4', () => {
    expect(acessoRotas(marina).ok).toBe(false);
    expect(acessoRotas(luana).ok).toBe(false);
    expect(acessoRotas({ camada: 'militante', niveis: niv(1, 1, 4) }).ok).toBe(true);
    expect(acessoRotas(aut).ok).toBe(true);
  });
  it('Zeladoria detalhada a partir de Fiscalista 2', () => {
    expect(acessoModo('zel', marina).variante).toBe('detalhada');
    expect(acessoModo('zel', luana).variante).toBe('simplificada');
  });
  it('Autoridade e Direção veem todos os modos, inclusive Eleitoral agregado', () => {
    expect(TODOS.every((m) => acessoModo(m, aut).ok && acessoModo(m, dir).ok)).toBe(true);
  });
  it('aba Partido bloqueada para visitante; pesos de Lacunas só para a Direção', () => {
    expect(acessoAba('partido', vis).ok).toBe(false);
    expect(acessoAba('dados', vis).ok).toBe(true);
    expect(acessoPesos(aut).ok).toBe(false);
    expect(acessoPesos(aut).motivo).toMatch(/direção municipal/);
    expect(acessoPesos(dir).ok).toBe(true);
  });
  it('exportação respeita a camada e não combina eleitoral com militância', () => {
    const cols = ['nome', 'pop', 'zel', 'pres', 'militantes', 'lac', 'comp'];
    expect(colunasPermitidas(cols, vis)).toEqual(['nome', 'pop', 'zel']);
    expect(colunasPermitidas(cols, marina)).toEqual(['nome', 'pop', 'zel', 'pres', 'militantes', 'lac']);
    expect(colunasPermitidas(cols, aut)).toEqual(['nome', 'pop', 'zel', 'comp']);
  });
  it('validador: outro núcleo, Fiscalista 3+ ou nível 3+ na trilha', () => {
    const e = { trilha: 'fiscalista' as const, militante: 'MIL-0001', nucleoAutor: 'NUC-CRE-1' };
    expect(podeValidar({ id: 'MIL-0013', nucleo: 'NUC-TUC-2', niveis: niv(5, 1, 4) }, e).ok).toBe(true);
    expect(podeValidar({ id: 'X', nucleo: 'NUC-CRE-1', niveis: niv(5, 1, 4) }, e).ok).toBe(false);
    expect(podeValidar({ id: 'MIL-0001', nucleo: 'NUC-CRE-1', niveis: niv(5, 1, 4) }, e).ok).toBe(false);
    expect(podeValidar({ id: 'Y', nucleo: 'NUC-X', niveis: niv(2, 2, 2) }, e).ok).toBe(false);
  });
});
