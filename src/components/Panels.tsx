// Painéis do trilho: Alertas, Decisões (+ pesos de Lacunas), Delegações, Relatórios (balanço de temporada), Configurações.
import { useState } from 'react';
import { HOJE, fmt, fmtData } from '../data/indicators';
import type { CamadaId } from '../data/types';
import { NOME_TRILHA } from '../domain/levels';
import { acessoDecisao, acessoPesos, NOME_CAMADA } from '../domain/permissions';
import { DELEGACOES } from '../content/textos';
import { selecionar, telaInicial, trocarPersona } from '../state/actions';
import { useAlertas, useContexto, useDados, useEntregas, useMissoes, usePersona } from '../state/derived';
import { MILITANTE_NIVEL1, PERSONA_PADRAO, VALIDADOR_PADRAO, personas } from '../state/personas';
import { fmtQuando, st, useStore } from '../state/store';
import { Fict, Locked, Src } from '../ui/common';
import { DrawerHead } from '../ui/DrawerHead';
import { ICONE_CATEGORIA, NOME_CATEGORIA, Icon } from '../ui/icons';
import { Term } from './NestedTooltip';
import { SeasonCard } from './SeasonCard';
import { motorAtual } from '../map/MapView';

const fechar = () => st().set({ painel: null });

export function AlertsPanel() {
  const dados = useDados();
  const persona = usePersona();
  const alertas = useAlertas();
  const sel = useStore((s) => s.sel);
  const meus = alertas.filter((a) => a.criadoNoApp && (a as { autor?: string }).autor === persona.id);
  const novos = alertas.filter((a) => a.status === 'novo' && !(a as { autor?: string }).autor?.startsWith(persona.id)).slice(0, 15);
  const consent = useStore((s) => s.consentimento[s.personaId]);
  const linha = (a: (typeof alertas)[number]) => (
    <button key={a.id} className="al-row" onClick={() => { st().set({ modal: { tipo: 'alerta', id: a.id } }); }}>
      <Icon n={ICONE_CATEGORIA[a.categoria]} s={16} />
      <div><b>{NOME_CATEGORIA[a.categoria]} · {dados.distritoPorId[a.distrito]?.nome}</b><small>{a.confirmTotal} de 3 confirmações · {fmtData(a.criado_em)}</small></div>
      <span className={`chip-s ${a.status === 'novo' ? 'wait' : 'ok'}`}>{a.status.replace('_', ' ')}</span>
    </button>
  );
  return (
    <div className="dr-col">
      <DrawerHead code="ALE" eyebrow="Zeladoria · confirmação independente" titulo="Alertas" onClose={fechar} />
      <div className="dr-body">
        <button className="btn primary big" onClick={() => st().set({ modal: { tipo: 'registrar-alerta' } })} data-testid="painel-registrar"><Icon n="plus" s={16} />Registrar alerta</button>
        <p className="nota">Um alerta passa a contar em <Term id="zeladoria">Zeladoria</Term> quando 3 pessoas diferentes confirmam. Alertas não guardam quem os criou para uso do partido.</p>
        <div className="block"><div className="block-h"><span>{persona.camada === 'visitante' ? 'Meus alertas' : 'Registrados nesta sessão'}</span><small>{meus.length}</small></div>{meus.map(linha)}{!meus.length && <div className="empty">Nenhum ainda</div>}</div>
        <div className="block"><div className="block-h"><span>Aguardando confirmação{sel ? ` · ${dados.distritoPorId[sel].nome}` : ''}</span><small>novos</small></div>{(sel ? alertas.filter((a) => a.status === 'novo' && a.distrito === sel) : novos).map(linha)}</div>
        {persona.camada === 'visitante' && <div className="aviso-leg"><b>Conhecer o partido</b> · contato só com consentimento explícito e revogável ⚖. {consent?.aceito ? 'Seu pedido está registrado.' : ''} <button className="link" onClick={() => st().set({ modal: { tipo: 'convite' } })}>saiba mais</button></div>}
        <div className="dr-foot"><Src t="Cidade Missão (dado do app) · 2026 · ponto/distrito" /><Fict /></div>
      </div>
    </div>
  );
}

