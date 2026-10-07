// Tooltip aninhado (doc. 5.1, 7.2, 7.3; pacote A §5): até 3 níveis; hover 300 ms abre; clique, Alt ou 900 ms fixam;
// termos sublinhados abrem o nível seguinte; Esc fecha o nível mais alto. Todo número termina com fonte · ano · nível.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { TERMO, partesTexto } from '../content/glossario';
import { MODO, fmt, fmtN, fmtValor, linhaFonte } from '../data/indicators';
import { faixaLacuna } from '../domain/lacunas';
import { contaPT, NOME_VERIFICACAO } from '../domain/points';
import { escalaModo } from '../map/scene';
import { useDados, useIndicadores } from '../state/derived';
import { useStore } from '../state/store';
import { Icon } from '../ui/icons';
import { Fict, Src } from '../ui/common';
import { teclas, useTips, type TipConteudo, type TipItem } from './tipStore';

const NivelCtx = createContext(0);
let seq = 0;
const ehToque = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

/** Gatilho: hover abre (300 ms), clique fixa. Dentro de um tooltip de nível n, abre o nível n+1. */
export function Tip({ c, children, className = 'tt-term', label, as = 'button', onClick, testid, role, checked }: { c: TipConteudo; children: ReactNode; className?: string; label?: string; as?: 'button' | 'span'; onClick?: () => void; testid?: string; role?: string; checked?: boolean }) {
  const nivelPai = useContext(NivelCtx);
  const nivel = nivelPai + 1;
  const ref = useRef<HTMLElement>(null);
  const chave = useRef(`tip${seq++}`).current;
  const timers = useRef<number[]>([]);
  const aberto = useTips((s) => s.pilha.some((t) => t.origem === chave));
  const limpar = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => limpar, []);
  if (nivel > 3) return <>{children}</>;
  const pos = (): TipItem => {
    const r = ref.current!.getBoundingClientRect();
    return { nivel, c, x: r.right, y: r.top, fixo: false, origem: chave, ancora: { x: r.left, y: r.bottom } };
  };
  const abrir = (fixo: boolean) => { const t = pos(); useTips.getState().abrir({ ...t, fixo }); };
  const enter = () => {
    if (ehToque()) return;
    limpar();
    timers.current.push(window.setTimeout(() => {
      abrir(teclas.alt);
      timers.current.push(window.setTimeout(() => useTips.getState().fixar(nivel), 600)); // 300 + 600 = 900 ms
    }, 300));
  };
  const leave = () => {
    limpar();
    window.setTimeout(() => {
      const s = useTips.getState();
      const t = s.pilha.find((x) => x.origem === chave);
      if (t && !t.fixo && s.dentro < nivel) s.fechar(nivel);
    }, 160);
  };
  const click = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    limpar();
    if (onClick) { const s = useTips.getState(); const t = s.pilha.find((x) => x.origem === chave); if (t && !t.fixo) s.fechar(nivel); onClick(); return; }
    const t = useTips.getState().pilha.find((x) => x.origem === chave);
    if (t?.fixo) useTips.getState().fechar(nivel); else abrir(true);
  };
  const props = {
    ref: ref as never, className: `${className}${aberto ? ' is-open' : ''}`, onMouseEnter: enter, onMouseLeave: leave, onClick: click,
    'aria-label': label, 'aria-expanded': role ? undefined : aberto, 'aria-haspopup': role ? undefined : ('dialog' as const), 'data-testid': testid,
    ...(role ? { role, 'aria-checked': checked } : {}),
  };
  return as === 'span' ? <span role="button" {...props} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(true); } }}>{children}</span> : <button type="button" {...props}>{children}</button>;
}

/** Termo do glossário. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const t = TERMO[id];
  return <Tip c={{ tipo: 'termo', id }}>{children ?? t?.termo ?? id}</Tip>;
}
/** Texto com [[termos]] do glossário. */
export function TextoComTermos({ t }: { t: string }) {
  return <>{partesTexto(t).map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : <Term key={i} id={p.id}>{p.rotulo}</Term>))}</>;
}

