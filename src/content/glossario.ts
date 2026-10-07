// Glossário dos tooltips aninhados. Termos entre [[id|rótulo]] abrem outro nível (até 3).
export interface Termo { id: string; termo: string; texto: string; fonte?: string; doc?: string }

export const GLOSSARIO: Termo[] = [
  { id: 'presenca', termo: 'Presença', doc: '6',
    texto: 'Modo de mapa do partido: [[militante-ativo|militantes ativos]] por mil eleitores do [[distrito|distrito]]. Mostra onde o partido já está, não onde "deveria" estar.',
    fonte: 'Cadastro interno (dado do app) · 2026 · distrito' },
  { id: 'militante-ativo', termo: 'Militante ativo', doc: '6',
    texto: 'Filiado comprovado que participou de ao menos uma [[missao|missão]] ou entrega verificada nos últimos 90 dias. Não depende de nível.' },
  { id: 'lacunas', termo: 'Lacunas de cobertura', doc: '6.1',
    texto: 'Índice composto que mostra onde o partido deve chegar primeiro: 0,4 × P_problemas + 0,3 × P_vulnerabilidade + 0,3 × (1 − P_presença). Cada P é o [[percentil|percentil]] do distrito no município. Um valor alto não descreve o distrito; indica prioridade de presença e de serviço. Os pesos são hipóteses ajustáveis pela direção municipal, com registro.',
    fonte: 'Índice composto (documento 3.0, seção 6.1) · 2026 · distrito' },
  { id: 'percentil', termo: 'Percentil', doc: '6.1',
    texto: 'Posição do distrito entre os 96 do município, de 0 (menor valor) a 1 (maior valor): nº de distritos com valor menor ÷ 95. Compara distritos entre si, sem dizer se o valor é "bom" ou "ruim".' },
  { id: 'vulnerabilidade', termo: 'Vulnerabilidade', doc: '6.2',
    texto: 'Indicador de vulnerabilidade social (o [[ipvs|IPVS]] reescalado de 0 a 1). Usado para direcionar presença e serviço, nunca para segmentar mensagens ou estigmatizar.',
    fonte: 'Fundação Seade, IPVS · 2010 · setor censitário → distrito (desatualizado)' },
  { id: 'ipvs', termo: 'IPVS', doc: '8.3',
    texto: 'Índice Paulista de Vulnerabilidade Social, da Fundação Seade. A base é de 2010 e por isso aparece com o selo [[desatualizado|desatualizado]] (dados com mais de 3 anos). [verificar edição mais recente]',
    fonte: 'Fundação Seade · 2010 · setor censitário' },
  { id: 'zeladoria', termo: 'Zeladoria', doc: '6',
    texto: 'Modo de problemas urbanos: [[alerta-confirmado|alertas confirmados]] por mil habitantes nos últimos 90 dias. O visitante vê a versão simplificada; Fiscalista 2+ vê a detalhada, com [[caso-coletivo|casos coletivos]].',
    fonte: 'Cidade Missão (dado do app) · 2026 · distrito' },
  { id: 'alerta-confirmado', termo: 'Alerta confirmado', doc: '3.1',
    texto: 'Alerta registrado por um morador e confirmado por 3 pessoas diferentes (confirmação independente). Só então passa a contar em Zeladoria. Alertas não guardam quem os criou para uso do partido.' },
  { id: 'caso-coletivo', termo: 'Caso coletivo', doc: '3.1',
    texto: 'Agrupamento de 10 ou mais alertas sobre o mesmo problema, aberto por um Fiscal (nível 3+) para cobrança formal com protocolo.' },
  { id: 'distrito', termo: 'Distrito', doc: '5.2',
    texto: 'Unidade clicável do mapa neste protótipo ("província"): 96 distritos oficiais de São Paulo. O documento prevê bairros, mas a cidade não tem limite oficial de bairro pronto [verificar]. Distritos se agrupam em [[subprefeitura|subprefeituras]].',
    fonte: 'GeoSampa / PMSP · limites simplificados [verificar ano e licença]' },
  { id: 'subprefeitura', termo: 'Subprefeitura', doc: '5.2',
    texto: 'Região administrativa que agrupa distritos (32 em São Paulo). No mapa longe, os nomes que aparecem são os das subprefeituras.' },
  { id: 'zona-atuacao', termo: 'Zona de atuação', doc: '5.2',
    texto: 'Grupo de distritos definido pela direção municipal do partido, sob responsabilidade de [[nucleo|núcleos]] e coordenadores. Exemplo: Zona Sul 1 e Sul 2.' },
  { id: 'nucleo', termo: 'Núcleo', doc: '4.3',
    texto: 'Grupo de militantes de um bairro. Sobe de nível com as entregas dos membros: Semente (5 ativos), Raiz (10 + 1 campanha), Tronco (20 + coordenadores nas 3 trilhas), Copa (40 + 2 temporadas com metas cumpridas).' },
  { id: 'missao', termo: 'Missão', doc: '2.1',
    texto: 'Tarefa publicada pelo app, por um coordenador ou por uma [[campanha|campanha]], com [[trilha|trilha]], [[ramo|ramo]], valor base (V_base), prazo, local e vagas. Gera [[pt|PT]] só depois da entrega verificada.' },
  { id: 'campanha', termo: 'Campanha', doc: '4.3',
    texto: 'Conjunto de missões com meta e prazo num território. Pode estar ligada ao foco da [[temporada|temporada]].' },
  { id: 'temporada', termo: 'Temporada', doc: '4.4',
    texto: 'Ciclo de 4 meses com um foco municipal escolhido pela militância entre 3 opções. Entregas ligadas ao foco ganham multiplicador 1,25. Termina com um balanço; nada se perde ao fechar a temporada.' },
  { id: 'trilha', termo: 'Trilha', doc: '2',
    texto: 'Cada militante progride em três trilhas independentes: Fiscalista (quem vê e cobra), Intelectual (quem estuda, formula e convence) e Militante (quem está na rua e organiza gente). Níveis de 1 a 6, com [[ramo|ramos]] a partir do 3.' },
  { id: 'ramo', termo: 'Ramo', doc: '2.1',
    texto: 'Especialização dentro da trilha, escolhida no nível 3 (3 por trilha); pode trocar uma vez por temporada. Define o título do nível 6.' },
  { id: 'pt', termo: 'PT (Pontos de Trilha)', doc: '2.2',
    texto: 'Valor de uma entrega numa trilha: V_base × M_verificação × M_foco. Verificação: 0,5 (evidência fraca), 1,0 (par ou coordenador), 1,5 (fonte externa). Foco: 1,25 (temporada) ou 1,5 (território prioritário). Teto de 150 PT por trilha por semana (H).' },
  { id: 'carreira', termo: 'Carreira', doc: '2.1',
    texto: 'Soma histórica de [[pt|PT]] na trilha. Nunca se perde e define o nível alcançado e o título.' },
  { id: 'prontidao', termo: 'Prontidão', doc: '2.1',
    texto: 'PT dos últimos 120 dias na trilha. É exigida para usar os poderes do nível; abaixo do mínimo, o nível fica [[em-reserva|em reserva]]. Na ficha, aparece em 4 pontos. Tolera pausas: sem streaks.' },
  { id: 'em-reserva', termo: 'Em reserva', doc: '2.1',
    texto: 'Estado de um nível cuja [[prontidao|Prontidão]] está abaixo do mínimo (20, 50, 100, 150 ou 200 PT conforme o nível). O título continua; os poderes ficam suspensos até a Prontidão voltar.' },
  { id: 'prova-passagem', termo: 'Prova de passagem', doc: '2.1',
    texto: 'Entrega qualificada exigida para os níveis 4, 5 e 6, avaliada por uma [[banca|banca]] de militantes do nível acima.' },
  { id: 'banca', termo: 'Banca', doc: '2.5',
    texto: 'Grupo de militantes nível 5+ na trilha, sorteado por prova, que avalia provas de passagem. 10% das entregas também passam por amostragem das bancas (anti-exploit).' },
  { id: 'medalha', termo: 'Medalha', doc: '2.1',
    texto: 'Marco único (primeira vez, recorde, feito coletivo). Só simbólica; registrada na ficha. Não dá poderes.' },
  { id: 'titulo-hibrido', termo: 'Título híbrido', doc: '4.2',
    texto: 'Título especial por nível 4+ em duas ou três trilhas (ex.: Fiscalista 4 + Militante 4 = Liderança Territorial). Sinaliza perfil completo e habilita indicação para funções de coordenação.' },
  { id: 'delegacao', termo: 'Delegação', doc: '1',
    texto: 'Responsabilidade passada a outra pessoa com prazo e escopo definidos (ex.: coordenação de uma subprefeitura). Expira se não for renovada.' },
  { id: 'dado-app', termo: 'Dado do app', doc: '8.3',
    texto: 'Número produzido pelo próprio app (alertas, presença, missões). Nunca se mistura com estatística oficial sem este rótulo.' },
  { id: 'desatualizado', termo: 'Desatualizado', doc: '8.3',
    texto: 'Selo para dados com mais de 3 anos em relação à data de hoje do protótipo (07/10/2026). Ex.: [[ipvs|IPVS]] 2010; Censo 2022.' },
  { id: 'verificacao', termo: 'Verificação', doc: '2.2',
    texto: 'Como uma entrega foi comprovada. Multiplicador 0,5 (autodeclarada com evidência fraca), 1,0 (validada por par ou coordenador de outro núcleo) ou 1,5 (confirmada por fonte externa: protocolo, resposta oficial, publicação).' },
  { id: 'foco', termo: 'Multiplicador de foco', doc: '2.2',
    texto: '1,0 padrão; 1,25 se ligada ao foco da [[temporada|temporada]]; 1,5 se em território prioritário com baixa presença do partido. Vale o maior que se aplicar (hipótese do protótipo).' },
  { id: 'eleitoral', termo: 'Eleitoral agregado', doc: '6.2',
    texto: 'Votação e comparecimento públicos do TSE por local de votação, agregados ao distrito. Nunca por pessoa; não combinável com dados de militantes ou visitantes; uso restrito a planejamento ⚖.',
    fonte: 'TSE · 2024 · local de votação → distrito' },
  { id: 'consentimento', termo: 'Consentimento', doc: '9',
    texto: 'O convite para conhecer o partido só usa contato com consentimento específico, explícito e revogável. Dados de visitantes nunca são cruzados com listas partidárias ⚖.' },
];
export const TERMO: Record<string, Termo> = Object.fromEntries(GLOSSARIO.map((t) => [t.id, t]));

/** Divide um texto em partes simples e referências a termos. */
export function partesTexto(t: string): (string | { id: string; rotulo: string })[] {
  const out: (string | { id: string; rotulo: string })[] = [];
  let i = 0;
  for (const m of t.matchAll(/\[\[([^|\]]+)\|([^\]]+)\]\]/g)) {
    if (m.index! > i) out.push(t.slice(i, m.index));
    out.push({ id: m[1], rotulo: m[2] });
    i = m.index! + m[0].length;
  }
  if (i < t.length) out.push(t.slice(i));
  return out;
}