export function PesosResumo() {
  const ctx = useContexto();
  const pesos = useStore((s) => s.pesos);
  const log = useStore((s) => s.pesosLog);
  const ac = acessoPesos(ctx);
  return (
    <div className="block" data-testid="pesos-lacunas"><div className="block-h"><span>Pesos do <Term id="lacunas">índice de Lacunas</Term></span><small>hipóteses (H) · doc. 6.1</small></div>
      <div className="tip-src"><span>Problemas</span><b>{fmt(pesos.problemas, 2)}</b><span>Vulnerabilidade</span><b>{fmt(pesos.vulnerabilidade, 2)}</b><span>Presença (1 − P)</span><b>{fmt(pesos.presenca, 2)}</b></div>
      {ac.ok ? <button className="btn" onClick={() => st().set({ modal: { tipo: 'pesos' } })} data-testid="abrir-pesos"><Icon n="gap" s={14} />Ajustar pesos</button>
        : <div className="lock-ic small" data-testid="pesos-bloqueado"><Icon n="lock" s={12} />Somente a direção municipal ajusta os pesos.</div>}
      {log.map((l, i) => <div key={i} className="hist-item"><time>{fmtQuando(l.quando)}</time><div>{fmt(l.antes.problemas, 2)}/{fmt(l.antes.vulnerabilidade, 2)}/{fmt(l.antes.presenca, 2)} → <b>{fmt(l.depois.problemas, 2)}/{fmt(l.depois.vulnerabilidade, 2)}/{fmt(l.depois.presenca, 2)}</b><small>{l.quem}</small></div></div>)}
    </div>
  );
}

export function DecisionsPanel() {
  const dados = useDados();
  const ctx = useContexto();
  const decisoes = useStore((s) => s.decisoes);
  const historico = useStore((s) => s.historico);
  if (ctx.camada === 'visitante' || ctx.camada === 'militante') return <div className="dr-col"><DrawerHead titulo="Decisões" onClose={fechar} /><div className="dr-body"><Locked motivo="Disponível a partir da camada Autoridade (decisões locais) e Direção." /></div></div>;
  return (
    <div className="dr-col">
      <DrawerHead code="DEC" eyebrow="Janelas de decisão · histórico" titulo="Decisões" onClose={fechar} />
      <div className="dr-body">
        {dados.decisoes.map((d) => {
          const reg = decisoes.find((x) => x.id === d.id);
          const ac = acessoDecisao(d.camada_minima, ctx);
          return (
            <div key={d.id} className="mission" style={{ '--tc': 'var(--hi)' } as React.CSSProperties}>
              <div className="ms-head"><span className="ms-track"><Icon n="scale" s={16} /></span><div><small>{d.id} · prazo {fmtData(d.prazo)}</small><b>{d.titulo}</b></div><span className={`ms-state ${reg ? 'st-done' : 'st-late'}`}>{reg ? 'decidida' : 'pendente'}</span></div>
              <p>{d.contexto}</p>
              {reg ? <p><b>{reg.opcao}. {reg.texto}</b> · {reg.quem} ({NOME_CAMADA[reg.camada]}) em {fmtQuando(reg.quando)} · {reg.missoes.length} missões sugeridas criadas</p>
                : <button className="btn primary" disabled={!ac.ok} onClick={() => st().set({ modal: { tipo: 'decisao', id: d.id } })} data-testid="abrir-decisao">Abrir janela de decisão</button>}
            </div>
          );
        })}
        <PesosResumo />
        <div className="block"><div className="block-h"><span>Histórico de coordenação</span><small>quem decidiu e quando</small></div>
          {historico.filter((h) => ['decisao', 'coordenacao', 'pesos', 'exportacao'].includes(h.tipo)).map((h) => <div key={h.id} className="hist-item"><time>{fmtQuando(h.quando)}</time><div>{h.texto}<small>{h.quem} · {NOME_CAMADA[h.camada]}</small></div></div>)}
        </div>
        <div className="dr-foot"><Fict /></div>
      </div>
    </div>
  );
}

export function DelegationsPanel() {
  const dados = useDados();
  const deleg = useStore((s) => s.delegacoes);
  return (
    <div className="dr-col">
      <DrawerHead code="DLG" eyebrow="Responsabilidade com prazo e escopo" titulo="Delegações" onClose={fechar} />
      <div className="dr-body">
        <p className="nota"><Term id="delegacao">Delegações</Term> expiram se não forem renovadas. Poderes são funções, não autoridade sobre pessoas.</p>
        {DELEGACOES.map((d) => { const s = deleg[d.id]; const ate = s?.ate ?? d.ate; const enc = s?.status === 'encerrada'; return (
          <div key={d.id} className="ent-row" style={{ borderLeftColor: enc ? 'var(--line2)' : ate <= '2026-10-16' ? 'var(--hi)' : 'var(--ok)' }}>
            <div><b>{d.escopo}</b><small>{d.para} · {d.distritos.map((x) => dados.distritoPorId[x].nome).join(', ')}</small></div>
            <span className={`chip-s ${enc ? 'neg' : ate <= '2026-10-16' ? 'late' : 'ok'}`}>{enc ? 'encerrada' : `até ${fmtData(ate)}`}</span>
          </div>
        ); })}
        <div className="dr-foot"><Fict /></div>
      </div>
    </div>
  );
}

