// Rótulos de território com prevenção de colisão (gulosa, como nos jogos de estratégia; porta de engine.js).
export interface CaixaRotulo { x0: number; y0: number; x1: number; y1: number }

export class Colisor {
  private caixas: CaixaRotulo[] = [];
  cabe(b: CaixaRotulo) {
    return !this.caixas.some((p) => b.x0 < p.x1 + 4 && b.x1 > p.x0 - 4 && b.y0 < p.y1 + 3 && b.y1 > p.y0 - 3);
  }
  ocupar(b: CaixaRotulo) { this.caixas.push(b); }
}

/** Largura aproximada de texto em caixa-alta (Gloock e Alegreya Sans SC são mais largas que a Barlow Condensed da direção B). */
export const K_LARGURA = 0.72;

export function rotuloSVG(o: {
  txt: string; x: number; y: number; fs: number; ls: number; cls: string; op?: number; forcado?: boolean; colisor: Colisor;
}): string {
  const w = o.txt.length * o.fs * K_LARGURA + Math.max(0, o.txt.length - 1) * o.ls;
  const b = { x0: o.x - w / 2, y0: o.y - o.fs * 0.75, x1: o.x + w / 2, y1: o.y + o.fs * 0.3 };
  if (!o.forcado && !o.colisor.cabe(b)) return '';
  o.colisor.ocupar(b);
  const t = o.txt.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<text class="${o.cls}" x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" text-anchor="middle" font-size="${o.fs.toFixed(1)}"${o.op ? ` fill-opacity="${o.op}"` : ''}${o.ls ? ` letter-spacing="${o.ls.toFixed(1)}"` : ''}>${t}</text>`;
}
