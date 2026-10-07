// Ações do usuário (fluxos 1 a 6 do PROMPT 4.5). Tudo o que muda aqui é persistido.
import type { AlertaCoordenacao, CamadaId, CategoriaAlerta, Entrega, EvidenciaTipo, Missao, ModoId, TrilhaId, VerificacaoId } from '../data/types';
import { HOJE, MODO, fmt, fmtN } from '../data/indicators';
import { normalizarPesos, type PesosLacunas } from '../domain/lacunas';
import { NOME_TRILHA, regraNivel } from '../domain/levels';
import { acessoModo, NOME_CAMADA, podeValidar } from '../domain/permissions';
import { calcularPT, contaPT, ptNaSemana, somarDias } from '../domain/points';
import { NOME_CATEGORIA } from '../ui/icons';
import { mapBus } from './mapBus';
import { contextoDe, entregasEfetivas, militanteEstado, missoesEfetivas } from './derived';
import { MODO_INICIAL, agora, novoId, st, useStore, type Passagem } from './store';
import { persona as acharPersona, PERSONA_PADRAO } from './personas';

const dados = () => st().dados!;
const quem = () => acharPersona(dados(), st().personaId)?.nome ?? 'Pessoa fictícia';

/* ---------- camada, persona, modo ---------- */
export function trocarPersona(id: string) {
  const p = acharPersona(dados(), id);
  if (!p) return;
  st().set({ personaId: id, camada: p.camada, fichaId: null, nucleoId: null, escolhendoPonto: null });
  garantirModoPermitido();
  st().toast({ tipo: 'info', icon: 'user', titulo: `Camada ${NOME_CAMADA[p.camada]}`, texto: p.nome });
}
export function trocarCamada(c: CamadaId) {
  const atual = acharPersona(dados(), st().personaId);
  if (atual?.camada === c) return;
  trocarPersona(PERSONA_PADRAO[c]);
  telaInicial(c);
}
/** Se o modo atual não é permitido na camada, volta ao modo inicial da camada. */
export function garantirModoPermitido() {
  const s = st();
  const p = acharPersona(dados(), s.personaId);
  const mil = p?.militanteId ? militanteEstado(dados(), p.militanteId, s.lancamentos, s.passagens) : null;
  const ctx = contextoDe(s.camada, mil);
  if (!acessoModo(s.modo, ctx).ok) {
    const alvo = acessoModo(MODO_INICIAL[s.camada], ctx).ok ? MODO_INICIAL[s.camada] : 'zel';
    s.set({ modo: alvo });
  }
  if (s.aba === 'partido' && s.camada === 'visitante') s.set({ aba: 'geral' });
  if (s.camada === 'visitante' && s.painel && ['nucleo', 'missoes', 'ficha', 'relatorios', 'decisoes', 'delegacoes'].includes(s.painel)) s.set({ painel: null });
}
/** Tela inicial por camada (doc. 7.4). */
export function telaInicial(c: CamadaId) {
  const s = st();
  const p = acharPersona(dados(), s.personaId);
  s.set({ modo: MODO_INICIAL[c], selB: null, fixado: false, mes: 11, comparar: null });
  garantirModoPermitido();
  if (c === 'visitante') { s.set({ sel: p?.distrito ?? null, painel: 'territorio', aba: 'geral', folha: 'meia' }); mapBus.emit({ tipo: 'municipio' }); }
  else if (c === 'militante') { const d = p?.distrito ?? null; s.set({ sel: d, painel: 'missoes', folha: 'recolhida' }); if (d) mapBus.emit({ tipo: 'distrito', id: d, zoom: 13 }); }
  else { s.set({ sel: null, painel: null, folha: 'recolhida' }); mapBus.emit({ tipo: 'municipio' }); }
}
export function escolherModo(m: ModoId) {
  st().set({ modo: m, comparar: null });
}

