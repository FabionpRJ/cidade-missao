import { FallbackMapEngine } from './FallbackMapEngine';
import type { MapEngine } from './MapEngine';

/** Escolhe o motor: Google com chave (salvo `?motor=proprio`), renderizador próprio sem chave ou se o carregamento falhar. */
export function motorPreferido(): 'google' | 'proprio' {
  const q = new URLSearchParams(window.location.search).get('motor');
  const chave = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (q === 'proprio' || !chave) return 'proprio';
  return 'google';
}
/** O motor do Google (e o carregador da API) só é baixado quando há chave. */
export async function criarMotor(tipo: 'google' | 'proprio'): Promise<MapEngine> {
  if (tipo === 'google') {
    const { GoogleMapEngine } = await import('./GoogleMapEngine');
    return new GoogleMapEngine(import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string);
  }
  return new FallbackMapEngine();
}
