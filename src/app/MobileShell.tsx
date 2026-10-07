// Celular (< 768 px, alvo 390 × 844; doc. 7.5): mapa em tela cheia, barra compacta com 3 indicadores, modos em faixa,
// folha deslizante, aba Acompanhar, ações rápidas fixas e modo economia de dados.
import { lazy, Suspense, useState } from 'react';
import type { Layout } from './layout';
import { HOJE, MODO, fmt } from '../data/indicators';
import { NOME_CAMADA, veFichas } from '../domain/permissions';
import { ALTURA_FOLHA, BottomSheet } from '../components/BottomSheet';
const Ledger = lazy(() => import('../components/Ledger').then((m) => ({ default: m.Ledger })));
import { Legend, useEscala } from '../components/Legend';
const FichaConteudo = lazy(() => import('../components/MilitantSheet').then((m) => ({ default: m.FichaConteudo })));
const MissionList = lazy(() => import('../components/MissionList').then((m) => ({ default: m.MissionList })));
const Modais = lazy(() => import('../components/Modals').then((m) => ({ default: m.Modais })));
import { ModeSelector } from '../components/ModeSelector';
import { DistrictView } from '../components/TerritoryPanel';
import { Toasts } from '../components/Toasts';
import { TooltipLayer } from '../components/NestedTooltip';
import { TrackTab } from '../components/TrackTab';
import { ICONE_CAMADA, useRecursos } from '../components/TopBar';
const painelLazy = (k: 'AlertsPanel' | 'DevSelector' | 'SettingsPanel') => lazy(() => import('../components/Panels').then((m) => ({ default: m[k] as React.ComponentType })));
const AlertsPanel = painelLazy('AlertsPanel'), DevSelector = painelLazy('DevSelector'), SettingsPanel = painelLazy('SettingsPanel');
const NucleusSheet = lazy(() => import('../components/NucleusSheet').then((m) => ({ default: m.NucleusSheet })));
import { checkin, selecionar } from '../state/actions';
import { useAlertas, useContexto, useDados, useIndicadores, useMissoes, usePersona } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st, useStore, type AbaMovel } from '../state/store';
import { MapView } from '../map/MapView';
import { Fict, Ramp, Src } from '../ui/common';
import { ICONE_CATEGORIA, NOME_CATEGORIA, Icon } from '../ui/icons';
import { AVISO_UNIDADE } from '../content/textos';