/* ---------- conteúdo ---------- */
function Corpo({ c }: { c: TipConteudo }) {
  const dados = useDados();
  const ind = useIndicadores();
  const pesos = useStore((s) => s.pesos);
  const modo = useStore((s) => s.modo), mes = useStore((s) => s.mes), comparar = useStore((s) => s.comparar);
  switch (c.tipo) {
    case 'termo': {
      const t = TERMO[c.id];
      if (!t) return <p>Termo não encontrado.</p>;
      return (<>
        <div className="tip-h"><b>{t.termo}</b><small>termo do glossário{t.doc ? ` · documento 3.0, seção ${t.doc}` : ''}</small></div>
        <p><TextoComTermos t={t.texto} /></p>
        <div className="tip-foot">{t.fonte ? <Src t={t.fonte} /> : <Fict />}</div>
      </>);
    }
    case 'numero':
      return (<>
        <div className="tip-h"><b>{c.titulo}</b><small>{c.app ? 'dado do app (não oficial)' : 'estatística pública'}{c.desatualizado ? ' · desatualizado' : ''}</small></div>
        <div className="tip-big"><span /><b>{c.valor}</b><span>{c.unidade}</span></div>
        {c.medias && (<div className="tip-src">
          {c.medias.mun && <><span>Média municipal</span><b>{c.medias.mun}</b></>}
          {c.medias.est && <><span>Média estadual</span><b>{c.medias.est}</b></>}
          {c.medias.nac && <><span>Média nacional</span><b>{c.medias.nac}</b></>}
        </div>)}
        {c.formula && <p><b>Fórmula:</b> {c.formula}</p>}
        {c.nota && <p>{c.nota}</p>}
        {c.termo && <p className="small">Ver <Term id={c.termo} /></p>}
        <div className="tip-foot"><Src t={`${c.fonte} · ${c.ano} · ${c.nivel}`} />{c.desatualizado && <Term id="desatualizado"><span className="selo old">desatualizado</span></Term>}{c.app && <Term id="dado-app"><span className="selo dapp">dado do app</span></Term>}</div>
      </>);
    case 'pt': {
      const k = c.calculo;
      return (<>
        <div className="tip-h"><b>{c.titulo}</b><small>Pontos de Trilha · doc. 2.2</small></div>
        <div className="tip-src">
          <span>V_base</span><b>{fmt(k.vBase)}</b>
          <span><Term id="verificacao">M_verificação</Term></span><b>× {fmt(k.mVerificacao, 2)}</b>
          <span><Term id="foco">M_foco</Term></span><b>× {fmt(k.mFoco, 2)} ({k.focoMotivo})</b>
          <span>Bruto</span><b>{contaPT(k)}</b>
          <span>Já na semana</span><b>{fmtN(k.jaNaSemana)} de {k.teto} PT (teto por trilha)</b>
          <span>Creditado</span><b>{fmtN(k.creditado)} PT{k.naoCreditado ? ` · ${fmtN(k.naoCreditado)} não creditados (teto)` : ''}</b>
        </div>
        <div className="tip-foot"><Src t="Regras (H) do documento 3.0 · 2026" /><Fict /></div>
      </>);
    }
    case 'texto':
      return (<><div className="tip-h"><b>{c.titulo}</b></div><p><TextoComTermos t={c.texto} /></p>{c.fonte && <div className="tip-foot"><Src t={c.fonte} /></div>}</>);
    case 'lacunas': {
      const d = dados.distritoPorId[c.distrito];
      const v = ind[c.distrito];
      const meta = dados.indicadores.lac;
      const media = (k: 'zel' | 'pres') => dados.indicadores[k].media_municipal!;
      const partes = [
        { l: 'Problemas', termo: 'zeladoria', p: v.lacComp.p_problemas, w: pesos.problemas, i: 'bell', bruto: `${fmt(v.alertas_90d)} alertas confirmados / 90 dias (${fmt(v.zel, 1)} por mil hab.; média municipal ${fmt(media('zel'), 1)})`, usa: v.lacComp.p_problemas },
        { l: 'Vulnerabilidade', termo: 'vulnerabilidade', p: v.lacComp.p_vulnerabilidade, w: pesos.vulnerabilidade, i: 'people', bruto: `IPVS reescalado ${fmt(v.vul, 2)} (Seade 2010, desatualizado)`, usa: v.lacComp.p_vulnerabilidade },
        { l: 'Presença', termo: 'presenca', p: v.lacComp.p_presenca, w: pesos.presenca, i: 'target', bruto: `${fmt(v.militantes)} militantes ativos / ${fmt(v.eleit)} eleitores (${fmt(v.pres, 2)} por mil)`, usa: 1 - v.lacComp.p_presenca },
      ];
      return (<>
        <div className="tip-h"><b>{d.nome}</b><small>{d.sub} · distrito</small></div>
        <div className="tip-big"><span className="tip-sw" style={{ background: escalaModo(dados, ind, 'lac', 11, null).cores[d.id] }} /><b>{fmt(v.lac, 2)}</b><span>Prioridade <b>{faixaLacuna(v.lac)}</b> de presença e serviço</span></div>
        <div className="tip-sub">Como o <Term id="lacunas">índice de Lacunas</Term> é composto</div>
        {partes.map((x) => (
          <div className="tip-part" key={x.l}>
            <Icon n={x.i} s={14} />
            <span><Term id={x.termo}>{x.l}</Term>: <Term id="percentil">percentil</Term> {fmt(x.p, 2)}{x.l === 'Presença' ? ' (usa 1 − P)' : ''}</span>
            <span className="tp-w">peso {fmt(x.w, 2)}</span>
            <span className="tp-bar"><i style={{ width: `${Math.round(x.usa * 100)}%` }} /></span>
            <b>{fmt(x.w * x.usa, 2)}</b>
            <small>← {x.bruto}</small>
          </div>
        ))}
        <div className="tip-sum"><span>Soma ponderada = {fmt(pesos.problemas, 1)} × P_prob + {fmt(pesos.vulnerabilidade, 1)} × P_vul + {fmt(pesos.presenca, 1)} × (1 − P_pres)</span><b>{fmt(v.lac, 2)}</b></div>
        <div className="tip-foot"><Src t={`${meta.fonte} · ${meta.ano} · ${meta.nivel}`} /><span className="tip-hint">Atualizado: 05/10/2026</span></div>
      </>);
    }
    case 'distrito': {
      const d = dados.distritoPorId[c.distrito];
      if (!d) return null;
      const m = MODO[modo];
      const esc = escalaModo(dados, ind, modo, mes, comparar);
      const v = esc.valores[d.id];
      const meta = m.indicador ? dados.indicadores[m.indicador] : null;
      if (modo === 'lac') return <Corpo c={{ tipo: 'lacunas', distrito: d.id }} />;
      return (<>
        <div className="tip-h"><b>{d.nome}</b><small>{d.sub} · distrito · <span className="mono">D-{d.cod} · {d.id}</span></small></div>
        {m.categorico ? (
          <div className="tip-src"><span>Subprefeitura</span><b>{d.sub}</b><span>Área</span><b>{fmt(d.ind.km2, 1)} km²</b><span>População</span><b>{fmt(d.ind.pop)} hab.</b></div>
        ) : (
          <div className="tip-big"><span className="tip-sw" style={{ background: esc.cores[d.id] }} /><b>{v === null ? '—' : esc.fmtV(v)}</b><span>{esc.unidade}</span></div>
        )}
        {!m.categorico && meta?.media_municipal !== undefined && esc.tipo === 'seq' && mes >= 11 && <p className="small">Média municipal: <b>{fmtValor(m, meta.media_municipal)}</b>{meta.media_estadual !== undefined ? <> · estadual {fmtValor(m, meta.media_estadual)}</> : null}{meta.media_nacional !== undefined ? <> · nacional {fmtValor(m, meta.media_nacional)}</> : null}</p>}
        {esc.nota && <p className="lg-nota">{esc.nota}</p>}
        <p className="small">Mostra: {m.tooltip}.</p>
        <div className="tip-foot"><Src t={meta ? linhaFonte(meta) : esc.fonte} />{meta?.dado_do_app && <span className="selo dapp">dado do app</span>}<span className="tip-hint">Clique para abrir · <kbd>Alt</kbd> fixa</span></div>
      </>);
    }
  }
}

