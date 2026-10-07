// Janelas: decisão, registrar/confirmar alerta, missão, entrega, validação, ficha do município, convite, seletor de camada, campanha, pesos.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HOJE, desatualizado, fmt, fmtData, fmtN } from '../data/indicators';
import type { CategoriaAlerta, EvidenciaTipo, VerificacaoId } from '../data/types';
import { FICHA_MUNICIPIO } from '../content/textos';
import { acessoDecisao, acessoPesos, NOME_CAMADA } from '../domain/permissions';
import { calcularPT, contaPT, NOME_VERIFICACAO, ptNaSemana } from '../domain/points';
import { NOME_TRILHA } from '../domain/levels';
import { normalizarPesos, PESOS_PADRAO, type PesosLacunas } from '../domain/lacunas';
import { alterarPesos, confirmarAlerta, consentir, contestarEntrega, decidir, registrarAlerta, registrarEntrega, validarEntrega } from '../state/actions';
import { useAlertas, useContexto, useDados, useEntregas, useIndicadores, useMissoes, usePersona } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st, useStore, type Modal } from '../state/store';
import { Fict, Src } from '../ui/common';
import { ICONE_CATEGORIA, NOME_CATEGORIA, Icon } from '../ui/icons';
import { MissionCard } from './MissionCard';
import { Term, Tip } from './NestedTooltip';
import { DevSelector } from './Panels';

const fechar = () => st().set({ modal: null });

