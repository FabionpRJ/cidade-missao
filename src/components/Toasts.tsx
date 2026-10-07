// Notificações (pacote A §5): no máximo 3; somem em 8 s; as de atenção ficam até serem lidas.
import { st, useStore } from '../state/store';
import { Icon } from '../ui/icons';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="cm-toasts" role="status" aria-live="polite" aria-label="Notificações">
      {toasts.map((t) => (
        <button key={t.id} className={`toast ${t.tipo === 'info' ? '' : t.tipo}`} onClick={() => { st().fecharToast(t.id); if (t.painel) st().set({ painel: t.painel }); }} title="Marcar como lida">
          <Icon n={t.icon ?? (t.tipo === 'ok' ? 'check' : t.tipo === 'warn' ? 'info' : 'bell')} s={18} />
          <div><b>{t.titulo}</b><p>{t.texto}</p></div>
          <time>{t.quando}</time>
        </button>
      ))}
    </div>
  );
}
