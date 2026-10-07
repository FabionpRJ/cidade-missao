// Ficha do núcleo (doc. 4.3): nível, requisito do próximo nível, membros ativos, coordenadores por trilha, metas.
import { fmtData } from '../data/indicators';
import type { NucleoNivel } from '../data/types';
import { acessoAba } from '../domain/permissions';
import { selecionar } from '../state/actions';
import { useContexto, useDados, useMissoes, usePersona } from '../state/derived';
import { st, useStore } from '../state/store';
import { Fict, Locked } from '../ui/common';
import { DrawerHead } from '../ui/DrawerHead';
import { ICONE_NUCLEO, Icon } from '../ui/icons';
import { MissionCard } from './MissionCard';
import { Term } from './NestedTooltip';

const ORDEM: NucleoNivel[] = ['em formação', 'Semente', 'Raiz', 'Tronco', 'Copa'];
const ATIVOS_MIN: Record<string, number> = { Semente: 5, Raiz: 10, Tronco: 20, Copa: 40 };

export function NucleusSheet() {
  const dados = useDados();
  const ctx = useContexto();
  const persona = usePersona();
  const nucleoId = useStore((s) => s.nucleoId);
  const missoes = useMissoes();
  const meu = persona.militanteId ? dados.militantePorId[persona.militanteId]?.nucleo : undefined;
  const id = nucleoId ?? meu;
  if (ctx.camada === 'visitante') return <div className="dr-col"><DrawerHead titulo="Núcleo" onClose={() => st().set({ painel: null })} /><div className="dr-body"><Locked motivo="Disponível a partir da camada Militante." /></div></div>;
  const n = id ? dados.nucleoPorId[id] : null;
  if (!n) {
    const lista = dados.nucleos.slice(0, 60);
    return (<div className="dr-col"><DrawerHead titulo="Núcleos" eyebrow="Escolha um núcleo" onClose={() => st().set({ painel: null })} />
      <div className="dr-body">{lista.map((x) => <button key={x.id} className="nuc-row" onClick={() => st().set({ nucleoId: x.id })}><span className="nuc-ic t-mil"><Icon n={ICONE_NUCLEO[x.nivel]} s={16} /></span><div><b>{x.nome}</b><small>{x.nivel} · {x.militantes_ativos} ativos</small></div><span className="chev"><Icon n="right" s={14} /></span></button>)}</div></div>);
  }
  const i = ORDEM.indexOf(n.nivel);
  const prox = ORDEM[i + 1];
  const regra = dados.regras.nucleo_niveis.find((r) => r.nivel === prox);
  const atual = dados.regras.nucleo_niveis.find((r) => r.nivel === n.nivel);
  const alvo = prox ? ATIVOS_MIN[prox] : null;
  const ms = missoes.filter((m) => m.nucleo === n.id && m.status !== 'unificada');
  const proprio = ctx.camada !== 'militante' || n.id === meu;
  const membros = dados.militantes.filter((m) => m.nucleo === n.id);
  const partido = acessoAba('partido', ctx);
  const coord = (t: string) => (t === 'militante' ? n.coordenador : membros.find((m) => m.trilhas[t as 'fiscalista'].nivel >= 4)?.nome) ?? null;
  const entregues = ms.filter((m) => m.status === 'em_curso').length;
  return (
    <div className="dr-col">
      <DrawerHead code={n.id} eyebrow={<>Núcleo · {dados.distritoPorId[n.distrito]?.nome}</>} titulo={n.nome.replace('Núcleo ', '')} onClose={() => st().set({ painel: null })}
        tools={<button className="icon-btn round" title="Ver distrito" aria-label="Ver distrito" onClick={() => selecionar(n.distrito, { centrar: true })}><Icon n="map" s={16} /></button>} />
      <div className="dr-body">
        {!partido.ok ? <Locked motivo={partido.motivo!} /> : (<>
          <div className="kpis">
            <div className="kpi"><Icon n={ICONE_NUCLEO[n.nivel]} s={22} /><div><b>{n.nivel}</b><small>{atual?.desbloqueia ?? 'em formação'}</small></div><span className="kpi-l"><span>Nível do <Term id="nucleo">núcleo</Term></span></span></div>
            <div className="kpi"><Icon n="users" s={22} /><div><b>{n.militantes_ativos}</b><small>militantes ativos</small></div><span className="kpi-l"><span>Membros</span></span></div>
          </div>
          <div className="block"><div className="block-h"><span>Próximo nível</span><small>{prox ?? 'nível máximo'}</small></div>
            {regra ? (<>
              <div className="ms-prog"><span className="ms-bar"><i style={{ width: `${Math.min(100, (n.militantes_ativos / (alvo ?? 1)) * 100)}%`, background: 'var(--t-mil)' }} /></span><span>{n.militantes_ativos} de {alvo} ativos</span></div>
              <p className="nota">Requisito: <b>{regra.requisito}</b>. Desbloqueia: {regra.desbloqueia}. Metas comparadas com o próprio núcleo, nunca com a derrota de outro.</p>
            </>) : <p className="nota">Copa: assento consultivo na direção municipal.</p>}
          </div>
          <div className="block"><div className="block-h"><span>Coordenadores por trilha</span><small>{proprio ? 'sem contato' : 'restrito ao seu núcleo'}</small></div>
            {(['fiscalista', 'intelectual', 'militante'] as const).map((t) => (
              <div key={t} className={`pair-row t-${t.slice(0, 3)}`}><span className="dot" /><span>{t[0].toUpperCase() + t.slice(1)}</span><b style={{ font: '600 13px var(--f-ui)' }}>{proprio ? coord(t) ?? 'vago' : '—'}</b></div>
            ))}
            <span className="small muted">Reunião: {n.reuniao}</span>
          </div>
          <div className="block"><div className="block-h"><span>Metas da temporada</span><small>{dados.temporada.nome}</small></div>
            <div className="ms-prog"><span className="ms-bar"><i style={{ width: `${ms.length ? (entregues / ms.length) * 100 : 0}%`, background: 'var(--hi)' }} /></span><span>{entregues} de {ms.length} missões em curso</span></div>
            {dados.campanhas.filter((c) => c.territorio.includes(n.distrito)).map((c) => <div key={c.id} className="ms-prog"><span className="ms-bar"><i style={{ width: `${c.progresso * 100}%`, background: 'var(--t-mil)' }} /></span><span>{c.nome} · até {fmtData(c.prazo)}</span></div>)}
          </div>
          <div className="block"><div className="block-h"><span>Missões do núcleo</span><small>{ms.length}</small></div>{ms.slice(0, 6).map((m) => <MissionCard key={m.id} m={m} compacto />)}</div>
        </>)}
        <div className="dr-foot"><span className="small muted">Núcleo e números fictícios</span><Fict /></div>
      </div>
    </div>
  );
}
