// Trilho de ícones (pacote A §5): 44 px, atalhos 1 a 0, bloqueio por camada com cadeado e tooltip.
import { acessoRail, type RailId } from '../domain/permissions';
import { useCoord } from '../state/coord';
import { useContexto } from '../state/derived';
import { st, useStore } from '../state/store';
import { Icon } from '../ui/icons';

export const RAIL: { id: RailId; icon: string; nome: string; k: string }[] = [
  { id: 'mapa', icon: 'map', nome: 'Mapa', k: '1' },
  { id: 'territorio', icon: 'building', nome: 'Território', k: '2' },
  { id: 'nucleo', icon: 'home', nome: 'Núcleo', k: '3' },
  { id: 'missoes', icon: 'flag', nome: 'Missões', k: '4' },
  { id: 'ficha', icon: 'user', nome: 'Ficha e trilhas', k: '5' },
  { id: 'alertas', icon: 'bell', nome: 'Alertas', k: '6' },
  { id: 'ledger', icon: 'ledger', nome: 'Ledger', k: '7' },
  { id: 'decisoes', icon: 'scale', nome: 'Decisões', k: '8' },
  { id: 'delegacoes', icon: 'send', nome: 'Delegações', k: '9' },
  { id: 'relatorios', icon: 'chart', nome: 'Relatórios', k: '0' },
];

export function abrirPainel(id: RailId) {
  const s = st();
  if (id === 'mapa') { s.set({ painel: null }); return; }
  s.set({ painel: s.painel === id ? null : id, ...(id === 'ficha' ? { fichaId: null } : {}), ...(id === 'nucleo' ? { nucleoId: null } : {}) });
}

export function IconRail() {
  const ctx = useContexto();
  const painel = useStore((s) => s.painel);
  const { ativos } = useCoord();
  const alertasN = useStore((s) => s.alertasCriados.filter((a) => a.autor === s.personaId).length);
  return (
    <nav className="cm-rail" aria-label="Painéis">
      {RAIL.map((r) => {
        const ac = acessoRail(r.id, ctx);
        const sel = r.id === 'mapa' ? painel === null : painel === r.id;
        const badge = r.id === 'alertas' ? (ctx.camada === 'visitante' ? alertasN : ativos.length) : 0;
        return (
          <button key={r.id} className={`rail-b${sel ? ' is-sel' : ''}${ac.ok ? '' : ' is-lock'}`} aria-disabled={!ac.ok} aria-pressed={sel}
            title={`${r.nome} (${r.k})${ac.ok ? '' : ` — ${ac.motivo}`}`} aria-label={`${r.nome}${ac.ok ? '' : `, bloqueado: ${ac.motivo}`}`}
            onClick={() => { if (!ac.ok) { st().toast({ tipo: 'info', icon: 'lock', titulo: `${r.nome} bloqueado`, texto: ac.motivo! }); return; } abrirPainel(r.id); }}>
            <span className="rail-k" aria-hidden="true">{r.k}</span>
            <Icon n={r.icon} s={20} />
            {!ac.ok && <span className="lk"><Icon n="lock" s={10} /></span>}
            {badge > 0 && <span className="badge-n">{badge}</span>}
          </button>
        );
      })}
      <div className="rail-sep" />
      <button className={`rail-b${painel === 'config' ? ' is-sel' : ''}`} title="Configurações e seletor de camada (Ctrl+Shift+L)" aria-label="Configurações" onClick={() => abrirPainel('config')}><Icon n="gear" s={20} /></button>
    </nav>
  );
}
