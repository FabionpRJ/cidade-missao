// Ficha do militante (doc. 4.1, 4.2, 4.5, 2.5): visual da referência (retrato, blocos, árvore 1–6) com o conteúdo do documento.
// Visível só a militantes do município; sem contato nem localização exata.
import { useState } from 'react';
import { fmt, fmtData } from '../data/indicators';
import type { TrilhaId } from '../data/types';
import { NOME_TRILHA, SIGLA_TRILHA, TRILHAS, titulosHibridos } from '../domain/levels';
import { veFichas } from '../domain/permissions';
import { HOJE } from '../data/indicators';
import { ptNaSemana } from '../domain/points';
import { concluirModulo, decidirBanca, pedirProva } from '../state/actions';
import { useContexto, useDados, useMilitante, useMissoes, usePersona } from '../state/derived';
import { st, useStore } from '../state/store';
import { Fict, Locked, ProntidaoDots, Retrato } from '../ui/common';
import { DrawerHead } from '../ui/DrawerHead';
import { ICONE_TRILHA, Icon } from '../ui/icons';
import { COR_TRILHA } from '../map/markers';
import { MissionCard } from './MissionCard';
import { Term } from './NestedTooltip';

function Passagem({ mid, t }: { mid: string; t: TrilhaId }) {
  const dados = useDados();
  const mil = useMilitante(mid)!;
  const e = mil.trilhas[t];
  const pas = mil.passagens[t];
  const [ramo, setRamo] = useState<string>(Object.keys(dados.trilhas[t].ramos)[0]);
  if (!e.proxima) return <div className="passagem"><b>{NOME_TRILHA[t]} 6 · nível máximo</b></div>;
  const px = e.proxima;
  const pronta = px.prontaCarreira;
  return (
    <div className={`passagem t-${SIGLA_TRILHA[t]}${pronta ? ' pronta' : ''}`} data-testid={`passagem-${t}`}>
      <div className="row"><b>{NOME_TRILHA[t]} {px.nivel} · {px.titulo}</b>{pronta && !pas && <span className="chip-s late right">pronto para a passagem</span>}{pas?.status === 'pendente_banca' && <span className="chip-s wait right">prova com a banca</span>}</div>
      <span className="small">Requisito: {px.requisito}. <Term id="carreira">Carreira</Term> {fmt(e.carreira)} de {fmt(px.carreiraMin)}{px.faltaCarreira > 0 ? ` (faltam ${fmt(px.faltaCarreira)})` : ' ✓'}.</span>
      {pronta && !pas && !px.exigeProva && (
        <div className="row wrap">
          {px.nivel === 3 && <select className="chip" value={ramo} onChange={(x) => setRamo(x.target.value)} aria-label="Escolha de ramo">{Object.entries(dados.trilhas[t].ramos).map(([k, r]) => <option key={k} value={k}>Ramo {r.nome}</option>)}</select>}
          <button className="btn primary" onClick={() => concluirModulo(mid, t, px.nivel === 3 ? ramo : undefined)} data-testid="concluir-modulo">Concluir módulo (simulado)</button>
        </div>
      )}
      {pronta && !pas && px.exigeProva && <div className="row wrap"><button className="btn primary" onClick={() => pedirProva(mid, t)} data-testid="pedir-prova"><Icon n="scale" s={14} />Pedir prova de passagem</button><span className="small">avaliada por <Term id="banca">banca</Term> · <Term id="prova-passagem">o que é?</Term></span></div>}
      {pas?.status === 'pendente_banca' && (<>
        <span className="small"><Term id="banca">Banca</Term> sorteada (nível 5+): {pas.banca?.map((b) => dados.militantePorId[b]?.nome).join(', ') || 'a sortear'} · pedido em {pas.pedidoEm.replace('T', ' ')}</span>
        <div className="row"><button className="btn" onClick={() => decidirBanca(mid, t, true)} data-testid="banca-aprova">Banca aprova (simulado)</button><button className="btn ghost" onClick={() => decidirBanca(mid, t, false)}>Devolver</button></div>
      </>)}
    </div>
  );
}