/* ---------- seleção ---------- */
export function selecionar(id: string | null, o: { centrar?: boolean; abrir?: boolean } = {}) {
  const s = st();
  if (id && s.fixado && s.sel && id !== s.sel) { s.set({ selB: id }); }
  else s.set({ sel: id, ...(id === null ? { selB: null } : {}) });
  if (id && o.abrir !== false) s.set({ painel: 'territorio', folha: s.folha === 'recolhida' ? 'meia' : s.folha });
  if (id && o.centrar) mapBus.emit({ tipo: 'distrito', id });
}

/* ---------- fluxo 1: alertas do visitante ---------- */
export function registrarAlerta(o: { categoria: CategoriaAlerta; lng: number; lat: number; distrito: string; descricao?: string }) {
  const s = st();
  const id = novoId('ALE-APP');
  s.acao((a) => ({ alertasCriados: [{ id, categoria: o.categoria, distrito: o.distrito, lng: o.lng, lat: o.lat, confirmacoes: 1, status: 'novo', protocolo: null, criado_em: HOJE, descricao: o.descricao, doApp: true, autor: s.personaId }, ...a.alertasCriados] }));
  s.registrar({ tipo: 'alerta', texto: `Alerta de ${NOME_CATEGORIA[o.categoria].toLowerCase()} registrado (novo, 1 de 3 confirmações)`, distritos: [o.distrito] }, 'Morador (anônimo)');
  s.toast({ tipo: 'ok', icon: 'bell', titulo: 'Alerta registrado', texto: `${NOME_CATEGORIA[o.categoria]} · aguardando 2 confirmações independentes` });
  return id;
}
export function confirmarAlerta(id: string): 'ok' | 'ja' | 'proprio' {
  const s = st();
  const criado = s.alertasCriados.find((a) => a.id === id);
  if (criado?.autor === s.personaId) return 'proprio';
  if ((s.confirmacoes[id] ?? []).includes(s.personaId)) return 'ja';
  const antes = (criado ? 1 : (dados().alertas.find((a) => a.id === id)?.confirmacoes ?? 0)) + (s.confirmacoes[id] ?? []).length;
  s.acao((a) => ({ confirmacoes: { ...a.confirmacoes, [id]: [...(a.confirmacoes[id] ?? []), s.personaId] } }));
  const total = antes + 1;
  const alerta = criado ?? dados().alertas.find((a) => a.id === id);
  if (alerta && total === 3 && (criado || alerta.status === 'novo')) {
    s.registrar({ tipo: 'alerta', texto: `Alerta de ${NOME_CATEGORIA[alerta.categoria].toLowerCase()} confirmado por 3 pessoas: passa a contar em Zeladoria`, distritos: [alerta.distrito] }, 'Moradores (anônimos)');
    s.toast({ tipo: 'ok', icon: 'check', titulo: 'Alerta confirmado', texto: '3 confirmações independentes: agora conta em Zeladoria.' });
  } else s.toast({ tipo: 'info', icon: 'check', titulo: 'Confirmação registrada', texto: `${total} de 3 confirmações` });
  return 'ok';
}
export function consentir(aceito: boolean) {
  const s = st();
  s.acao((a) => ({ consentimento: { ...a.consentimento, [s.personaId]: { aceito, quando: agora() } } }));
  s.toast({ tipo: aceito ? 'ok' : 'info', icon: 'hands', titulo: aceito ? 'Pedido de contato registrado' : 'Consentimento revogado', texto: aceito ? 'Simulado. Você pode revogar a qualquer momento.' : 'Nenhum contato será feito.' });
}

