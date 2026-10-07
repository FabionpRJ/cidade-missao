import { describe, expect, it } from 'vitest';
import { classe, classeDivergente, corPorValor, limitesClasses, luminanciaL, RAMPAS } from '../../src/map/choropleth';
import { MODOS } from '../../src/data/indicators';
import { dados } from './carregar';

describe('classes de cor por domínio (7 classes, intervalos iguais)', () => {
  it('divide o domínio em 7 intervalos iguais', () => {
    expect(limitesClasses([0, 7])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(classe(0, [0, 7])).toBe(0);
    expect(classe(0.99, [0, 7])).toBe(0);
    expect(classe(1, [0, 7])).toBe(1);
    expect(classe(6.5, [0, 7])).toBe(6);
    expect(classe(7, [0, 7])).toBe(6);
    expect(classe(-5, [0, 7])).toBe(0);
    expect(classe(99, [0, 7])).toBe(6);
  });
  it('usa o domínio de cada indicador (Zeladoria 1–10, Presença 0,3–3)', () => {
    expect(classe(5.72, dados.indicadores.zel.dominio!)).toBe(3);
    expect(classe(0.3, dados.indicadores.pres.dominio!)).toBe(0);
    expect(classe(3, dados.indicadores.pres.dominio!)).toBe(6);
    expect(corPorValor(0.95, [0, 1], RAMPAS.prioridade)).toBe('#C2AEDF');
  });
  it('todo modo não categórico tem domínio nos dados', () => {
    for (const m of MODOS) if (!m.categorico) expect(dados.indicadores[m.indicador!].dominio).toBeDefined();
  });
  it('rampas com luminosidade crescente (L* monotônico)', () => {
    for (const k of ['territorio', 'servicos', 'problemas', 'partido', 'prioridade'] as const) {
      const L = RAMPAS[k].map(luminanciaL);
      for (let i = 1; i < L.length; i++) expect(L[i]).toBeGreaterThan(L[i - 1]);
    }
  });
  it('rampa divergente simétrica', () => {
    expect(classeDivergente(0, 10)).toBe(3);
    expect(classeDivergente(10, 10)).toBe(6);
    expect(classeDivergente(-10, 10)).toBe(0);
  });
});
