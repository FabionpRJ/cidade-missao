// Painel de missões: lista filtrável (trilha, ramo, distrito, campanha), minhas missões e entregas, fila de validação.
import { useMemo, useState } from 'react';
import { fmtData, fmtN } from '../data/indicators';
import type { TrilhaId } from '../data/types';
import { NOME_TRILHA, SIGLA_TRILHA, TRILHAS } from '../domain/levels';
import { podeValidar } from '../domain/permissions';
import { contaPT, NOME_VERIFICACAO } from '../domain/points';
import { contextoDe, useDados, useEntregas, useMilitante, useMissoes, usePersona } from '../state/derived';
import { st, useStore } from '../state/store';
import { Fict } from '../ui/common';
import { DrawerHead } from '../ui/DrawerHead';
import { Icon } from '../ui/icons';
import { MissionCard } from './MissionCard';
import { Tip } from './NestedTooltip';

export function ValidationQueue() {
  const dados = useDados();
  const persona = usePersona();
  const val = useMilitante(persona.militanteId);
  const entregas = useEntregas();
  const pend = entregas.filter((e) => e.status === 'pendente_validacao');
  const feitas = entregas.filter((e) => e.status !== 'pendente_validacao' && e.validador === persona.militanteId);
  const niveis = val ? contextoDe('militante', val).niveis! : null;
  return (<>
    <p className="nota">Validador: outro militante, <b>de outro núcleo</b>, com Fiscalista 3+ ou nível 3+ na trilha da entrega e Prontidão ativa. Validações correlacionadas geram auditoria (doc. 4.6).</p>
    {pend.map((e) => {
      const autor = dados.militantePorId[e.militante];
      const ac = val && niveis ? podeValidar({ id: val.m.id, nucleo: val.m.nucleo, niveis }, { trilha: e.trilha, militante: e.militante, nucleoAutor: autor?.nucleo ?? '' }) : { ok: false, motivo: 'Troque para um militante validador' };
      return (
        <div key={e.id} className={`ent-row t-${SIGLA_TRILHA[e.trilha]}`} data-testid={`entrega-${e.id}`}>
          <div><b>{e.acao}</b><small>{autor?.nome} · {dados.nucleoPorId[autor?.nucleo ?? '']?.nome ?? autor?.nucleo} · {NOME_TRILHA[e.trilha]} · evidência: {e.evidencia}{e.evidencia_detalhe ? ` (${e.evidencia_detalhe})` : ''} · {fmtData(e.criada_em)}</small></div>
          {ac.ok ? <button className="btn primary" onClick={() => st().set({ modal: { tipo: 'validar', entrega: e.id } })} data-testid="validar">Validar</button>
            : <span className="lock-ic small" title={ac.motivo}><Icon n="lock" s={12} />{ac.motivo}</span>}
        </div>
      );
    })}
    {!pend.length && <div className="empty">Nenhuma entrega pendente.</div>}
    {feitas.length > 0 && <div className="block"><div className="block-h"><span>Validadas por você</span><small>{feitas.length}</small></div>
      {feitas.map((e) => <div key={e.id} className={`ent-row t-${SIGLA_TRILHA[e.trilha]}`}><div><b>{e.acao}</b><small>{dados.militantePorId[e.militante]?.nome} · {e.verificacao ? NOME_VERIFICACAO[e.verificacao] : ''}</small></div>
        {e.calculo ? <Tip c={{ tipo: 'pt', titulo: 'Conta dos PT', calculo: e.calculo }}>+{fmtN(e.calculo.creditado)} PT</Tip> : <span className="chip-s neg">contestada</span>}</div>)}
    </div>}
  </>);
}

function MinhasEntregas() {
  const dados = useDados();
  const persona = usePersona();
  const entregas = useEntregas().filter((e) => e.militante === persona.militanteId);
  return (<>
    {entregas.map((e) => (
      <div key={e.id} className={`ent-row t-${SIGLA_TRILHA[e.trilha]}`} data-testid={`minha-entrega-${e.id}`}>
        <div><b>{e.acao}</b><small>{NOME_TRILHA[e.trilha]} · evidência: {e.evidencia} · {fmtData(e.criada_em)}{e.validador ? ` · validador: ${dados.militantePorId[e.validador]?.nome}` : ''}</small></div>
        {e.status === 'pendente_validacao' ? <span className="chip-s wait">pendente de validação</span>
          : e.status === 'validada' && e.calculo ? <Tip c={{ tipo: 'pt', titulo: 'Conta dos PT', calculo: e.calculo }}><span className="chip-s ok">+{fmtN(e.calculo.creditado)} PT</span></Tip>
            : <span className="chip-s neg">{e.status}</span>}
        {e.calculo && <small style={{ gridColumn: '1/3' }} className="mono">{contaPT(e.calculo)}{e.calculo.naoCreditado ? ` · teto: −${fmtN(e.calculo.naoCreditado)}` : ''}</small>}
      </div>
    ))}
    {!entregas.length && <div className="empty">Nenhuma entrega registrada.</div>}
  </>);
}