/* ---------- fluxo 3: missão → entrega → validação → PT ---------- */
export function aceitarMissao(id: string) {
  const s = st();
  const m = missoesEfetivas(dados(), s.missoesCriadas, s.missoesAlteradas).find((x) => x.id === id);
  if (!m) return;
  s.acao((a) => ({
    inscricoes: { ...a.inscricoes, [s.personaId]: { ...(a.inscricoes[s.personaId] ?? {}), [id]: { status: 'aceita', aceitaEm: agora() } } },
    missoesAlteradas: { ...a.missoesAlteradas, [id]: { ...(a.missoesAlteradas[id] ?? {}), inscritos: Math.min(m.vagas, m.inscritos + 1) } },
  }));
  s.toast({ tipo: 'ok', icon: 'flag', titulo: 'Missão aceita', texto: m.titulo });
}
export function checkin(id: string) {
  const s = st();
  const i = s.inscricoes[s.personaId]?.[id];
  if (!i) return;
  s.acao((a) => ({ inscricoes: { ...a.inscricoes, [s.personaId]: { ...a.inscricoes[s.personaId], [id]: { ...i, status: 'checkin', checkinEm: agora() } } } }));
  s.toast({ tipo: 'ok', icon: 'pin', titulo: 'Check-in feito', texto: 'Presença registrada no local (simulado, sem localização exata guardada).' });
}
export function registrarEntrega(missaoId: string, evidencia: EvidenciaTipo, detalhe: string) {
  const s = st();
  const m = missoesEfetivas(dados(), s.missoesCriadas, s.missoesAlteradas).find((x) => x.id === missaoId);
  const p = acharPersona(dados(), s.personaId);
  if (!m || !p?.militanteId) return;
  const id = novoId('ENT-APP');
  const e: Entrega = {
    id, militante: p.militanteId, missao: m.id, trilha: m.trilha, ramo: m.ramo, acao: m.titulo, v_base: m.v_base, status: 'pendente_validacao',
    verificacao: null, evidencia, evidencia_detalhe: detalhe, foco_temporada: m.foco_temporada, territorio_prioritario: m.territorio_prioritario, criada_em: HOJE,
  };
  const i = s.inscricoes[s.personaId]?.[missaoId] ?? { status: 'aceita' as const, aceitaEm: agora() };
  s.acao((a) => ({
    entregasCriadas: [e, ...a.entregasCriadas],
    inscricoes: { ...a.inscricoes, [s.personaId]: { ...(a.inscricoes[s.personaId] ?? {}), [missaoId]: { ...i, status: 'entregue', entrega: id } } },
  }));
  s.registrar({ tipo: 'entrega', texto: `Entrega registrada (${evidencia}) na missão "${m.titulo}": pendente de validação`, distritos: [m.distrito] }, p.nome);
  s.toast({ tipo: 'info', icon: 'doc', titulo: 'Entrega pendente de validação', texto: 'Um validador de outro núcleo (Fiscalista 3+) precisa conferir.' });
  return id;
}
export function validarEntrega(entregaId: string, verificacao: VerificacaoId): { ok: boolean; motivo?: string } {
  const s = st();
  const D = dados();
  const e = entregasEfetivas(D, s.entregasCriadas, s.entregasAlteradas).find((x) => x.id === entregaId);
  const p = acharPersona(D, s.personaId);
  if (!e || !p?.militanteId) return { ok: false, motivo: 'Entrega ou validador não encontrado' };
  const val = militanteEstado(D, p.militanteId, s.lancamentos, s.passagens)!;
  const autor = D.militantePorId[e.militante];
  const ctxVal = contextoDe('militante', val).niveis!;
  const pode = podeValidar({ id: p.militanteId, nucleo: val.m.nucleo, niveis: ctxVal }, { trilha: e.trilha, militante: e.militante, nucleoAutor: autor?.nucleo ?? '' });
  if (!pode.ok) return pode;
  const ja = ptNaSemana(s.lancamentos, e.militante, e.trilha, HOJE);
  const c = calcularPT({ vBase: e.v_base, verificacao, foco_temporada: e.foco_temporada, territorio_prioritario: e.territorio_prioritario, jaNaSemana: ja, regras: D.regras });
  const antes = militanteEstado(D, e.militante, s.lancamentos, s.passagens)!.trilhas[e.trilha];
  s.acao((a) => ({
    entregasAlteradas: { ...a.entregasAlteradas, [e.id]: { status: 'validada', verificacao, validador: p.militanteId, validada_em: agora(), calculo: c } },
    lancamentos: c.creditado > 0 ? [...a.lancamentos, { id: novoId('PT'), militante: e.militante, trilha: e.trilha, data: HOJE, creditado: c.creditado, entrega: e.id, descricao: e.acao }] : a.lancamentos,
  }));
  const depois = militanteEstado(D, e.militante, st().lancamentos, st().passagens)!.trilhas[e.trilha];
  const nomeAutor = autor?.nome ?? e.militante;
  s.registrar({ tipo: 'validacao', texto: `Entrega de ${nomeAutor} validada por ${p.nome}: ${contaPT(c)}; creditado ${fmtN(c.creditado)} PT${c.naoCreditado ? ` (teto semanal: ${fmtN(c.naoCreditado)} não creditados)` : ''}` }, p.nome);
  s.toast({ tipo: 'ok', icon: 'check', titulo: `+${fmtN(c.creditado)} PT · ${NOME_TRILHA[e.trilha]}`, texto: `${contaPT(c)}${c.naoCreditado ? ` · teto semanal: ${fmtN(c.naoCreditado)} não creditados` : ''}` });
  if (depois.proxima?.prontaCarreira && !antes.proxima?.prontaCarreira) {
    const px = depois.proxima;
    s.toast({ tipo: 'warn', icon: 'medal', titulo: `${nomeAutor}: pronto(a) para a passagem`, texto: `${NOME_TRILHA[e.trilha]} ${px.nivel} (${px.titulo}) · ${px.exigeProva ? 'pedir prova de passagem à banca' : px.requisito}` });
  }
  if (antes.emReserva && !depois.emReserva) s.toast({ tipo: 'ok', icon: 'check', titulo: 'Saiu da reserva', texto: `${NOME_TRILHA[e.trilha]} ${depois.nivel}: Prontidão ${fmt(depois.prontidao)} PT, poderes ativos.` });
  return { ok: true };
}
export function contestarEntrega(entregaId: string, motivo: string) {
  const s = st();
  s.acao((a) => ({ entregasAlteradas: { ...a.entregasAlteradas, [entregaId]: { status: 'contestada', validador: acharPersona(dados(), s.personaId)?.militanteId, validada_em: agora() } } }));
  s.registrar({ tipo: 'validacao', texto: `Entrega contestada: ${motivo}` }, quem());
  s.toast({ tipo: 'warn', icon: 'info', titulo: 'Entrega contestada', texto: motivo });
}