export function FichaConteudo({ id }: { id: string }) {
  const dados = useDados();
  const mil = useMilitante(id);
  const lanc = useStore((s) => s.lancamentos);
  const insc = useStore((s) => s.inscricoes[id]) ?? {};
  const missoes = useMissoes();
  if (!mil) return null;
  const { m, trilhas } = mil;
  const principal = (Object.entries(trilhas) as [TrilhaId, typeof trilhas.fiscalista][]).sort((a, b) => b[1].nivel - a[1].nivel || b[1].carreira - a[1].carreira)[0];
  const [tp, ep] = principal;
  const nuc = dados.nucleoPorId[m.nucleo];
  const hib = titulosHibridos({ fiscalista: trilhas.fiscalista.nivel, intelectual: trilhas.intelectual.nivel, militante: trilhas.militante.nivel });
  const tituloPrincipal = `${ep.titulo}${ep.ramo ? ` (${dados.trilhas[tp].ramos[ep.ramo]?.nome})` : ''}`;
  const emCurso = missoes.filter((x) => insc[x.id] && insc[x.id].status !== 'entregue');
  return (<>
    <section className="f-hero">
      <div className={`f-portrait t-${SIGLA_TRILHA[tp]}`}><Retrato cor={COR_TRILHA[SIGLA_TRILHA[tp]]} codigo={m.id.replace('MIL-', '')} /><span className="f-lvl">{ep.nivel}</span></div>
      <div className="f-id">
        <small className="eyebrow"><span className="code">{m.id}</span>{nuc?.nome ?? m.nucleo}</small>
        <h3>{m.nome}</h3>
        <div className={`f-track t-${SIGLA_TRILHA[tp]}`}><Icon n={ICONE_TRILHA[tp]} s={14} />{tituloPrincipal}</div>
        <div className="f-branch">Militante desde {fmtData(m.militante_desde)} · título principal</div>
      </div>
    </section>
    <section className="f-cols" aria-label="Trilhas">
      {TRILHAS.map((t) => {
        const e = trilhas[t];
        const sem = ptNaSemana(lanc, id, t, HOJE);
        return (
          <div key={t} className={`f-col t-${SIGLA_TRILHA[t]}`} data-testid={`trilha-${t}`}>
            <span className="t">{NOME_TRILHA[t]} <b>{e.nivel}</b></span>
            <span className="r">{e.ramo ? dados.trilhas[t].ramos[e.ramo]?.nome : '— sem ramo'}</span>
            <span className="ti">{e.titulo}</span>
            <span className="c">{fmt(e.carreira, e.carreira % 1 ? 1 : 0)} <small><Term id="carreira">Carreira</Term></small></span>
            <span className="row" style={{ gap: 5 }}><ProntidaoDots n={e.pontos} /><small className="muted"><Term id="prontidao">Prontidão</Term> {fmt(e.prontidao, e.prontidao % 1 ? 1 : 0)}</small></span>
            {e.emReserva && <Term id="em-reserva"><span className="res-tag">em reserva</span></Term>}
            {sem > 0 && <small className="muted">{fmt(sem, 1)}/150 PT na semana</small>}
          </div>
        );
      })}
    </section>
    <section className="f-block"><div className="f-h">Trilhas <small>níveis 1 a 6</small></div>
      <div className="tree">{TRILHAS.map((t) => { const e = trilhas[t]; return (
        <div key={t} className={`tree-col t-${SIGLA_TRILHA[t]}`}><span className="tree-l">{NOME_TRILHA[t]}</span>
          <div className="nodes" role="img" aria-label={`${NOME_TRILHA[t]}: nível ${e.nivel} de 6`}>{[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className={`node ${n <= e.nivel ? (e.emReserva && n === e.nivel ? 'is-res' : 'is-done') : n === e.nivel + 1 ? 'is-next' : ''}`}>{n <= e.nivel && !(e.emReserva && n === e.nivel) ? <Icon n="check" s={11} /> : n}</span>)}</div>
        </div>); })}</div>
    </section>
    <section className="f-block"><div className="f-h">Próxima passagem <small>doc. 2.3</small></div>
      {m.proxima_passagem && <p className="nota">Registro: {m.proxima_passagem.titulo} → falta {m.proxima_passagem.falta}.</p>}
      {TRILHAS.map((t) => <Passagem key={t} mid={id} t={t} />)}
    </section>
    <section className="f-block"><div className="f-h"><span><Term id="medalha">Medalhas</Term></span><small>só simbólicas</small></div>
      <div className="traits">{m.medalhas.length ? m.medalhas.map((x) => <span key={x} className="trait"><Icon n="medal" s={14} />{x}</span>) : <span className="muted small">Nenhuma ainda</span>}</div>
    </section>
    <section className="f-block"><div className="f-h"><span><Term id="titulo-hibrido">Títulos híbridos</Term></span><small>alcançados e a caminho</small></div>
      <div className="traits">
        {hib.filter((h) => h.alcancado).map((h) => <span key={h.titulo} className="trait" title={h.habilita}><Icon n="star" s={14} />{h.titulo}</span>)}
        {hib.filter((h) => h.aCaminho).map((h) => <span key={h.titulo} className="trait off" title={`${h.combinacao} · falta: ${h.falta.join(', ')}`}><Icon n="right" s={14} />a caminho: {h.titulo} ({h.falta.join(', ')})</span>)}
        {!hib.some((h) => h.alcancado || h.aCaminho) && <span className="muted small">Nenhum por enquanto</span>}
      </div>
    </section>
    <section className="f-block"><div className="f-h">Mentoria e cargos</div>
      <dl className="kv">
        <dt>Mentor(a)</dt><dd>{m.mentor ?? '—'}</dd>
        <dt>Mentorados</dt><dd>{m.mentorados}</dd>
        <dt>Cargos</dt><dd>{m.cargos.length ? m.cargos.map((c) => `${c.cargo} (até ${fmtData(c.ate)})`).join('; ') : '—'}</dd>
      </dl>
    </section>
    {emCurso.length > 0 && <section className="f-block"><div className="f-h">Missões em curso <small>{emCurso.length}</small></div>{emCurso.map((x) => <MissionCard key={x.id} m={x} compacto />)}</section>}
    <div className="f-foot"><Fict /><span>Pessoa e números fictícios · sem contato nem localização exata · sem ranking</span></div>
  </>);
}

