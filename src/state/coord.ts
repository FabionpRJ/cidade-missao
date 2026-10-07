import { useMemo } from 'react';
import { HOJE } from '../data/indicators';
import { alertasCoordenacao, type CoordAtivo } from '../domain/coordination';
import { recebeAlertasCoordenacao } from '../domain/permissions';
import { chaveCoord } from './actions';
import { useContexto, useDados, useMissoes, useZonaPersona } from './derived';
import { useStore } from './store';
import { create } from 'zustand';

/** Alertas de coordenação ativos (não resolvidos e não dispensados), só para Autoridade e Direção. */
export function useCoord(): { ativos: CoordAtivo[]; todos: CoordAtivo[] } {
  const dados = useDados();
  const ctx = useContexto();
  const coord = useStore((s) => s.coord);
  const passagens = useStore((s) => s.passagens);
  const zona = useZonaPersona();
  const missoes = useMissoes();
  return useMemo(() => {
    if (!recebeAlertasCoordenacao(ctx)) return { ativos: [], todos: [] };
    const provas = Object.entries(passagens).flatMap(([mil, p]) => Object.entries(p ?? {}).filter(([, x]) => x?.status === 'pendente_banca').map(([t, x]) => ({ militante: mil, trilha: t, nivel: x!.nivel })));
    const todos = alertasCoordenacao({
      dados, estado: coord, hoje: HOJE, zona, chave: chaveCoord, provasPendentes: provas,
      missaoDistrito: (id) => missoes.find((m) => m.id === id)?.distrito,
    });
    return { todos, ativos: todos.filter((c) => !c.resolvido && !c.dispensado) };
  }, [dados, ctx, coord, passagens, zona, missoes]);
}

/** Vista atual do mapa (para minimapa e barra), fora do store principal para não re-renderizar o app a cada quadro. */
export const useVista = create<{ bounds: [number, number, number, number] | null; zoom: number; nivel: 'far' | 'mid' | 'near' }>(() => ({ bounds: null, zoom: 11, nivel: 'far' }));
