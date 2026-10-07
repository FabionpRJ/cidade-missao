// Barra superior (doc. 7.1, 7.2; pacote A §5): itens do documento filtrados pela camada; clique abre o Ledger filtrado.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HOJE, fmt, mesCurto } from '../data/indicators';
import { NOME_CAMADA } from '../domain/permissions';
import { useCoord } from '../state/coord';
import { useAlertas, useDados, useIndicadores, usePersona, useZonaPersona } from '../state/derived';
import { st, useStore } from '../state/store';
import { Fict } from '../ui/common';
import { Icon, Monograma } from '../ui/icons';
import { Tip } from './NestedTooltip';
import type { TipConteudo } from './tipStore';

interface Recurso { id: string; i: string; v: string; l: string; d?: string; pos?: boolean; tip: TipConteudo; lock?: string; ledger?: { indicador: string; zona?: string | null; sub?: string | null }; painel?: 'relatorios' }

export const ICONE_CAMADA = { visitante: 'eye', militante: 'mega', autoridade: 'building', direcao: 'scale' } as const;

export function useRecursos(): { escopo: string; itens: Recurso[] } {
  const dados = useDados();
  const ind = useIndicadores();
  const alertas = useAlertas();
  const persona = usePersona();
  const zona = useZonaPersona();
  const [usarZona] = useState(false);
  const escopoZona = useStore((s) => s.ledger.zona);
  return useMemo(() => {
    const c = persona.camada;
    const T = dados.temporada;
    let ids = dados.distritos.map((d) => d.id);
    let escopo = 'Município de São Paulo';
    let sub: string | null = null, zonaId: string | null = null;
    if (c === 'militante' && persona.distrito) {
      sub = dados.distritoPorId[persona.distrito].sub;
      ids = dados.subPorNome[sub]?.distritos ?? ids;
      escopo = `Subprefeitura ${sub} (seu núcleo)`;
    } else if (c === 'autoridade' && (usarZona || escopoZona) && zona.length) {
      ids = zona; escopo = 'Sua zona de atuação'; zonaId = persona.zonas?.[0] ?? null;
    }
    const soma = (k: 'militantes' | 'filiacoes_mes' | 'pop') => ids.reduce((a, id) => a + ind[id][k], 0);
    const mil = soma('militantes');
    const milAntes = ids.reduce((a, id) => a + (dados.distritoPorId[id].serie.pres[8] * ind[id].eleit) / 1000, 0);
    const pront = ids.reduce((a, id) => a + ind[id].prontidao_media * ind[id].militantes, 0) / Math.max(1, mil);
    const abertos = alertas.filter((a) => a.status !== 'resolvido' && ids.includes(a.distrito)).length;
    const camp = dados.campanhas.filter((x) => x.territorio.some((t) => ids.includes(t))).length;
    const tempo = ids.reduce((a, id) => a + ind[id].tempo_resolucao_dias * ind[id].pop, 0) / soma('pop');
    const nivel = c === 'militante' ? 'subprefeitura' : 'município';
    const app = (titulo: string, valor: string, unidade: string, extra?: string): TipConteudo => ({ tipo: 'numero', titulo, valor, unidade, fonte: 'Cidade Missão (dado do app)', ano: 2026, nivel, app: true, nota: extra });
    const lockMil = 'Disponível a partir da camada Militante';
    const ledger = (indicador: string) => ({ indicador, sub, zona: zonaId });
    const itens: Recurso[] = [];
    if (c === 'visitante') {
      itens.push({ id: 'pop', i: 'people', v: fmt(soma('pop')), l: 'População', tip: { tipo: 'numero', titulo: 'População', valor: fmt(soma('pop')), unidade: 'habitantes (soma dos distritos)', fonte: 'IBGE, Censo 2022', ano: 2022, nivel: 'distrito → município', desatualizado: true, nota: 'Valor fictício nos dados do protótipo.' }, ledger: ledger('pop') });
    } else {
      itens.push({ id: 'mil', i: 'users', v: fmt(mil), l: 'Militantes ativos', d: `${mil - milAntes >= 0 ? '+' : '−'}${fmt(Math.abs(mil - milAntes))}`, pos: mil >= milAntes, tip: app('Militantes ativos', fmt(mil), 'participaram de missão ou entrega em 90 dias', `Tendência: ${fmt(milAntes)} em ${mesCurto(dados.meta.meses[8])} → ${fmt(mil)} em ${mesCurto(dados.meta.meses[11])}.`), ledger: ledger('militantes') });
      itens.push({ id: 'pront', i: 'clock', v: `${fmt(pront)}%`, l: 'Prontidão média', tip: app('Prontidão média', `${fmt(pront)}%`, '% dos militantes ativos com Prontidão acima do mínimo do nível', 'Média ponderada pelos militantes de cada distrito.'), ledger: ledger('prontidao_media') });
    }
    itens.push({ id: 'ale', i: 'bell', v: fmt(abertos), l: 'Alertas abertos', tip: app('Alertas abertos', fmt(abertos), 'alertas no mapa ainda não resolvidos (amostra)', 'Alertas não guardam quem os criou para uso do partido.'), ledger: ledger('zel') });
    if (c === 'visitante') {
      itens.push({ id: 'res', i: 'clock', v: `${fmt(tempo)} d`, l: 'Tempo médio de resolução', tip: app('Tempo médio de resolução', `${fmt(tempo)} dias`, 'média ponderada pela população'), ledger: ledger('zel') });
      itens.push({ id: 'mil', i: 'users', v: '—', l: 'Militantes ativos', lock: lockMil, tip: { tipo: 'texto', titulo: 'Militantes ativos', texto: lockMil + '. O visitante vê só indicadores públicos do município.' } });
      itens.push({ id: 'temp', i: 'flag', v: '—', l: 'Temporada', lock: lockMil, tip: { tipo: 'texto', titulo: 'Temporada', texto: lockMil + '.' } });
    } else {
      itens.push({ id: 'fil', i: 'plus', v: fmt(soma('filiacoes_mes')), l: 'Filiações do mês', tip: app('Filiações do mês', fmt(soma('filiacoes_mes')), 'filiações confirmadas no cadastro em out/26'), ledger: ledger('filiacoes_mes') });
      itens.push({ id: 'cam', i: 'flag', v: String(camp), l: 'Campanhas', tip: app('Campanhas ativas', String(camp), 'campanhas com território no escopo', dados.campanhas.map((x) => `${x.nome} (${Math.round(x.progresso * 100)}%)`).join(' · ')), ledger: ledger('ops') });
      itens.push({ id: 'temp', i: 'cal', v: `${T.dias_restantes}d`, l: `Temporada: ${T.nome}`, painel: 'relatorios', tip: { tipo: 'texto', titulo: `Temporada ${T.nome}`, texto: `De ${T.inicio.split('-').reverse().join('/')} a ${T.fim.split('-').reverse().join('/')}; faltam ${T.dias_restantes} dias. Escolhida por ${T.escolhida_por}. Entregas ligadas ao foco: ×${fmt(T.multiplicador, 2)}. Ver [[temporada|temporada]].`, fonte: 'Cidade Missão (dado do app) · 2026 · município' } });
    }
    return { escopo, itens };
  }, [dados, ind, alertas, persona, zona, usarZona, escopoZona]);
}

