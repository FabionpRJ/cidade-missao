// Ledger (doc. 5.1, 7.2): tabela dos 96 distritos por qualquer indicador; ordenar, filtrar, comparar, exportar CSV respeitando permissões.
import { useMemo } from 'react';
import { fmt } from '../data/indicators';
import { acessoIndicador, acessoPesos, colunasPermitidas, NOME_CAMADA } from '../domain/permissions';
import { selecionar } from '../state/actions';
import { useContexto, useDados, useIndicadores, usePersona, type IndEf } from '../state/derived';
import { mapBus } from '../state/mapBus';
import { agora, st, useStore } from '../state/store';
import { corPorValor, RAMPAS } from '../map/choropleth';
import { Fict, Src } from '../ui/common';
import { DrawerHead } from '../ui/DrawerHead';
import { Icon } from '../ui/icons';
import { Term, Tip } from './NestedTooltip';

interface Col { id: string; nome: string; curto: string; get: (i: IndEf) => number; dec: number; fonte: string; rampa?: keyof typeof RAMPAS; dom?: [number, number] }

function useColunas(): Col[] {
  const dados = useDados();
  const I = dados.indicadores;
  const f = (k: keyof typeof I) => `${I[k].fonte} · ${I[k].ano} · ${I[k].nivel}`;
  return [
    { id: 'lac', nome: 'Lacunas de cobertura', curto: 'Lacunas', get: (i) => i.lac, dec: 2, fonte: f('lac'), rampa: 'prioridade', dom: [0, 1] },
    { id: 'p_problemas', nome: 'Percentil de problemas', curto: 'P prob.', get: (i) => i.lacComp.p_problemas, dec: 2, fonte: f('lac') },
    { id: 'p_vulnerabilidade', nome: 'Percentil de vulnerabilidade', curto: 'P vuln.', get: (i) => i.lacComp.p_vulnerabilidade, dec: 2, fonte: f('lac') },
    { id: 'p_presenca', nome: 'Percentil de presença', curto: 'P pres.', get: (i) => i.lacComp.p_presenca, dec: 2, fonte: f('lac') },
    { id: 'zel', nome: 'Zeladoria (alertas /mil hab., 90 dias)', curto: 'Zelad.', get: (i) => i.zel, dec: 1, fonte: f('zel'), rampa: 'problemas', dom: I.zel.dominio },
    { id: 'alertas_90d', nome: 'Alertas confirmados (90 dias)', curto: 'Alertas', get: (i) => i.alertas_90d, dec: 0, fonte: f('zel') },
    { id: 'tempo_resolucao_dias', nome: 'Tempo médio de resolução (dias)', curto: 'Resol.', get: (i) => i.tempo_resolucao_dias, dec: 0, fonte: f('zel') },
    { id: 'pres', nome: 'Presença (militantes /mil eleitores)', curto: 'Presença', get: (i) => i.pres, dec: 2, fonte: f('pres'), rampa: 'partido', dom: I.pres.dominio },
    { id: 'militantes', nome: 'Militantes ativos', curto: 'Milit.', get: (i) => i.militantes, dec: 0, fonte: f('pres') },
    { id: 'nucleos', nome: 'Núcleos', curto: 'Núcl.', get: (i) => i.nucleos, dec: 0, fonte: f('pres') },
    { id: 'prontidao_media', nome: 'Prontidão média (%)', curto: 'Pront.', get: (i) => i.prontidao_media, dec: 0, fonte: f('prontidao_media') },
    { id: 'filiacoes_mes', nome: 'Filiações do mês', curto: 'Filiaç.', get: (i) => i.filiacoes_mes, dec: 0, fonte: f('pres') },
    { id: 'ops', nome: 'Operações (missões ativas)', curto: 'Oper.', get: (i) => i.ops, dec: 0, fonte: f('ops'), rampa: 'partido', dom: I.ops.dominio },
    { id: 'pop', nome: 'População', curto: 'Pop.', get: (i) => i.pop, dec: 0, fonte: f('pop') },
    { id: 'dens', nome: 'Densidade (hab./km²)', curto: 'Dens.', get: (i) => i.dens, dec: 0, fonte: f('dens'), rampa: 'territorio', dom: I.dens.dominio },
    { id: 'renda', nome: 'Renda (R$ per capita/mês)', curto: 'Renda', get: (i) => i.renda, dec: 0, fonte: f('renda'), rampa: 'territorio', dom: I.renda.dominio },
    { id: 'vul', nome: 'Vulnerabilidade (IPVS 2010)', curto: 'Vulner.', get: (i) => i.vul, dec: 2, fonte: f('vul') },
    { id: 'saude', nome: 'Saúde (% cobertura)', curto: 'Saúde', get: (i) => i.saude, dec: 0, fonte: f('saude'), rampa: 'servicos', dom: I.saude.dominio },
    { id: 'educ', nome: 'Educação (% atendimento)', curto: 'Educ.', get: (i) => i.educ, dec: 1, fonte: f('educ'), rampa: 'servicos', dom: I.educ.dominio },
    { id: 'san', nome: 'Saneamento (% esgoto)', curto: 'Saneam.', get: (i) => i.san, dec: 1, fonte: f('san'), rampa: 'servicos', dom: I.san.dominio },
    { id: 'risco', nome: 'Riscos (/mil domicílios)', curto: 'Riscos', get: (i) => i.risco, dec: 0, fonte: f('risco'), rampa: 'servicos', dom: I.risco.dominio },
    { id: 'comp', nome: 'Comparecimento (%, TSE 2024) ⚖', curto: 'Compar.', get: (i) => i.comp, dec: 1, fonte: f('comp'), rampa: 'partido', dom: I.comp.dominio },
    { id: 'eleit', nome: 'Eleitorado', curto: 'Eleit.', get: (i) => i.eleit, dec: 0, fonte: f('comp') },
  ];
}
const RELACIONADAS: Record<string, string[]> = {
  lac: ['p_problemas', 'p_vulnerabilidade', 'p_presenca'], zel: ['alertas_90d', 'tempo_resolucao_dias', 'pop'], alertas_90d: ['zel', 'tempo_resolucao_dias'],
  pres: ['militantes', 'nucleos', 'prontidao_media'], militantes: ['pres', 'nucleos', 'prontidao_media'], prontidao_media: ['militantes', 'pres', 'nucleos'],
  filiacoes_mes: ['militantes', 'pres'], ops: ['militantes', 'nucleos', 'pres'], comp: ['eleit', 'pop'], vul: ['renda', 'zel'], renda: ['vul', 'pop'],
};

