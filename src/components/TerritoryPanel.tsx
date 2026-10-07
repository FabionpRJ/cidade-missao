// Painel do território (doc. 7.2, 7.3, 8.2): abas Geral, Dados, Problemas, Partido, Histórico.
// A fonte de cada número aparece junto do número; a lista completa de fontes fica no fim da aba Dados. Fixável para comparar dois distritos.
import { useMemo, useState, type ReactNode } from 'react';
import { HOJE, IND_OFICIAIS, MODO, desatualizado, fmt, fmtData, fmtIndicador, linhaFonte, mesCurto } from '../data/indicators';
import type { IndicadorId } from '../data/types';
import { percentis } from '../domain/lacunas';
import { acessoAba, acessoModo, type AbaId } from '../domain/permissions';
import { confirmarAlerta, selecionar } from '../state/actions';
import { useAlertas, useContexto, useDados, useEntregas, useIndicadores, useMissoes, usePersona, type IndEf } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { fmtQuando, st, useStore } from '../state/store';
import { Fict, Locked, Ramp, Spark, Src } from '../ui/common';
import { DrawerHead } from '../ui/DrawerHead';
import { ICONE_CATEGORIA, ICONE_NUCLEO, NOME_CATEGORIA, Icon } from '../ui/icons';
import { useEscala } from './Legend';
import { Term, Tip } from './NestedTooltip';
import type { TipConteudo } from './tipStore';

const ABAS: { id: AbaId; nome: string }[] = [
  { id: 'geral', nome: 'Geral' }, { id: 'dados', nome: 'Dados' }, { id: 'problemas', nome: 'Problemas' }, { id: 'partido', nome: 'Partido' }, { id: 'historico', nome: 'Histórico' },
];

/** Número com tooltip de fonte · ano · nível. */
export function useNumTip() {
  const dados = useDados();
  return (id: IndicadorId, v: number, extra?: Partial<Extract<TipConteudo, { tipo: 'numero' }>>): Extract<TipConteudo, { tipo: 'numero' }> => {
    const m = dados.indicadores[id];
    return {
      tipo: 'numero', titulo: m.nome, valor: fmtIndicador(id, v), unidade: m.unidade, fonte: m.fonte, ano: m.ano, nivel: m.nivel, app: m.dado_do_app, desatualizado: desatualizado(m),
      formula: m.formula, medias: m.media_municipal !== undefined ? { mun: fmtIndicador(id, m.media_municipal), est: m.media_estadual !== undefined ? fmtIndicador(id, m.media_estadual) : undefined, nac: m.media_nacional !== undefined ? fmtIndicador(id, m.media_nacional) : undefined } : undefined,
      termo: id === 'vul' ? 'ipvs' : id === 'zel' ? 'zeladoria' : id === 'pres' ? 'presenca' : id === 'lac' ? 'lacunas' : undefined,
      ...extra,
    };
  };
}

function composicao(cod: string) {
  const c = Number(cod);
  const fis = 28 + ((c * 7) % 15), int = 18 + ((c * 11) % 13);
  return { fis, int, mil: 100 - fis - int };
}

function Kpi({ i, l, v, u, tip, delta, lock }: { i: string; l: string; v: string; u: string; tip?: TipConteudo; delta?: ReactNode; lock?: string }) {
  if (lock) return <div className="kpi is-lock"><Icon n="lock" s={22} /><div><b>—</b><small>{lock}</small></div><span className="kpi-l">{l}</span></div>;
  return (
    <div className="kpi"><Icon n={i} s={22} />
      <div>{tip ? <Tip c={tip} className="tt-term" label={`${l}: ${v}`}><b>{v}</b></Tip> : <b>{v}</b>}<small>{u}</small></div>
      <span className="kpi-l"><span>{l}</span></span>{delta}
    </div>
  );
}

