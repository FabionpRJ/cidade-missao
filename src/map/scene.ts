// Constrói a cena do mapa (cores e marcadores) a partir do estado. Função pura, usada pelos dois motores,
// pelo minimapa, pela legenda e pelo Ledger.
import type { Dados, LngLat, Missao, ModoId } from '../data/types';
import { MODO, fmt, mesCurto } from '../data/indicators';
import type { AlertaEf, IndEf } from '../state/derived';
import { ICONE_CATEGORIA, ICONE_POI, NOME_CATEGORIA } from '../ui/icons';
import { classeDivergente, corAdm, corPorValor, DIVERGENTE, RAMPAS } from './choropleth';
import type { Mark, NivelZoom, Route, Scene } from './MapEngine';
import { COR_TRILHA } from './markers';

export interface Escala {
  tipo: 'cat' | 'seq' | 'div';
  rampa: string[];
  dominio: [number, number];
  unidade: string;
  fonte: string;
  valores: Record<string, number | null>;
  cores: Record<string, string>;
  /** nota de tempo: "série mensal indisponível", "comparando com …" */
  nota?: string;
  mensal: boolean;
  fmtV: (v: number) => string;
}

const SIGLA = { fiscalista: 'fis', intelectual: 'int', militante: 'mil' } as const;

export function escalaModo(dados: Dados, ind: Record<string, IndEf>, modo: ModoId, mes: number, comparar: number | null): Escala {
  const m = MODO[modo];
  const ids = dados.distritos.map((d) => d.id);
  if (m.categorico) {
    const idx = Object.fromEntries(dados.subprefeituras.map((s, i) => [s.nome, i]));
    return {
      tipo: 'cat', rampa: RAMPAS.adm, dominio: [0, 1], unidade: 'subprefeituras e distritos', fonte: 'GeoSampa (limites) · 2024 [verificar ano] · distrito',
      valores: Object.fromEntries(ids.map((id) => [id, null])),
      cores: Object.fromEntries(dados.distritos.map((d) => [d.id, corAdm(idx[d.sub] ?? 0)])), mensal: false, fmtV: (v) => fmt(v),
    };
  }
  const meta = dados.indicadores[m.indicador!];
  const fonte = `${meta.fonte} · ${meta.ano} · ${meta.nivel}`;
  const fmtV = (v: number) => `${m.prefixo ?? ''}${fmt(v, m.dec)}${m.sufixo ?? ''}`;
  const serieKey = m.serieMensal;
  const atual = mes >= 11;
  // valor de um distrito no mês i (null se não há série mensal)
  const valorMes = (id: string, i: number): number => {
    const d = dados.distritoPorId[id];
    if (!serieKey || i >= 11) return (ind[id] as unknown as Record<string, number>)[m.indicador!];
    return d.serie[serieKey][i];
  };
  // Zeladoria fora do mês atual usa a série mensal com unidade própria (decisão D8)
  const zelMensal = modo === 'zel' && !atual;
  let dominio = meta.dominio ?? [0, 1];
  let unidade = meta.unidade;
  if (zelMensal) {
    const mx = Math.max(...dados.distritos.flatMap((d) => d.serie.zel_mes));
    dominio = [0, Math.ceil(mx * 10) / 10];
    unidade = 'alertas confirmados /mil hab. no mês (série mensal)';
  }
  const rampa = RAMPAS[m.familia];
  if (comparar !== null && serieKey && comparar !== mes) {
    // compara a série mensal com ela mesma (mesma unidade nos dois meses)
    const sv = (id: string, i: number) => dados.distritoPorId[id].serie[serieKey][i];
    const diffs: Record<string, number | null> = {};
    for (const id of ids) diffs[id] = Math.round((sv(id, mes) - sv(id, comparar)) * 1000) / 1000;
    const lim = Math.max(...Object.values(diffs).map((v) => Math.abs(v ?? 0))) || 1;
    const meses = dados.meta.meses;
    return {
      tipo: 'div', rampa: DIVERGENTE, dominio: [-lim, lim],
      unidade: `diferença ${mesCurto(meses[mes])} − ${mesCurto(meses[comparar])} (${serieKey === 'zel_mes' ? 'alertas confirmados /mil hab. no mês' : meta.unidade})`,
      fonte, valores: diffs,
      cores: Object.fromEntries(ids.map((id) => [id, DIVERGENTE[classeDivergente(diffs[id] ?? 0, lim)]])),
      nota: `comparando com ${mesCurto(meses[comparar])}`, mensal: true, fmtV: (v) => (v > 0 ? '+' : '') + fmt(v, Math.max(1, m.dec)),
    };
  }
  const valores = Object.fromEntries(ids.map((id) => [id, zelMensal ? dados.distritoPorId[id].serie.zel_mes[mes] : valorMes(id, mes)]));
  return {
    tipo: 'seq', rampa, dominio, unidade, fonte, valores,
    cores: Object.fromEntries(ids.map((id) => [id, corPorValor(valores[id] as number, dominio, rampa)])),
    nota: !serieKey && !atual ? `dado de ${meta.ano} · série mensal indisponível` : undefined,
    mensal: !!serieKey, fmtV: zelMensal ? (v) => fmt(v, 2) : fmtV,
  };
}

