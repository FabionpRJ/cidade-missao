// Cartão de missão (doc. 2.1, 2.2; pacote A §5): trilha, ramo, V_base, verificação típica, multiplicadores, vagas, prazo, nível mínimo, campanha.
import { HOJE, fmt, fmtData } from '../data/indicators';
import type { Missao } from '../data/types';
import { NOME_TRILHA, SIGLA_TRILHA } from '../domain/levels';
import { calcularPT, ptNaSemana } from '../domain/points';
import { aceitarMissao, checkin } from '../state/actions';
import { useDados, useMilitante, usePersona } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st, useStore } from '../state/store';
import { ICONE_TRILHA, Icon } from '../ui/icons';
import { Term, Tip } from './NestedTooltip';
import { ideiaDaMissao } from '../content/missoesCidadania';

export function MissionCard({ m, compacto }: { m: Missao; compacto?: boolean }) {
  const dados = useDados();
  const persona = usePersona();
  const mil = useMilitante(persona.militanteId);
  const insc = useStore((s) => s.inscricoes[s.personaId]?.[m.id]);
  const lanc = useStore((s) => s.lancamentos);
  const sig = SIGLA_TRILHA[m.trilha];
  const nivel = mil?.trilhas[m.trilha].nivel ?? 0;
  const bloqueada = persona.camada === 'militante' && nivel < m.nivel_minimo;
  const atrasada = m.prazo < HOJE && m.status !== 'concluida';
  const camp = m.campanha ? dados.campanhas.find((c) => c.id === m.campanha) : null;
  const ramo = m.ramo ? dados.trilhas[m.trilha].ramos[m.ramo]?.nome : 'todos os ramos';
  const est = calcularPT({ vBase: m.v_base, verificacao: m.m_verificacao_esperado >= 1.5 ? 'confirmada_por_fonte_externa' : 'validada_por_par_ou_coordenador', foco_temporada: m.foco_temporada, territorio_prioritario: m.territorio_prioritario, jaNaSemana: persona.militanteId ? ptNaSemana(lanc, persona.militanteId, m.trilha, HOJE) : 0, regras: dados.regras });
  const [cls, lbl] = m.status === 'unificada' ? ['st-next', 'unificada'] : bloqueada ? ['st-lock', `nível ${m.nivel_minimo}+`] : insc ? ['st-run', insc.status === 'entregue' ? 'entregue' : insc.status === 'checkin' ? 'check-in feito' : 'aceita'] : atrasada ? ['st-late', 'atrasada'] : m.status === 'em_curso' ? ['st-run', 'em curso'] : m.status === 'agendada' ? ['st-next', 'agendada'] : ['st-open', 'aberta'];
  const cid = ideiaDaMissao(m);
  const pct = m.vagas ? Math.round((m.inscritos / m.vagas) * 100) : 0;
  return (
    <article className={`mission t-${sig}${m.status === 'unificada' ? ' is-unif' : ''}${bloqueada ? ' is-lock' : ''}`} data-testid={`missao-${m.id}`}>
      <div className="ms-head">
        <span className="ms-track"><Icon n={bloqueada ? 'lock' : ICONE_TRILHA[m.trilha]} s={16} /></span>
        <div><small>{NOME_TRILHA[m.trilha]} · {ramo} · {dados.distritoPorId[m.distrito]?.nome}</small><b>{m.titulo}</b></div>
        <span className={`ms-state ${cls}`}>{lbl}</span>
      </div>
      {!compacto && cid && (
        <div className="ms-cid" data-testid="missao-cidadania">
          <p><Icon n="hands" s={13} /><b>Cidadania:</b> {cid.cidadania}</p>
          <p className="small muted">Instrumento: {cid.instrumento}</p>
          <details><summary>Como fazer</summary><ol>{cid.passos.map((p) => <li key={p}>{p}</li>)}</ol></details>
        </div>
      )}
      {!compacto && <p><Term id="verificacao">Verificação típica</Term>: {m.verificacao_tipica} (×{fmt(m.m_verificacao_esperado, 1)}){m.origem ? ` · ${m.origem}` : ''}</p>}
      <div className="ms-mult">
        <span>V_base {m.v_base}</span>
        <span className={m.foco_temporada ? 'on' : ''} title="Foco da temporada">foco ×1,25{m.foco_temporada ? ' ✓' : ''}</span>
        <span className={m.territorio_prioritario ? 'on' : ''} title="Território prioritário com baixa presença">prioritário ×1,5{m.territorio_prioritario ? ' ✓' : ''}</span>
      </div>
      <div className="ms-prog"><span className="ms-bar"><i style={{ width: `${pct}%` }} /></span><span>{m.inscritos} de {m.vagas} vagas</span></div>
      <div className="ms-foot">
        <span><Icon n="cal" s={13} />até {fmtData(m.prazo)}</span>
        <span title="Nível mínimo na trilha"><Icon n="user" s={13} />nível {m.nivel_minimo}+</span>
        {camp && <span><Icon n="flag" s={13} />{camp.nome}</span>}
        <Tip c={{ tipo: 'pt', titulo: 'PT estimado desta missão', calculo: est }} className="tt-term xp">≈ {fmt(est.creditado, est.creditado % 1 ? 1 : 0)} PT</Tip>
      </div>
      {!compacto && persona.camada !== 'visitante' && m.status !== 'unificada' && (
        <div className="ms-acts">
          {bloqueada && <span className="lock-ic small"><Icon n="lock" s={12} />Requer {NOME_TRILHA[m.trilha]} {m.nivel_minimo} (você: {nivel})</span>}
          {!bloqueada && persona.camada === 'militante' && !insc && m.inscritos < m.vagas && <button className="btn primary" onClick={() => aceitarMissao(m.id)} data-testid="aceitar">Aceitar</button>}
          {insc?.status === 'aceita' && <button className="btn primary" onClick={() => checkin(m.id)} data-testid="checkin"><Icon n="pin" s={14} />Check-in</button>}
          {insc && insc.status !== 'entregue' && <button className="btn" onClick={() => st().set({ modal: { tipo: 'entrega', missao: m.id } })} data-testid="registrar-entrega"><Icon n="doc" s={14} />Registrar entrega</button>}
          <button className="btn ghost" onClick={() => mapBus.emit({ tipo: 'ponto', ll: [m.lng, m.lat], zoom: 14 })}><Icon n="map" s={14} />Ver no mapa</button>
        </div>
      )}
    </article>
  );
}
