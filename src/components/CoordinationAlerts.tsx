// Alertas de coordenação (doc. 7.2): ícones no topo; clique centraliza o mapa e abre a ação sugerida; dispensar adia 7 dias.
import { useEffect } from 'react';
import { ICONE_TIPO_COORD, NOME_TIPO_COORD, type CoordAtivo } from '../domain/coordination';
import { agirCoord, dispensarCoord, selecionar } from '../state/actions';
import { useCoord } from '../state/coord';
import { useDados } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { st, useStore } from '../state/store';
import { Icon } from '../ui/icons';

function descricao(c: CoordAtivo, nome: (id: string) => string): string {
  const a = c.a;
  switch (a.tipo) {
    case 'distrito_sem_nucleo': return `${nome(a.distrito!)} não tem núcleo e concentra muitos alertas confirmados. Abrir uma missão de acolhimento (Militante · Organização, território prioritário ×1,5) chama quem já está perto.`;
    case 'sobreposicao_de_missoes': return 'Os núcleos Grajaú 1 e Grajaú 2 convocaram mutirões de limpeza para sáb., 17/out, na mesma área. Unificar evita retrabalho e soma o efetivo.';
    case 'missao_sem_voluntarios': return 'A missão está aberta sem nenhum inscrito. Convocar núcleos vizinhos envia um aviso (simulado).';
    case 'meta_em_risco': return 'A campanha está atrás do ritmo previsto para o prazo. Revise a meta ou reforce a equipe com núcleos vizinhos.';
    case 'delegacao_expirando': return 'Delegações têm prazo e escopo. Renove por mais 4 meses ou encerre; sem ação, a responsabilidade volta à direção.';
    case 'prova_pendente_de_banca': return 'Provas de passagem dos níveis 4 a 6 são avaliadas por banca de militantes nível 5+ na trilha, sorteada por prova.';
  }
}

function useLista() {
  const { ativos, todos } = useCoord();
  const verDisp = useStore((s) => s.verDispensados);
  return { lista: verDisp ? todos.filter((c) => !c.resolvido) : ativos, todos, verDisp };
}

function focar(lista: CoordAtivo[], i: number) {
  st().set({ coordIdx: i, coordAberto: true });
  const c = lista[i];
  if (c?.distrito) { selecionar(c.distrito, { abrir: false }); mapBus.emit({ tipo: 'distrito', id: c.distrito }); }
}

/** Faixa logo abaixo da barra superior: um ícone por alerta (rola na horizontal se não couber). */
export function CoordinationStrip() {
  const { lista, todos, verDisp } = useLista();
  const idx = useStore((s) => s.coordIdx), aberto = useStore((s) => s.coordAberto);
  useEffect(() => { if (idx >= lista.length && lista.length) st().set({ coordIdx: lista.length - 1 }); }, [lista.length, idx]);
  const atual = lista[Math.min(idx, lista.length - 1)];
  const resolvidos = todos.filter((c) => c.resolvido).length;
  return (
    <div className="coord-strip" role="region" aria-label="Alertas de coordenação">
      <span className="lbl">Coordenação</span>
      <div className="coord-ics">
        {lista.map((c, i) => (
          <button key={c.chave} className={`coord-ic${i === idx && aberto ? ' is-sel' : ''}${c.naZona ? ' is-zona' : ''}`} onClick={() => focar(lista, i)}
            title={`${NOME_TIPO_COORD[c.a.tipo]}: ${c.a.texto}${c.naZona ? ' (na sua zona)' : ''}${c.dispensado ? ' · dispensado' : ''}`} aria-label={`${NOME_TIPO_COORD[c.a.tipo]}: ${c.a.texto}`} style={c.dispensado ? { opacity: .5 } : undefined}>
            <Icon n={ICONE_TIPO_COORD[c.a.tipo]} s={18} />
          </button>
        ))}
      </div>
      {lista.length === 0 && <span className="resumo">Nenhum alerta de coordenação ativo.</span>}
      {atual && <span className="resumo"><b>{NOME_TIPO_COORD[atual.a.tipo]}</b> · {atual.a.texto}</span>}
      <span className="direita">
        {resolvidos > 0 && <span className="chip-s ok">{resolvidos} resolvido(s)</span>}
        <button className="chip" onClick={() => st().set({ verDispensados: !verDisp })} aria-pressed={verDisp}>{verDisp ? 'Ocultar dispensados' : 'Ver dispensados'}</button>
      </span>
    </div>
  );
}

/** Cartão do alerta selecionado, no canto superior direito da área do mapa. */
export function CoordinationCard() {
  const dados = useDados();
  const { lista } = useLista();
  const idx = useStore((s) => s.coordIdx), aberto = useStore((s) => s.coordAberto);
  const nome = (id: string) => dados.distritoPorId[id]?.nome ?? id;
  const atual = lista[Math.min(idx, lista.length - 1)];
  if (!atual || !aberto) return null;
  return (
    <div className="cm-alert" role="alert" data-testid="coord-card">
      <div className="al-ic"><Icon n={ICONE_TIPO_COORD[atual.a.tipo]} s={22} /></div>
      <div className="al-body">
        <small>Alerta de coordenação · {NOME_TIPO_COORD[atual.a.tipo]}{atual.distrito ? ` · ${dados.distritoPorId[atual.distrito]?.sub ?? ''}` : ''}{atual.naZona ? ' · na sua zona' : ''}</small>
        <b>{atual.a.texto}</b>
        <p>{descricao(atual, nome)}</p>
        <div className="al-act">
          <button className="btn primary" onClick={() => agirCoord(atual.a)} data-testid="coord-acao"><Icon n="check" s={14} />{atual.a.acao}</button>
          {atual.a.tipo === 'delegacao_expirando' && <button className="btn" onClick={() => agirCoord(atual.a, 'encerrar')}>Encerrar delegação</button>}
          {atual.a.tipo === 'meta_em_risco' && <button className="btn" onClick={() => agirCoord(atual.a, 'Meta revisada para 3 mutirões (registro na campanha)')}>Revisar meta</button>}
          {atual.distrito && <button className="btn ghost" onClick={() => { selecionar(atual.distrito!, { abrir: true }); mapBus.emit({ tipo: 'distrito', id: atual.distrito! }); }}><Icon n="map" s={14} />Ver no mapa</button>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button className="icon-btn" title="Fechar o cartão" aria-label="Fechar o cartão" onClick={() => st().set({ coordAberto: false })}><Icon n="close" s={16} /></button>
        <button className="icon-btn" title="Dispensar por 7 dias" aria-label="Dispensar por 7 dias" onClick={() => dispensarCoord(atual.a)} data-testid="coord-dispensar"><Icon n="clock" s={16} /></button>
      </div>
      <span className="al-count">
        <button aria-label="Anterior" onClick={() => focar(lista, (idx - 1 + lista.length) % lista.length)}><Icon n="back" s={12} /></button>
        {Math.min(idx, lista.length - 1) + 1} de {lista.length}
        <button aria-label="Próximo" onClick={() => focar(lista, (idx + 1) % lista.length)}><Icon n="right" s={12} /></button>
        <span className="al-nota">· dispensar adia 7 dias</span>
      </span>
    </div>
  );
}
