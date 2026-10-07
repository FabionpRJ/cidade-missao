// Linha do tempo mensal (doc. 6.3, 7.2; pacote A §5): 12 meses, reproduzir, comparar com, modo dividido.
import { useEffect } from 'react';
import { MODO, mesCurto } from '../data/indicators';
import { useDados } from '../state/derived';
import { st, useStore } from '../state/store';
import { Icon } from '../ui/icons';

export function useReproducao() {
  const tocando = useStore((s) => s.tocando);
  useEffect(() => {
    if (!tocando) return;
    const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const id = window.setInterval(() => {
      const s = st();
      if (s.mes >= 11) { s.set({ tocando: false }); return; }
      s.set({ mes: s.mes + 1 });
    }, reduz ? 1500 : 900);
    return () => clearInterval(id);
  }, [tocando]);
}

export function Timeline() {
  const dados = useDados();
  const mes = useStore((s) => s.mes), comparar = useStore((s) => s.comparar), tocando = useStore((s) => s.tocando);
  const modo = useStore((s) => s.modo), fixado = useStore((s) => s.fixado), selB = useStore((s) => s.selB);
  const historico = useStore((s) => s.historico);
  const m = MODO[modo];
  const meses = dados.meta.meses;
  // marcos: início da temporada e eventos registrados no protótipo (mês atual)
  const inicioTemp = meses.indexOf(dados.temporada.inicio.slice(0, 7));
  const marcos = new Set<number>([inicioTemp, 11].filter((i) => i >= 0));
  if (historico.length) marcos.add(11);
  return (
    <div className="cm-timeline" role="group" aria-label="Linha do tempo mensal" data-testid="timeline">
      <button className={`tl-play${tocando ? ' is-on' : ''}`} title={tocando ? 'Pausar' : 'Reproduzir 12 meses'} aria-label={tocando ? 'Pausar' : 'Reproduzir 12 meses'}
        onClick={() => st().set({ tocando: !tocando, mes: !tocando && mes === 11 ? 0 : mes })}><Icon n={tocando ? 'pause' : 'play'} s={14} /></button>
      <div className="tl-track" role="radiogroup" aria-label="Mês">
        {meses.map((ym, i) => (
          <button key={ym} role="radio" aria-checked={i === mes} className={`tl-m${i === mes ? ' is-sel' : ''}${i === comparar ? ' is-ref' : ''}`} title={`${mesCurto(ym)}${i === inicioTemp ? ' · início da temporada' : ''}`}
            onClick={() => st().set({ mes: i, tocando: false })}>
            <span className="tl-tick" />{marcos.has(i) && <span className="tl-ev" />}<span className="tl-lbl">{mesCurto(ym)}</span>
          </button>
        ))}
      </div>
      {m.serieMensal ? (
        <label className="tl-note"><Icon n="clock" s={13} /><span className="tl-txt">Comparar com</span>
          <select value={comparar ?? ''} onChange={(e) => st().set({ comparar: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Comparar com o mês">
            <option value="">—</option>
            {meses.map((ym, i) => i !== mes && <option key={ym} value={i}>{mesCurto(ym)}</option>)}
          </select>
        </label>
      ) : (
        <span className="tl-note"><Icon n="info" s={13} /><b>{m.categorico ? 'limites' : `dado de ${m.indicador ? dados.indicadores[m.indicador].ano : ''}`}</b><span> · série mensal indisponível</span></span>
      )}
      <button className={`btn${fixado ? ' is-sel' : ''}`} onClick={() => st().set({ fixado: !fixado, selB: fixado ? null : selB, painel: 'territorio' })} title="Modo dividido: fixe o painel e clique em outro distrito para comparar lado a lado" aria-pressed={fixado}>
        <Icon n="split" s={14} /><span className="btn-t">Dividir</span>
      </button>
    </div>
  );
}