export function MilitantSheet() {
  const dados = useDados();
  const ctx = useContexto();
  const persona = usePersona();
  const fichaId = useStore((s) => s.fichaId);
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState(false);
  const id = fichaId ?? persona.militanteId ?? null;
  if (!veFichas(ctx)) return <div className="dr-col"><DrawerHead titulo="Ficha do militante" onClose={() => st().set({ painel: null })} /><div className="dr-body"><Locked motivo="Fichas de militantes são visíveis só a militantes do município (doc. 9)." /></div></div>;
  const m = id ? dados.militantePorId[id] : null;
  return (
    <div className="dr-col">
      <DrawerHead code={m?.id ?? 'MIL'} eyebrow="Ficha do militante" titulo={lista || !m ? 'Militantes' : m.nome.split(' ')[0] + ' ' + m.nome.split(' ').slice(-1)[0]}
        onBack={lista ? () => setLista(false) : undefined} onClose={() => st().set({ painel: null })}
        tools={<button className="icon-btn round" title="Militantes do município" aria-label="Militantes do município" onClick={() => setLista(!lista)}><Icon n="users" s={16} /></button>} />
      <div className="dr-body">
        {(lista || !m) ? (<>
          <p className="nota">Fichas visíveis aos militantes do município. Ordem alfabética: <b>sem ranking</b> de pessoas.</p>
          <input className="chip" placeholder="Buscar militante" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar militante" />
          {[...dados.militantes].sort((a, b) => a.nome.localeCompare(b.nome)).filter((x) => x.nome.toLowerCase().includes(busca.toLowerCase())).map((x) => (
            <button key={x.id} className="nuc-row" onClick={() => { st().set({ fichaId: x.id }); setLista(false); }}>
              <span className="nuc-ic"><Icon n="user" s={16} /></span><div><b>{x.nome}</b><small>{dados.nucleoPorId[x.nucleo]?.nome} · F{x.trilhas.fiscalista.nivel} I{x.trilhas.intelectual.nivel} M{x.trilhas.militante.nivel}</small></div><span className="chev"><Icon n="right" s={14} /></span>
            </button>
          ))}
        </>) : <FichaConteudo id={m.id} />}
      </div>
    </div>
  );
}