/* ---------- camada que desenha a pilha ---------- */
function Caixa({ t, anterior }: { t: TipItem; anterior?: DOMRect | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState<{ left: number; top: number }>({ left: t.x + 12, top: t.y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight, W = window.innerWidth, H = window.innerHeight;
    let left: number, top: number;
    if (anterior) {
      left = anterior.right + 12; top = Math.max(8, t.y - 30);
      if (left + w > W - 8) left = Math.max(8, anterior.left - w - 12);
    } else {
      left = t.x + 12; top = t.y;
      if (left + w > W - 8) left = Math.max(8, (t.ancora?.x ?? t.x) - w - 12);
    }
    top = Math.min(top, H - h - 8);
    setP({ left, top: Math.max(8, top) });
  }, [t, anterior]);
  const fechar = useTips((s) => s.fechar);
  return (
    <NivelCtx.Provider value={t.nivel}>
      <div ref={ref} className={`cm-tip lvl${t.nivel}${t.fixo ? ' is-pinned' : ''}`} role="dialog" aria-label="Detalhe" style={p} data-nivel={t.nivel}
        onMouseEnter={() => useTips.setState({ dentro: t.nivel })}
        onMouseLeave={() => {
          useTips.setState({ dentro: t.nivel - 1 });
          window.setTimeout(() => { const s = useTips.getState(); const x = s.pilha.find((q) => q.nivel === t.nivel); if (x && !x.fixo && s.dentro < t.nivel) s.fechar(t.nivel); }, 200);
        }}>
        {t.fixo && <span className="tip-pin"><Icon n="pin" s={12} />fixado</span>}
        {t.fixo && <button className="tip-close" aria-label="Fechar detalhe" onClick={() => fechar(t.nivel)}><Icon n="close" s={14} /></button>}
        <Corpo c={t.c} />
        {t.nivel < 3 && !t.fixo && <span className="tip-hint">Segure <kbd>Alt</kbd>, clique ou espere para fixar · termos sublinhados abrem outro nível</span>}
      </div>
    </NivelCtx.Provider>
  );
}

export function TooltipLayer() {
  const pilha = useTips((s) => s.pilha);
  const [rects, setRects] = useState<Record<number, DOMRect>>({});
  useLayoutEffect(() => {
    const r: Record<number, DOMRect> = {};
    document.querySelectorAll<HTMLElement>('.tip-layer .cm-tip').forEach((el) => { r[Number(el.dataset.nivel)] = el.getBoundingClientRect(); });
    setRects(r);
  }, [pilha]);
  // clique fora fecha os tooltips não fixados
  useEffect(() => {
    const f = (e: PointerEvent) => {
      const alvo = e.target as Element;
      if (alvo.closest?.('.cm-tip') || alvo.closest?.('.tt-term')) return;
      const s = useTips.getState();
      if (s.pilha.some((t) => !t.fixo)) useTips.setState({ pilha: s.pilha.filter((t) => t.fixo) });
    };
    window.addEventListener('pointerdown', f);
    return () => window.removeEventListener('pointerdown', f);
  }, []);
  if (!pilha.length) return null;
  return (
    <div className="tip-layer">
      {pilha.map((t) => <Caixa key={t.nivel + t.origem} t={t} anterior={t.nivel > 1 ? rects[t.nivel - 1] ?? null : null} />)}
    </div>
  );
}

export { NOME_VERIFICACAO };
