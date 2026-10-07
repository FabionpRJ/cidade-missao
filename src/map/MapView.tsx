import { useEffect, useMemo, useRef, useState } from 'react';
import type { LngLat } from '../data/types';
import { acessoModo, acessoRotas } from '../domain/permissions';
import { selecionar } from '../state/actions';
import { useCoord, useVista } from '../state/coord';
import { useAlertas, useContexto, useDados, useIndicadores, useMissoes, usePersona } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st, useStore } from '../state/store';
import { useShallow } from 'zustand/react/shallow';
import { useTips } from '../components/tipStore';
import { teclas } from '../components/tipStore';
import { criarMotor, motorPreferido } from './criarMotor';
import { nivelDoZoom, SP_BOUNDS, type MapEngine } from './MapEngine';
import { construirCena, escalaModo } from './scene';
import { metrosPorPx } from './projection';

/** Fontes do pacote A (Gloock, Alegreya Sans, Alegreya Sans SC) carregadas depois do primeiro desenho do mapa (não disputam banda com o essencial). */
function carregarFontes() {
  if (document.getElementById('cm-fontes')) return;
  const l = document.createElement('link');
  l.id = 'cm-fontes'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Gloock&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400&family=Alegreya+Sans+SC:wght@500;700&display=swap';
  document.head.appendChild(l);
}

export interface Insets { top: number; right: number; bottom: number; left: number }
/** Motor ativo (para minimapa, capturas e o tooltip fixado por URL). */
export const motorAtual: { m: MapEngine | null; insets: Insets } = { m: null, insets: { top: 0, right: 0, bottom: 0, left: 0 } };

/** Centraliza um ponto na área visível (descontando painéis que cobrem o mapa). */
export function centralizar(ll: LngLat, zoom?: number) {
  const m = motorAtual.m;
  if (!m) return;
  const z = zoom ?? m.getView().zoom;
  const ins = m.tipo === 'google' ? { top: 0, right: 0, bottom: 0, left: 0 } : motorAtual.insets;
  const dx = (ins.left - ins.right) / 2, dy = (ins.top - ins.bottom) / 2;
  const mpp = metrosPorPx(z, ll[1]);
  const dLng = (dx * mpp) / (111320 * Math.cos((ll[1] * Math.PI) / 180)), dLat = (dy * mpp) / 110540;
  m.setView({ center: [ll[0] - dLng, ll[1] + dLat], zoom: z }, true);
}

