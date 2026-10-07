// Outliner (doc. 7.2, tabela 7.4; pacote A §5): o que o usuário acompanha; seções recolhíveis, reordenáveis por arraste.
import { useState, type ReactNode } from 'react';
import { MODO, fmt, fmtData } from '../data/indicators';
import type { CamadaId } from '../data/types';
import { NOME_TRILHA, TRILHAS, SIGLA_TRILHA } from '../domain/levels';
import { NOME_TIPO_COORD, ICONE_TIPO_COORD } from '../domain/coordination';
import { DELEGACOES, NOTICIAS, PEDIDOS, PROPOSTAS } from '../content/textos';
import { selecionar } from '../state/actions';
import { useCoord } from '../state/coord';
import { useAlertas, useDados, useIndicadores, useMilitante, useMissoes, usePersona, useZonaPersona } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st, useStore } from '../state/store';
import { ICONE_CATEGORIA, ICONE_NUCLEO, ICONE_TRILHA, NOME_CATEGORIA, Icon } from '../ui/icons';
import { useEscala } from './Legend';

interface Linha { ic?: string; icCls?: string; l: ReactNode; v?: ReactNode; bar?: number; sel?: boolean; on?: () => void; key: string }
interface Secao { id: string; t: string; icon: string; n?: string | number; linhas?: Linha[]; lock?: string; corpo?: ReactNode }

const PADRAO: Record<CamadaId, string[]> = {
  visitante: ['observados', 'meus_alertas', 'noticias'],
  militante: ['meu_nucleo', 'missoes', 'trilhas', 'campanhas', 'observados', 'delegacoes'],
  autoridade: ['coordenacao', 'campanhas', 'nucleos', 'propostas', 'prestacao', 'observados'],
  direcao: ['municipios', 'delegacoes', 'relatorios', 'campanhas', 'observados'],
};