export function ReportsPanel() {
  const dados = useDados();
  const missoes = useMissoes();
  const entregas = useEntregas();
  const alertas = useAlertas();
  const val = entregas.filter((e) => e.status === 'validada');
  const porRamo: Record<string, number> = {};
  for (const e of val) { const k = `${NOME_TRILHA[e.trilha]} · ${e.ramo ? dados.trilhas[e.trilha].ramos[e.ramo]?.nome : 'geral'}`; porRamo[k] = (porRamo[k] ?? 0) + 1; }
  return (
    <div className="dr-col">
      <DrawerHead code={dados.temporada.id} eyebrow="Balanço público interno · doc. 4.4" titulo="Relatórios" onClose={fechar} />
      <div className="dr-body">
        <SeasonCard />
        <div className="block"><div className="block-h"><span>Balanço da temporada (parcial)</span><small>dados fictícios</small></div>
          <div className="kpis">
            <div className="kpi"><Icon n="check" s={22} /><div><b>{val.length}</b><small>entregas verificadas</small></div><span className="kpi-l">Entregue</span></div>
            <div className="kpi"><Icon n="bell" s={22} /><div><b>{alertas.filter((a) => a.status === 'resolvido').length}</b><small>alertas resolvidos (amostra)</small></div><span className="kpi-l">Mudou no território</span></div>
            <div className="kpi"><Icon n="flag" s={22} /><div><b>{missoes.filter((m) => m.foco_temporada).length}</b><small>missões ligadas ao foco</small></div><span className="kpi-l">Foco</span></div>
            <div className="kpi"><Icon n="layers" s={22} /><div><b>{alertas.filter((a) => a.status === 'caso_coletivo').length}</b><small>casos coletivos abertos</small></div><span className="kpi-l">Cobrança</span></div>
          </div>
        </div>
        <div className="block"><div className="block-h"><span>Destaque por ramo</span><small>sem ranking geral de pessoas</small></div>
          {Object.entries(porRamo).map(([k, n]) => <div key={k} className="pair-row pos"><Icon n="medal" s={16} /><span>{k}</span><b>{n}</b></div>)}
          <p className="nota">O documento prevê destaque por ramo na temporada e metas de núcleos; não há ranking público de pessoas nem streaks (doc. 4.6).</p>
        </div>
        <div className="dr-foot"><Src t="Cidade Missão (dado do app) · 2026 · município" /><Fict /></div>
      </div>
    </div>
  );
}

export function DevSelector({ onPronto }: { onPronto?: () => void }) {
  const dados = useDados();
  const camada = useStore((s) => s.camada), pid = useStore((s) => s.personaId);
  const [c, setC] = useState<CamadaId>(camada);
  const lista = personas(dados).filter((p) => p.camada === c);
  const aplicar = (id: string, cam: CamadaId, pronto = true) => { const mudou = cam !== st().camada; trocarPersona(id); if (mudou) telaInicial(cam); if (pronto) onPronto?.(); };
  return (
    <div className="dc-sec" data-testid="dev-selector">
      <div role="radiogroup" aria-label="Camada" className="filters">
        {(['visitante', 'militante', 'autoridade', 'direcao'] as CamadaId[]).map((k) => (
          <button key={k} role="radio" aria-checked={c === k} className={`chip${c === k ? ' is-sel' : ''}`} onClick={() => { setC(k); aplicar(PERSONA_PADRAO[k], k, false); }} data-testid={`camada-${k}`}>{NOME_CAMADA[k]}</button>
        ))}
      </div>
      <div className="filters">
        {c === 'militante' && <>
          <button className="chip" onClick={() => aplicar('MIL-0001', 'militante')} data-testid="persona-marina">Marina (Fiscalista 4)</button>
          <button className="chip" onClick={() => aplicar(MILITANTE_NIVEL1, 'militante')} data-testid="persona-nivel1">Nível 1 (bloqueios)</button>
          <button className="chip" onClick={() => aplicar(VALIDADOR_PADRAO, 'militante')} data-testid="persona-validador">Validador (Fiscalista 5, outro núcleo)</button>
        </>}
        {c === 'visitante' && ['VIS-A', 'VIS-B', 'VIS-C'].map((v) => <button key={v} className={`chip${pid === v ? ' is-sel' : ''}`} onClick={() => aplicar(v, 'visitante')} data-testid={`persona-${v}`}>{v.replace('VIS-', 'Visitante ')}</button>)}
      </div>
      <label className="field">Persona
        <select value={lista.some((p) => p.id === pid) ? pid : ''} onChange={(e) => aplicar(e.target.value, c)} data-testid="persona-select">
          {!lista.some((p) => p.id === pid) && <option value="">—</option>}
          {lista.map((p) => <option key={p.id} value={p.id}>{p.nome} · {p.descricao}</option>)}
        </select>
      </label>
      <p className="nota">Simulação de login (atalho <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd>). Pessoas fictícias. Visitantes simulados não têm dados pessoais e nunca entram em listas do partido.</p>
    </div>
  );
}