function abrirRecurso(r: Recurso) {
  if (r.lock) return;
  if (r.painel) { st().set({ painel: r.painel }); return; }
  if (r.ledger) st().set({ painel: 'ledger', ledger: { ...st().ledger, indicador: r.ledger.indicador, ordem: 'desc', sub: r.ledger.sub ?? null, zona: r.ledger.zona ?? null, comparar: [] } });
}

/** Quantos indicadores cabem na faixa (o resto vai para o botão "+N"). Mede a largura real. */
function useCabem(ref: React.RefObject<HTMLDivElement | null>, n: number) {
  const [cabem, setCabem] = useState(n);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const filhos = [...el.querySelectorAll<HTMLElement>(':scope > .res')];
      filhos.forEach((f) => { f.style.display = ''; });
      const larguras = filhos.map((f) => f.offsetWidth);
      const total = larguras.reduce((a, b) => a + b, 0);
      let k = filhos.length;
      if (total > el.clientWidth) {
        const livre = el.clientWidth - 58; // espaço do botão "+N"
        let soma = 0; k = 0;
        for (const w of larguras) { if (soma + w > livre) break; soma += w; k++; }
      }
      filhos.forEach((f, i) => { f.style.display = i < k ? '' : 'none'; });
      setCabem(k);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, n]);
  return cabem;
}