function Busca() {
  const dados = useDados();
  const [q, setQ] = useState('');
  const res = q.trim().length > 1 ? dados.distritos.filter((d) => d.nome.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  return (
    <div className="m-search">
      <Icon n="lupa" s={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar distrito ou endereço" aria-label="Buscar distrito" data-testid="busca" />
      <Fict />
      <button className="m-avatar" title="Entrar (simulado)" aria-label="Camada e persona" onClick={() => st().set({ modal: { tipo: 'dev' } })}><Icon n="user" s={16} /></button>
      {res.length > 0 && <div className="busca-res">{res.map((d) => <button key={d.id} onClick={() => { setQ(''); selecionar(d.id); st().set({ folha: 'meia', abaMovel: 'mapa' }); mapBus.emit({ tipo: 'distrito', id: d.id, zoom: 13.5 }); }}>{d.nome}<small>{d.sub}</small></button>)}</div>}
    </div>
  );
}

/** Resumo do distrito na folha (tela 3 da referência). */
function ResumoDistrito({ id, paisagem }: { id: string; paisagem?: boolean }) {
  const dados = useDados();
  const ind = useIndicadores()[id];
  const esc = useEscala();
  const modo = useStore((s) => s.modo);
  const alertas = useAlertas().filter((a) => a.distrito === id);
  const d = dados.distritoPorId[id];
  const m = MODO[modo];
  const v = esc.valores[id];
  const p = v === null || esc.tipo === 'cat' ? null : Math.max(0, Math.min(1, (v - esc.dominio[0]) / (esc.dominio[1] - esc.dominio[0])));
  const meta = m.indicador ? dados.indicadores[m.indicador] : null;
  const cats = Object.entries(alertas.filter((a) => a.status !== 'resolvido').reduce<Record<string, number>>((acc, a) => { acc[a.categoria] = (acc[a.categoria] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const recentes = alertas.filter((a) => a.criado_em <= HOJE).sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 3);
  return (<>
    <div className="sh-head">
      <div><small className="eyebrow"><span className="code">D-{d.cod} · {d.id}</span>Distrito · {d.sub}</small><h3>{d.nome}</h3></div>
      <button className="icon-btn round" style={{ width: 44, height: 44 }} aria-label="Fechar" onClick={() => st().set({ sel: null, folha: 'recolhida' })}><Icon n="close" s={18} /></button>
    </div>
    {!m.categorico && v !== null && (
      <div className="sh-stat">
        <div className="sh-big"><b>{esc.fmtV(v)}</b><span>{esc.unidade}<br />{meta && <Src t={`${meta.fonte.split(' (')[0]} · ${meta.ano} · distrito`} />}</span></div>
        <div className="sh-cmp"><span>cidade <b>{meta?.media_municipal !== undefined ? fmt(meta.media_municipal, m.dec) : '—'}</b></span><div className="sh-rw"><Ramp rampa={esc.rampa} mini />{p !== null && <span className="pos-mark" style={{ left: `calc(100% * ${p})` }} />}</div></div>
      </div>
    )}
    {cats.length > 0 && <div className="cats-grid">{cats.map(([c, n]) => <div key={c} className="cat"><Icon n={ICONE_CATEGORIA[c]} s={18} /><b>{n}</b><small>{NOME_CATEGORIA[c]}</small></div>)}</div>}
    <div className="sh-sub"><span>Alertas recentes</span><small>amostra no mapa · {ind.tempo_resolucao_dias} d para resolver</small></div>
    {recentes.map((a) => (
      <button key={a.id} className="al-row" onClick={() => st().set({ modal: { tipo: 'alerta', id: a.id } })}>
        <Icon n={ICONE_CATEGORIA[a.categoria]} s={16} /><div><b>{NOME_CATEGORIA[a.categoria]}{a.descricao ? ` · ${a.descricao}` : ''}</b><small>{a.status.replace('_', ' ')} · {a.confirmTotal} confirmações</small></div><time>{a.criado_em.slice(8, 10)}/{a.criado_em.slice(5, 7)}</time>
      </button>
    ))}
    <button className="btn" onClick={() => st().set({ folha: 'cheia' })}><Icon n={paisagem ? 'right' : 'up'} s={14} />Ver abas do distrito (Geral, Dados, Problemas…)</button>
    <span className="small muted">{AVISO_UNIDADE}</span>
  </>);
}

function Pagina({ titulo, children, onBack, badge }: { titulo: string; children: React.ReactNode; onBack?: () => void; badge?: boolean }) {
  const camada = useStore((s) => s.camada);
  return (
    <div className="m-page" role="region" aria-label={titulo}>
      <div className="m-appbar">
        <button className="icon-btn" aria-label="Voltar ao mapa" onClick={onBack ?? (() => st().set({ abaMovel: 'mapa', painel: null }))}><Icon n="back" s={18} /></button>
        <b>{titulo}</b>
        {badge !== false && <span className="layer-badge sm"><Icon n={ICONE_CAMADA[camada]} s={12} /><b>{NOME_CAMADA[camada]}</b></span>}
      </div>
      {children}
    </div>
  );
}

export function MobileShell({ layout }: { layout: Layout }) {
  const dados = useDados();
  const persona = usePersona();
  const ctx = useContexto();
  const { w, h, paisagem } = layout;
  const sel = useStore((s) => s.sel), folha = useStore((s) => s.folha), aba = useStore((s) => s.abaMovel), painel = useStore((s) => s.painel);
  const eco = useStore((s) => s.economia), camada = useStore((s) => s.camada), escolhendo = useStore((s) => s.escolhendoPonto);
  const modo = useStore((s) => s.modo), modosAbertos = useStore((s) => s.modosAbertos);
  const insc = useStore((s) => s.inscricoes[s.personaId]) ?? {};
  const missoes = useMissoes();
  const { itens } = useRecursos();
  const [motor, setMotor] = useState<'google' | 'proprio'>('proprio');
  // medidas: retrato usa folha inferior; paisagem (celular deitado) usa painel lateral
  const navH = paisagem ? 52 : 64;
  const topH = 12 + 48 + 8 + 34;
  const folhaAberta = !!sel && aba === 'mapa';
  const lado = paisagem && folhaAberta ? Math.min(folha === 'cheia' ? 560 : 420, Math.round(w * (folha === 'cheia' ? 0.62 : 0.5))) : 0;
  const sheetH = !paisagem && folhaAberta ? ALTURA_FOLHA(folha, h) : 0;
  const modesVis = modosAbertos && (paisagem || !folhaAberta || folha === 'recolhida');
  const modesH = modesVis ? (paisagem ? 52 : 56) : 0;
  const fabTop = paisagem ? 12 : topH + 8;
  const baseMapa = h - navH - Math.max(sheetH, modesH);
  const fabRows = Math.max(0, Math.min(4, Math.floor((baseMapa - fabTop - 8 + 8) / 56)));
  const legendaCabe = baseMapa - (topH + 8) - 8 >= 150;
  const insets = { top: topH, right: paisagem ? 72 : 0, bottom: navH + Math.max(sheetH, modesH), left: lado };
  const setAba = (a: AbaMovel) => st().set({ abaMovel: a, painel: a === 'mapa' ? (sel ? 'territorio' : null) : painel });
  const aceita = Object.entries(insc).find(([, i]) => i.status === 'aceita');
  const fazerCheckin = () => {
    if (camada !== 'militante') { st().toast({ tipo: 'info', icon: 'lock', titulo: 'Check-in', texto: 'Disponível a partir da camada Militante.' }); return; }
    if (aceita) { checkin(aceita[0]); return; }
    st().toast({ tipo: 'info', icon: 'pin', titulo: 'Nenhuma ação aceita', texto: 'Aceite uma missão para fazer check-in.' });
    st().set({ abaMovel: 'perfil', painel: 'missoes' });
  };
  const minhas = () => { if (camada === 'visitante') { st().toast({ tipo: 'info', icon: 'lock', titulo: 'Minhas missões', texto: 'Disponível a partir da camada Militante.' }); return; } st().set({ abaMovel: 'perfil', painel: 'missoes' }); };
  const nMissoes = missoes.filter((m) => insc[m.id] && insc[m.id].status !== 'entregue').length;
  // páginas cheias
  let pagina: React.ReactNode = null;
  if (aba === 'acompanhar') pagina = <Pagina titulo="Acompanhar"><TrackTab /></Pagina>;
  else if (aba === 'numeros') pagina = <Pagina titulo="Números" badge={false}><div className="m-scroll" style={{ padding: 0 }}><Ledger /></div></Pagina>;
  else if (aba === 'perfil') {
    if (painel === 'missoes' && camada !== 'visitante') pagina = <Pagina titulo="Missões" onBack={() => setAba('mapa')}><div className="m-scroll" style={{ padding: 0 }}><MissionList /></div></Pagina>;
    else if (painel === 'nucleo') pagina = <Pagina titulo="Núcleo"><div className="m-scroll" style={{ padding: 0 }}><NucleusSheet /></div></Pagina>;
    else if (painel === 'alertas') pagina = <Pagina titulo="Alertas"><div className="m-scroll" style={{ padding: 0 }}><AlertsPanel /></div></Pagina>;
    else if (painel === 'config') pagina = <Pagina titulo="Configurações"><div className="m-scroll" style={{ padding: 0 }}><SettingsPanel /></div></Pagina>;
    else if (persona.militanteId && veFichas(ctx)) pagina = <Pagina titulo="Ficha do militante"><div className="m-scroll ficha-s" data-testid="ficha-movel"><FichaConteudo id={persona.militanteId} /></div></Pagina>;
    else pagina = <Pagina titulo={camada === 'visitante' ? 'Entrar (simulado)' : 'Perfil'}><div className="m-scroll"><DevSelector /><button className="btn" onClick={() => st().set({ painel: 'config' })}><Icon n="gear" s={14} />Configurações</button></div></Pagina>;
  }
  return (
    <div className={`app mob motor-${motor}${paisagem ? ' paisagem' : ''}`} style={{ '--sheet-h': `${Math.max(sheetH, modesH)}px`, '--nav-h': `${navH}px`, '--lado': `${lado}px`, '--modes-h': `${modesH}px`, '--m-top-h': `${topH}px` } as React.CSSProperties}>
      <MapView insets={insets} onMotor={setMotor} />
      <div className="m-top">
        <Busca />
        <div className="m-chips" role="list" aria-label="Indicadores e camada">
          <button className="chip is-sel" onClick={() => st().set({ modosAbertos: !st().modosAbertos })}><Icon n={MODO[modo].icon} s={13} />{MODO[modo].nome.split(' ')[0]}</button>
          {itens.filter((r) => !r.lock).slice(0, 3).map((r) => <span key={r.id} className="chip" role="listitem" title={`${r.l} · ${r.tip.tipo === 'numero' ? `${r.tip.fonte} · ${r.tip.ano}` : ''}`}><Icon n={r.i} s={13} /><b>{r.v}</b>{r.l.split(' ')[0].toLowerCase()}</span>)}
          <button className="chip" onClick={() => st().set({ modal: { tipo: 'dev' } })}><Icon n={ICONE_CAMADA[camada]} s={13} />{NOME_CAMADA[camada]}</button>
          <button className={`chip${eco ? ' is-sel' : ''}`} onClick={() => st().set({ economia: !eco })} aria-pressed={eco} title="Modo economia de dados"><Icon n="wifi" s={13} />economia</button>
        </div>
      </div>
      {legendaCabe && <div style={{ position: 'absolute', top: topH + 8, left: lado + 12, zIndex: 18 }}><Legend mini aviso={`${motor === 'proprio' ? 'mapa de demonstração (sem chave do Google) · ' : ''}${AVISO_UNIDADE}`} /></div>}
      {fabRows > 0 && <div className="m-fab" style={{ top: fabTop, gridTemplateRows: `repeat(${fabRows}, 48px)` }} role="toolbar" aria-label="Ações rápidas">
        <button className="cta" title="Registrar alerta" aria-label="Registrar alerta" onClick={() => st().set({ modal: { tipo: 'registrar-alerta' } })} data-testid="fab-alerta"><Icon n="bell" s={20} /></button>
        <button className={camada === 'visitante' ? 'is-lock' : ''} title="Check-in em ação" aria-label="Check-in em ação" onClick={fazerCheckin}><Icon n="pin" s={20} />{camada === 'visitante' && <span className="lk"><Icon n="lock" s={10} /></span>}</button>
        <button className={camada === 'visitante' ? 'is-lock' : ''} title="Minhas missões" aria-label="Minhas missões" onClick={minhas}><Icon n="flag" s={20} />{camada === 'visitante' ? <span className="lk"><Icon n="lock" s={10} /></span> : nMissoes ? <span className="badge-n">{nMissoes}</span> : null}</button>
        <button title="Centralizar no município" aria-label="Centralizar no município" onClick={() => mapBus.emit({ tipo: 'municipio' })}><Icon n="locate" s={20} /></button>
      </div>}
      {modesVis && <ModeSelector faixa />}
      {sel && aba === 'mapa' && (
        <BottomSheet folha={paisagem && folha === 'recolhida' ? 'meia' : folha} lado={paisagem ? lado : 0} setFolha={(f) => st().set({ folha: paisagem && f === 'recolhida' ? 'cheia' : f })} altura={sheetH} rotulo={`Distrito ${dados.distritoPorId[sel]?.nome}`}
          rodape={folha !== 'cheia' ? <button className="m-cta" onClick={() => st().set({ modal: { tipo: 'registrar-alerta' } })} data-testid="cta-alerta"><Icon n="plus" s={18} />Registrar alerta</button> : undefined}>
          {folha === 'cheia' ? <div style={{ margin: '0 -16px' }}><DistrictView id={sel} /></div> : <ResumoDistrito id={sel} paisagem={paisagem} />}
        </BottomSheet>
      )}
      {pagina && <Suspense fallback={<div className="m-page" aria-busy="true" />}>{pagina}</Suspense>}
      <nav className="m-nav" aria-label="Navegação">
        {([['mapa', 'map', 'Mapa'], ['acompanhar', 'eye', 'Acompanhar'], ['numeros', 'ledger', 'Números'], ['perfil', camada === 'visitante' ? 'user' : 'user', camada === 'visitante' ? 'Entrar' : camada === 'militante' ? 'Ficha' : 'Perfil']] as const).map(([id, i, l]) => (
          <button key={id} className={aba === id ? 'is-sel' : ''} aria-current={aba === id ? 'page' : undefined} onClick={() => { if (id === 'perfil') st().set({ painel: null }); setAba(id); }} data-testid={`nav-${id}`}><Icon n={i} s={20} /><span>{l}</span></button>
        ))}
      </nav>
      <Toasts />
      {escolhendo && <div className="pick-banner" role="status"><Icon n="pin" s={16} />Toque no mapa onde está o problema<button className="btn ghost" onClick={() => st().set({ escolhendoPonto: null, modal: { tipo: 'registrar-alerta', categoria: escolhendo } })}>voltar</button></div>}
      <Suspense fallback={null}><Modais /></Suspense>
      <TooltipLayer />
    </div>
  );
}
