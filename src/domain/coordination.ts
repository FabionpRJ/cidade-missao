// Alertas de coordenação (doc. 7.2): seis tipos; dispensar adia 7 dias; resolvidos saem da pilha.
import type { AlertaCoordenacao, Dados, TipoAlertaCoord } from '../data/types';

export const NOME_TIPO_COORD: Record<TipoAlertaCoord, string> = {
  distrito_sem_nucleo: 'Distrito sem núcleo',
  missao_sem_voluntarios: 'Missão sem voluntários',
  sobreposicao_de_missoes: 'Sobreposição de missões',
  meta_em_risco: 'Meta em risco',
  delegacao_expirando: 'Delegação expirando',
  prova_pendente_de_banca: 'Prova pendente de banca',
};
export const ICONE_TIPO_COORD: Record<TipoAlertaCoord, string> = {
  distrito_sem_nucleo: 'home', missao_sem_voluntarios: 'users', sobreposicao_de_missoes: 'ops', meta_em_risco: 'target', delegacao_expirando: 'send', prova_pendente_de_banca: 'scale',
};

export interface CoordAtivo { a: AlertaCoordenacao; chave: string; naZona: boolean; distrito?: string; dispensado: boolean; resolvido?: { quem: string; quando: string; resultado: string } }

export function alertasCoordenacao(o: {
  dados: Dados;
  estado: Record<string, { dispensadoAte?: string; resolvido?: { quem: string; quando: string; resultado: string } }>;
  hoje: string;
  zona: string[];
  chave: (a: AlertaCoordenacao) => string;
  provasPendentes: { militante: string; trilha: string; nivel: number }[];
  missaoDistrito: (id: string) => string | undefined;
}): CoordAtivo[] {
  const base: AlertaCoordenacao[] = [...o.dados.alertas_de_coordenacao];
  for (const p of o.provasPendentes) {
    const m = o.dados.militantePorId[p.militante];
    base.push({ tipo: 'prova_pendente_de_banca', militante: p.militante, texto: `Prova de passagem pendente de banca: ${m?.nome ?? p.militante} (${p.trilha} ${p.nivel})`, acao: 'Ver banca sorteada' });
  }
  const camp = (id?: string) => o.dados.campanhas.find((c) => c.id === id);
  const lista = base.map((a): CoordAtivo => {
    const chave = o.chave(a);
    const est = o.estado[chave] ?? {};
    const distrito = a.distrito ?? (a.missao ? o.missaoDistrito(a.missao) : undefined) ?? camp(a.campanha)?.territorio[0] ??
      (a.tipo === 'delegacao_expirando' ? 'SOC' : a.militante ? o.dados.militantePorId[a.militante]?.distrito : undefined);
    const naZona = !!distrito && (o.zona.includes(distrito) || !!camp(a.campanha)?.territorio.some((t) => o.zona.includes(t)));
    return { a, chave, naZona, distrito, dispensado: !!est.dispensadoAte && est.dispensadoAte > o.hoje, resolvido: est.resolvido };
  });
  // da zona da persona primeiro (decisão D9)
  return lista.sort((x, y) => Number(y.naZona) - Number(x.naZona));
}