export function Ledger() {
  const dados = useDados();
  const ind = useIndicadores();
  const ctx = useContexto();
  const persona = usePersona();
  const L = useStore((s) => s.ledger);
  const sel = useStore((s) => s.sel);
  const pesos = useStore((s) => s.pesos);
  const todas = useColunas();
  const permitidas = todas.filter((c) => acessoIndicador(c.id, ctx).ok);
  const princ = permitidas.find((c) => c.id === L.indicador) ?? permitidas.find((c) => c.id === 'zel')!;
  const zonaDist = L.zona ? dados.zonas_de_atuacao.find((z) => z.id === L.zona)?.distritos ?? [] : null;
  const rel = (L.largo ? permitidas.map((c) => c.id).filter((x) => x !== princ.id) : (RELACIONADAS[princ.id] ?? ['zel', 'pop']));
  const colsIds = colunasPermitidas([princ.id, ...rel], ctx);
  const cols = colsIds.map((id) => todas.find((c) => c.id === id)!).filter(Boolean);
  const ordenada = useMemo(() => {
    const busca = L.busca.trim().toLowerCase();
    return dados.distritos
      .filter((d) => (!zonaDist || zonaDist.includes(d.id)) && (!L.sub || d.sub === L.sub) && (!busca || d.nome.toLowerCase().includes(busca)))
      .map((d) => ({ d, v: princ.get(ind[d.id]) }))
      .sort((a, b) => (L.ordem === 'desc' ? b.v - a.v : a.v - b.v));
  }, [dados, ind, princ, L, zonaDist]);
  const set = (p: Partial<typeof L>) => st().set({ ledger: { ...L, ...p } });
  const cor = (c: Col, v: number) => (c.rampa && c.dom ? corPorValor(v, c.dom, RAMPAS[c.rampa]) : null);
  const exportar = () => {
    const linhas = [
      `# Cidade Missão 3.0 — Ledger de territórios — DADOS FICTÍCIOS (protótipo)`,
      `# Exportado por ${persona.nome} (camada ${NOME_CAMADA[ctx.camada]}) em ${agora().replace('T', ' ')}; colunas filtradas pelas permissões da camada.`,
      `# Filtros: ${L.zona ? dados.zonas_de_atuacao.find((z) => z.id === L.zona)?.nome : 'todas as zonas'}; ${L.sub ?? 'todas as subprefeituras'}; ordem ${L.ordem === 'desc' ? 'decrescente' : 'crescente'} por ${princ.nome}`,
      ['posicao', 'codigo', 'distrito', 'subprefeitura', ...cols.map((c) => c.id)].join(';'),
      ...ordenada.map(({ d }, i) => [i + 1, d.id, d.nome, d.sub, ...cols.map((c) => c.get(ind[d.id]).toFixed(c.dec).replace('.', ','))].join(';')),
      ...cols.map((c) => `# fonte ${c.id}: ${c.fonte}`),
    ];
    const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ledger_${princ.id}${L.zona ? '_' + L.zona : ''}_ficticio.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    st().registrar({ tipo: 'exportacao', texto: `Ledger exportado em CSV (${ordenada.length} distritos, ${cols.length} colunas permitidas)` }, persona.nome);
    st().toast({ tipo: 'ok', icon: 'download', titulo: 'CSV exportado', texto: `${ordenada.length} distritos · colunas: ${cols.map((c) => c.curto).join(', ')}` });
  };
  const cmp = L.comparar;
  const pesoAc = acessoPesos(ctx);
  return (
    <div className="dr-col ledger" aria-label="Ledger de territórios">
      <DrawerHead code="LDG-01" eyebrow="Tabela comparativa · 96 distritos" titulo="Ledger de territórios" onClose={() => st().set({ painel: null })} />
      <div className="dr-body" style={{ gap: 8 }}>
        <div className="filters">
          <label className="sr" htmlFor="ldg-ind">Indicador</label>
          <select id="ldg-ind" className="chip" value={princ.id} onChange={(e) => set({ indicador: e.target.value, comparar: [] })} data-testid="ledger-indicador">
            {permitidas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button className="chip" onClick={() => set({ ordem: L.ordem === 'desc' ? 'asc' : 'desc' })} aria-label="Inverter ordem"><Icon n="sort" s={12} />{L.ordem === 'desc' ? 'maior → menor' : 'menor → maior'}</button>
          <button className={`chip${L.largo ? ' is-sel' : ''}`} onClick={() => set({ largo: !L.largo })} aria-pressed={L.largo} title="Mostrar todas as colunas permitidas"><Icon n="split" s={12} />{L.largo ? 'menos colunas' : 'todas as colunas'}</button>
        </div>
        <div className="filters">
          {ctx.camada !== 'visitante' && (
            <select className={`chip${L.zona ? ' is-sel' : ''}`} value={L.zona ?? ''} onChange={(e) => set({ zona: e.target.value || null })} aria-label="Zona de atuação" data-testid="ledger-zona">
              <option value="">Todas as zonas de atuação</option>
              {dados.zonas_de_atuacao.map((z) => <option key={z.id} value={z.id}>{z.nome}{persona.zonas?.includes(z.id) ? ' (sua)' : ''}</option>)}
            </select>
          )}
          <select className={`chip${L.sub ? ' is-sel' : ''}`} value={L.sub ?? ''} onChange={(e) => set({ sub: e.target.value || null })} aria-label="Subprefeitura">
            <option value="">Todas as subprefeituras</option>
            {dados.subprefeituras.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
          </select>
          <input className="chip" style={{ width: 120 }} placeholder="Buscar distrito" value={L.busca} onChange={(e) => set({ busca: e.target.value })} aria-label="Buscar distrito" />
        </div>
        {princ.id === 'lac' && (
          <div className="row small muted wrap">
            <Term id="lacunas">Pesos</Term>: problemas {fmt(pesos.problemas, 2)} · vulnerabilidade {fmt(pesos.vulnerabilidade, 2)} · presença {fmt(pesos.presenca, 2)}
            {pesoAc.ok ? <button className="link" onClick={() => st().set({ modal: { tipo: 'pesos' } })} data-testid="ajustar-pesos">ajustar pesos</button>
              : <span className="lock-ic" title={pesoAc.motivo}><Icon n="lock" s={11} />somente a direção municipal</span>}
          </div>
        )}
        {princ.id === 'comp' && <div className="aviso-leg">⚖ Eleitoral agregado: colunas de militância removidas da tabela e do CSV (não combinável).</div>}
        {cmp.length > 0 && (
          <div className="cmp-box" aria-label="Comparação">
            <div className="row"><b className="small">Comparando {cmp.length} distritos</b><button className="link right" onClick={() => set({ comparar: [] })}>limpar</button></div>
            {cmp.map((id) => { const v = princ.get(ind[id]); const mx = Math.max(...cmp.map((x) => princ.get(ind[x]))) || 1; return (
              <div key={id} className="cmp-row"><span>{dados.distritoPorId[id].nome}</span><span className={`bar${princ.id === 'lac' ? ' prio' : ''}`}><i style={{ width: `${(v / mx) * 100}%` }} /></span><b className="num">{fmt(v, princ.dec)}</b></div>
            ); })}
          </div>
        )}
        <div className="tbl-wrap">
          <table className="tbl" data-testid="ledger-tabela">
            <caption className="sr">Distritos por {princ.nome}</caption>
            <thead><tr>
              <th>#</th><th><span className="sr">Comparar</span></th><th>Distrito</th>
              {cols.map((c) => <th key={c.id} className={`num${c.id === princ.id ? ' is-sort' : ''}`} aria-sort={c.id === princ.id ? (L.ordem === 'desc' ? 'descending' : 'ascending') : 'none'}>
                <button onClick={() => set(c.id === princ.id ? { ordem: L.ordem === 'desc' ? 'asc' : 'desc' } : { indicador: c.id })} title={c.nome}>{c.curto}{c.id === princ.id ? (L.ordem === 'desc' ? ' ↓' : ' ↑') : ''}</button>
              </th>)}
            </tr></thead>
            <tbody>
              {ordenada.map(({ d }, i) => (
                <tr key={d.id} className={`${d.id === sel ? 'is-sel' : ''}${zonaDist?.includes(d.id) || persona.zonas?.some((z) => dados.zonas_de_atuacao.find((x) => x.id === z)?.distritos.includes(d.id)) ? ' is-zona' : ''}${cmp.includes(d.id) ? ' is-cmp' : ''}`}
                  onClick={() => { selecionar(d.id, { abrir: false }); mapBus.emit({ tipo: 'distrito', id: d.id }); }} data-testid={`ledger-${d.id}`}>
                  <td>{i + 1}</td>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Comparar ${d.nome}`} checked={cmp.includes(d.id)} onChange={() => set({ comparar: cmp.includes(d.id) ? cmp.filter((x) => x !== d.id) : [...cmp, d.id].slice(-6) })} /></td>
                  <td><b>{d.nome}</b><small>{d.sub}</small></td>
                  {cols.map((c) => {
                    const v = c.get(ind[d.id]); const k = cor(c, v);
                    return <td key={c.id} className="num">{c.id === 'lac'
                      ? <Tip c={{ tipo: 'lacunas', distrito: d.id }} className="tt-term" label={`Lacunas de ${d.nome}: ${fmt(v, 2)}`}>{k && <span className="cell-sw" style={{ background: k }} />}{fmt(v, c.dec)}</Tip>
                      : <>{k && c.id === princ.id && <span className="cell-sw" style={{ background: k }} />}{fmt(v, c.dec)}</>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dr-foot">
          <Src t={princ.fonte} />
          <button className="btn" onClick={exportar} data-testid="exportar-csv"><Icon n="download" s={14} />Exportar CSV</button>
          <Fict />
        </div>
      </div>
    </div>
  );
}
