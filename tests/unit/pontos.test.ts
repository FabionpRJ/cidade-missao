import { describe, expect, it } from 'vitest';
import { calcularPT, mFoco, ptNaSemana, semanaISO, type LancamentoPT } from '../../src/domain/points';

describe('PT = V_base × M_verificação × M_foco (doc. 2.2)', () => {
  const base = { vBase: 40, foco_temporada: false, territorio_prioritario: false, jaNaSemana: 0 };
  it('aplica cada multiplicador de verificação', () => {
    expect(calcularPT({ ...base, verificacao: 'autodeclarada_evidencia_fraca' }).bruto).toBe(20);
    expect(calcularPT({ ...base, verificacao: 'validada_por_par_ou_coordenador' }).bruto).toBe(40);
    expect(calcularPT({ ...base, verificacao: 'confirmada_por_fonte_externa' }).bruto).toBe(60);
  });
  it('aplica o foco da temporada (×1,25) e o território prioritário (×1,5)', () => {
    expect(calcularPT({ ...base, foco_temporada: true, verificacao: 'validada_por_par_ou_coordenador' }).bruto).toBe(50);
    expect(calcularPT({ ...base, territorio_prioritario: true, verificacao: 'validada_por_par_ou_coordenador' }).bruto).toBe(60);
    const c = calcularPT({ vBase: 60, foco_temporada: true, territorio_prioritario: false, jaNaSemana: 0, verificacao: 'confirmada_por_fonte_externa' });
    expect(c.bruto).toBe(112.5);
    expect(c.mFoco).toBe(1.25);
  });
  it('M_foco é um fator único: vale o maior (decisão D2)', () => {
    expect(mFoco({ foco_temporada: true, territorio_prioritario: true }).valor).toBe(1.5);
    expect(mFoco({ foco_temporada: false, territorio_prioritario: false }).valor).toBe(1);
  });
  it('respeita o teto semanal de 150 PT por trilha', () => {
    const c = calcularPT({ vBase: 120, verificacao: 'confirmada_por_fonte_externa', foco_temporada: false, territorio_prioritario: false, jaNaSemana: 0 });
    expect(c.bruto).toBe(180);
    expect(c.creditado).toBe(150);
    expect(c.naoCreditado).toBe(30);
    const d = calcularPT({ vBase: 40, verificacao: 'validada_por_par_ou_coordenador', foco_temporada: false, territorio_prioritario: false, jaNaSemana: 130 });
    expect(d.creditado).toBe(20);
    const e = calcularPT({ vBase: 40, verificacao: 'validada_por_par_ou_coordenador', foco_temporada: false, territorio_prioritario: false, jaNaSemana: 150 });
    expect(e.creditado).toBe(0);
  });
  it('soma o que já foi creditado na mesma semana ISO e na mesma trilha', () => {
    const l: LancamentoPT[] = [
      { id: '1', militante: 'M', trilha: 'fiscalista', data: '2026-10-05', creditado: 60, descricao: '' },
      { id: '2', militante: 'M', trilha: 'fiscalista', data: '2026-10-07', creditado: 40, descricao: '' },
      { id: '3', militante: 'M', trilha: 'militante', data: '2026-10-07', creditado: 99, descricao: '' },
      { id: '4', militante: 'M', trilha: 'fiscalista', data: '2026-10-04', creditado: 99, descricao: '' },
    ];
    expect(semanaISO('2026-10-05')).toBe(semanaISO('2026-10-11'));
    expect(semanaISO('2026-10-04')).not.toBe(semanaISO('2026-10-05'));
    expect(ptNaSemana(l, 'M', 'fiscalista', '2026-10-07')).toBe(100);
  });
});
