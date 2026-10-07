// Estados fixos por query string, para reproduzir telas e capturas. Ex.:
// ?camada=militante&persona=MIL-0001&modo=pre&distrito=CRE&zoom=13&aba=partido
// ?camada=autoridade&modo=lac&painel=ledger&zoom=11&tip=CDU&tip2=lacunas
// ?camada=visitante&modo=zel&distrito=BRL&folha=meia&zoom=14
import type { CamadaId, ModoId } from '../data/types';
import type { AbaId, RailId } from '../domain/permissions';
import { garantirModoPermitido, telaInicial } from '../state/actions';
import { mapBus } from '../state/mapBus';
import { persona as acharPersona, PERSONA_PADRAO } from '../state/personas';
import { st, type Folha } from '../state/store';
import { useTips } from '../components/tipStore';
import { motorAtual } from '../map/MapView';

const CAMADAS: CamadaId[] = ['visitante', 'militante', 'autoridade', 'direcao'];

let aplicado = false;
export function aplicarURL(): boolean {
  if (aplicado) return false;
  aplicado = true;
  const q = new URLSearchParams(window.location.search);
  const s = st();
  const dados = s.dados!;
  const temAlgo = ['camada', 'persona', 'modo', 'distrito', 'zoom', 'painel', 'aba', 'folha'].some((k) => q.has(k));
  const camadaQ = q.get('camada') as CamadaId | null;
  const personaQ = q.get('persona');
  if (camadaQ && CAMADAS.includes(camadaQ)) {
    const p = acharPersona(dados, personaQ ?? PERSONA_PADRAO[camadaQ]);
    s.set({ camada: camadaQ, personaId: p && p.camada === camadaQ ? p.id : PERSONA_PADRAO[camadaQ] });
  } else if (personaQ) {
    const p = acharPersona(dados, personaQ);
    if (p) s.set({ camada: p.camada, personaId: p.id });
  }
  if (!temAlgo) { telaInicial(st().camada); return false; }
  const tema = q.get('tema');
  if (tema === 'claro' || tema === 'escuro') s.set({ tema });
  if (q.get('economia') === '1') s.set({ economia: true });
  const modo = q.get('modo') as ModoId | null;
  if (modo) s.set({ modo, comparar: null });
  garantirModoPermitido();
  const mes = q.get('mes');
  if (mes !== null && !Number.isNaN(Number(mes))) s.set({ mes: Math.max(0, Math.min(11, Number(mes))) });
  const comparar = q.get('comparar');
  if (comparar !== null && !Number.isNaN(Number(comparar))) s.set({ comparar: Math.max(0, Math.min(11, Number(comparar))) });
  const modal = q.get('janela');
  if (modal === 'decisao') s.set({ modal: { tipo: 'decisao', id: 'DEC-1' } });
  if (modal === 'municipio') s.set({ modal: { tipo: 'municipio' } });
  const d = q.get('distrito');
  const painel = q.get('painel') as RailId | null;
  const aba = q.get('aba') as AbaId | null;
  const folha = q.get('folha') as Folha | null;
  s.set({
    sel: d && dados.distritoPorId[d] ? d : null,
    painel: painel ?? (d ? 'territorio' : null),
    aba: aba ?? 'geral',
    folha: folha ?? (d ? 'meia' : 'recolhida'),
    selB: q.get('b'), fixado: q.has('b'),
    ...(painel === 'ficha' && q.get('ficha') ? { fichaId: q.get('ficha') } : {}),
  });
  if (painel === 'ficha' || painel === 'missoes' || painel === 'ledger') s.set({ abaMovel: painel === 'ledger' ? 'numeros' : 'perfil' });
  const zoom = q.get('zoom') ? Number(q.get('zoom')) : undefined;
  if (d && dados.distritoPorId[d]) mapBus.emit({ tipo: 'distrito', id: d, zoom: zoom ?? 13 });
  else if (zoom && zoom > 11.4) mapBus.emit({ tipo: 'view', ll: [-46.62, -23.6], zoom });
  else mapBus.emit({ tipo: 'municipio' });
  // tooltip aninhado fixado (tela 2): nível 1 = decomposição do índice; nível 2 = termo do glossário
  const tip = q.get('tip');
  if (tip && dados.distritoPorId[tip]) {
    const tentar = (n = 0) => {
      const m = motorAtual.m;
      if (!m) { if (n < 60) setTimeout(() => tentar(n + 1), 100); return; }
      setTimeout(() => {
        const r = dados.distritoPorId[tip].rotulo;
        const [x, y] = m.project([r.lng, r.lat]);
        const host = document.querySelector('.map-host')!.getBoundingClientRect();
        s.set({ hover: tip });
        useTips.getState().abrir({ nivel: 1, c: { tipo: 'lacunas', distrito: tip }, x: host.left + x + 30, y: host.top + y - 160, fixo: true, origem: 'url' });
        const t2 = q.get('tip2');
        if (t2) setTimeout(() => useTips.getState().abrir({ nivel: 2, c: { tipo: 'termo', id: t2 }, x: host.left + x + 420, y: host.top + y - 60, fixo: true, origem: 'url2' }), 120);
      }, 700);
    };
    tentar();
  }
  return true;
}