export interface EntradaCena {
  dados: Dados;
  escala: Escala;
  ind: Record<string, IndEf>;
  alertas: AlertaEf[];
  missoes: Missao[];
  modo: ModoId;
  rotas: boolean;
  varianteOpe?: 'nucleo' | 'completa';
  zelDetalhada: boolean;
  nucleoProprio?: string;
  sel: string | null;
  selB: string | null;
  hover: string | null;
  destaque: string[];
  esmaecer: boolean;
  economia: boolean;
  coordPorDistrito: Record<string, number>;
  escolhido?: LngLat | null;
  me?: LngLat | null;
  minhasMissoes: Set<string>;
  partidoVisivel: boolean;
}

const TODOS: NivelZoom[] = ['far', 'mid', 'near'];
const MEIO_PERTO: NivelZoom[] = ['mid', 'near'];

export function construirCena(e: EntradaCena): Scene {
  const { dados, modo } = e;
  const marks: Mark[] = [];
  const routes: Route[] = [];
  const rot = (id: string) => dados.distritoPorId[id]?.rotulo;
  const off = (id: string, dx: number, dy: number): { lng: number; lat: number } => { const r = rot(id); return { lng: r.lng + dx, lat: r.lat + dy }; };

  // contadores onde há alerta de coordenação (longe)
  for (const [id, n] of Object.entries(e.coordPorDistrito)) if (n > 0 && rot(id)) marks.push({ t: 'count', n, warn: true, ...off(id, 0.004, -0.004), niveis: ['far'], titulo: `${n} alerta(s) de coordenação` });

  // pontos de interesse por modo (posição fictícia)
  const poi = MODO[modo].poi;
  if (poi) for (const p of dados.pontos_de_interesse) if (p.tipo === poi) marks.push({ t: 'poi', icon: ICONE_POI[p.tipo], lng: p.lng, lat: p.lat, niveis: MEIO_PERTO, titulo: `${p.nome} · posição fictícia` });

  if (modo === 'adm') {
    marks.push({ t: 'star', lng: -46.6367, lat: -23.5469, niveis: TODOS, titulo: 'Prefeitura (posição aproximada)' });
    marks.push({ t: 'poi', icon: 'scale', lng: -46.6395, lat: -23.5528, niveis: MEIO_PERTO, titulo: 'Câmara Municipal (posição aproximada)' });
    for (const s of dados.subprefeituras) marks.push({ t: 'poi', icon: 'building', lng: s.rotulo.lng + 0.006, lat: s.rotulo.lat - 0.005, niveis: MEIO_PERTO, titulo: `Subprefeitura ${s.nome} (posição fictícia)` });
  }

  if (modo === 'zel' || modo === 'san' || modo === 'ris') {
    const cats = modo === 'san' ? ['boca_de_lobo', 'alagamento'] : modo === 'ris' ? ['alagamento'] : null;
    const abertos = e.alertas.filter((a) => a.status !== 'resolvido' && (!cats || cats.includes(a.categoria)));
    const porDist: Record<string, number> = {};
    for (const a of abertos) porDist[a.distrito] = (porDist[a.distrito] ?? 0) + 1;
    // perto: individuais no distrito selecionado e agrupados nos vizinhos (pacote A §4)
    for (const [id, n] of Object.entries(porDist)) if (rot(id)) marks.push({ t: 'cluster', n, ...off(id, 0, 0.004), niveis: e.sel && id !== e.sel ? ['mid', 'near'] : ['mid'], id, titulo: `${n} alertas abertos (amostra no mapa)` });
    for (const a of abertos) {
      if (e.sel && a.distrito !== e.sel && !a.criadoNoApp) continue;
      const fresh = a.status === 'novo' || (a.criadoNoApp && a.recente);
      marks.push({
        t: 'alert', c: ICONE_CATEGORIA[a.categoria], fresh, caso: e.zelDetalhada && a.status === 'caso_coletivo', lng: a.lng, lat: a.lat,
        niveis: a.criadoNoApp ? TODOS : ['near'], id: a.id, titulo: `${NOME_CATEGORIA[a.categoria]} · ${a.status.replace('_', ' ')} · ${a.confirmTotal} confirmações`,
      });
    }
  }

  if (e.partidoVisivel && modo === 'pre') {
    const sedePorSub: Record<string, { lng: number; lat: number; n: number; nome: string }> = {};
    for (const n of dados.nucleos) {
      const tr = (['fis', 'int', 'mil'] as const)[Number(n.id.slice(-1)) % 3];
      marks.push({ t: 'nucleo', tr, n: n.militantes_ativos, nivel: n.nivel, mine: n.id === e.nucleoProprio, lng: n.lng, lat: n.lat, niveis: MEIO_PERTO, small: n.id !== e.nucleoProprio && n.distrito !== e.sel, id: n.id, titulo: `${n.nome} · ${n.nivel} · ${n.militantes_ativos} ativos` });
      const sub = dados.distritoPorId[n.distrito]?.sub;
      if (sub && (!sedePorSub[sub] || n.militantes_ativos > sedePorSub[sub].n)) sedePorSub[sub] = { lng: n.lng, lat: n.lat, n: n.militantes_ativos, nome: n.nome };
    }
    const ativasPorDist: Record<string, number> = {};
    for (const m of e.missoes) if (m.status !== 'unificada' && m.status !== 'concluida') ativasPorDist[m.distrito] = (ativasPorDist[m.distrito] ?? 0) + 1;
    for (const [id, n] of Object.entries(ativasPorDist)) if (rot(id)) marks.push({ t: 'count', n, big: id === e.sel, ...off(id, 0.006, 0.006), niveis: ['mid'], titulo: `${n} missões ativas` });
    for (const [sub, s] of Object.entries(sedePorSub)) marks.push({ t: 'star', lng: s.lng + 0.004, lat: s.lat + 0.003, niveis: MEIO_PERTO, titulo: `Sede regional ${sub} (fictícia), junto ao ${s.nome}` });
  }

  if (e.partidoVisivel && modo === 'ope') {
    const doNucleo = e.varianteOpe === 'nucleo';
    const ativas = e.missoes.filter((m) => m.status !== 'unificada' && m.status !== 'concluida' && (!doNucleo || m.nucleo === e.nucleoProprio || e.minhasMissoes.has(m.id)));
    const porDist: Record<string, number> = {};
    for (const m of ativas) porDist[m.distrito] = (porDist[m.distrito] ?? 0) + 1;
    for (const [id, n] of Object.entries(porDist)) if (rot(id)) marks.push({ t: 'count', n, big: id === e.sel, ...off(id, 0.005, 0.005), niveis: ['mid'], titulo: `${n} missões ativas` });
    for (const m of ativas) {
      marks.push({ t: 'mission', tr: SIGLA[m.trilha], warn: m.inscritos === 0 && m.status === 'aberta', mine: e.minhasMissoes.has(m.id), lng: m.lng, lat: m.lat, niveis: e.minhasMissoes.has(m.id) || m.distrito === e.sel ? MEIO_PERTO : ['near'], id: m.id, titulo: `${m.titulo} · ${m.inscritos}/${m.vagas} vagas · prazo ${m.prazo}` });
    }
    // núcleos de origem das rotas (distrito selecionado e o próprio núcleo)
    for (const n of dados.nucleos) {
      if (n.distrito !== e.sel && n.id !== e.nucleoProprio) continue;
      const tr = (['fis', 'int', 'mil'] as const)[Number(n.id.slice(-1)) % 3];
      marks.push({ t: 'nucleo', tr, n: n.militantes_ativos, nivel: n.nivel, mine: n.id === e.nucleoProprio, small: true, lng: n.lng, lat: n.lat, niveis: MEIO_PERTO, id: n.id, titulo: `${n.nome} · ${n.nivel}` });
    }
    if (e.rotas) {
      for (const m of ativas) {
        const n = m.nucleo ? dados.nucleoPorId[m.nucleo] : null;
        if (!n || !(m.distrito === e.sel || m.nucleo === e.nucleoProprio)) continue;
        routes.push({ a: [n.lng, n.lat], b: [m.lng, m.lat], cor: COR_TRILHA[SIGLA[m.trilha]] });
      }
    }
    for (const c of dados.campanhas) {
      const id = c.territorio[0];
      if (rot(id)) marks.push({ t: 'campanha', foco: c.foco_temporada, ...off(id, -0.006, -0.002), niveis: TODOS, id: c.id, titulo: `Campanha: ${c.nome} (${Math.round(c.progresso * 100)}%)` });
    }
  }

  if (modo === 'lac') {
    const top = [...dados.distritos].sort((a, b) => e.ind[b.id].lac - e.ind[a.id].lac).slice(0, 10);
    top.forEach((d, i) => marks.push({ t: 'prio', n: i + 1, ...off(d.id, 0, 0.006), niveis: ['far', 'mid'], id: d.id, titulo: `${d.nome}: prioridade ${i + 1} de 96 (índice ${fmt(e.ind[d.id].lac, 2)})` }));
  }

  if (e.me) marks.push({ t: 'me', lng: e.me[0], lat: e.me[1], niveis: MEIO_PERTO });
  if (e.escolhido) marks.push({ t: 'pick', lng: e.escolhido[0], lat: e.escolhido[1], niveis: TODOS });

  return {
    cores: e.escala.cores, sel: e.sel, selB: e.selB, hover: e.hover, destaque: e.destaque, esmaecer: e.esmaecer,
    marks, routes, economia: e.economia, modo,
  };
}