export function TopBar() {
  const faixa = useRef<HTMLDivElement>(null);
  const [mais, setMais] = useState(false);
  const btnMais = useRef<HTMLButtonElement>(null);
  const dados = useDados();
  const persona = usePersona();
  const camada = useStore((s) => s.camada);
  const mes = useStore((s) => s.mes), tocando = useStore((s) => s.tocando);
  const insc = useStore((s) => s.inscricoes[s.personaId]);
  const criados = useStore((s) => s.alertasCriados);
  const decisoes = useStore((s) => s.decisoes);
  const { ativos } = useCoord();
  const { itens, escopo } = useRecursos();
  const nMissoes = Object.values(insc ?? {}).filter((i) => i.status !== 'entregue').length;
  const pendDec = dados.decisoes.filter((d) => !decisoes.some((x) => x.id === d.id)).length;
  const meus = criados.filter((a) => a.autor === persona.id).length;
  const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const ym = dados.meta.meses[mes].split('-');
  const cabem = useCabem(faixa, itens.length);
  const ocultos = itens.slice(cabem);
  return (
    <header className="cm-top" aria-label="Barra superior">
      <div className="brand">
        <Monograma />
        {<div className="brand-t"><b>Cidade Missão</b>
          <Tip as="span" className="mun-sel" c={{ tipo: 'texto', titulo: 'Município', texto: camada === 'direcao' ? 'Visão multi-município: futuro (fora do escopo do protótipo). Só São Paulo está carregado.' : 'Protótipo com um município piloto: São Paulo.' }}>
            <small>São Paulo · SP</small>{camada === 'direcao' && <Icon n="lock" s={10} />}
          </Tip></div>}
      </div>
      <div className="res-row" role="list" aria-label={`Indicadores · ${escopo}`} ref={faixa}>
        {itens.map((r) => (
          <Tip key={r.id} c={r.tip} className={`res${r.lock ? ' is-lock' : ''}`} label={`${r.l}: ${r.v}${r.lock ? ` (${r.lock})` : ''}`} onClick={r.lock ? undefined : () => abrirRecurso(r)} testid={`res-${r.id}`}>
            <Icon n={r.lock ? 'lock' : r.i} s={18} />
            <b>{r.v}</b>
            {r.d ? <em className={r.pos ? 'pos' : 'neg'}>{r.d}</em> : <span />}
            <small>{r.l}</small>
          </Tip>
        ))}
        {ocultos.length > 0 && (
          <div className="res-mais">
            <button className="chip" aria-expanded={mais} ref={btnMais} aria-label={`Mais ${ocultos.length} indicadores`} onClick={() => setMais(!mais)} data-testid="res-mais">+{ocultos.length}</button>
            {mais && <div className="res-pop" role="list" onClick={() => setMais(false)} style={{ left: Math.max(8, Math.min((btnMais.current?.getBoundingClientRect().left ?? 0) - 120, window.innerWidth - 260)) }}>
              {ocultos.map((r) => (
                <button key={r.id} className={`res${r.lock ? ' is-lock' : ''}`} style={{ display: 'grid' }} onClick={() => abrirRecurso(r)} title={r.lock ?? r.l}>
                  <Icon n={r.lock ? 'lock' : r.i} s={18} /><b>{r.v}</b>{r.d ? <em className={r.pos ? 'pos' : 'neg'}>{r.d}</em> : <span />}<small>{r.l}</small>
                </button>
              ))}
            </div>}
          </div>
        )}
      </div>
      <div className="top-mid">
        <button className="layer-badge" onClick={() => st().set({ modal: { tipo: 'dev' } })} title="Trocar camada e persona (Ctrl+Shift+L)" data-testid="camada-badge">
          <Icon n={ICONE_CAMADA[camada]} s={14} /><span className="btn-t">Camada</span> <b>{NOME_CAMADA[camada]}</b>
        </button>
        <Fict />
      </div>
      <div className="top-right">
        {camada !== 'visitante' && <button className="cnt" title={`Suas missões em andamento: ${nMissoes}`} aria-label={`Suas missões: ${nMissoes}`} onClick={() => st().set({ painel: 'missoes' })}><Icon n="flag" s={16} /><span className="num">{nMissoes}</span></button>}
        {camada === 'visitante' && <button className="cnt" title={`Seus alertas: ${meus}`} aria-label={`Seus alertas: ${meus}`} onClick={() => st().set({ painel: 'alertas' })}><Icon n="bell" s={16} /><span className="num">{meus}</span></button>}
        {(camada === 'autoridade' || camada === 'direcao') && <>
          <button className="cnt warn" title={`Alertas de coordenação: ${ativos.length}`} aria-label={`Alertas de coordenação: ${ativos.length}`}><Icon n="ops" s={16} /><span className="num">{ativos.length}</span></button>
          <button className="cnt" title={`Decisões pendentes: ${pendDec}`} aria-label={`Decisões pendentes: ${pendDec}`} onClick={() => st().set({ painel: 'decisoes' })}><Icon n="scale" s={16} /><span className="num">{pendDec}</span></button>
        </>}
        <div className="date-ctl">
          <div className="date"><b>{MESES_LONGOS[Number(ym[1]) - 1][0].toUpperCase() + MESES_LONGOS[Number(ym[1]) - 1].slice(1)} de {ym[0]}</b><small>{mes === 11 ? `hoje ${HOJE.split('-').reverse().join('/')} · mensal` : 'histórico · mensal'}</small></div>
          <div className="time-btns">
            <button title="Mês anterior ([)" aria-label="Mês anterior" disabled={mes === 0} onClick={() => st().set({ mes: Math.max(0, mes - 1), tocando: false })}><Icon n="prev" s={14} /></button>
            <button className={tocando ? 'is-on' : ''} title={tocando ? 'Pausar' : 'Reproduzir 12 meses'} aria-label={tocando ? 'Pausar' : 'Reproduzir'} onClick={() => st().set({ tocando: !tocando, mes: !tocando && mes === 11 ? 0 : mes })}><Icon n={tocando ? 'pause' : 'play'} s={14} /></button>
            <button title="Próximo mês (])" aria-label="Próximo mês" disabled={mes === 11} onClick={() => st().set({ mes: Math.min(11, mes + 1), tocando: false })}><Icon n="next" s={14} /></button>
          </div>
        </div>
        <button className="btn" onClick={() => st().set({ modal: { tipo: 'municipio' } })} title="Ficha do município (doc. 8.2)"><Icon n="doc" s={14} /><span className="btn-t">Ficha do município</span></button>
        <button className="icon-btn" title="Configurações" aria-label="Configurações" onClick={() => st().set({ painel: 'config' })}><Icon n="menu" s={18} /></button>
      </div>
    </header>
  );
}