export function SettingsPanel() {
  const tema = useStore((s) => s.tema), eco = useStore((s) => s.economia), mini = useStore((s) => s.minimapa);
  const camada = useStore((s) => s.camada);
  return (
    <div className="dr-col">
      <DrawerHead code="CFG" eyebrow="Protótipo · desenvolvedor" titulo="Configurações" onClose={fechar} />
      <div className="dr-body">
        <div className="block"><div className="block-h"><span>Camada e persona</span><small>agora: {NOME_CAMADA[camada]}</small></div><DevSelector /></div>
        <div className="block"><div className="block-h"><span>Aparência</span></div>
          <div className="filters">
            <button className={`chip${tema === 'escuro' ? ' is-sel' : ''}`} onClick={() => st().set({ tema: 'escuro' })}><Icon n="moon" s={12} />Escuro</button>
            <button className={`chip${tema === 'claro' ? ' is-sel' : ''}`} onClick={() => st().set({ tema: 'claro' })} data-testid="tema-claro"><Icon n="sun" s={12} />Claro (papel e tinta)</button>
          </div>
          <label className="check"><input type="checkbox" checked={eco} onChange={() => st().set({ economia: !eco })} data-testid="economia" />Modo economia de dados: mapa simplificado (sem malha viária, coropleta sem bordas finas)</label>
          <label className="check"><input type="checkbox" checked={mini} onChange={() => st().set({ minimapa: !mini })} />Minimapa visível (<kbd>N</kbd>)</label>
        </div>
        <div className="block"><div className="block-h"><span>Motor do mapa</span></div>
          <p className="nota">Em uso: <b>{motorAtual.m?.tipo === 'google' ? 'Google Maps (com chave)' : 'renderizador próprio (sem chave)'}</b>. Para usar o Google, crie <code>.env.local</code> com <code>VITE_GOOGLE_MAPS_API_KEY</code>. Para forçar o renderizador próprio: <code>?motor=proprio</code>.</p>
        </div>
        <div className="block"><div className="block-h"><span>Dados de demonstração</span></div>
          <p className="nota">O que você faz (alertas, missões, entregas, PT, decisões, pesos, preferências) fica salvo neste navegador.</p>
          <button className="btn" onClick={() => { if (window.confirm('Restaurar os dados de demonstração? Isso apaga o que foi feito neste navegador.')) { st().restaurarDemo(); location.reload(); } }} data-testid="restaurar"><Icon n="refresh" s={14} />Restaurar dados de demonstração</button>
        </div>
        <div className="block"><div className="block-h"><span>Atalhos</span></div>
          <dl className="kv small">
            <dt><kbd>1</kbd>–<kbd>0</kbd></dt><dd>painéis do trilho</dd><dt><kbd>M</kbd></dt><dd>seletor de modos</dd><dt><kbd>L</kbd></dt><dd>Ledger</dd>
            <dt><kbd>[</kbd> <kbd>]</kbd></dt><dd>mês anterior / seguinte</dd><dt><kbd>N</kbd></dt><dd>minimapa</dd><dt><kbd>Esc</kbd></dt><dd>fecha o nível mais alto</dd>
            <dt>setas</dt><dd>movem o mapa quando focado</dd><dt>letras</dt><dd>A D R S E G I Z P O C T: modos</dd><dt><kbd>Alt</kbd></dt><dd>fixa o tooltip</dd>
          </dl>
        </div>
        <div className="dr-foot"><span className="small muted">Hoje no protótipo: {fmtData(HOJE)}</span><Fict /></div>
      </div>
    </div>
  );
}

export { selecionar };