function Janela({ titulo, eyebrow, code, children, sm, testid }: { titulo: string; eyebrow?: ReactNode; code?: string; children: ReactNode; sm?: boolean; testid?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLElement>('button:not(.icon-btn), input, select, textarea')?.focus(); }, []);
  return (
    <div className="modal-bg" onPointerDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div ref={ref} className={`cm-modal${sm ? ' sm' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-t" data-testid={testid}>
        <div className="dc-head"><span className="line-strip" aria-hidden="true" /><small className="eyebrow">{code && <span className="code">{code}</span>}{eyebrow}</small><h3 id="modal-t">{titulo}</h3><Fict className="dc-fict" />
          <button className="icon-btn" aria-label="Fechar (Esc)" onClick={fechar}><Icon n="close" s={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

function DecisaoModal({ id }: { id: string }) {
  const dados = useDados();
  const ctx = useContexto();
  const d = dados.decisoes.find((x) => x.id === id)!;
  const reg = useStore((s) => s.decisoes.find((x) => x.id === id));
  const [op, setOp] = useState<string | null>(null);
  const ac = acessoDecisao(d.camada_minima, ctx);
  return (
    <Janela titulo={d.titulo} code={d.id} eyebrow={`Decisão · ${ctx.camada === 'direcao' ? 'Diretório municipal' : 'Coordenação local'}`} testid="janela-decisao">
      <p className="dc-body">{d.contexto} Cada escolha muda as missões sugeridas para os núcleos.</p>
      <div className="dc-opts" role="radiogroup" aria-label="Opções">
        {d.opcoes.map((o) => (
          <button key={o.id} role="radio" aria-checked={op === o.id} className="dc-opt" disabled={o.bloqueada || !!reg} onClick={() => setOp(o.id)} data-testid={`opcao-${o.id}`}>
            <span className="dc-k">{o.bloqueada ? <Icon n="lock" s={12} /> : o.id}</span>
            <div><b>{o.texto}</b><small>{o.efeitos}{o.efeitos.includes('custo') ? <> · <Tip as="span" c={{ tipo: 'texto', titulo: 'Custo de coordenação', texto: 'Esforço estimado para organizar a ação: núcleos envolvidos, deslocamento e reuniões. Não envolve dinheiro (nenhum fluxo financeiro no app).' }}>o que é custo de coordenação?</Tip></> : null}</small></div>
          </button>
        ))}
      </div>
      {reg && <p className="dc-body"><b>Registrada:</b> {reg.opcao}. {reg.texto} · {reg.quem} ({NOME_CAMADA[reg.camada]}) · {reg.quando.replace('T', ' ')}</p>}
      <div className="dc-foot">
        <span><Icon n="clock" s={13} />Decidir até {fmtData(d.prazo)}</span><span><Icon n="users" s={13} />3 dirigentes já opinaram (fictício)</span>
        {!reg && <button className="btn primary" disabled={!op || !ac.ok} onClick={() => op && decidir(d.id, op)} data-testid="confirmar-decisao"><Icon n="check" s={14} />Registrar decisão</button>}
      </div>
      {!ac.ok && <p className="dc-body lock-ic"><Icon n="lock" s={12} />{ac.motivo}</p>}
    </Janela>
  );
}

function RegistrarAlerta({ m }: { m: Extract<Modal, { tipo: 'registrar-alerta' }> }) {
  const dados = useDados();
  const persona = usePersona();
  const sel = useStore((s) => s.sel);
  const [cat, setCat] = useState<CategoriaAlerta | undefined>(m.categoria);
  const [desc, setDesc] = useState('');
  const [feito, setFeito] = useState<string | null>(null);
  const passo = feito ? 4 : !cat ? 1 : !m.ponto ? 2 : 3;
  const escolherNoMapa = () => { st().set({ modal: null, escolhendoPonto: cat! }); };
  const usarDistrito = () => { const d = dados.distritoPorId[sel ?? persona.distrito ?? 'BRL']; st().set({ modal: { tipo: 'registrar-alerta', categoria: cat, ponto: { lng: d.rotulo.lng + 0.002, lat: d.rotulo.lat - 0.002, distrito: d.id } } }); };
  return (
    <Janela titulo={feito ? 'Alerta registrado' : 'Registrar alerta'} code="ALE" eyebrow="Zeladoria · sem dados pessoais" sm testid="registrar-alerta-modal">
      <div className="steps" aria-label={`Passo ${passo} de 4`}>{[1, 2, 3, 4].map((i) => <span key={i} className={i <= passo ? 'on' : ''} />)}</div>
      {!feito && (<div className="dc-sec">
        <b className="small">1 · Categoria</b>
        <div className="cats-grid" role="radiogroup" aria-label="Categoria">
          {(Object.keys(NOME_CATEGORIA) as CategoriaAlerta[]).map((c) => (
            <button key={c} role="radio" aria-checked={cat === c} className="cat" onClick={() => { setCat(c); if (m.ponto) st().set({ modal: { ...m, categoria: c } }); }} data-testid={`cat-${c}`}><Icon n={ICONE_CATEGORIA[c]} s={20} /><small>{NOME_CATEGORIA[c]}</small></button>
          ))}
        </div>
        <b className="small">2 · Local</b>
        {m.ponto ? <div className="row small"><Icon n="pin" s={14} />{dados.distritoPorId[m.ponto.distrito].nome} · posição aproximada <button className="link" onClick={escolherNoMapa}>trocar</button></div>
          : <div className="row wrap"><button className="btn primary" disabled={!cat} onClick={escolherNoMapa} data-testid="tocar-mapa"><Icon n="pin" s={14} />Tocar no mapa</button><button className="btn ghost" disabled={!cat} onClick={usarDistrito}>usar o distrito selecionado</button></div>}
        <b className="small">3 · Descrição (opcional)</b>
        <label className="field"><span className="sr">Descrição</span><textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={140} placeholder="Ex.: poste apagado na esquina (sem nomes, telefones ou placas)" data-testid="descricao" /></label>
        <div className="dc-foot" style={{ padding: 0 }}>
          <span className="small">Não pedimos nome nem contato. Alertas de segurança seguem o protocolo de anonimato.</span>
          <button className="btn primary" disabled={!cat || !m.ponto} onClick={() => { const id = registrarAlerta({ categoria: cat!, ...m.ponto!, descricao: desc.trim() || undefined }); setFeito(id); }} data-testid="enviar-alerta"><Icon n="send" s={14} />Enviar</button>
        </div>
      </div>)}
      {feito && (<div className="dc-sec">
        <p className="dc-body" style={{ padding: 0 }}>Seu alerta aparece no mapa como <b>novo</b>, com pulsação discreta. Ele passa a contar em Zeladoria quando <Term id="alerta-confirmado">3 pessoas diferentes confirmarem</Term>.</p>
        <div className="row"><button className="btn" onClick={() => { fechar(); mapBus.emit({ tipo: 'ponto', ll: [m.ponto!.lng, m.ponto!.lat], zoom: 14 }); }}><Icon n="map" s={14} />Ver no mapa</button></div>
        {persona.camada === 'visitante' && <Convite />}
      </div>)}
    </Janela>
  );
}

function Convite() {
  const c = useStore((s) => s.consentimento[s.personaId]);
  const [ok, setOk] = useState(false);
  return (
    <div className="aviso-leg" style={{ borderStyle: 'solid' }} data-testid="convite">
      <b>Conhecer o partido</b> · O app é do Partido Missão. Se quiser saber como participar, podemos indicar o canal oficial. <b>Nenhum dado seu é coletado aqui</b>; o pedido de contato exige consentimento explícito, específico e revogável ⚖ e nunca é cruzado com listas do partido.
      {c?.aceito ? (
        <div className="row" style={{ marginTop: 8 }}><span className="chip-s ok">consentimento registrado (simulado)</span><button className="btn ghost" onClick={() => consentir(false)} data-testid="revogar">Revogar</button></div>
      ) : (<>
        <label className="check" style={{ marginTop: 8 }}><input type="checkbox" checked={ok} onChange={() => setOk(!ok)} data-testid="consentimento" />Concordo em ser indicado(a) ao canal oficial do partido para contato. Posso revogar a qualquer momento.</label>
        <button className="btn" disabled={!ok} onClick={() => consentir(true)} style={{ marginTop: 6 }} data-testid="pedir-contato">Quero conhecer</button>
      </>)}
    </div>
  );
}

function AlertaModal({ id }: { id: string }) {
  const dados = useDados();
  const persona = usePersona();
  const a = useAlertas().find((x) => x.id === id);
  if (!a) return null;
  const meu = a.criadoNoApp && (a as { autor?: string }).autor === persona.id;
  const ja = a.confirmadores.includes(persona.id);
  return (
    <Janela titulo={`${NOME_CATEGORIA[a.categoria]} · ${dados.distritoPorId[a.distrito].nome}`} code={a.id} eyebrow={`Alerta · ${a.status.replace('_', ' ')}`} sm testid="alerta-modal">
      <div className="dc-sec">
        <div className="sh-stat"><div className="sh-big"><b>{Math.min(a.confirmTotal, 99)}</b><span>de 3 confirmações independentes<br />{a.status === 'novo' ? 'ainda não conta em Zeladoria' : 'conta em Zeladoria'}</span></div>
          <div className="ms-prog"><span className="ms-bar"><i style={{ width: `${Math.min(100, (a.confirmTotal / 3) * 100)}%`, background: a.status === 'novo' ? 'var(--warn)' : 'var(--ok)' }} /></span><span>{a.status.replace('_', ' ')}</span></div>
        </div>
        {a.descricao && <p className="dc-body" style={{ padding: 0 }}>“{a.descricao}”</p>}
        <span className="small muted">Registrado em {fmtData(a.criado_em)} · posição aproximada · quem registrou não é identificado</span>
        <div className="row wrap">
          {a.status === 'novo' && !meu && !ja && persona.camada === 'visitante' && <button className="btn primary" onClick={() => confirmarAlerta(a.id)} data-testid="confirmar-alerta"><Icon n="check" s={14} />Confirmar que vi</button>}
          {a.status === 'novo' && !meu && !ja && persona.camada !== 'visitante' && <button className="btn primary" onClick={() => confirmarAlerta(a.id)}><Icon n="check" s={14} />Confirmar</button>}
          {meu && <span className="chip-s wait">registrado por você · aguardando outras pessoas</span>}
          {ja && <span className="chip-s ok">você já confirmou</span>}
          <button className="btn ghost" onClick={() => { fechar(); mapBus.emit({ tipo: 'ponto', ll: [a.lng, a.lat], zoom: 15 }); }}><Icon n="map" s={14} />Ver no mapa</button>
        </div>
        {persona.camada === 'visitante' && a.status !== 'novo' && a.confirmadoNoApp && <Convite />}
        <Src t="Cidade Missão (dado do app) · 2026 · ponto" />
      </div>
    </Janela>
  );
}

function EntregaModal({ missao }: { missao: string }) {
  const m = useMissoes().find((x) => x.id === missao);
  const [ev, setEv] = useState<EvidenciaTipo>('foto');
  const [det, setDet] = useState('');
  if (!m) return null;
  const pronto = ev === 'foto' || det.trim().length > 2;
  return (
    <Janela titulo="Registrar entrega" code={m.id} eyebrow={`${NOME_TRILHA[m.trilha]} · ${m.titulo}`} sm testid="entrega-modal">
      <div className="dc-sec">
        <b className="small">Evidência</b>
        <div className="cats-grid" role="radiogroup" aria-label="Tipo de evidência">
          {([['foto', 'camera', 'Foto (simulada)'], ['protocolo', 'doc', 'Protocolo'], ['ata', 'ledger', 'Ata'], ['link de publicação', 'send', 'Publicação']] as const).map(([k, i, l]) => (
            <button key={k} role="radio" aria-checked={ev === k} className="cat" onClick={() => { setEv(k); setDet(''); }} data-testid={`ev-${k.split(' ')[0]}`}><Icon n={i} s={20} /><small>{l}</small></button>
          ))}
        </div>
        {ev === 'foto' && <div className="aviso-leg row"><Icon n="camera" s={18} />Foto simulada anexada (foto_{m.id.toLowerCase()}.jpg) · sem rostos nem placas · localização aproximada</div>}
        {ev === 'protocolo' && <label className="field">Número do protocolo<input value={det} onChange={(e) => setDet(e.target.value)} placeholder="Ex.: SP-2026-0012345 (fictício)" data-testid="detalhe" /></label>}
        {ev === 'ata' && <label className="field">Resumo da ata<textarea value={det} onChange={(e) => setDet(e.target.value)} placeholder="Pauta, presentes (número), encaminhamentos" data-testid="detalhe" /></label>}
        {ev === 'link de publicação' && <label className="field">Link da publicação<input value={det} onChange={(e) => setDet(e.target.value)} placeholder="https://… (fictício)" data-testid="detalhe" /></label>}
        <p className="nota">A entrega fica <b>pendente de validação</b> por um militante de outro núcleo. Só gera PT depois de verificada.</p>
        <div className="dc-foot" style={{ padding: 0 }}><span /><button className="btn primary" disabled={!pronto} onClick={() => { registrarEntrega(m.id, ev, ev === 'foto' ? `foto_${m.id.toLowerCase()}.jpg (simulada)` : det.trim()); fechar(); }} data-testid="enviar-entrega"><Icon n="send" s={14} />Enviar para validação</button></div>
      </div>
    </Janela>
  );
}

function ValidarModal({ entrega }: { entrega: string }) {
  const dados = useDados();
  const e = useEntregas().find((x) => x.id === entrega);
  const lanc = useStore((s) => s.lancamentos);
  const [v, setV] = useState<VerificacaoId>(e?.evidencia === 'protocolo' || e?.evidencia === 'link de publicação' ? 'confirmada_por_fonte_externa' : 'validada_por_par_ou_coordenador');
  const [erro, setErro] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  if (!e) return null;
  const autor = dados.militantePorId[e.militante];
  const calc = calcularPT({ vBase: e.v_base, verificacao: v, foco_temporada: e.foco_temporada, territorio_prioritario: e.territorio_prioritario, jaNaSemana: ptNaSemana(lanc, e.militante, e.trilha, HOJE), regras: dados.regras });
  return (
    <Janela titulo="Validar entrega" code={e.id} eyebrow={`${autor?.nome} · ${NOME_TRILHA[e.trilha]}`} sm testid="validar-modal">
      <div className="dc-sec">
        <div className="ent-row"><div><b>{e.acao}</b><small>Evidência: {e.evidencia}{e.evidencia_detalhe ? ` · ${e.evidencia_detalhe}` : ''} · {fmtData(e.criada_em)}</small></div></div>
        <b className="small">Tipo de <Term id="verificacao">verificação</Term></b>
        <div className="dc-opts" style={{ padding: 0 }} role="radiogroup" aria-label="Tipo de verificação">
          {(Object.keys(NOME_VERIFICACAO) as VerificacaoId[]).map((k) => (
            <button key={k} role="radio" aria-checked={v === k} className="dc-opt" onClick={() => setV(k)} data-testid={`verif-${k}`}>
              <span className="dc-k">×{fmt(dados.regras.m_verificacao[k], 1)}</span><div><b>{NOME_VERIFICACAO[k]}</b></div>
            </button>
          ))}
        </div>
        <div className="tip-src">
          <span>Conta</span><b><Tip c={{ tipo: 'pt', titulo: 'PT desta entrega', calculo: calc }}>{contaPT(calc)}</Tip></b>
          <span>Teto semanal</span><b>{fmtN(calc.jaNaSemana)} já creditados · {fmtN(calc.creditado)} PT serão creditados{calc.naoCreditado ? ` (${fmtN(calc.naoCreditado)} acima do teto)` : ''}</b>
        </div>
        {erro && <p className="lock-ic small"><Icon n="lock" s={12} />{erro}</p>}
        <label className="field">Motivo (se contestar)<input value={motivo} onChange={(x) => setMotivo(x.target.value)} placeholder="Ex.: evidência não mostra o local" /></label>
        <div className="dc-foot" style={{ padding: 0 }}>
          <button className="btn ghost" disabled={motivo.trim().length < 3} onClick={() => { contestarEntrega(e.id, motivo.trim()); fechar(); }}>Contestar</button>
          <button className="btn primary" onClick={() => { const r = validarEntrega(e.id, v); if (r.ok) fechar(); else setErro(r.motivo ?? 'Não foi possível validar'); }} data-testid="confirmar-validacao"><Icon n="check" s={14} />Validar</button>
        </div>
      </div>
    </Janela>
  );
}

function MunicipioModal() {
  const dados = useDados();
  const ind = useIndicadores();
  const ctx = useContexto();
  const pop = dados.distritos.reduce((a, d) => a + ind[d.id].pop, 0);
  const a90 = dados.distritos.reduce((a, d) => a + ind[d.id].alertas_90d, 0);
  return (
    <Janela titulo="Ficha do município" code="SP · 3550308" eyebrow="São Paulo · doc. 8.2 · valores fictícios" testid="ficha-municipio">
      <div className="dc-sec">
        {FICHA_MUNICIPIO.map((g) => (
          <div className="block" key={g.grupo}><div className="block-h"><span>{g.grupo}</span>{g.itens.some((i) => i.app) && <span className="selo dapp">dado do app</span>}</div>
            {g.itens.map((i) => {
              const valor = i.app && i.nome.startsWith('Alertas') ? fmt((a90 / pop) * 1000, 2) : i.valor;
              const old = desatualizado({ ano: i.ano } as never);
              return (
                <div key={i.nome} className="stat-row">
                  <span className="nm">{i.nome}{old && <Term id="desatualizado"><span className="selo old">desatualizado</span></Term>}</span>
                  <Tip c={{ tipo: 'numero', titulo: i.nome, valor, fonte: i.fonte, ano: i.ano, nivel: i.nivel, app: i.app, desatualizado: old, nota: 'Valor fictício para o protótipo; a fonte indica onde buscar o dado real.' }} className="tt-term vl">{valor}</Tip>
                  <Src t={`${i.fonte} · ${i.ano} · ${i.nivel}`} />
                </div>
              );
            })}
          </div>
        ))}
        {ctx.camada !== 'visitante' && <p className="nota">Militância e operação do partido ficam fora desta ficha pública.</p>}
        <div className="row"><Fict /><span className="small muted">Todos os valores desta ficha são fictícios.</span></div>
      </div>
    </Janela>
  );
}

function MissaoModal({ id }: { id: string }) {
  const x = useMissoes().find((y) => y.id === id);
  return x ? <Janela titulo="Missão" code={x.id} eyebrow={NOME_TRILHA[x.trilha]} sm testid="missao-modal"><div className="dc-sec"><MissionCard m={x} /></div></Janela> : null;
}

function CampanhaModal({ id }: { id: string }) {
  const dados = useDados();
  const c = dados.campanhas.find((x) => x.id === id);
  const ms = useMissoes().filter((m) => m.campanha === id && m.status !== 'unificada');
  if (!c) return null;
  return (
    <Janela titulo={c.nome} code={c.id} eyebrow={`Campanha · ${c.territorio.map((t) => dados.distritoPorId[t].nome).join(', ')}`} testid="campanha-modal">
      <div className="dc-sec">
        <div className="ms-prog"><span className="ms-bar"><i style={{ width: `${c.progresso * 100}%`, background: 'var(--hi)' }} /></span><span>{Math.round(c.progresso * 100)}% · até {fmtData(c.prazo)}</span></div>
        <dl className="kv"><dt>Meta</dt><dd>{c.meta}</dd><dt>Foco da temporada</dt><dd>{c.foco_temporada ? `sim (×${fmt(dados.temporada.multiplicador, 2)})` : 'não'}</dd><dt>Coordenação</dt><dd>{c.coordenador}</dd></dl>
        <div className="block"><div className="block-h"><span>Missões ligadas</span><small>{ms.length}</small></div>{ms.slice(0, 6).map((m) => <MissionCard key={m.id} m={m} compacto />)}</div>
        <Fict />
      </div>
    </Janela>
  );
}

function PesosModal() {
  const ctx = useContexto();
  const atual = useStore((s) => s.pesos);
  const [p, setP] = useState<PesosLacunas>(atual);
  const ac = acessoPesos(ctx);
  const n = normalizarPesos(p);
  const campo = (k: keyof PesosLacunas, l: string) => (
    <label className="field" key={k}>{l}: <b>{fmt(n[k], 2)}</b>
      <input type="range" min={0} max={1} step={0.05} value={p[k]} disabled={!ac.ok} onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })} data-testid={`peso-${k}`} />
    </label>
  );
  return (
    <Janela titulo="Pesos do índice de Lacunas" code="LAC" eyebrow="Hipóteses (H) · doc. 6.1 · mudança registrada" sm testid="pesos-modal">
      <div className="dc-sec">
        <p className="nota">Lacuna = <b>{fmt(n.problemas, 2)}</b> × P_problemas + <b>{fmt(n.vulnerabilidade, 2)}</b> × P_vulnerabilidade + <b>{fmt(n.presenca, 2)}</b> × (1 − P_presença). Os pesos são normalizados para somar 1.</p>
        {campo('problemas', 'Problemas')}{campo('vulnerabilidade', 'Vulnerabilidade')}{campo('presenca', 'Presença')}
        {!ac.ok && <p className="lock-ic small" data-testid="pesos-somente-direcao"><Icon n="lock" s={12} />{ac.motivo}</p>}
        <div className="dc-foot" style={{ padding: 0 }}>
          <button className="btn ghost" disabled={!ac.ok} onClick={() => setP({ ...PESOS_PADRAO })}>Voltar a 0,4 / 0,3 / 0,3</button>
          <button className="btn primary" disabled={!ac.ok} onClick={() => { if (alterarPesos(p)) fechar(); }} data-testid="aplicar-pesos"><Icon n="check" s={14} />Aplicar e registrar</button>
        </div>
      </div>
    </Janela>
  );
}

export function Modais() {
  const m = useStore((s) => s.modal);
  if (!m) return null;
  switch (m.tipo) {
    case 'decisao': return <DecisaoModal id={m.id} />;
    case 'registrar-alerta': return <RegistrarAlerta m={m} />;
    case 'alerta': return <AlertaModal id={m.id} />;
    case 'convite': return <Janela titulo="Conhecer o partido" eyebrow="Convite · consentimento ⚖" sm testid="convite-modal"><div className="dc-sec"><Convite /></div></Janela>;
    case 'municipio': return <MunicipioModal />;
    case 'dev': return <Janela titulo="Camada e persona" code="DEV" eyebrow="Seletor de desenvolvedor · simula o login" sm testid="dev-modal"><DevSelector onPronto={fechar} /></Janela>;
    case 'entrega': return <EntregaModal missao={m.missao} />;
    case 'validar': return <ValidarModal entrega={m.entrega} />;
    case 'missao': return <MissaoModal id={m.id} />;
    case 'campanha': return <CampanhaModal id={m.id} />;
    case 'pesos': return <PesosModal />;
    default: return null;
  }
}
