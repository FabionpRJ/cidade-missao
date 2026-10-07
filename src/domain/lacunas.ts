// Índice de lacuna de cobertura (doc. 6.1): 0,4 × P_problemas + 0,3 × P_vulnerabilidade + 0,3 × (1 − P_presença).

export interface PesosLacunas { problemas: number; vulnerabilidade: number; presenca: number }
export const PESOS_PADRAO: PesosLacunas = { problemas: 0.4, vulnerabilidade: 0.3, presenca: 0.3 };

/** Percentil de cada valor no conjunto: nº de valores menores ÷ (n − 1), de 0 a 1 (decisão D1). */
export function percentis(valores: number[]): number[] {
  const n = valores.length;
  if (n < 2) return valores.map(() => 0);
  const ord = [...valores].sort((a, b) => a - b);
  // nº de menores = índice da primeira ocorrência no vetor ordenado
  const menores = (v: number) => {
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ord[m] < v) lo = m + 1; else hi = m; }
    return lo;
  };
  return valores.map((v) => menores(v) / (n - 1));
}

export function indiceLacunas(c: { pProblemas: number; pVulnerabilidade: number; pPresenca: number }, p: PesosLacunas = PESOS_PADRAO) {
  return p.problemas * c.pProblemas + p.vulnerabilidade * c.pVulnerabilidade + p.presenca * (1 - c.pPresenca);
}

export interface LacunaDistrito { valor: number; pProblemas: number; pVulnerabilidade: number; pPresenca: number }

/** Calcula percentis e índice para todos os distritos. `problemas` = alertas confirmados /mil hab. em 90 dias. */
export function calcularLacunas(
  ds: { id: string; problemas: number; vulnerabilidade: number; presenca: number }[],
  pesos: PesosLacunas = PESOS_PADRAO,
): Record<string, LacunaDistrito> {
  const pp = percentis(ds.map((d) => d.problemas));
  const pv = percentis(ds.map((d) => d.vulnerabilidade));
  const pr = percentis(ds.map((d) => d.presenca));
  const out: Record<string, LacunaDistrito> = {};
  ds.forEach((d, i) => {
    const c = { pProblemas: pp[i], pVulnerabilidade: pv[i], pPresenca: pr[i] };
    out[d.id] = { ...c, valor: indiceLacunas(c, pesos) };
  });
  return out;
}

/** Normaliza pesos para somarem 1 (mantém proporção). */
export function normalizarPesos(p: PesosLacunas): PesosLacunas {
  const s = p.problemas + p.vulnerabilidade + p.presenca;
  if (s <= 0) return { ...PESOS_PADRAO };
  return { problemas: p.problemas / s, vulnerabilidade: p.vulnerabilidade / s, presenca: p.presenca / s };
}

export function faixaLacuna(v: number) {
  return v >= 0.7 ? 'alta' : v >= 0.45 ? 'média' : 'baixa';
}
