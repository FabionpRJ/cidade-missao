import { describe, expect, it } from 'vitest';
import { emReserva, estadoTrilha, nivelPorCarreira, pontosProntidao, prontidaoDeLancamentos, proximaPassagem, titulo, titulosHibridos } from '../../src/domain/levels';
import type { LancamentoPT } from '../../src/domain/points';
import { dados } from './carregar';

describe('nível a partir da Carreira (doc. 2.3)', () => {
  it('usa a Carreira mínima de cada nível', () => {
    expect(nivelPorCarreira(0)).toBe(1);
    expect(nivelPorCarreira(99)).toBe(1);
    expect(nivelPorCarreira(100)).toBe(2);
    expect(nivelPorCarreira(349)).toBe(2);
    expect(nivelPorCarreira(350)).toBe(3);
    expect(nivelPorCarreira(900)).toBe(4);
    expect(nivelPorCarreira(1999)).toBe(4);
    expect(nivelPorCarreira(2000)).toBe(5);
    expect(nivelPorCarreira(4000)).toBe(6);
    expect(nivelPorCarreira(99999)).toBe(6);
  });
  it('a próxima passagem diz se a Carreira já alcançou e se exige prova (níveis 4 a 6)', () => {
    const t = dados.trilhas.intelectual;
    const p = proximaPassagem(t, 2, 390, null)!;
    expect(p.nivel).toBe(3); expect(p.prontaCarreira).toBe(true); expect(p.exigeProva).toBe(false);
    const q = proximaPassagem(dados.trilhas.fiscalista, 4, 1180, 'contas_publicas')!;
    expect(q.nivel).toBe(5); expect(q.faltaCarreira).toBe(820); expect(q.exigeProva).toBe(true); expect(q.titulo).toBe('Auditor(a)');
    expect(proximaPassagem(t, 6, 5000, 'comunicacao')).toBeNull();
  });
  it('os níveis dos dados nunca passam do nível permitido pela Carreira', () => {
    for (const m of dados.militantes) for (const tr of Object.values(m.trilhas)) expect(tr.nivel).toBeLessThanOrEqual(nivelPorCarreira(tr.carreira));
  });
});

describe('Prontidão (120 dias) e "em reserva" (doc. 2.1)', () => {
  it('conta só os PT dos últimos 120 dias', () => {
    const l: LancamentoPT[] = [
      { id: 'a', militante: 'M', trilha: 'fiscalista', data: '2026-10-01', creditado: 60, descricao: '' },
      { id: 'b', militante: 'M', trilha: 'fiscalista', data: '2026-06-10', creditado: 50, descricao: '' }, // 119 dias antes
      { id: 'c', militante: 'M', trilha: 'fiscalista', data: '2026-06-09', creditado: 70, descricao: '' }, // 120 dias: fora
      { id: 'd', militante: 'M', trilha: 'militante', data: '2026-10-01', creditado: 99, descricao: '' },
    ];
    expect(prontidaoDeLancamentos(l, 'M', 'fiscalista', '2026-10-07')).toBe(110);
  });
  it('fica em reserva abaixo do mínimo do nível, e sai ao recuperar a Prontidão', () => {
    expect(emReserva(48, 3)).toBe(true);
    expect(emReserva(50, 3)).toBe(false);
    expect(emReserva(99, 4)).toBe(true);
    expect(emReserva(0, 1)).toBe(false);
  });
  it('bate com o campo em_reserva de todos os militantes dos dados', () => {
    for (const m of dados.militantes) for (const tr of Object.values(m.trilhas)) expect(emReserva(tr.prontidao_120d, tr.nivel)).toBe(tr.em_reserva);
  });
  it('Marina: Militante 3 em reserva com 48 PT; volta ao ativo com +2 PT', () => {
    const marina = dados.militantePorId['MIL-0001'];
    const base = { trilhaId: 'militante' as const, trilha: dados.trilhas.militante, base: marina.trilhas.militante };
    expect(estadoTrilha({ ...base, ptExtra: 0, prontidaoExtra: 0 }).emReserva).toBe(true);
    expect(estadoTrilha({ ...base, ptExtra: 2, prontidaoExtra: 2 }).emReserva).toBe(false);
  });
  it('Prontidão em 4 pontos', () => {
    expect(pontosProntidao(112, 4)).toBe(3);
    expect(pontosProntidao(48, 3)).toBe(2);
    expect(pontosProntidao(0, 2)).toBe(0);
    expect(pontosProntidao(1000, 2)).toBe(4);
  });
});

describe('títulos (doc. 3) e títulos híbridos (doc. 4.2)', () => {
  it('título por nível e, no nível 6, o título do ramo', () => {
    expect(titulo(dados.trilhas.fiscalista, 4, 'contas_publicas')).toBe('Fiscal-chefe');
    expect(titulo(dados.trilhas.fiscalista, 6, 'zeladoria')).toBe('Guardião(ã) do Bairro');
    expect(titulo(dados.trilhas.fiscalista, 6, 'contas_publicas')).toBe('Auditor(a) Popular');
    expect(titulo(dados.trilhas.fiscalista, 6, 'legislativo')).toBe('Sentinela da Câmara');
    expect(titulo(dados.trilhas.intelectual, 6, 'formulacao')).toBe('Conselheiro(a) de Políticas');
    expect(titulo(dados.trilhas.intelectual, 6, 'comunicacao')).toBe('Redator(a)-chefe');
    expect(titulo(dados.trilhas.intelectual, 6, 'debate_formacao')).toBe('Mestre(a) Formador(a)');
    expect(titulo(dados.trilhas.militante, 6, 'rua')).toBe('Liderança de Rua');
    expect(titulo(dados.trilhas.militante, 6, 'organizacao')).toBe('Organizador(a)-geral');
    expect(titulo(dados.trilhas.militante, 6, 'mobilizacao')).toBe('Mobilizador(a)-geral');
    expect(titulo(dados.trilhas.militante, 1, null)).toBe('Apoiador(a)');
  });
  it('bate com os títulos dos dados até o nível 5', () => {
    for (const m of dados.militantes) for (const [t, tr] of Object.entries(m.trilhas)) if (tr.nivel < 6)
      expect(titulo(dados.trilhas[t as 'fiscalista'], tr.nivel, tr.ramo)).toBe(tr.titulo);
  });
  it('títulos híbridos alcançados e a caminho', () => {
    const h = (f: number, i: number, m: number) => Object.fromEntries(titulosHibridos({ fiscalista: f, intelectual: i, militante: m }).map((x) => [x.titulo, x]));
    const a = h(4, 4, 2);
    expect(a['Auditor(a) Cívico(a)'].alcancado).toBe(true);
    expect(a['Liderança Territorial'].alcancado).toBe(false);
    expect(a['Liderança Territorial'].aCaminho).toBe(true);
    expect(a['Quadro Completo'].aCaminho).toBe(true);
    expect(a['Referência do Partido'].aCaminho).toBe(false);
    const b = h(4, 4, 4);
    expect(['Auditor(a) Cívico(a)', 'Liderança Territorial', 'Quadro Orgânico', 'Quadro Completo'].every((t) => b[t].alcancado)).toBe(true);
    expect(h(6, 6, 6)['Referência do Partido'].alcancado).toBe(true);
    expect(h(1, 1, 1)['Liderança Territorial'].aCaminho).toBe(false);
    expect(h(4, 2, 3)['Liderança Territorial'].falta).toEqual(['Militante 3 → 4']);
  });
});