function useSecoes(): Record<string, Secao> {
  const dados = useDados();
  const persona = usePersona();
  const ind = useIndicadores();
  const missoes = useMissoes();
  const alertas = useAlertas();
  const esc = useEscala();
  const modo = useStore((s) => s.modo);
  const sel = useStore((s) => s.sel);
  const observados = useStore((s) => s.observados);
  const insc = useStore((s) => s.inscricoes[s.personaId]) ?? {};
  const decisoes = useStore((s) => s.decisoes);
  const delegSt = useStore((s) => s.delegacoes);
  const mil = useMilitante(persona.militanteId);
  const zona = useZonaPersona();
  const { ativos } = useCoord();
  const camada = persona.camada;
  const focar = (id: string) => { selecionar(id, { abrir: false }); mapBus.emit({ tipo: 'distrito', id }); };
  const nuc = mil ? dados.nucleoPorId[mil.m.nucleo] : null;
  const s: Record<string, Secao> = {};
  s.observados = {
    id: 'observados', t: camada === 'visitante' ? 'Distritos observados' : 'Acompanhando', icon: 'eye', n: observados.length,
    linhas: observados.map((id) => {
      const d = dados.distritoPorId[id], v = esc.valores[id];
      const serie = MODO[modo].serieMensal;
      const sobe = serie ? d.serie[serie][11] >= d.serie[serie][8] : null;
      return { key: id, l: d.nome, sel: sel === id, on: () => focar(id), v: <>{v === null || v === undefined ? '—' : esc.fmtV(v)} {sobe !== null && <i className={`tr ${sobe ? 'up' : 'dn'}`}>{sobe ? '▲' : '▼'}</i>}</> };
    }),
  };
  const meus = alertas.filter((a) => a.criadoNoApp && (a as { autor?: string }).autor === persona.id);
  s.meus_alertas = { id: 'meus_alertas', t: 'Meus alertas', icon: 'bell', n: meus.length,
    linhas: meus.length ? meus.map((a) => ({ key: a.id, ic: ICONE_CATEGORIA[a.categoria], icCls: a.status === 'novo' ? 'warn' : '', l: `${NOME_CATEGORIA[a.categoria]} · ${dados.distritoPorId[a.distrito].nome}`, v: <span className={`chip-s ${a.status === 'novo' ? 'wait' : 'ok'}`}>{a.status === 'novo' ? `${a.confirmTotal}/3` : 'confirmado'}</span>, on: () => st().set({ modal: { tipo: 'alerta', id: a.id } }) }))
      : [{ key: 'vazio', l: <span className="muted">Nenhum alerta registrado ainda</span>, on: () => st().set({ modal: { tipo: 'registrar-alerta' } }), v: <span className="link">registrar</span> }] };
  s.noticias = { id: 'noticias', t: 'Notícias (fictícias)', icon: 'news', n: NOTICIAS.length,
    linhas: NOTICIAS.map((n) => ({ key: n.id, ic: 'news', l: <><b>{n.orgao}</b> · {n.titulo}</>, v: fmtData(n.data).slice(0, 5) })) };
  if (mil && nuc) {
    const doNucleo = missoes.filter((m) => m.nucleo === nuc.id && m.status !== 'unificada');
    const emCurso = doNucleo.filter((m) => m.status === 'em_curso').length;
    s.meu_nucleo = { id: 'meu_nucleo', t: 'Meu núcleo', icon: 'home', linhas: [
      { key: 'n', ic: ICONE_NUCLEO[nuc.nivel], icCls: 't-mil', l: <b>{nuc.nome}</b>, v: `${nuc.nivel} · ${nuc.militantes_ativos} ativos`, on: () => st().set({ painel: 'nucleo', nucleoId: nuc.id }) },
      { key: 'r', ic: 'cal', l: 'Próxima reunião', v: nuc.reuniao },
      { key: 'm', ic: 'flag', l: 'Missões em curso', bar: doNucleo.length ? (emCurso / doNucleo.length) * 100 : 0, v: `${emCurso} de ${doNucleo.length}`, on: () => st().set({ painel: 'missoes' }) },
    ] };
  }
  const minhas = Object.entries(insc).map(([id, i]) => ({ m: missoes.find((x) => x.id === id), i })).filter((x) => x.m);
  s.missoes = { id: 'missoes', t: 'Minhas missões', icon: 'flag', n: minhas.length,
    linhas: minhas.length ? minhas.map(({ m, i }) => ({ key: m!.id, ic: ICONE_TRILHA[m!.trilha], icCls: `t-${SIGLA_TRILHA[m!.trilha]}`, l: m!.titulo, bar: i.status === 'aceita' ? 25 : i.status === 'checkin' ? 60 : 100, v: i.status === 'entregue' ? 'entregue' : i.status === 'checkin' ? 'check-in' : 'aceita', on: () => st().set({ modal: { tipo: 'missao', id: m!.id } }) }))
      : [{ key: 'v', l: <span className="muted">Nenhuma missão aceita</span>, v: <span className="link">ver missões</span>, on: () => st().set({ painel: 'missoes' }) }] };
  if (mil) s.trilhas = { id: 'trilhas', t: 'Trilhas', icon: 'user', linhas: TRILHAS.map((t) => {
    const e = mil.trilhas[t];
    const px = e.proxima;
    return { key: t, ic: ICONE_TRILHA[t], icCls: `t-${SIGLA_TRILHA[t]}`, l: <>{NOME_TRILHA[t]} · nível {e.nivel}{e.emReserva ? ' · em reserva' : ''}</>, bar: px ? Math.min(100, (e.carreira / px.carreiraMin) * 100) : 100, v: px ? `${fmt(e.carreira)}/${fmt(px.carreiraMin)}` : 'nível 6', on: () => st().set({ painel: 'ficha', fichaId: null }) };
  }) };
  s.campanhas = { id: 'campanhas', t: 'Campanhas', icon: 'flag', n: dados.campanhas.length, linhas: dados.campanhas.map((c) => ({
    key: c.id, ic: 'flag', icCls: c.foco_temporada ? 'warn' : '', l: c.nome, bar: c.progresso * 100, v: `até ${fmtData(c.prazo).slice(0, 5)}`, on: () => { st().set({ modal: { tipo: 'campanha', id: c.id } }); focar(c.territorio[0]); },
  })) };
  s.delegacoes = { id: 'delegacoes', t: 'Delegações', icon: 'send', ...(camada === 'militante' ? { lock: 'Autoridade', n: 'Autoridade' } : { n: DELEGACOES.length }),
    linhas: DELEGACOES.map((d) => { const st0 = delegSt[d.id]; const ate = st0?.ate ?? d.ate; return { key: d.id, ic: 'send', icCls: ate <= '2026-10-16' && st0?.status !== 'encerrada' ? 'warn' : '', l: `${d.escopo} · ${d.para}`, v: st0?.status === 'encerrada' ? 'encerrada' : `até ${fmtData(ate).slice(0, 5)}`, on: () => focar(d.distritos[0]) }; }) };
  s.coordenacao = { id: 'coordenacao', t: 'Coordenação', icon: 'ops', n: ativos.length, linhas: ativos.slice(0, 6).map((c, i) => ({ key: c.chave, ic: ICONE_TIPO_COORD[c.a.tipo], icCls: 'warn', l: `${NOME_TIPO_COORD[c.a.tipo]}${c.distrito ? ' · ' + dados.distritoPorId[c.distrito]?.nome : ''}`, v: c.naZona ? 'sua zona' : '', sel: i === 0, on: () => c.distrito && focar(c.distrito) })) };
  const nucZona = dados.nucleos.filter((n) => zona.includes(n.distrito));
  s.nucleos = { id: 'nucleos', t: 'Núcleos sob coordenação', icon: 'home', n: nucZona.length, linhas: nucZona.slice(0, 8).map((n) => ({ key: n.id, ic: ICONE_NUCLEO[n.nivel], l: n.nome, v: n.coordenador ? n.nivel : <span className="chip-s late">sem coordenador</span>, on: () => st().set({ painel: 'nucleo', nucleoId: n.id }) })) };
  s.propostas = { id: 'propostas', t: 'Propostas', icon: 'doc', n: PROPOSTAS.length, linhas: PROPOSTAS.map((p) => ({ key: p.id, ic: 'doc', l: p.texto, v: <span className="chip-s wait">{p.status}</span> })) };
  s.prestacao = { id: 'prestacao', t: 'Prestação de contas · pedidos', icon: 'lupa', n: PEDIDOS.length, linhas: PEDIDOS.map((p) => ({ key: p.id, ic: 'doc', l: p.texto, v: <span className={`chip-s ${p.status === 'respondido' ? 'ok' : p.status === 'atrasado' ? 'late' : 'wait'}`}>{p.status}</span>, on: () => focar(p.distrito) })) };
  s.municipios = { id: 'municipios', t: 'Municípios', icon: 'building', n: 1, linhas: [
    { key: 'sp', ic: 'building', l: <b>São Paulo · SP</b>, v: `${fmt(dados.distritos.reduce((a, d) => a + ind[d.id].militantes, 0))} ativos`, on: () => mapBus.emit({ tipo: 'municipio' }) },
    { key: 'f', ic: 'lock', l: <span className="muted">Visão multi-município: futuro</span>, v: '' },
  ] };
  s.relatorios = { id: 'relatorios', t: 'Relatórios', icon: 'chart', linhas: [
    { key: 'b', ic: 'chart', l: 'Balanço da temporada', v: <span className="link">abrir</span>, on: () => st().set({ painel: 'relatorios' }) },
    { key: 'd', ic: 'scale', l: 'Decisões registradas', v: String(decisoes.length), on: () => st().set({ painel: 'decisoes' }) },
  ] };
  return s;
}

