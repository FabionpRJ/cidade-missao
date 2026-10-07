import { describe, expect, it } from 'vitest';
import { calcularLacunas, indiceLacunas, normalizarPesos, percentis, PESOS_PADRAO } from '../../src/domain/lacunas';
import { dados } from './carregar';

describe('percentis e índice de Lacunas (doc. 6.1)', () => {
  it('percentil = menores ÷ (n − 1)', () => {
    expect(percentis([10, 20, 30, 40, 50])).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(percentis([5, 5, 9])).toEqual([0, 0, 1]);
  });
  const entrada = dados.distritos.map((d) => ({ id: d.id, problemas: d.ind.zel, vulnerabilidade: d.ind.vul, presenca: d.ind.pres }));
  const calc = calcularLacunas(entrada);
  it('reproduz os percentis dos dados', () => {
    for (const d of dados.distritos) {
      expect(calc[d.id].pProblemas).toBeCloseTo(d.lacComp.p_problemas, 2);
      expect(calc[d.id].pVulnerabilidade).toBeCloseTo(d.lacComp.p_vulnerabilidade, 2);
      expect(calc[d.id].pPresenca).toBeCloseTo(d.lacComp.p_presenca, 2);
    }
  });
  it('bate com `lac` dos dados (tolerância 0,01) com os pesos 0,4 / 0,3 / 0,3', () => {
    expect(dados.distritos).toHaveLength(96);
    for (const d of dados.distritos) expect(Math.abs(calc[d.id].valor - d.ind.lac)).toBeLessThanOrEqual(0.01);
  });
  it('pesos ajustáveis recalculam o índice', () => {
    const c = { pProblemas: 1, pVulnerabilidade: 0, pPresenca: 1 };
    expect(indiceLacunas(c, PESOS_PADRAO)).toBeCloseTo(0.4);
    expect(indiceLacunas(c, { problemas: 0.6, vulnerabilidade: 0.2, presenca: 0.2 })).toBeCloseTo(0.6);
    const n = normalizarPesos({ problemas: 2, vulnerabilidade: 1, presenca: 1 });
    expect(n.problemas).toBeCloseTo(0.5);
    expect(n.problemas + n.vulnerabilidade + n.presenca).toBeCloseTo(1);
  });
});
