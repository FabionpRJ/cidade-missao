import type { ReactNode } from 'react';
import { Icon } from './icons';

/** Cabeçalho de gaveta: madeira com ornamento déco e título em placa (direção A); faixa e código mono vêm de tokens. */
export function DrawerHead({ code, eyebrow, titulo, onBack, onClose, tools, id }: { code?: string; eyebrow?: ReactNode; titulo: string; onBack?: () => void; onClose?: () => void; tools?: ReactNode; id?: string }) {
  return (
    <div className="dr-head">
      <span className="line-strip" aria-hidden="true" />
      {onBack && <button className="icon-btn round" title="Voltar" aria-label="Voltar" onClick={onBack}><Icon n="back" s={18} /></button>}
      <div className="dr-title">
        <small className="eyebrow">{code && <span className="code">{code}</span>}{eyebrow}</small>
        <h2 id={id} className={titulo.length > 16 ? 'longo' : titulo.length > 11 ? 'medio' : undefined}>{titulo}</h2>
      </div>
      {tools && <div className="dr-tools">{tools}</div>}
      {onClose && <button className="icon-btn round" title="Fechar (Esc)" aria-label="Fechar" onClick={onClose}><Icon n="close" s={18} /></button>}
    </div>
  );
}