export function MissionList() {
  const dados = useDados();
  const persona = usePersona();
  const missoes = useMissoes();
  const insc = useStore((s) => s.inscricoes[s.personaId]) ?? {};
  const [aba, setAba] = useState<'lista' | 'minhas' | 'validar'>('lista');
  const sub = persona.distrito ? dados.distritoPorId[persona.distrito].sub : null;
  const [f, setF] = useState<{ trilha: TrilhaId | ''; ramo: string; distrito: string; campanha: string }>({ trilha: '', ramo: '', distrito: persona.distrito ?? '', campanha: '' });
  const lista = useMemo(() => missoes.filter((m) => (!f.trilha || m.trilha === f.trilha) && (!f.ramo || m.ramo === f.ramo) && (!f.distrito || m.distrito === f.distrito) && (!f.campanha || m.campanha === f.campanha))
    .sort((a, b) => Number(!!insc[b.id]) - Number(!!insc[a.id]) || a.prazo.localeCompare(b.prazo)), [missoes, f, insc]);
  const minhas = missoes.filter((m) => insc[m.id]);
  const nPend = useEntregas().filter((e) => e.status === 'pendente_validacao').length;
  const distritosSub = sub ? dados.subPorNome[sub].distritos : [];
  return (
    <div className="dr-col">
      <DrawerHead code="MIS" eyebrow={`${persona.nome} · ${dados.temporada.nome}: foco ×1,25`} titulo="Missões" onClose={() => st().set({ painel: null })} />
      <div className="tabs" role="tablist">
        {([['lista', 'Missões'], ['minhas', `Minhas (${minhas.length})`], ['validar', `Validar (${nPend})`]] as const).map(([id, n]) => (
          <button key={id} role="tab" aria-selected={aba === id} className={`tab${aba === id ? ' is-sel' : ''}`} onClick={() => setAba(id)} data-testid={`missoes-aba-${id}`}>{n}</button>
        ))}
      </div>
      <div className="dr-body">
        {aba === 'lista' && (<>
          <div className="filters">
            <select className="chip" value={f.trilha} onChange={(e) => setF({ ...f, trilha: e.target.value as TrilhaId | '', ramo: '' })} aria-label="Trilha"><option value="">Todas as trilhas</option>{TRILHAS.map((t) => <option key={t} value={t}>{NOME_TRILHA[t]}</option>)}</select>
            <select className="chip" value={f.ramo} onChange={(e) => setF({ ...f, ramo: e.target.value })} aria-label="Ramo" disabled={!f.trilha}><option value="">Todos os ramos</option>{f.trilha && Object.entries(dados.trilhas[f.trilha].ramos).map(([k, r]) => <option key={k} value={k}>{r.nome}</option>)}</select>
            <select className="chip" value={f.distrito} onChange={(e) => setF({ ...f, distrito: e.target.value })} aria-label="Distrito" data-testid="filtro-distrito">
              <option value="">Todos os distritos</option>
              {distritosSub.length > 0 && <optgroup label={`Subprefeitura ${sub}`}>{distritosSub.map((id) => <option key={id} value={id}>{dados.distritoPorId[id].nome}</option>)}</optgroup>}
              <optgroup label="Município">{dados.distritos.filter((d) => !distritosSub.includes(d.id)).map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</optgroup>
            </select>
            <select className="chip" value={f.campanha} onChange={(e) => setF({ ...f, campanha: e.target.value })} aria-label="Campanha"><option value="">Todas as campanhas</option>{dados.campanhas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          </div>
          <div className="small muted">{lista.length} missões</div>
          {lista.slice(0, 40).map((m) => <MissionCard key={m.id} m={m} />)}
          {lista.length > 40 && <div className="empty">+{lista.length - 40} missões: refine os filtros.</div>}
        </>)}
        {aba === 'minhas' && (<>
          {minhas.map((m) => <MissionCard key={m.id} m={m} />)}
          {!minhas.length && <div className="empty">Aceite uma missão na aba Missões.</div>}
          <div className="block"><div className="block-h"><span>Minhas entregas</span></div><MinhasEntregas /></div>
        </>)}
        {aba === 'validar' && <ValidationQueue />}
        <div className="dr-foot"><span className="small muted">Missões, pessoas e pontos fictícios</span><Fict /></div>
      </div>
    </div>
  );
}