/* ---------- passagens de nível ---------- */
function gravarPassagem(mil: string, trilha: TrilhaId, p: Passagem) {
  st().acao((a) => ({ passagens: { ...a.passagens, [mil]: { ...(a.passagens[mil] ?? {}), [trilha]: p } } }));
}
/** Níveis 2 e 3: módulo (e escolha de ramo no 3). */
export function concluirModulo(mil: string, trilha: TrilhaId, ramo?: string | null) {
  const s = st();
  const e = militanteEstado(dados(), mil, s.lancamentos, s.passagens)!.trilhas[trilha];
  if (!e.proxima || e.proxima.exigeProva || !e.proxima.prontaCarreira) return;
  gravarPassagem(mil, trilha, { nivel: e.proxima.nivel, ramo: ramo ?? e.ramo, status: 'aprovada', pedidoEm: agora(), aprovadaEm: agora() });
  s.registrar({ tipo: 'passagem', texto: `${dados().militantePorId[mil].nome} passou a ${NOME_TRILHA[trilha]} ${e.proxima.nivel}${ramo ? ` (ramo ${dados().trilhas[trilha].ramos[ramo]?.nome})` : ''}` }, quem());
  s.toast({ tipo: 'ok', icon: 'medal', titulo: `Novo nível: ${NOME_TRILHA[trilha]} ${e.proxima.nivel}`, texto: `${regraNivel(e.proxima.nivel, dados().regras.niveis).passagem} · concluído (simulado)` });
}
/** Níveis 4 a 6: pedido de prova de passagem, avaliada por banca sorteada de nível 5+ na trilha. */
export function pedirProva(mil: string, trilha: TrilhaId) {
  const s = st();
  const D = dados();
  const e = militanteEstado(D, mil, s.lancamentos, s.passagens)!.trilhas[trilha];
  if (!e.proxima?.exigeProva) return;
  const nivelBanca = Math.max(5, e.proxima.nivel);
  const banca = D.militantes.filter((x) => x.id !== mil && x.nucleo !== D.militantePorId[mil].nucleo && x.trilhas[trilha].nivel >= nivelBanca).slice(0, 3).map((x) => x.id);
  gravarPassagem(mil, trilha, { nivel: e.proxima.nivel, status: 'pendente_banca', banca, pedidoEm: agora() });
  s.registrar({ tipo: 'passagem', texto: `Prova de passagem pedida: ${D.militantePorId[mil].nome}, ${NOME_TRILHA[trilha]} ${e.proxima.nivel}. Banca sorteada: ${banca.map((b) => D.militantePorId[b].nome).join(', ') || 'a sortear'}` }, quem());
  s.toast({ tipo: 'warn', icon: 'scale', titulo: 'Prova de passagem pedida', texto: `Banca de ${banca.length} militantes nível ${nivelBanca}+ (sorteio simulado)` });
}
export function decidirBanca(mil: string, trilha: TrilhaId, aprovada: boolean) {
  const s = st();
  const p = s.passagens[mil]?.[trilha];
  if (!p || p.status !== 'pendente_banca') return;
  if (aprovada) gravarPassagem(mil, trilha, { ...p, status: 'aprovada', aprovadaEm: agora() });
  else s.acao((a) => { const c = { ...(a.passagens[mil] ?? {}) }; delete c[trilha]; return { passagens: { ...a.passagens, [mil]: c } }; });
  s.registrar({ tipo: 'passagem', texto: `Banca ${aprovada ? 'aprovou' : 'pediu nova versão d'}a prova de ${dados().militantePorId[mil].nome} (${NOME_TRILHA[trilha]} ${p.nivel})` }, quem());
  s.toast({ tipo: aprovada ? 'ok' : 'info', icon: 'medal', titulo: aprovada ? `Novo nível: ${NOME_TRILHA[trilha]} ${p.nivel}` : 'Prova devolvida', texto: aprovada ? 'Aprovada pela banca (simulado).' : 'A banca pediu nova versão.' });
}

