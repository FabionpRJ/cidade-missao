import { describe, expect, it } from 'vitest';
import { IDEIAS_CIDADANIA, ideiaDaMissao } from '../../src/content/missoesCidadania';
import { dados } from './carregar';

describe('missões de cidadania', () => {
  const novas = dados.missoes.filter((m) => m.origem === 'missão de cidadania');

  it('gera 3 missões por ideia, com ids únicos', () => {
    expect(novas.length).toBe(IDEIAS_CIDADANIA.length * 3);
    expect(new Set(dados.missoes.map((m) => m.id)).size).toBe(dados.missoes.length);
  });

  it('cada missão é coerente com trilha, ramo, núcleo e vagas', () => {
    for (const m of novas) {
      if (m.ramo) expect(dados.trilhas[m.trilha].ramos[m.ramo]).toBeDefined();
      expect(dados.nucleoPorId[m.nucleo!].distrito).toBe(m.distrito);
      expect(m.inscritos).toBeLessThan(m.vagas);
      expect(ideiaDaMissao(m)?.cidadania).toBeTruthy();
    }
  });

  it('as 3 missões de uma ideia ficam em distritos diferentes', () => {
    for (const i of IDEIAS_CIDADANIA) expect(new Set(novas.filter((m) => m.titulo === i.titulo).map((m) => m.distrito)).size).toBe(3);
  });

  it('cada ramo de cada trilha ganhou ao menos 4 ideias, todas no catálogo de ações', () => {
    for (const [tid, t] of Object.entries(dados.trilhas)) for (const r of Object.keys(t.ramos))
      expect(IDEIAS_CIDADANIA.filter((i) => i.trilha === tid && i.ramo === r).length).toBeGreaterThanOrEqual(4);
    for (const i of IDEIAS_CIDADANIA) expect(dados.trilhas[i.trilha].acoes.some((a) => a[0] === i.titulo)).toBe(true);
  });
});
