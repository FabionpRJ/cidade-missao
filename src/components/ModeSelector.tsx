// Seletor de modos (doc. 6; pacote A §5): 12 modos em 4 famílias; atalhos; bloqueio por camada e nível.
import { GRUPOS, MODOS } from '../data/indicators';
import type { ModoId } from '../data/types';
import { acessoModo, acessoRotas } from '../domain/permissions';
import { escolherModo } from '../state/actions';
import { useContexto } from '../state/derived';
import { st, useStore } from '../state/store';
import { Icon } from '../ui/icons';
import { Tip } from './NestedTooltip';

export function useModos() {
  const ctx = useContexto();
  return MODOS.map((m) => {
    const ac = acessoModo(m.id, ctx);
    const rotas = m.id === 'ope' && ac.ok ? acessoRotas(ctx) : null;
    return { m, ac, rotas };
  });
}

export function tentarModo(id: ModoId, motivo?: string) {
  if (motivo) { st().toast({ tipo: 'info', icon: 'lock', titulo: 'Modo bloqueado', texto: motivo }); return; }
  escolherModo(id);
}

export function ModeSelector({ faixa }: { faixa?: boolean }) {
  const modo = useStore((s) => s.modo);
  const lista = useModos();
  const botao = ({ m, ac, rotas }: (typeof lista)[number]) => {
    const sel = m.id === modo;
    const texto = `${m.nome} · colore por ${m.colore}. Ícones: ${m.icones}.${ac.ok ? '' : ` Bloqueado: ${ac.motivo}.`}${rotas && !rotas.ok ? ` Rotas núcleo → missão bloqueadas: ${rotas.motivo}.` : ''}${ac.variante === 'simplificada' ? ' Versão simplificada nesta camada.' : ''}${ac.variante === 'nucleo' ? ' Missões e rotas só do seu núcleo.' : ''} Atalho: ${m.atalho}.`;
    return (
      <Tip key={m.id} c={{ tipo: 'texto', titulo: m.nome, texto }} className={`mode-b${sel ? ' is-sel' : ''}${ac.ok ? '' : ' is-lock'}`}
        label={`${m.nome}${ac.ok ? '' : ' (bloqueado)'}`} onClick={() => tentarModo(m.id, ac.ok ? undefined : ac.motivo)} testid={`modo-${m.id}`} role="radio" checked={sel}>
        <Icon n={ac.ok ? m.icon : 'lock'} s={16} />
        {!faixa && <span className="k" aria-hidden="true">{m.atalho}</span>}
        {rotas && !rotas.ok && !faixa && <span className="sr">rotas bloqueadas</span>}
      </Tip>
    );
  };
  if (faixa) return <nav className="m-modes" role="radiogroup" aria-label="Modos de mapa">{lista.map(botao)}</nav>;
  return (
    <div className="cm-modes" role="radiogroup" aria-label="Modos de mapa" data-testid="modos">
      <div className="modes-h"><Icon n="layers" s={14} />Modos de mapa<kbd>M</kbd></div>
      {GRUPOS.map((g) => (
        <div className="mode-fam" key={g.id}>
          <span className="fam-l">{g.nome}</span>
          <div className="mode-btns">{lista.filter((x) => x.m.grupo === g.id).map(botao)}</div>
        </div>
      ))}
    </div>
  );
}