/* ---------- alertas de coordenação ---------- */
export const chaveCoord = (a: AlertaCoordenacao) => `${a.tipo}:${a.distrito ?? a.missao ?? a.campanha ?? a.militante ?? a.texto.slice(0, 24)}`;
export function dispensarCoord(a: AlertaCoordenacao) {
  const s = st();
  const ate = somarDias(HOJE, 7);
  s.acao((x) => ({ coord: { ...x.coord, [chaveCoord(a)]: { ...(x.coord[chaveCoord(a)] ?? {}), dispensadoAte: ate } } }));
  s.toast({ tipo: 'info', icon: 'clock', titulo: 'Alerta dispensado por 7 dias', texto: `Volta em ${ate.split('-').reverse().join('/')}` });
}
function resolverCoord(a: AlertaCoordenacao, resultado: string) {
  const s = st();
  s.acao((x) => ({ coord: { ...x.coord, [chaveCoord(a)]: { resolvido: { quem: quem(), quando: agora(), resultado } } } }));
  s.registrar({ tipo: 'coordenacao', texto: `${a.texto} → ${resultado}`, distritos: a.distrito ? [a.distrito] : undefined }, quem());
  s.toast({ tipo: 'ok', icon: 'check', titulo: 'Alerta de coordenação resolvido', texto: resultado });
}
export function criarMissao(m: Omit<Missao, 'id'>, prefixo = 'MIS-APP') {
  const id = novoId(prefixo);
  st().acao((a) => ({ missoesCriadas: [{ ...m, id }, ...a.missoesCriadas] }));
  return id;
}
/** Executa a ação sugerida de um alerta de coordenação. */
export function agirCoord(a: AlertaCoordenacao, opcao?: string) {
  const s = st();
  const D = dados();
  switch (a.tipo) {
    case 'distrito_sem_nucleo': {
      const d = D.distritoPorId[a.distrito!];
      const vizinho = D.nucleos.find((n) => D.distritoPorId[n.distrito]?.sub === d.sub) ?? null;
      const id = criarMissao({
        titulo: `Acolhimento em ${d.nome}: novo militante acolhido e ativo após 30 dias`, trilha: 'militante', ramo: 'organizacao', distrito: d.id, nucleo: vizinho?.id ?? null,
        lng: d.rotulo.lng, lat: d.rotulo.lat, status: 'aberta', prazo: somarDias(HOJE, 30), vagas: 4, inscritos: 0, v_base: 30, verificacao_tipica: 'atividade do acolhido',
        m_verificacao_esperado: 1, foco_temporada: false, territorio_prioritario: true, nivel_minimo: 1, campanha: null, criada_por: quem(), origem: 'alerta de coordenação: distrito sem núcleo',
      });
      resolverCoord(a, `Missão de acolhimento aberta (${id}), 4 vagas, território prioritário ×1,5`);
      selecionar(d.id, { centrar: true });
      return id;
    }
    case 'sobreposicao_de_missoes': {
      const ms = missoesEfetivas(D, s.missoesCriadas, s.missoesAlteradas).filter((m) => m.distrito === a.distrito && m.prazo === '2026-10-17' && m.status !== 'unificada');
      if (ms.length >= 2) {
        const [x, y] = ms;
        s.acao((st0) => ({ missoesAlteradas: { ...st0.missoesAlteradas,
          [x.id]: { ...(st0.missoesAlteradas[x.id] ?? {}), titulo: 'Mutirão de limpeza no córrego (unificado: Núcleos Grajaú 1 e 2)', vagas: x.vagas + y.vagas, inscritos: x.inscritos + y.inscritos, origem: `unificada com ${y.id}` },
          [y.id]: { ...(st0.missoesAlteradas[y.id] ?? {}), status: 'unificada', origem: `unificada em ${x.id}` } } }));
        resolverCoord(a, `Missões unificadas em ${x.id}: ${x.vagas + y.vagas} vagas, ${x.inscritos + y.inscritos} inscritos`);
      } else resolverCoord(a, 'Missões já unificadas');
      if (a.distrito) selecionar(a.distrito, { centrar: true });
      return;
    }
    case 'missao_sem_voluntarios': {
      s.acao((x) => ({ missoesAlteradas: { ...x.missoesAlteradas, [a.missao!]: { ...(x.missoesAlteradas[a.missao!] ?? {}), origem: 'convocação de núcleos vizinhos' } } }));
      resolverCoord(a, 'Núcleos vizinhos convocados (aviso simulado)');
      return;
    }
    case 'meta_em_risco':
      resolverCoord(a, opcao ?? 'Equipe reforçada: +2 núcleos convidados para a campanha');
      return;
    case 'delegacao_expirando': {
      const renovar = opcao !== 'encerrar';
      s.acao((x) => ({ delegacoes: { ...x.delegacoes, 'DLG-1': { ate: renovar ? '2027-02-16' : HOJE, status: renovar ? 'ativa' : 'encerrada' } } }));
      resolverCoord(a, renovar ? 'Delegação renovada por 4 meses (até 16/02/2027)' : 'Delegação encerrada');
      return;
    }
    case 'prova_pendente_de_banca': {
      const mil = a.militante!;
      const banca = D.militantes.filter((x) => x.id !== mil && x.nucleo !== D.militantePorId[mil].nucleo && x.trilhas.fiscalista.nivel >= 5).slice(0, 3);
      resolverCoord(a, `Banca sorteada: ${banca.map((b) => b.nome).join(', ')}`);
      return;
    }
  }
}