function AbaGeral({ id, ind }: { id: string; ind: IndEf }) {
  const dados = useDados();
  const d = dados.distritoPorId[id];
  const ctx = useContexto();
  const persona = usePersona();
  const modo = useStore((s) => s.modo), mes = useStore((s) => s.mes);
  const esc = useEscala();
  const alertas = useAlertas();
  const entregas = useEntregas();
  const missoes = useMissoes();
  const numTip = useNumTip();
  const m = MODO[modo];
  const partido = ctx.camada !== 'visitante';
  const v = esc.valores[id];
  const p = esc.tipo === 'cat' || v === null ? null : Math.max(0, Math.min(1, (v - esc.dominio[0]) / (esc.dominio[1] - esc.dominio[0])));
  const serieK = m.serieMensal ?? (partido ? 'pres' : 'zel_mes');
  const serie = d.serie[serieK];
  const nomeSerie = serieK === 'pres' ? 'Presença' : serieK === 'ops' ? 'Operações' : 'Zeladoria (série mensal)';
  const meusAl = alertas.filter((a) => a.distrito === id);
  const cats = Object.entries(meusAl.reduce<Record<string, number>>((acc, a) => { acc[a.categoria] = (acc[a.categoria] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const misD = missoes.filter((x) => x.distrito === id);
  const entD = entregas.filter((e) => misD.some((x) => x.id === e.missao) && e.status === 'validada').length;
  const entregue: [string, string, number][] = [
    ['check', 'Alertas resolvidos', meusAl.filter((a) => a.status === 'resolvido').length],
    ['doc', 'Protocolados', meusAl.filter((a) => a.status === 'protocolado').length],
    ['layers', 'Casos coletivos', meusAl.filter((a) => a.status === 'caso_coletivo').length],
    ...(partido ? [['flag', 'Missões em curso', misD.filter((x) => x.status === 'em_curso').length] as [string, string, number], ['hands', 'Entregas validadas', entD] as [string, string, number]] : []),
  ];
  const comp = composicao(d.cod);
  const nucleos = dados.nucleos.filter((n) => n.distrito === id);
  const meuNuc = persona.militanteId ? dados.militantePorId[persona.militanteId]?.nucleo : null;
  return (<>
    {persona.camada === 'visitante' && persona.distrito === id && (
      <div className="aviso-leg" style={{ borderStyle: 'solid', borderColor: 'var(--hi)' }}><b>Seu distrito</b> · acompanhe alertas, estatísticas públicas e notícias. <button className="link" onClick={() => st().set({ modal: { tipo: 'convite' } })}>Conhecer o partido</button></div>
    )}
    <div className="mode-strip"><Icon n={m.icon} s={16} /><span>Modo <b>{m.nome}</b>{mes < 11 ? ` · ${mesCurto(dados.meta.meses[mes])}` : ''}</span>
      {esc.tipo !== 'cat' && <><Ramp rampa={esc.rampa} mini />{p !== null && <span className="pos-mark" style={{ right: `calc(10px + 150px - 150px * ${p})` }} />}</>}
    </div>
    <div className="kpis">
      {m.categorico
        ? <Kpi i="building" l="Subprefeitura" v={d.sub.split('/')[0]} u={`${fmt(d.ind.km2, 1)} km² · ${dados.subPorNome[d.sub]?.distritos.length ?? 0} distritos`} />
        : <Kpi i={m.icon} l={m.nome} v={v === null ? '—' : esc.fmtV(v)} u={esc.unidade} tip={m.indicador ? numTip(m.indicador, (ind as unknown as Record<string, number>)[m.indicador]) : undefined} />}
      <Kpi i="people" l="População" v={fmt(ind.pop)} u="habitantes" tip={numTip('pop', ind.pop)} />
      {partido ? (<>
        <Kpi i="users" l="Militantes" v={fmt(ind.militantes)} u="ativos" tip={{ tipo: 'numero', titulo: 'Militantes ativos', valor: fmt(ind.militantes), unidade: 'no distrito', fonte: 'Cadastro interno (dado do app)', ano: 2026, nivel: 'distrito', app: true, termo: 'militante-ativo' }}
          delta={<span className={`delta ${serie[11] >= serie[8] && serieK === 'pres' ? 'pos' : ''}`}>{serieK === 'pres' ? `${d.serie.pres[11] >= d.serie.pres[8] ? '▲' : '▼'} ${fmt(Math.abs(d.serie.pres[11] - d.serie.pres[8]), 2)} /mil em 3 meses` : ''}</span>} />
        <Kpi i="home" l="Núcleos" v={String(nucleos.length)} u="em funcionamento" delta={<span className="delta">{nucleos.filter((n) => n.nivel === 'em formação').length} em formação</span>} />
      </>) : (<>
        {modo === 'zel'
          ? <Kpi i="bell" l="Alertas confirmados" v={fmt(ind.alertas_90d)} u="últimos 90 dias" tip={{ ...numTip('zel', ind.zel), titulo: 'Alertas confirmados (90 dias)', valor: fmt(ind.alertas_90d), unidade: `${fmt(ind.zel, 1)} por mil hab.` }} />
          : <Kpi i="bell" l="Zeladoria" v={fmt(ind.zel, 1)} u="alertas confirmados /mil hab., 90 dias" tip={numTip('zel', ind.zel)} />}
        <Kpi i="clock" l="Resolução" v={`${fmt(ind.tempo_resolucao_dias)} d`} u="tempo médio" tip={{ tipo: 'numero', titulo: 'Tempo médio de resolução', valor: `${ind.tempo_resolucao_dias} dias`, fonte: 'Cidade Missão (dado do app)', ano: 2026, nivel: 'distrito', app: true }} />
      </>)}
    </div>
    <div className="block">
      <div className="block-h"><span>{nomeSerie} em 12 meses</span><Src t={serieK === 'pres' ? 'Cadastro interno · distrito' : 'Cidade Missão · distrito'} /></div>
      <div className="spark-row"><Spark vals={serie} w={300} h={46} sel={mes} /><div className="spark-lbl"><b>{fmt(serie[11], serieK === 'ops' ? 0 : 2)}</b><small>{mesCurto(dados.meta.meses[11])}</small></div></div>
      <div className="months" style={{ width: 300 }}><span>{mesCurto(dados.meta.meses[0])}</span><span>{mesCurto(dados.meta.meses[11])}</span></div>
    </div>
    <div className="block pair">
      <div><div className="pair-h">Maiores demandas <small>alertas no mapa (amostra)</small></div>
        {cats.map(([c, n]) => <div key={c} className="pair-row neg"><Icon n={ICONE_CATEGORIA[c]} s={18} /><span>{NOME_CATEGORIA[c]}</span><b>{n}</b></div>)}
        {!cats.length && <div className="empty">Sem alertas</div>}</div>
      <div><div className="pair-h">Mais entregue <small>2026 · dado do app</small></div>
        {entregue.map(([i, l, n]) => <div key={l} className="pair-row pos"><Icon n={i} s={18} /><span>{l}</span><b>{n}</b></div>)}</div>
    </div>
    {partido && (
      <div className="block">
        <div className="block-h"><span>Composição por <Term id="trilha">trilha</Term></span><small>{fmt(ind.militantes)} militantes · estimativa fictícia</small></div>
        <div className="trackbar"><i className="t-fis" style={{ width: `${comp.fis}%` }} /><i className="t-int" style={{ width: `${comp.int}%` }} /><i className="t-mil" style={{ width: `${comp.mil}%` }} /></div>
        <div className="track-legend"><span><i className="dot t-fis" />Fiscalista {comp.fis}%</span><span><i className="dot t-int" />Intelectual {comp.int}%</span><span><i className="dot t-mil" />Militante {comp.mil}%</span></div>
      </div>
    )}
    {partido && (
      <div className="block">
        <div className="block-h"><span><Term id="nucleo">Núcleos</Term></span><small>{nucleos.length}</small></div>
        {nucleos.map((n) => (
          <button key={n.id} className={`nuc-row${n.id === meuNuc ? ' is-mine' : ''}`} onClick={() => st().set({ painel: 'nucleo', nucleoId: n.id })}>
            <span className="nuc-ic t-mil"><Icon n={ICONE_NUCLEO[n.nivel]} s={16} /></span>
            <div><b>{n.nome}</b><small>{n.militantes_ativos} ativos · {n.nivel} · reunião {n.reuniao}{n.id === meuNuc ? <> · <em>seu núcleo</em></> : null}</small></div>
            <span className="chev"><Icon n="right" s={14} /></span>
          </button>
        ))}
        {!nucleos.length && <div className="empty">Distrito sem núcleo</div>}
      </div>
    )}
    {persona.camada === 'visitante' && <button className="btn" onClick={() => st().set({ modal: { tipo: 'convite' } })}><Icon n="hands" s={14} />Conhecer o partido</button>}
  </>);
}

function AbaDados({ id, ind }: { id: string; ind: IndEf }) {
  const dados = useDados();
  const indAll = useIndicadores();
  const ctx = useContexto();
  const numTip = useNumTip();
  const pct = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    const ids = dados.distritos.map((d) => d.id);
    for (const k of [...IND_OFICIAIS, 'zel', 'pres', 'ops', 'lac', 'prontidao_media', 'comp'] as IndicadorId[]) {
      const ps = percentis(ids.map((x) => (indAll[x] as unknown as Record<string, number>)[k]));
      out[k] = Object.fromEntries(ids.map((x, i) => [x, ps[i]]));
    }
    return out;
  }, [dados, indAll]);
  const poi = (t: string) => dados.pontos_de_interesse.filter((p) => p.distrito === id && p.tipo === t).length;
  const linha = (k: IndicadorId) => {
    const meta = dados.indicadores[k];
    const v = (ind as unknown as Record<string, number>)[k];
    const p = pct[k]?.[id];
    const old = desatualizado(meta);
    return (
      <div className="stat-row" key={k}>
        <span className="nm">{k === 'vul' ? <Term id="vulnerabilidade">{meta.nome}</Term> : meta.nome}{old && <Term id="desatualizado"><span className="selo old">desatualizado</span></Term>}{meta.dado_do_app && <span className="selo dapp">dado do app</span>}</span>
        <Tip c={numTip(k, v)} className="tt-term vl" label={`${meta.nome}: ${fmtIndicador(k, v)}`}>{fmtIndicador(k, v)}</Tip>
        <span className="small muted" style={{ gridColumn: '1/3' }}>{meta.unidade}</span>
        {p !== undefined && <span className="pct"><Term id="percentil">percentil</Term><span className={`bar${k === 'lac' ? ' prio' : ''}`}><i style={{ width: `${p * 100}%` }} /></span><b>{fmt(p, 2)}</b></span>}
        {meta.media_municipal !== undefined && <span className="cmp"><span>município <b>{fmtIndicador(k, meta.media_municipal)}</b></span>{meta.media_estadual !== undefined && <span>estado <b>{fmtIndicador(k, meta.media_estadual)}</b></span>}{meta.media_nacional !== undefined && <span>país <b>{fmtIndicador(k, meta.media_nacional)}</b></span>}</span>}
        <Src t={linhaFonte(meta)} />
      </div>
    );
  };
  const app: IndicadorId[] = ctx.camada === 'visitante' ? ['zel'] : ['zel', 'pres', 'ops', 'prontidao_media', ...(acessoModo('lac', ctx).ok ? ['lac' as IndicadorId] : [])];
  const fontes = [...new Set([...IND_OFICIAIS, ...app, ...(acessoModo('ele', ctx).ok ? ['comp' as IndicadorId] : [])].map((k) => linhaFonte(dados.indicadores[k])))];
  return (<>
    <div className="block"><div className="block-h"><span>Estatísticas públicas</span><small>oficiais · comparadas com município, estado e país</small></div>
      {IND_OFICIAIS.map(linha)}
      {acessoModo('ele', ctx).ok && <><div className="aviso-leg">⚖ <Term id="eleitoral">Eleitoral agregado</Term>: uso de planejamento, sem cruzar com pessoas.</div>{linha('comp')}</>}
    </div>
    <div className="block"><div className="block-h"><span>Equipamentos no distrito</span><small>posições e nomes fictícios</small></div>
      <div className="cats-grid">
        {[['health', 'UBS', poi('ubs')], ['book', 'Escolas', poi('escola')], ['hands', 'CRAS', poi('cras')], ['urna', 'Locais de votação', poi('local_votacao')]].map(([i, l, n]) => <div key={l as string} className="cat"><Icon n={i as string} s={18} /><b>{n}</b><small>{l}</small></div>)}
      </div>
    </div>
    <div className="block"><div className="block-h"><span><Term id="dado-app">Dados do app</Term></span><small>não oficiais · nunca misturados sem rótulo</small></div>
      {app.map(linha)}
      <div className="stat-row"><span className="nm">Tempo médio de resolução <span className="selo dapp">dado do app</span></span><span className="vl">{ind.tempo_resolucao_dias} d</span><Src t="Cidade Missão (dado do app) · 2026 · distrito" /></div>
    </div>
    <div className="block"><div className="block-h"><span>Fontes</span><small>lista completa · disponibilidade por distrito [verificar]</small></div>
      {fontes.map((f) => <Src key={f} t={f} />)}
      <Src t="GeoSampa / PMSP · limites de distritos e subprefeituras, simplificados [verificar ano e licença]" />
      <p className="nota">Agregação: indicadores de setor censitário foram agregados ao distrito. Os números deste protótipo são <b>fictícios</b>; as fontes indicam onde buscar o dado real.</p>
    </div>
  </>);
}

function AbaProblemas({ id, ind }: { id: string; ind: IndEf }) {
  const alertas = useAlertas().filter((a) => a.distrito === id);
  const ctx = useContexto();
  const persona = useStore((s) => s.personaId);
  const numTip = useNumTip();
  const detalhada = acessoModo('zel', ctx).variante === 'detalhada';
  const casos = alertas.filter((a) => a.status === 'caso_coletivo').length;
  const cats = Object.keys(NOME_CATEGORIA).map((c) => [c, alertas.filter((a) => a.categoria === c && a.status !== 'resolvido').length] as const);
  const recentes = alertas.filter((a) => a.criado_em <= HOJE).sort((a, b) => (a.criadoNoApp === b.criadoNoApp ? b.criado_em.localeCompare(a.criado_em) : a.criadoNoApp ? -1 : 1)).slice(0, 12);
  const STATUS: Record<string, [string, string]> = { novo: ['novo', 'wait'], confirmado: ['confirmado', 'ok'], protocolado: ['protocolado', 'wait'], caso_coletivo: ['caso coletivo', 'late'], resolvido: ['resolvido', 'ok'] };
  return (<>
    <div className="kpis">
      <Kpi i="bell" l="Alertas confirmados" v={fmt(ind.alertas_90d)} u="últimos 90 dias" tip={{ ...numTip('zel', ind.zel), titulo: 'Alertas confirmados (90 dias)', valor: fmt(ind.alertas_90d), unidade: `${fmt(ind.zel, 1)} por mil hab.` }} />
      <Kpi i="chart" l="Por mil habitantes" v={fmt(ind.zel, 1)} u="Zeladoria, 90 dias" tip={numTip('zel', ind.zel)} />
      <Kpi i="clock" l="Tempo de resolução" v={`${ind.tempo_resolucao_dias} d`} u="média" tip={{ tipo: 'numero', titulo: 'Tempo médio de resolução', valor: `${ind.tempo_resolucao_dias} dias`, fonte: 'Cidade Missão (dado do app)', ano: 2026, nivel: 'distrito', app: true }} />
      <Kpi i="layers" l="Casos coletivos" v={String(casos)} u={detalhada ? 'em andamento (amostra)' : 'versão simplificada'} tip={{ tipo: 'termo', id: 'caso-coletivo' }} />
    </div>
    <div className="block"><div className="block-h"><span>Abertos por categoria</span><small>alertas no mapa (amostra)</small></div>
      <div className="cats-grid">{cats.map(([c, n]) => <div key={c} className="cat"><Icon n={ICONE_CATEGORIA[c]} s={18} /><b>{n}</b><small>{NOME_CATEGORIA[c]}</small></div>)}</div>
    </div>
    <button className="btn primary big" onClick={() => st().set({ modal: { tipo: 'registrar-alerta' } })} data-testid="registrar-alerta"><Icon n="plus" s={16} />Registrar alerta</button>
    <div className="block"><div className="block-h"><span>Alertas recentes</span><small>{detalhada ? 'detalhada' : 'simplificada'}</small></div>
      {recentes.map((a) => {
        const [lbl, cls] = STATUS[a.status];
        const meu = a.criadoNoApp && (a as { autor?: string }).autor === persona;
        const jaConf = a.confirmadores.includes(persona);
        return (
          <div key={a.id} className="al-row" data-testid={`alerta-${a.id}`}>
            <Icon n={ICONE_CATEGORIA[a.categoria]} s={16} />
            <div><b>{NOME_CATEGORIA[a.categoria]}{a.descricao ? ` · ${a.descricao}` : ''}</b><small>{a.confirmTotal} confirmações · {fmtData(a.criado_em)}{detalhada && a.protocolo ? ` · protocolo ${a.protocolo}` : ''}{a.criadoNoApp ? ' · registrado agora' : ''}</small></div>
            <span className="row">
              <span className={`chip-s ${cls}`}>{lbl}</span>
              {a.status === 'novo' && !meu && !jaConf && <button className="btn" onClick={() => confirmarAlerta(a.id)} data-testid="confirmar">Confirmar</button>}
              {a.status === 'novo' && (meu || jaConf) && <span className="small muted">{meu ? 'seu' : 'confirmado por você'}</span>}
            </span>
          </div>
        );
      })}
      {!recentes.length && <div className="empty">Nenhum alerta neste distrito.</div>}
    </div>
  </>);
}

function AbaPartido({ id, ind }: { id: string; ind: IndEf }) {
  const dados = useDados();
  const ctx = useContexto();
  const persona = usePersona();
  const missoes = useMissoes().filter((m) => m.distrito === id && m.status !== 'unificada');
  const numTip = useNumTip();
  const ac = acessoAba('partido', ctx);
  if (!ac.ok) return <Locked motivo={ac.motivo!} />;
  const proprio = ctx.camada !== 'militante' || persona.distrito === id;
  const nucleos = dados.nucleos.filter((n) => n.distrito === id);
  const comp = composicao(dados.distritoPorId[id].cod);
  const camp = dados.campanhas.filter((c) => c.territorio.includes(id));
  const meuNuc = persona.militanteId ? dados.militantePorId[persona.militanteId]?.nucleo : null;
  return (<>
    <div className="kpis">
      <Kpi i="target" l="Presença" v={fmt(ind.pres, 2)} u="militantes /mil eleitores" tip={numTip('pres', ind.pres)} delta={<span className={`delta ${ind.pres >= 1.66 ? 'pos' : ''}`}>média municipal 1,66</span>} />
      <Kpi i="users" l="Militantes" v={fmt(ind.militantes)} u="ativos" tip={{ tipo: 'numero', titulo: 'Militantes ativos', valor: fmt(ind.militantes), fonte: 'Cadastro interno (dado do app)', ano: 2026, nivel: 'distrito', app: true, termo: 'militante-ativo' }} />
      <Kpi i="clock" l="Prontidão média" v={`${fmt(ind.prontidao_media)}%`} u="acima do mínimo do nível" tip={numTip('prontidao_media', ind.prontidao_media)} />
      <Kpi i="flag" l="Operações" v={String(missoes.filter((m) => m.status !== 'concluida').length)} u="missões ativas" tip={numTip('ops', ind.ops)} />
    </div>
    <div className="block">
      <div className="block-h"><span>Militantes por trilha</span><small>estimativa fictícia</small></div>
      <div className="trackbar"><i className="t-fis" style={{ width: `${comp.fis}%` }} /><i className="t-int" style={{ width: `${comp.int}%` }} /><i className="t-mil" style={{ width: `${comp.mil}%` }} /></div>
      <div className="track-legend"><span><i className="dot t-fis" />Fiscalista {Math.round((ind.militantes * comp.fis) / 100)}</span><span><i className="dot t-int" />Intelectual {Math.round((ind.militantes * comp.int) / 100)}</span><span><i className="dot t-mil" />Militante {Math.round((ind.militantes * comp.mil) / 100)}</span></div>
    </div>
    <div className="block">
      <div className="block-h"><span>Núcleos e coordenadores</span><small>{proprio ? 'sem contato nem localização exata' : 'detalhe restrito ao seu núcleo'}</small></div>
      {nucleos.map((n) => (
        <button key={n.id} className={`nuc-row${n.id === meuNuc ? ' is-mine' : ''}`} onClick={() => st().set({ painel: 'nucleo', nucleoId: n.id })}>
          <span className="nuc-ic t-mil"><Icon n={ICONE_NUCLEO[n.nivel]} s={16} /></span>
          <div><b>{n.nome}</b><small>{n.nivel} · {n.militantes_ativos} ativos · {proprio ? `coordenação: ${n.coordenador ?? 'sem coordenador'}` : 'coordenação: restrita'}{n.id === meuNuc ? <> · <em>seu núcleo</em></> : null}</small></div>
          <span className="chev"><Icon n="right" s={14} /></span>
        </button>
      ))}
      {!nucleos.length && <div className="empty">Distrito sem núcleo. {ctx.camada !== 'militante' ? 'Veja o alerta de coordenação.' : ''}</div>}
    </div>
    <div className="block">
      <div className="block-h"><span><Term id="campanha">Campanhas</Term></span><small>{camp.length}</small></div>
      {camp.map((c) => <button key={c.id} className="nuc-row" onClick={() => st().set({ modal: { tipo: 'campanha', id: c.id } })}><span className="nuc-ic" style={{ background: 'var(--hi)', color: 'var(--hi-tx)' }}><Icon n="flag" s={16} /></span><div><b>{c.nome}</b><small>{Math.round(c.progresso * 100)}% · {c.meta}</small></div><span className="chev"><Icon n="right" s={14} /></span></button>)}
      {!camp.length && <div className="empty">Nenhuma campanha neste distrito</div>}
    </div>
    <div className="block">
      <div className="block-h"><span>Missões no distrito</span><button className="link" onClick={() => st().set({ painel: 'missoes' })}>ver todas <Icon n="right" s={12} /></button></div>
      {missoes.slice(0, 5).map((m) => <button key={m.id} className="nuc-row" onClick={() => st().set({ modal: { tipo: 'missao', id: m.id } })}><span className={`nuc-ic t-${m.trilha.slice(0, 3)}`}><Icon n="flag" s={16} /></span><div><b>{m.titulo}</b><small>{m.inscritos}/{m.vagas} vagas · prazo {fmtData(m.prazo)} · {m.status.replace('_', ' ')}</small></div><span className="chev"><Icon n="right" s={14} /></span></button>)}
    </div>
  </>);
}

function AbaHistorico({ id }: { id: string }) {
  const dados = useDados();
  const d = dados.distritoPorId[id];
  const ctx = useContexto();
  const historico = useStore((s) => s.historico).filter((e) => e.distritos?.includes(id));
  const decisoes = useStore((s) => s.decisoes);
  const partido = ctx.camada !== 'visitante';
  const series: [string, number[], number][] = [['Zeladoria (alertas /mil hab. no mês)', d.serie.zel_mes, 2], ...(partido ? [['Presença (militantes /mil eleitores)', d.serie.pres, 2] as [string, number[], number], ['Operações (missões ativas)', d.serie.ops, 0] as [string, number[], number]] : [])];
  const eventos = [
    ...historico.map((e) => ({ q: e.quando, t: e.texto, s: `${e.quem} · ${e.tipo}` })),
    ...(partido ? decisoes.filter((x) => x.missoes.length).map((x) => ({ q: x.quando, t: `Decisão ${x.id}: ${x.texto}`, s: `${x.quem} · decisão` })) : []).filter((e) => historico.every((h) => !h.texto.includes(e.t))),
    { q: dados.temporada.inicio, t: `Início da temporada "${dados.temporada.nome}"`, s: 'município' },
    ...dados.campanhas.filter((c) => partido && c.territorio.includes(id)).map((c) => ({ q: '2026-08-01', t: `Campanha "${c.nome}" iniciada`, s: 'campanha · data fictícia' })),
  ].sort((a, b) => b.q.localeCompare(a.q));
  return (<>
    {series.map(([n, v, dec]) => (
      <div className="block" key={n}><div className="block-h"><span>{n}</span><small>{fmt(v[0], dec)} → {fmt(v[11], dec)}</small></div>
        <Spark vals={v} w={400} h={40} /><div className="months"><span>{mesCurto(dados.meta.meses[0])}</span><span>{mesCurto(dados.meta.meses[6])}</span><span>{mesCurto(dados.meta.meses[11])}</span></div></div>
    ))}
    <div className="block"><div className="block-h"><span>Linha do tempo do distrito</span><small>{eventos.length} eventos</small></div>
      {eventos.map((e, i) => <div key={i} className="hist-item"><time>{fmtQuando(e.q)}</time><div>{e.t}<small>{e.s}</small></div></div>)}
    </div>
  </>);
}

export function DistrictView({ id, coluna }: { id: string; coluna?: 'A' | 'B' }) {
  const dados = useDados();
  const ind = useIndicadores()[id];
  const ctx = useContexto();
  const abaGlobal = useStore((s) => s.aba);
  const [abaLocal, setAbaLocal] = useState<AbaId>('geral');
  const aba = coluna === 'B' ? abaLocal : abaGlobal;
  const setAba = (a: AbaId) => (coluna === 'B' ? setAbaLocal(a) : st().set({ aba: a }));
  const fixado = useStore((s) => s.fixado);
  const observados = useStore((s) => s.observados);
  const [nivel, setNivel] = useState<'distrito' | 'sub'>('distrito');
  const d = dados.distritoPorId[id];
  if (!d || !ind) return null;
  if (nivel === 'sub') return <SubView nome={d.sub} onBack={() => { st().set({ sel: null }); }} onPick={(x) => { setNivel('distrito'); selecionar(x, { centrar: true }); }} />;
  const obs = observados.includes(id);
  const fechar = () => (coluna === 'B' ? st().set({ selB: null }) : st().set({ painel: null }));
  return (
    <div className="dr-col" aria-labelledby={`dist-${id}`}>
      <DrawerHead id={`dist-${id}`} code={`D-${d.cod} · ${d.id}`} titulo={d.nome}
        eyebrow={<>Distrito · <Tip c={{ tipo: 'termo', id: 'subprefeitura' }}>Subprefeitura {d.sub}</Tip></>}
        onBack={coluna === 'B' ? undefined : () => setNivel('sub')} onClose={fechar}
        tools={<>
          <button className={`icon-btn round`} title={obs ? 'Deixar de observar' : 'Observar (outliner)'} aria-pressed={obs} aria-label="Observar distrito" onClick={() => st().set({ observados: obs ? observados.filter((x) => x !== id) : [...observados, id] })}><Icon n={obs ? 'check' : 'eye'} s={16} /></button>
          {coluna !== 'B' && <button className="icon-btn round" title={fixado ? 'Desafixar painel' : 'Fixar painel para comparar dois distritos'} aria-pressed={fixado} aria-label="Fixar painel" onClick={() => st().set({ fixado: !fixado, selB: null })} style={fixado ? { background: 'var(--hi)', color: 'var(--hi-tx)' } : undefined}><Icon n="pin" s={16} /></button>}
        </>} />
      <div className="tabs" role="tablist" aria-label="Abas do território" onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const ok = ABAS.filter((a) => acessoAba(a.id, ctx).ok);
        const i = ok.findIndex((a) => a.id === aba);
        const prox = ok[(i + (e.key === 'ArrowRight' ? 1 : ok.length - 1)) % ok.length];
        setAba(prox.id);
        (e.currentTarget.querySelector(`[data-testid="aba-${prox.id}"]`) as HTMLElement | null)?.focus();
        e.preventDefault();
      }}>
        {ABAS.map((a) => {
          const ac = acessoAba(a.id, ctx);
          return (
            <button key={a.id} role="tab" aria-selected={aba === a.id} aria-disabled={!ac.ok} tabIndex={aba === a.id ? 0 : -1} className={`tab${aba === a.id ? ' is-sel' : ''}${ac.ok ? '' : ' is-lock'}`} title={ac.ok ? undefined : ac.motivo}
              onClick={() => (ac.ok ? setAba(a.id) : st().toast({ tipo: 'info', icon: 'lock', titulo: 'Aba bloqueada', texto: ac.motivo! }))} data-testid={`aba-${a.id}`}>
              {!ac.ok && <Icon n="lock" s={11} />}{a.nome}
            </button>
          );
        })}
      </div>
      <div className="dr-body" role="tabpanel">
        {aba === 'geral' && <AbaGeral id={id} ind={ind} />}
        {aba === 'dados' && <AbaDados id={id} ind={ind} />}
        {aba === 'problemas' && <AbaProblemas id={id} ind={ind} />}
        {aba === 'partido' && <AbaPartido id={id} ind={ind} />}
        {aba === 'historico' && <AbaHistorico id={id} />}
        <div className="dr-foot"><Src t="Números deste painel são fictícios · protótipo" /><Fict /></div>
      </div>
    </div>
  );
}

