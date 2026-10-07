// Textos e números fictícios que não estão nos arquivos de dados (todos marcados).

/** Ficha do município (doc. 8.2). Valores FICTÍCIOS; a fonte indica onde buscar o dado real. */
export const FICHA_MUNICIPIO: { grupo: string; itens: { nome: string; valor: string; fonte: string; ano: number; nivel: string; app?: boolean }[] }[] = [
  { grupo: 'População e economia', itens: [
    { nome: 'População', valor: '11,4 milhões', fonte: 'IBGE, Censo 2022', ano: 2022, nivel: 'município' },
    { nome: 'PIB per capita', valor: 'R$ 71.300', fonte: 'IBGE, PIB dos Municípios', ano: 2023, nivel: 'município' },
    { nome: 'Empregos formais', valor: '5,2 milhões', fonte: 'RAIS / Novo CAGED', ano: 2025, nivel: 'município' },
    { nome: 'Eleitorado', valor: '9,3 milhões', fonte: 'TSE', ano: 2024, nivel: 'município' },
  ] },
  { grupo: 'Orçamento e gasto por função', itens: [
    { nome: 'Orçamento executado', valor: 'R$ 118 bi', fonte: 'Tesouro Nacional (Siconfi)', ano: 2025, nivel: 'município' },
    { nome: 'Saúde', valor: '21% da despesa', fonte: 'Siconfi · despesa por função', ano: 2025, nivel: 'município' },
    { nome: 'Educação', valor: '25% da despesa', fonte: 'Siconfi · despesa por função', ano: 2025, nivel: 'município' },
    { nome: 'Urbanismo', valor: '11% da despesa', fonte: 'Siconfi · despesa por função', ano: 2025, nivel: 'município' },
  ] },
  { grupo: 'Serviços', itens: [
    { nome: 'IDEB (anos iniciais, rede pública)', valor: '5,6', fonte: 'INEP', ano: 2023, nivel: 'município' },
    { nome: 'Mortalidade infantil', valor: '10,9 por mil nascidos vivos', fonte: 'DataSUS (SIM/SINASC)', ano: 2024, nivel: 'município' },
    { nome: 'Cobertura de esgoto', valor: '90,7% dos domicílios', fonte: 'IBGE, Censo 2022', ano: 2022, nivel: 'município' },
    { nome: 'IDHM', valor: '0,805', fonte: 'Atlas Brasil (PNUD)', ano: 2010, nivel: 'município' },
  ] },
  { grupo: 'Dados do app (não oficiais)', itens: [
    { nome: 'Alertas confirmados por mil hab. (90 dias)', valor: '5,72', fonte: 'Cidade Missão (dado do app)', ano: 2026, nivel: 'município', app: true },
    { nome: 'Tempo médio de resolução', valor: '14 dias', fonte: 'Cidade Missão (dado do app)', ano: 2026, nivel: 'município', app: true },
  ] },
];

/** Notícias da Câmara e da prefeitura: 3 itens fictícios (fora do escopo integrar fontes reais). */
export const NOTICIAS = [
  { id: 'N1', orgao: 'Câmara Municipal', titulo: 'Audiência pública sobre drenagem na Zona Sul marcada para 21/out', data: '2026-10-05' },
  { id: 'N2', orgao: 'Prefeitura', titulo: 'Calendário de limpeza de bueiros antes das chuvas é publicado', data: '2026-10-03' },
  { id: 'N3', orgao: 'Câmara Municipal', titulo: 'Comissão de Finanças apresenta relatório do orçamento de 2027', data: '2026-09-30' },
];

/** Delegações fictícias (camada Autoridade/Direção). */
export const DELEGACOES = [
  { id: 'DLG-1', escopo: 'Capela do Socorro', para: 'Coordenação fictícia da Zona Sul 2', ate: '2026-10-16', distritos: ['SOC', 'CDU', 'GRA'] },
  { id: 'DLG-2', escopo: 'Campo Limpo', para: 'Coordenação fictícia da Zona Sul 1', ate: '2027-01-31', distritos: ['CLM', 'CRE', 'VAN'] },
  { id: 'DLG-3', escopo: "M'Boi Mirim", para: 'Coordenação fictícia da Zona Sul 1', ate: '2027-02-28', distritos: ['JDA', 'JDS'] },
];

/** Pedidos à subprefeitura e propostas (Autoridade · prestação de contas), fictícios. */
export const PEDIDOS = [
  { id: 'PED-1', texto: 'Iluminação · Jd. São Luís', status: 'respondido', distrito: 'JDS' },
  { id: 'PED-2', texto: 'Drenagem · Grajaú', status: 'em análise', distrito: 'GRA' },
  { id: 'PED-3', texto: 'Recapeamento · Socorro', status: 'atrasado', distrito: 'SOC' },
];
export const PROPOSTAS = [
  { id: 'PRO-1', texto: 'Indicação: limpeza preventiva de córregos em Grajaú', status: 'protocolada' },
  { id: 'PRO-2', texto: 'Requerimento de informação: contratos de poda 2026', status: 'em redação' },
];

export const AVISO_UNIDADE = 'unidade: distrito; bairros oficiais a verificar';
export const AVISO_FICTICIO = 'Todos os números, pessoas, núcleos, missões, alertas e decisões são fictícios. Só nomes e limites de distritos e subprefeituras são reais (GeoSampa).';

/** Complemento do protótipo: as duas missões do alerta "sobreposição de missões" em Grajaú (não estão nos dados). */
export const MISSOES_COMPLEMENTO = [
  { id: 'MIS-GRA-L1', titulo: 'Mutirão de limpeza no córrego (Núcleo Grajaú 1)', trilha: 'militante', ramo: 'rua', distrito: 'GRA', nucleo: 'NUC-GRA-1',
    lng: -46.6552, lat: -23.8281, status: 'aberta', prazo: '2026-10-17', vagas: 20, inscritos: 9, v_base: 30, verificacao_tipica: 'coordenador',
    m_verificacao_esperado: 1.0, foco_temporada: true, territorio_prioritario: false, nivel_minimo: 1, campanha: 'CAM-1', origem: 'complemento do protótipo' },
  { id: 'MIS-GRA-L2', titulo: 'Mutirão de limpeza no córrego (Núcleo Grajaú 2)', trilha: 'militante', ramo: 'rua', distrito: 'GRA', nucleo: 'NUC-GRA-2',
    lng: -46.6528, lat: -23.8302, status: 'aberta', prazo: '2026-10-17', vagas: 15, inscritos: 6, v_base: 30, verificacao_tipica: 'coordenador',
    m_verificacao_esperado: 1.0, foco_temporada: true, territorio_prioritario: false, nivel_minimo: 1, campanha: 'CAM-1', origem: 'complemento do protótipo' },
] as const;