/* ---------- fluxo 6: decisão e pesos ---------- */
export function decidir(decId: string, opcaoId: string) {
  const s = st();
  const D = dados();
  const dec = D.decisoes.find((d) => d.id === decId);
  const op = dec?.opcoes.find((o) => o.id === opcaoId);
  if (!dec || !op || op.bloqueada) return;
  const alvos: string[] = opcaoId === 'A' ? ['JDA', 'JDS', 'JDA'] : opcaoId === 'B' ? ['GRA', 'CDU', 'CLM', 'CRE'] : [];
  const ids = alvos.map((dist, i) => {
    const d = D.distritoPorId[dist];
    const nuc = D.nucleos.find((n) => n.distrito === dist) ?? null;
    return criarMissao({
      titulo: `Mutirão de solidariedade pós-chuva · ${d.nome}${opcaoId === 'A' && i === 2 ? ' (equipe 2)' : ''}`, trilha: 'militante', ramo: 'rua', distrito: dist, nucleo: nuc?.id ?? null,
      lng: d.rotulo.lng + (i % 2 ? 0.004 : -0.004), lat: d.rotulo.lat + 0.003, status: 'agendada', prazo: somarDias(HOJE, 4), vagas: 25, inscritos: 0, v_base: 30,
      verificacao_tipica: 'coordenador', m_verificacao_esperado: 1, foco_temporada: true, territorio_prioritario: false, nivel_minimo: 1, campanha: 'CAM-2', criada_por: quem(), origem: `decisão ${dec.id}`,
    }, 'MIS-DEC');
  });
  s.acao((a) => ({ decisoes: [{ id: dec.id, opcao: op.id, texto: op.texto, quem: quem(), camada: s.camada, quando: agora(), missoes: ids }, ...a.decisoes] }));
  s.registrar({ tipo: 'decisao', texto: `Decisão "${dec.titulo}" → ${op.id}. ${op.texto}. ${ids.length} missões sugeridas criadas.`, distritos: [...new Set(alvos)] }, quem());
  s.toast({ tipo: 'ok', icon: 'scale', titulo: 'Decisão registrada no histórico', texto: `${op.texto} · ${ids.length} missões sugeridas` });
  s.set({ modal: null, modo: 'ope', painel: 'decisoes' });
}
export function alterarPesos(p: PesosLacunas) {
  const s = st();
  if (s.camada !== 'direcao') return false;
  const depois = normalizarPesos(p);
  const antes = s.pesos;
  s.acao((a) => ({ pesos: depois, pesosLog: [{ quem: quem(), quando: agora(), antes, depois }, ...a.pesosLog] }));
  const f = (x: PesosLacunas) => `${fmt(x.problemas, 2)} / ${fmt(x.vulnerabilidade, 2)} / ${fmt(x.presenca, 2)}`;
  s.registrar({ tipo: 'pesos', texto: `Pesos do índice de Lacunas: ${f(antes)} → ${f(depois)}` }, quem());
  s.toast({ tipo: 'ok', icon: 'gap', titulo: 'Índice de Lacunas recalculado', texto: `Pesos ${f(depois)} · mudança registrada` });
  return true;
}

export const nomeModo = (m: ModoId) => MODO[m].nome;
export { useStore };
