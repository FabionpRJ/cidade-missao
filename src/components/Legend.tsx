// Legenda sempre visível (doc. 5.4): rampa do modo, unidade, fonte · ano · nível; escalas acessíveis (L* crescente).
import { useMemo } from 'react';
import { MODO, NOME_FAMILIA, fmt } from '../data/indicators';
import { escalaModo } from '../map/scene';
import { useDados, useIndicadores } from '../state/derived';
import { useStore } from '../state/store';
import { useVista } from '../state/coord';
import { NOME_NIVEL } from '../map/MapEngine';
import { Ramp, Src } from '../ui/common';
import { Icon } from '../ui/icons';
import { AVISO_UNIDADE } from '../content/textos';
import { Tip } from './NestedTooltip';

export function useEscala() {
  const dados = useDados();
  const ind = useIndicadores();
  const modo = useStore((s) => s.modo), mes = useStore((s) => s.mes), comparar = useStore((s) => s.comparar);
  return useMemo(() => escalaModo(dados, ind, modo, mes, comparar), [dados, ind, modo, mes, comparar]);
}

export function Legend({ mini, aviso }: { mini?: boolean; aviso?: string }) {
  const dados = useDados();
  const modo = useStore((s) => s.modo);
  const sel = useStore((s) => s.sel);
  const esc = useEscala();
  const nivel = useVista((s) => s.nivel);
  const pesos = useStore((s) => s.pesos);
  const m = MODO[modo];
  const ticks: [string, string, string] | undefined = esc.tipo === 'cat' ? undefined : [esc.fmtV(esc.dominio[0]), esc.fmtV((esc.dominio[0] + esc.dominio[1]) / 2), esc.fmtV(esc.dominio[1]) + (esc.tipo === 'seq' && m.id !== 'lac' ? '+' : '')];
  const palavras: [string, string] | undefined = esc.tipo === 'div' ? ['diminuiu', 'aumentou'] : m.legendaPalavras;
  if (mini) return (
    <div className="m-legend" aria-label={`Legenda: ${m.nome}`}>
      <b>{m.nome}</b>
      <Ramp rampa={esc.rampa} mini palavras={palavras} />
      <small>{esc.unidade}</small>
      {aviso && <small className="lg-aviso">{aviso}</small>}
    </div>
  );
  const valSel = sel ? esc.valores[sel] : null;
  const posicao = sel && valSel !== null && valSel !== undefined ? 1 + Object.values(esc.valores).filter((v) => (v ?? -Infinity) > valSel).length : null;
  return (
    <section className="cm-legend" aria-label={`Legenda do modo ${m.nome}`} data-testid="legenda">
      <div className="lg-h"><Icon n={m.icon} s={16} /><b>{m.nome}</b><span className="fam-tag">{NOME_FAMILIA[m.familia]}</span></div>
      <div className="lg-u">{esc.unidade}{m.indicador && dados.indicadores[m.indicador].dado_do_app ? <> · <span className="selo dapp">dado do app</span></> : null}</div>
      {esc.tipo === 'cat'
        ? <div className="lg-cats">{dados.subprefeituras.slice(0, 6).map((s, i) => <span key={s.id}><i style={{ background: esc.rampa[(i * 5) % 6] }} />{s.curto}…</span>)}<span className="muted">6 tons alternados por subprefeitura</span></div>
        : <Ramp rampa={esc.rampa} ticks={ticks} palavras={palavras} />}
      {esc.nota && <div className="lg-nota">{esc.nota}</div>}
      {sel && valSel !== null && valSel !== undefined && (
        <div className="lg-sel"><Icon n={m.icon} s={13} />{dados.distritoPorId[sel].nome}: <b>{esc.fmtV(valSel)}</b>{esc.tipo === 'seq' && posicao ? <> · {posicao}º de 96</> : null}</div>
      )}
      <div className="lg-sel" style={{ borderTop: 0, paddingTop: 0 }}><Src t={esc.fonte} /></div>
      <div className="row small muted"><Icon n="info" s={12} /><Tip c={{ tipo: 'termo', id: 'distrito' }}>{AVISO_UNIDADE}</Tip><span className="right">zoom {NOME_NIVEL[nivel]}</span></div>
      {aviso && <div className="lg-aviso">{aviso}</div>}
      {modo === 'ele' && <div className="aviso-leg">⚖ Uso de planejamento: dados públicos do TSE agregados por local de votação; nunca por pessoa e sem cruzar com militantes ou visitantes.</div>}
      {modo === 'lac' && <div className="small muted">Prioridade de presença e serviço, nunca perigo. Pesos {fmt(pesos.problemas, 2)} / {fmt(pesos.vulnerabilidade, 2)} / {fmt(pesos.presenca, 2)}.</div>}
    </section>
  );
}
