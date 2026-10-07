import type { ReactNode } from 'react';
import { Icon } from './icons';

export const Fict = ({ className = '' }: { className?: string }) => <span className={`fict ${className}`}>dados fictícios</span>;

export const Src = ({ t }: { t: string }) => <span className="src"><Icon n="doc" s={12} />{t}</span>;

export function Ramp({ rampa, ticks, mini, palavras }: { rampa: string[]; ticks?: [string, string, string]; mini?: boolean; palavras?: [string, string] }) {
  return (
    <div className={`ramp${mini ? ' mini' : ''}`} role="img" aria-label={`Escala de ${rampa.length} classes${ticks ? `, de ${ticks[0]} a ${ticks[2]}` : ''}`}>
      <div className="ramp-bar">{rampa.map((c, i) => <i key={i} style={{ background: c }} />)}</div>
      {ticks && <div className="ramp-ticks"><span>{ticks[0]}</span><span>{ticks[1]}</span><span>{ticks[2]}</span></div>}
      {palavras && <div className="lg-words"><span>{palavras[0]}</span><span>{palavras[1]}</span></div>}
    </div>
  );
}

export function Spark({ vals, w = 300, h = 46, sel }: { vals: number[]; w?: number; h?: number; sel?: number }) {
  const mn = Math.min(...vals), mx = Math.max(...vals), k = mx - mn || 1;
  const pts = vals.map((v, i) => [(i * w) / (vals.length - 1), h - 3 - ((v - mn) / k) * (h - 6)]);
  const d = 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join('L');
  const last = pts[pts.length - 1];
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={`${d}L${w},${h}L0,${h}Z`} className="sp-area" />
      <path d={d} className="sp-line" fill="none" />
      {sel !== undefined && sel < vals.length - 1 && <line className="sp-sel" x1={pts[sel][0]} x2={pts[sel][0]} y1={0} y2={h} />}
      <circle cx={last[0]} cy={last[1]} r={2.6} className="sp-dot" />
    </svg>
  );
}

export function Locked({ motivo, children }: { motivo: string; children?: ReactNode }) {
  return <div className="locked-box"><Icon n="lock" s={22} /><b>Bloqueado nesta camada</b><span>{motivo}</span>{children}</div>;
}

/** Retrato gerado (theme_a.js): oval com moldura de latão; foto nunca é obrigatória. Roupa na cor da trilha principal. */
export function Retrato({ cor, codigo }: { cor: string; codigo: string }) {
  return (
    <svg viewBox="0 0 112 132" aria-hidden="true">
      <defs><linearGradient id="retrato-fundo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E4A3E" /><stop offset="1" stopColor="#14201C" /></linearGradient>
        <clipPath id="retrato-oval"><ellipse cx="56" cy="66" rx="52" ry="62" /></clipPath></defs>
      <ellipse cx="56" cy="66" rx="52" ry="62" fill="url(#retrato-fundo)" />
      <g clipPath="url(#retrato-oval)">
        <circle cx="56" cy="54" r="19" fill="#C9B48A" />
        <path d="M33 52c0-15 10-24 23-24s23 9 23 24c-5-8-13-11-23-11s-18 3-23 11z" fill="#3A2A1C" />
        <path d="M18 132c4-28 19-46 38-46s34 18 38 46z" fill={cor} fillOpacity=".85" />
        <path d="M48 86l8 10 8-10" fill="none" stroke="#E2C27E" strokeWidth="2" />
      </g>
      <ellipse cx="56" cy="66" rx="52" ry="62" fill="none" stroke="#C9A15E" strokeWidth="2.5" />
      <ellipse cx="56" cy="66" rx="46" ry="56" fill="none" stroke="#6E5A38" />
      <title>{`Retrato gerado · ${codigo}`}</title>
    </svg>
  );
}

export function ProntidaoDots({ n }: { n: number }) {
  return <span className="pdots" role="img" aria-label={`Prontidão ${n} de 4`}>{[0, 1, 2, 3].map((i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>;
}
