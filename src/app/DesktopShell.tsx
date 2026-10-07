// Computador (≥ 1200 px) e intermediário (768–1199 px). Medidas vêm de app/layout.ts.
import { lazy, Suspense, useState } from 'react';
import { CoordinationCard, CoordinationStrip } from '../components/CoordinationAlerts';
import type { Layout } from './layout';
import { IconRail } from '../components/IconRail';
const Ledger = lazy(() => import('../components/Ledger').then((m) => ({ default: m.Ledger })));
import { Legend } from '../components/Legend';
const MilitantSheet = lazy(() => import('../components/MilitantSheet').then((m) => ({ default: m.MilitantSheet })));
const MissionList = lazy(() => import('../components/MissionList').then((m) => ({ default: m.MissionList })));
const Modais = lazy(() => import('../components/Modals').then((m) => ({ default: m.Modais })));
import { ModeSelector } from '../components/ModeSelector';
const NucleusSheet = lazy(() => import('../components/NucleusSheet').then((m) => ({ default: m.NucleusSheet })));
import { Outliner } from '../components/Outliner';
const painelLazy = (k: 'AlertsPanel' | 'DecisionsPanel' | 'DelegationsPanel' | 'ReportsPanel' | 'SettingsPanel') => lazy(() => import('../components/Panels').then((m) => ({ default: m[k] })));
const AlertsPanel = painelLazy('AlertsPanel'), DecisionsPanel = painelLazy('DecisionsPanel'), DelegationsPanel = painelLazy('DelegationsPanel'), ReportsPanel = painelLazy('ReportsPanel'), SettingsPanel = painelLazy('SettingsPanel');
import { TerritoryPanel } from '../components/TerritoryPanel';
import { Timeline } from '../components/Timeline';
import { Toasts } from '../components/Toasts';
import { TooltipLayer } from '../components/NestedTooltip';
import { TopBar } from '../components/TopBar';
import { acessoRail, recebeAlertasCoordenacao } from '../domain/permissions';
import { Minimap } from '../map/Minimap';
import { MapView } from '../map/MapView';
import { useContexto, usePersona } from '../state/derived';
import { st, useStore } from '../state/store';
import { Icon } from '../ui/icons';

function Gaveta() {
  const painel = useStore((s) => s.painel);
  const ctx = useContexto();
  if (!painel || painel === 'mapa') return null;
  if (!acessoRail(painel, ctx).ok) return null;
  switch (painel) {
    case 'territorio': return <TerritoryPanel />;
    case 'ledger': return <Ledger />;
    case 'missoes': return <MissionList />;
    case 'ficha': return <MilitantSheet />;
    case 'nucleo': return <NucleusSheet />;
    case 'alertas': return <AlertsPanel />;
    case 'decisoes': return <DecisionsPanel />;
    case 'delegacoes': return <DelegationsPanel />;
    case 'relatorios': return <ReportsPanel />;
    case 'config': return <SettingsPanel />;
    default: return null;
  }
}

function Acoes() {
  const persona = usePersona();
  const c = persona.camada;
  const insc = useStore((s) => s.inscricoes[s.personaId]) ?? {};
  const pend = Object.values(insc).filter((i) => i.status !== 'entregue').length;
  const lista: { i: string; l: string; on: () => void; n?: number }[] =
    c === 'visitante' ? [
      { i: 'bell', l: 'Registrar alerta', on: () => st().set({ modal: { tipo: 'registrar-alerta' } }) },
      { i: 'eye', l: 'Alertas', on: () => st().set({ painel: 'alertas' }) },
      { i: 'doc', l: 'Ficha do município', on: () => st().set({ modal: { tipo: 'municipio' } }) },
      { i: 'hands', l: 'Conhecer o partido', on: () => st().set({ modal: { tipo: 'convite' } }) },
    ] : c === 'militante' ? [
      { i: 'flag', l: 'Minhas missões', on: () => st().set({ painel: 'missoes' }), n: pend },
      { i: 'bell', l: 'Registrar alerta', on: () => st().set({ modal: { tipo: 'registrar-alerta' } }) },
      { i: 'home', l: 'Meu núcleo', on: () => st().set({ painel: 'nucleo', nucleoId: null }) },
      { i: 'user', l: 'Minha ficha', on: () => st().set({ painel: 'ficha', fichaId: null }) },
      { i: 'chart', l: 'Temporada', on: () => st().set({ painel: 'relatorios' }) },
    ] : [
      { i: 'ledger', l: 'Ledger', on: () => st().set({ painel: 'ledger' }) },
      { i: 'scale', l: 'Janela de decisão', on: () => st().set({ modal: { tipo: 'decisao', id: 'DEC-1' } }) },
      { i: 'gap', l: 'Pesos de Lacunas', on: () => st().set({ modal: { tipo: 'pesos' } }) },
      { i: 'send', l: 'Delegações', on: () => st().set({ painel: 'delegacoes' }) },
      { i: 'chart', l: 'Relatório da temporada', on: () => st().set({ painel: 'relatorios' }) },
    ];
  return (
    <div className="cm-actions" role="toolbar" aria-label="Ações">
      {lista.map((a) => <button key={a.l} className="act" title={a.l} aria-label={a.l} onClick={a.on}><Icon n={a.i} s={24} />{a.n ? <span className="badge-n">{a.n}</span> : null}</button>)}
    </div>
  );
}

