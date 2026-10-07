// Folha deslizante (doc. 7.5; pacote A §8): recolhida, meia tela (≈52%) e tela cheia; arrastar a alça alterna.
import { useRef, type ReactNode } from 'react';
import type { Folha } from '../state/store';

/** Alturas da folha no retrato: recolhida, meia (≈ 52% da tela, nunca menor que 240 px nem maior que deixar 200 px de mapa) e cheia. */
export const ALTURA_FOLHA = (f: Folha, h: number) =>
  f === 'recolhida' ? 92 : f === 'meia' ? Math.max(240, Math.min(Math.round(h * 0.52) - 64, h - 64 - 200)) : h - 64 - 8;

/** No celular deitado (`lado` > 0), a folha vira painel lateral: a alça alterna entre meia e cheia (mais larga). */
export function BottomSheet({ folha, setFolha, altura, children, rotulo, rodape, lado = 0 }: { folha: Folha; setFolha: (f: Folha) => void; altura: number; children: ReactNode; rotulo: string; rodape?: ReactNode; lado?: number }) {
  const ini = useRef<{ y: number; f: Folha } | null>(null);
  const ordem: Folha[] = ['recolhida', 'meia', 'cheia'];
  return (
    <section className={`m-sheet ${folha}${lado ? ' lado' : ''}`} style={lado ? { width: lado } : { height: altura }} aria-label={rotulo} data-testid="folha" data-folha={folha}>
      <button className="sh-grab" aria-label={`Folha: ${folha}. Toque para alternar a altura`}
        onPointerDown={(e) => { ini.current = { y: e.clientY, f: folha }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
        onPointerUp={(e) => {
          const i = ini.current; ini.current = null;
          if (!i) return;
          const dy = e.clientY - i.y, k = ordem.indexOf(i.f);
          if (lado) { setFolha(i.f === 'cheia' ? 'meia' : 'cheia'); return; }
          if (Math.abs(dy) < 8) setFolha(ordem[(k + 1) % 3]);
          else setFolha(ordem[Math.max(0, Math.min(2, k + (dy < 0 ? 1 : -1) * (Math.abs(dy) > 220 ? 2 : 1)))]);
        }}>
        <span className="sh-handle" />
      </button>
      <div className="sh-body">{children}</div>
      {rodape && <div className="sh-foot">{rodape}</div>}
    </section>
  );
}