export function Outliner({ semCaixa }: { semCaixa?: boolean }) {
  const camada = useStore((s) => s.camada);
  const ordem = useStore((s) => s.ordemOutliner[s.camada]) ?? PADRAO[camada];
  const fechadas = useStore((s) => s.outlinerFechadas);
  const aberto = useStore((s) => s.outlinerAberto);
  const secoes = useSecoes();
  const [arrastando, setArr] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const ids = ordem.filter((id) => secoes[id]);
  const mover = (de: string, para: string) => {
    if (de === para) return;
    const o = ids.filter((x) => x !== de);
    o.splice(o.indexOf(para), 0, de);
    st().set({ ordemOutliner: { ...st().ordemOutliner, [camada]: o } });
  };
  const moverTecla = (id: string, delta: number) => {
    const i = ids.indexOf(id), j = i + delta;
    if (j < 0 || j >= ids.length) return;
    const o = [...ids]; [o[i], o[j]] = [o[j], o[i]];
    st().set({ ordemOutliner: { ...st().ordemOutliner, [camada]: o } });
  };
  const alternar = (id: string) => st().set({ outlinerFechadas: fechadas.includes(id) ? fechadas.filter((x) => x !== id) : [...fechadas, id] });
  const corpo = (
    <div className="ol-scroll">
      {ids.map((id) => {
        const s = secoes[id];
        const open = !fechadas.includes(id) && !s.lock;
        return (
          <section key={id} className={`ol-sec${open ? ' is-open' : ''}${s.lock ? ' is-lock' : ''}${sobre === id && arrastando !== id ? ' is-drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setSobre(id); }} onDrop={() => { if (arrastando) mover(arrastando, id); setArr(null); setSobre(null); }}>
            <div className="ol-h" style={{ padding: 0 }}>
              <span className="ol-grip" draggable onDragStart={() => setArr(id)} onDragEnd={() => { setArr(null); setSobre(null); }} tabIndex={0} role="button"
                aria-label={`Reordenar ${s.t} (setas para mover)`} onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); moverTecla(id, -1); } if (e.key === 'ArrowDown') { e.preventDefault(); moverTecla(id, 1); } }}>
                <Icon n="drag" s={14} />
              </span>
              <button className="ol-h" style={{ paddingLeft: 2 }} aria-expanded={open} onClick={() => !s.lock && alternar(id)} title={s.lock ? `Disponível a partir da camada ${s.lock}` : undefined}>
                <Icon n={s.lock ? 'lock' : s.icon} s={16} /><span className="t">{s.t}</span>{s.n !== undefined && <em>{s.n}</em>}<Icon n={open ? 'down' : 'right'} s={14} className="ol-chev" />
              </button>
            </div>
            {open && (
              <div className="ol-body">
                {s.corpo}
                {s.linhas?.map((r) => (
                  <button key={r.key} className={`ol-row${r.sel ? ' is-sel' : ''}`} onClick={r.on} disabled={!r.on} style={!r.on ? { cursor: 'default' } : undefined}>
                    {r.ic ? <span className={`ol-ic ${r.icCls ?? ''}`}><Icon n={r.ic} s={14} /></span> : <span />}
                    <span className="ol-l">{r.l}</span>
                    {r.bar !== undefined ? <span className="ol-bar"><i style={{ width: `${Math.max(0, Math.min(100, r.bar))}%` }} /></span> : <span />}
                    <span className="ol-v">{r.v}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
  if (semCaixa) return corpo;
  return (
    <aside className={`cm-outliner${aberto ? '' : ' is-closed'}`} aria-label="Acompanhamento (outliner)" data-testid="outliner">
      <div className="ol-head"><Icon n="eye" s={14} /><span className="grow">Acompanhamento</span>
        <button className="icon-btn" style={{ width: 26, height: 26 }} aria-label={aberto ? 'Recolher outliner' : 'Abrir outliner'} aria-expanded={aberto} onClick={() => st().set({ outlinerAberto: !aberto })}><Icon n={aberto ? 'up' : 'down'} s={14} /></button>
      </div>
      {aberto && corpo}
    </aside>
  );
}
