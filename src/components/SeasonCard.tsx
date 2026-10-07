import { fmt, fmtData } from '../data/indicators';
import { useDados } from '../state/derived';
import { st } from '../state/store';
import { Src } from '../ui/common';
import { Icon } from '../ui/icons';
import { Term } from './NestedTooltip';

/** Temporada (doc. 4.4): foco, dias restantes, campanhas ligadas e multiplicador. */
export function SeasonCard({ compacto }: { compacto?: boolean }) {
  const dados = useDados();
  const T = dados.temporada;
  const total = 123;
  const ligadas = dados.campanhas.filter((c) => c.foco_temporada);
  return (
    <div className="mission t-int" style={{ '--tc': 'var(--hi)' } as React.CSSProperties} data-testid="temporada">
      <div className="ms-head">
        <span className="ms-track"><Icon n="cal" s={16} /></span>
        <div><small><Term id="temporada">Temporada</Term> {T.id} · foco municipal</small><b>{T.nome}</b></div>
        <span className="ms-state st-run">{T.dias_restantes} dias</span>
      </div>
      <div className="ms-prog"><span className="ms-bar"><i style={{ width: `${Math.round(((total - T.dias_restantes) / total) * 100)}%`, background: 'var(--hi)' }} /></span><span>{fmtData(T.inicio)} → {fmtData(T.fim)}</span></div>
      {!compacto && <p>Escolhida por {T.escolhida_por}. Entregas ligadas ao foco ganham <b>×{fmt(T.multiplicador, 2)}</b>. Nada se perde ao fechar a temporada.</p>}
      <div className="ms-mult"><span className="on">foco ×{fmt(T.multiplicador, 2)}</span><span>território prioritário ×1,5</span></div>
      {!compacto && ligadas.map((c) => (
        <button key={c.id} className="nuc-row" onClick={() => st().set({ modal: { tipo: 'campanha', id: c.id } })}>
          <span className="nuc-ic" style={{ background: 'var(--hi)', color: 'var(--hi-tx)' }}><Icon n="flag" s={16} /></span>
          <div><b>{c.nome}</b><small>{Math.round(c.progresso * 100)}% · até {fmtData(c.prazo)} · {c.meta}</small></div>
          <span className="chev"><Icon n="right" s={14} /></span>
        </button>
      ))}
      <Src t="Cidade Missão (dado do app) · 2026 · município" />
    </div>
  );
}