function SubView({ nome, onBack, onPick }: { nome: string; onBack: () => void; onPick: (id: string) => void }) {
  const dados = useDados();
  const esc = useEscala();
  const s = dados.subPorNome[nome];
  return (
    <div className="dr-col">
      <DrawerHead code={`SUB-${s.id}`} eyebrow="Subprefeitura · São Paulo" titulo={s.curto} onBack={onBack} onClose={() => st().set({ painel: null })} />
      <div className="dr-body">
        <div className="block"><div className="block-h"><span>Distritos</span><small>{s.distritos.length}</small></div>
          {s.distritos.map((id) => { const v = esc.valores[id]; return (
            <button key={id} className="nuc-row" onClick={() => onPick(id)}><span className="nuc-ic" style={{ background: esc.cores[id] }} /><div><b>{dados.distritoPorId[id].nome}</b><small>{v === null || v === undefined ? dados.distritoPorId[id].sub : esc.fmtV(v)}</small></div><span className="chev"><Icon n="right" s={14} /></span></button>
          ); })}
        </div>
      </div>
    </div>
  );
}

function CidadeView() {
  const dados = useDados();
  return (
    <div className="dr-col">
      <DrawerHead code="SP · 3550308" eyebrow="Município · 32 subprefeituras · 96 distritos" titulo="São Paulo" onClose={() => st().set({ painel: null })} />
      <div className="dr-body">
        <p className="nota">Clique num distrito no mapa ou escolha uma subprefeitura. A unidade do mapa é o distrito; bairros oficiais a verificar.</p>
        {dados.subprefeituras.map((s) => (
          <button key={s.id} className="nuc-row" onClick={() => { const d = s.distritos[0]; if (d) { selecionar(d); mapBus.emit({ tipo: 'distrito', id: d }); } }}>
            <span className="nuc-ic"><Icon n="building" s={16} /></span><div><b>{s.nome}</b><small>{s.distritos.map((id) => dados.distritoPorId[id].nome).join(', ')}</small></div><span className="chev"><Icon n="right" s={14} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TerritoryPanel() {
  const sel = useStore((s) => s.sel), selB = useStore((s) => s.selB), fixado = useStore((s) => s.fixado);
  if (!sel) return <CidadeView />;
  return (<>
    <DistrictView key={sel} id={sel} coluna="A" />
    {fixado && selB && <DistrictView key={'B' + selB} id={selB} coluna="B" />}
    {fixado && !selB && <div className="dr-col" style={{ display: 'none' }} />}
  </>);
}
