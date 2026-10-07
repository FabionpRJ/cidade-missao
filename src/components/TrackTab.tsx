// Aba "Acompanhar" do celular (doc. 7.5): outliner e alertas (de coordenação, para Autoridade e Direção).
import { ICONE_TIPO_COORD, NOME_TIPO_COORD } from '../domain/coordination';
import { agirCoord, dispensarCoord, selecionar } from '../state/actions';
import { useCoord } from '../state/coord';
import { useDados, usePersona } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st } from '../state/store';
import { Fict } from '../ui/common';
import { Icon } from '../ui/icons';
import { Outliner } from './Outliner';
import { SeasonCard } from './SeasonCard';

export function TrackTab() {
  const dados = useDados();
  const persona = usePersona();
  const { ativos } = useCoord();
  return (
    <div className="m-scroll" data-testid="acompanhar">
      {ativos.length > 0 && (
        <div className="block"><div className="block-h"><span>Alertas de coordenação</span><small>{ativos.length}</small></div>
          {ativos.map((c) => (
            <div key={c.chave} className="ent-row" style={{ borderLeftColor: 'var(--hi)' }}>
              <div><b>{c.a.texto}</b><small>{NOME_TIPO_COORD[c.a.tipo]}{c.naZona ? ' · na sua zona' : ''}</small></div>
              <Icon n={ICONE_TIPO_COORD[c.a.tipo]} s={18} />
              <div className="row wrap" style={{ gridColumn: '1/3' }}>
                <button className="btn primary" onClick={() => agirCoord(c.a)}>{c.a.acao}</button>
                {c.distrito && <button className="btn ghost" onClick={() => { st().set({ abaMovel: 'mapa' }); selecionar(c.distrito!); mapBus.emit({ tipo: 'distrito', id: c.distrito! }); }}>Ver no mapa</button>}
                <button className="btn ghost" onClick={() => dispensarCoord(c.a)}>Dispensar 7 dias</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {persona.camada !== 'visitante' && <SeasonCard compacto />}
      <div className="block" style={{ border: '1px solid var(--line2)' }}><Outliner semCaixa /></div>
      <div className="row small muted"><Fict />{dados.meta.municipio} · acompanhamento</div>
    </div>
  );
}