export function MapView({ insets, onMotor }: { insets: Insets; onMotor?: (t: 'google' | 'proprio') => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [motor, setMotor] = useState<MapEngine | null>(null);
  const dados = useDados();
  const ind = useIndicadores();
  const alertas = useAlertas();
  const missoes = useMissoes();
  const ctx = useContexto();
  const persona = usePersona();
  const { ativos } = useCoord();
  const s = useStore(useShallow((x) => ({ modo: x.modo, mes: x.mes, comparar: x.comparar, sel: x.sel, selB: x.selB, hover: x.hover, eco: x.economia, cmp: x.ledger.comparar, painel: x.painel, ledgerZona: x.ledger.zona, pick: x.modal?.tipo === 'registrar-alerta' ? x.modal.ponto : null, insc: x.inscricoes[x.personaId], camada: x.camada })));
  motorAtual.insets = insets;

  // monta o motor (Google com chave; renderizador próprio sem chave ou se falhar)
  useEffect(() => {
    let vivo = true;
    let m: MapEngine | null = null;
    const view = { center: [-46.6, -23.68] as LngLat, zoom: 10.6 };
    const montar = async (tipo: 'google' | 'proprio') => {
      try {
        m = await criarMotor(tipo);
        if (!vivo) return;
        await m.mount(host.current!, dados, view);
      } catch (e) {
        console.warn('Google Maps indisponível, usando o renderizador próprio:', e);
        m?.destroy();
        if (tipo === 'google') return montar('proprio');
        throw e;
      }
      if (!vivo || !m) { m?.destroy(); return; }
      performance.mark('cm:motor');
      carregarFontes();
      motorAtual.m = m;
      setMotor(m);
      onMotor?.(m.tipo);
    };
    montar(motorPreferido());
    return () => { vivo = false; m?.destroy(); motorAtual.m = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  // cena
  const escala = useMemo(() => escalaModo(dados, ind, s.modo, s.mes, s.comparar), [dados, ind, s.modo, s.mes, s.comparar]);
  const coordPorDistrito = useMemo(() => {
    const r: Record<string, number> = {};
    for (const c of ativos) if (c.distrito) r[c.distrito] = (r[c.distrito] ?? 0) + 1;
    return r;
  }, [ativos]);
  const cena = useMemo(() => {
    const acOpe = acessoModo('ope', ctx);
    const minhas = new Set(Object.keys(s.insc ?? {}));
    const zona = s.ledgerZona ? dados.zonas_de_atuacao.find((z) => z.id === s.ledgerZona)?.distritos ?? [] : [];
    const destaque = s.cmp.length ? s.cmp : s.painel === 'ledger' ? zona : [];
    const me: LngLat | null = persona.camada === 'visitante' && persona.distrito ? [dados.distritoPorId[persona.distrito].rotulo.lng + 0.004, dados.distritoPorId[persona.distrito].rotulo.lat - 0.006] : null;
    return construirCena({
      dados, escala, ind, alertas, missoes, modo: s.modo, rotas: acessoRotas(ctx).ok, varianteOpe: acOpe.variante as 'nucleo' | 'completa' | undefined,
      zelDetalhada: acessoModo('zel', ctx).variante === 'detalhada', nucleoProprio: persona.militanteId ? dados.militantePorId[persona.militanteId]?.nucleo : undefined,
      sel: s.sel, selB: s.selB, hover: s.hover, destaque, esmaecer: destaque.length > 0, economia: s.eco, coordPorDistrito,
      escolhido: s.pick ? [s.pick.lng, s.pick.lat] : null, me, minhasMissoes: minhas, partidoVisivel: ctx.camada !== 'visitante',
    });
  }, [dados, escala, ind, alertas, missoes, s, ctx, persona, coordPorDistrito]);
  useEffect(() => { motor?.setScene(cena); }, [motor, cena]);

  // eventos do mapa
  useEffect(() => {
    if (!motor) return;
    let timer = 0, timerFix = 0, ultimo: string | null = null;
    const offs = [
      motor.on('click', (e) => {
        const est = st();
        if (est.escolhendoPonto) {
          if (!e.id) { est.toast({ tipo: 'warn', icon: 'pin', titulo: 'Fora do município', texto: 'Toque dentro de um distrito de São Paulo.' }); return; }
          est.set({ escolhendoPonto: null, modal: { tipo: 'registrar-alerta', categoria: est.escolhendoPonto, ponto: { lng: e.lngLat[0], lat: e.lngLat[1], distrito: e.id } } });
          return;
        }
        if (e.id) selecionar(e.id);
      }),
      motor.on('hover', (e) => {
        if (st().hover !== e.id) st().set({ hover: e.id });
        clearTimeout(timer); clearTimeout(timerFix);
        const tips = useTips.getState();
        const fixado = tips.pilha.some((t) => t.fixo);
        if (!e.id) {
          ultimo = null;
          window.setTimeout(() => { const t = useTips.getState(); if (t.dentro < 1 && t.pilha.length && !t.pilha[0].fixo && t.pilha[0].origem === 'mapa') t.fechar(1); }, 200);
          return;
        }
        if (fixado) return;
        const abrir = () => {
          useTips.getState().abrir({ nivel: 1, c: { tipo: 'distrito', distrito: e.id! }, x: e.x + 8, y: e.y + 8, fixo: teclas.alt, origem: 'mapa' });
          timerFix = window.setTimeout(() => { const t = useTips.getState(); if (t.pilha[0]?.origem === 'mapa') t.fixar(1); }, 600);
        };
        const aberto = tips.pilha[0]?.origem === 'mapa';
        if (aberto && ultimo !== e.id) abrir(); else if (!aberto) timer = window.setTimeout(abrir, 300);
        ultimo = e.id;
      }),
      motor.on('marker', (e) => {
        const est = st();
        if (e.tipo === 'alert') est.set({ modal: { tipo: 'alerta', id: e.id } });
        else if (e.tipo === 'mission') est.set({ modal: { tipo: 'missao', id: e.id } });
        else if (e.tipo === 'nucleo') est.set({ nucleoId: e.id, painel: 'nucleo' });
        else if (e.tipo === 'campanha') est.set({ modal: { tipo: 'campanha', id: e.id } });
        else if (e.tipo === 'cluster' || e.tipo === 'prio') { selecionar(e.id); mapBus.emit({ tipo: 'distrito', id: e.id, zoom: e.tipo === 'cluster' ? 14 : undefined }); }
      }),
      motor.on('view', () => {
        const v = motor.getView();
        useVista.setState({ bounds: motor.getBounds(), zoom: v.zoom, nivel: nivelDoZoom(v.zoom) });
      }),
    ];
    return () => { offs.forEach((f) => f()); clearTimeout(timer); clearTimeout(timerFix); };
  }, [motor]);

  // comandos vindos da interface
  useEffect(() => {
    if (!motor) return;
    return mapBus.on((c) => {
      if (c.tipo === 'distrito') {
        const d = dados.distritoPorId[c.id];
        if (!d) return;
        const z = c.zoom ?? Math.max(motor.getView().zoom, 12.4);
        centralizar([d.rotulo.lng, d.rotulo.lat], z);
      } else if (c.tipo === 'municipio') {
        const ins = motor.tipo === 'google' ? 30 : { top: insets.top + 20, right: insets.right + 20, bottom: insets.bottom + 20, left: insets.left + 20 };
        motor.fitBounds(SP_BOUNDS, ins);
      } else if (c.tipo === 'ponto') centralizar(c.ll, c.zoom);
      else if (c.tipo === 'zoom') motor.zoomBy(c.delta);
      else if (c.tipo === 'view') motor.setView({ center: c.ll, zoom: c.zoom });
    });
  }, [motor, dados, insets]);

  useEffect(() => { motor?.resize(); }, [motor, insets.left, insets.bottom]);

  return <div className="map-host" ref={host} />;
}