export function DesktopShell({ layout }: { layout: Layout }) {
  const painel = useStore((s) => s.painel);
  const fixado = useStore((s) => s.fixado), selB = useStore((s) => s.selB), largo = useStore((s) => s.ledger.largo);
  const modos = useStore((s) => s.modosAbertos), mini = useStore((s) => s.minimapa);
  const escolhendo = useStore((s) => s.escolhendoPonto);
  const ctx = useContexto();
  const coord = recebeAlertasCoordenacao(ctx);
  const [motor, setMotor] = useState<'google' | 'proprio'>('proprio');
  const mid = layout.tipo === 'mid';
  const aberto = !!painel && painel !== 'mapa' && acessoRail(painel, ctx).ok;
  const split = painel === 'territorio' && fixado && !!selB;
  const larguraLivre = layout.w - 64 - layout.rw - 24;
  // gaveta: simples, dividida (dois distritos) ou Ledger expandido; nunca deixa a área do mapa com menos de ~320 px
  const dwo = !aberto ? 0 : mid
    ? Math.min(split || (painel === 'ledger' && largo) ? 896 : layout.dw, layout.w - 64 - 12)
    : split ? Math.max(layout.dw, Math.min(2 * layout.dw, larguraLivre - 320))
      : painel === 'ledger' && largo ? Math.max(layout.dw, Math.min(760, larguraLivre - 320)) : layout.dw;
  const dw = mid ? 0 : dwo; // espaço reservado (no intermediário a gaveta sobrepõe o mapa)
  const topo = 56 + (coord ? 44 : 0);
  const insets = { top: topo, right: layout.rw + 24, bottom: 72, left: 64 + dw };
  const vars = { '--dw': `${dw}px`, '--dwo': `${dwo}px`, '--rw': `${layout.rw}px`, '--topo': `${topo}px` } as React.CSSProperties;
  return (
    <div className={`app desk${mid ? ' mid' : ''}${coord ? ' tem-coord' : ''} motor-${motor}`} style={vars}>
      <MapView insets={insets} onMotor={setMotor} />
      <TopBar />
      {coord && <CoordinationStrip />}
      <IconRail />
      {aberto && <aside className={`cm-drawer${split ? ' split' : ''}${painel === 'ledger' && largo ? ' largo' : ''}${painel === 'ledger' ? ' ledger' : ''}`} aria-label="Painel">
        <Suspense fallback={<div className="dr-col"><div className="dr-head" style={{ height: 96 }} /><div className="dr-body" aria-busy="true" /></div>}><Gaveta /></Suspense>
      </aside>}
      {mid && aberto && <div className="veu" aria-hidden="true" onClick={() => st().set({ painel: null })} />}
      <div className="col-dir">
        <Outliner />
        {modos && <ModeSelector />}
        {mini && layout.mini && <Minimap />}
      </div>
      <div className="centro">
        <Legend aviso={motor === 'proprio' ? 'mapa de demonstração (sem chave do Google)' : undefined} />
        {coord && <CoordinationCard />}
        <Acoes />
        <Timeline />
        <Toasts />
      </div>
      {escolhendo && <div className="pick-banner" role="status"><Icon n="pin" s={16} />Clique no mapa onde está o problema<button className="btn ghost" onClick={() => st().set({ escolhendoPonto: null, modal: { tipo: 'registrar-alerta', categoria: escolhendo } })}>voltar</button></div>}
      <Suspense fallback={null}><Modais /></Suspense>
      <TooltipLayer />
    </div>
  );
}
