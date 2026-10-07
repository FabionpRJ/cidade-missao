// Catálogo de missões de cidadania (MISSOES_CIDADANIA.md): cada ideia vira um tipo de ação da trilha e algumas missões
// fictícias espalhadas pelos núcleos. O texto `cidadania` diz qual direito ou dever a missão exercita; `instrumento`, o canal público usado.
import type { AcaoTrilha, Dados, Missao, TrilhaId } from '../data/types';

export interface IdeiaCidadania {
  id: string;
  titulo: string;
  trilha: TrilhaId;
  ramo: string | null;
  v_base: number;
  verificacao: string;
  /** Multiplicador de verificação esperado (1,5 quando há confirmação por fonte externa, como protocolo). */
  mult: 1 | 1.5;
  nivel: 1 | 2 | 3 | 4;
  /** Liga-se ao foco da temporada (Enchentes e drenagem). */
  foco?: boolean;
  /** Tende a acontecer onde há mais risco de alagamento (escolha dos distritos). */
  risco?: boolean;
  cidadania: string;
  instrumento: string;
  passos: string[];
}

export const IDEIAS_CIDADANIA: IdeiaCidadania[] = [
  // ── Fiscalista · Zeladoria ──────────────────────────────────────────────
  { id: 'FZ1', titulo: 'Vistoria de bueiros no caminho da escola antes das chuvas', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 10,
    verificacao: 'fotos georreferenciadas', mult: 1, nivel: 1, foco: true, risco: true,
    cidadania: 'Fiscalizar o serviço que o imposto já paga e proteger quem mais circula a pé: crianças e responsáveis.',
    instrumento: 'SP156 (solicitação de limpeza de bueiro)',
    passos: ['Percorrer o trajeto até a escola com 1 ou 2 moradores', 'Fotografar cada bueiro entupido com localização', 'Abrir uma solicitação no SP156 por ponto e anotar os protocolos'] },
  { id: 'FZ2', titulo: 'Acompanhar protocolos do SP156 até o prazo de resposta', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 15,
    verificacao: 'número de protocolo', mult: 1.5, nivel: 1,
    cidadania: 'Reclamar é o começo; cobrar o prazo é o que faz o serviço público responder a quem pediu.',
    instrumento: 'SP156 (consulta de protocolo)',
    passos: ['Reunir os protocolos abertos pelo núcleo', 'Conferir status e prazo de cada um', 'Avisar os moradores que confirmaram o alerta'] },
  { id: 'FZ3', titulo: 'Reclamação à Ouvidoria por protocolo vencido', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 20,
    verificacao: 'protocolo', mult: 1.5, nivel: 2,
    cidadania: 'A Ouvidoria existe para o cidadão contestar o próprio poder público quando o atendimento falha.',
    instrumento: 'Ouvidoria Geral do Município',
    passos: ['Separar protocolos vencidos sem solução', 'Registrar reclamação citando número, data e fotos', 'Guardar o número da Ouvidoria e acompanhar a resposta'] },
  { id: 'FZ4', titulo: 'Mapa de risco de alagamento feito com moradores', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 30,
    verificacao: 'fotos + lista de presença com consentimento', mult: 1, nivel: 2, foco: true, risco: true,
    cidadania: 'Quem mora no lugar conhece onde a água sobe; transformar esse saber em dado é participar da prevenção.',
    instrumento: 'Defesa Civil municipal (envio do mapa e pedido de vistoria)',
    passos: ['Convidar moradores para uma caminhada de 1 hora', 'Marcar pontos de alagamento, casas em risco e rotas de fuga', 'Entregar o mapa à Defesa Civil e à subprefeitura com protocolo'] },
  { id: 'FZ5', titulo: 'Auditoria de acessibilidade das calçadas até a UBS', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 25,
    verificacao: 'fotos georreferenciadas', mult: 1, nivel: 1,
    cidadania: 'Ir e vir é direito de todos, inclusive de quem usa cadeira de rodas, bengala ou carrinho de bebê.',
    instrumento: 'SP156 (calçada) e Lei Brasileira de Inclusão',
    passos: ['Fazer o trajeto com uma pessoa com deficiência ou idosa, se ela quiser', 'Registrar degraus, buracos, rampas ausentes e obstáculos', 'Protocolar os pontos e publicar o resultado no núcleo'] },
  { id: 'FZ6', titulo: 'Levantamento de iluminação no trajeto dos pontos de ônibus', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 15,
    verificacao: 'fotos georreferenciadas', mult: 1, nivel: 1,
    cidadania: 'Rua escura afasta mulheres e trabalhadores do turno da noite; cobrar luz é cobrar segurança no espaço público.',
    instrumento: 'SP156 (iluminação pública)',
    passos: ['Fazer o trajeto depois das 19h, sempre em dupla', 'Anotar postes apagados ou trechos sem poste', 'Protocolar cada ponto e acompanhar o reparo'] },
  { id: 'FZ7', titulo: 'Devolutiva aos moradores: o que foi resolvido no bairro', trilha: 'fiscalista', ramo: 'zeladoria', v_base: 15,
    verificacao: 'ata + presenças', mult: 1, nivel: 2,
    cidadania: 'Prestar contas a quem confirmou os alertas mantém a confiança e mostra que cobrar dá resultado.',
    instrumento: 'Cartaz no comércio local e reunião aberta',
    passos: ['Listar alertas resolvidos, em andamento e parados', 'Montar um cartaz simples com antes e depois', 'Apresentar numa reunião aberta e ouvir novos problemas'] },

  // ── Fiscalista · Contas Públicas ────────────────────────────────────────
  { id: 'FC1', titulo: 'Leitura guiada do orçamento previsto para o distrito', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 30,
    verificacao: 'revisão por par', mult: 1, nivel: 2,
    cidadania: 'O orçamento é a escolha concreta de onde o dinheiro público vai; entender a lei é condição para disputá-la.',
    instrumento: 'Projeto de Lei Orçamentária Anual (LOA) e Portal da Transparência',
    passos: ['Localizar as ações da subprefeitura e das secretarias no distrito', 'Comparar com o ano anterior e com o que foi executado', 'Escrever uma página em linguagem simples para o núcleo'] },
  { id: 'FC2', titulo: 'Participar da audiência pública do orçamento 2027', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 25,
    verificacao: 'registro da presença', mult: 1, nivel: 1,
    cidadania: 'A audiência é o momento previsto em lei para o morador falar antes de o orçamento ser votado.',
    instrumento: 'Audiência pública da Comissão de Finanças e Orçamento da Câmara',
    passos: ['Conferir data e local no portal da Câmara', 'Levar uma demanda curta e com número (ex.: bueiros do distrito)', 'Inscrever-se para falar e registrar o que foi respondido'] },
  { id: 'FC3', titulo: 'Acompanhar as metas da prefeitura para o distrito', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 40,
    verificacao: 'revisão por par', mult: 1, nivel: 2,
    cidadania: 'Promessa de governo vira compromisso público no Programa de Metas; acompanhar é exigir coerência.',
    instrumento: 'Programa de Metas do município',
    passos: ['Listar metas com entrega prevista no distrito ou na subprefeitura', 'Conferir o andamento informado pela prefeitura', 'Visitar uma entrega e comparar com o que está publicado'] },
  { id: 'FC4', titulo: 'Contrato de manutenção da escola conferido no Portal da Transparência', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 30,
    verificacao: 'revisão por par', mult: 1, nivel: 2,
    cidadania: 'Todo contrato público é público; conferir se o serviço pago chega à escola é controle social.',
    instrumento: 'Portal da Transparência e Diário Oficial da Cidade',
    passos: ['Achar o contrato (empresa, valor, vigência, objeto)', 'Conversar com o conselho de escola sobre o serviço prestado', 'Registrar divergências com fonte'] },
  { id: 'FC5', titulo: 'Placa de obra conferida: valor, prazo e responsável', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 15,
    verificacao: 'fotos georreferenciadas', mult: 1, nivel: 1,
    cidadania: 'A placa é a prestação de contas na rua; obra sem placa ou atrasada é pergunta legítima de qualquer morador.',
    instrumento: 'Placa de obra e Portal da Transparência',
    passos: ['Fotografar a placa e a obra', 'Conferir valor e prazo no portal', 'Abrir alerta se faltar placa ou se o prazo estiver vencido'] },
  { id: 'FC6', titulo: 'Recurso de LAI em pedido negado ou sem resposta', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 25,
    verificacao: 'protocolo', mult: 1.5, nivel: 2,
    cidadania: 'Acesso à informação é a regra e o sigilo a exceção; recorrer é usar o direito até o fim.',
    instrumento: 'Lei de Acesso à Informação (Lei 12.527/2011), recurso no e-SIC',
    passos: ['Ler a negativa ou registrar o prazo vencido', 'Escrever o recurso citando a lei e o interesse público', 'Acompanhar até a última instância'] },
  { id: 'FC7', titulo: 'Denúncia fundamentada ao Tribunal de Contas do Município', trilha: 'fiscalista', ramo: 'contas_publicas', v_base: 80,
    verificacao: 'protocolo', mult: 1.5, nivel: 4,
    cidadania: 'Qualquer cidadão pode levar indícios de irregularidade ao órgão de controle; a força está na prova, não no barulho.',
    instrumento: 'Tribunal de Contas do Município (canal de denúncias)',
    passos: ['Reunir documentos públicos e respostas de LAI', 'Escrever a denúncia com fatos, datas e valores, sem acusações sem prova', 'Passar por revisão da banca do ramo antes de protocolar'] },

  // ── Fiscalista · Legislativo ────────────────────────────────────────────
  { id: 'FL1', titulo: 'Audiência pública da Câmara acompanhada com relato', trilha: 'fiscalista', ramo: 'legislativo', v_base: 20,
    verificacao: 'revisão por par', mult: 1, nivel: 1,
    cidadania: 'Estar presente onde a lei é discutida é o primeiro passo para influenciar a lei.',
    instrumento: 'Audiências públicas da Câmara Municipal (presenciais ou transmitidas)',
    passos: ['Escolher uma audiência que afete o distrito', 'Anotar quem falou, o que foi proposto e os próximos passos', 'Publicar um relato de meia página no núcleo'] },
  { id: 'FL2', titulo: 'Ficha de projeto de lei que afeta o distrito', trilha: 'fiscalista', ramo: 'legislativo', v_base: 20,
    verificacao: 'revisão por par', mult: 1, nivel: 1,
    cidadania: 'Saber o que tramita antes de virar lei permite opinar a tempo.',
    instrumento: 'Pesquisa de proposições no portal da Câmara',
    passos: ['Encontrar o projeto e a fase de tramitação', 'Resumir o que muda para quem mora no distrito', 'Indicar comissões e datas em que o morador pode se manifestar'] },
  { id: 'FL3', titulo: 'Mapa das indicações de vereadores para o distrito', trilha: 'fiscalista', ramo: 'legislativo', v_base: 40,
    verificacao: 'revisão por par', mult: 1, nivel: 2,
    cidadania: 'Indicações mostram o que cada mandato pediu para o bairro; comparar com o que foi feito é fiscalizar o mandato.',
    instrumento: 'Indicações publicadas no portal da Câmara',
    passos: ['Levantar as indicações do último ano que citam o distrito', 'Agrupar por tema e por autor', 'Conferir na rua quais foram atendidas'] },
  { id: 'FL4', titulo: 'Pedido de informação sobre emenda parlamentar no distrito', trilha: 'fiscalista', ramo: 'legislativo', v_base: 30,
    verificacao: 'protocolo', mult: 1.5, nivel: 2,
    cidadania: 'Emenda é dinheiro público direcionado por um mandato; quem mora no bairro tem direito de saber onde foi parar.',
    instrumento: 'LAI à Câmara e à secretaria executora',
    passos: ['Identificar emendas destinadas ao distrito', 'Pedir execução, valor pago e local', 'Visitar o local e registrar a situação'] },
  { id: 'FL5', titulo: 'Contribuição em consulta pública de projeto de lei', trilha: 'fiscalista', ramo: 'legislativo', v_base: 15,
    verificacao: 'protocolo', mult: 1.5, nivel: 1,
    cidadania: 'Opinar formalmente num projeto registra a voz do morador no processo legislativo.',
    instrumento: 'Consultas públicas e manifestações da Câmara Municipal',
    passos: ['Ler o projeto e a justificativa', 'Escrever uma sugestão objetiva, com exemplo do bairro', 'Enviar e guardar o comprovante'] },

  // ── Intelectual · formação (todos os ramos) ─────────────────────────────
  { id: 'IF1', titulo: 'Módulo: como funcionam prefeitura, Câmara, subprefeituras e conselhos', trilha: 'intelectual', ramo: null, v_base: 15,
    verificacao: 'prova', mult: 1, nivel: 1,
    cidadania: 'Só cobra bem quem sabe a quem cobrar: cada problema tem um responsável e um canal.',
    instrumento: 'Lei Orgânica do Município',
    passos: ['Estudar o módulo (2 horas)', 'Fazer a prova', 'Montar o quadro "quem resolve o quê" do seu distrito'] },
  { id: 'IF2', titulo: 'Módulo: Lei de Acesso à Informação na prática', trilha: 'intelectual', ramo: null, v_base: 15,
    verificacao: 'prova', mult: 1, nivel: 1,
    cidadania: 'A informação pública pertence a quem paga por ela; saber pedir é uma ferramenta de todos.',
    instrumento: 'Lei 12.527/2011 e e-SIC municipal',
    passos: ['Estudar o módulo', 'Fazer a prova', 'Redigir um pedido real e enviá-lo'] },

  // ── Intelectual · Formulação ────────────────────────────────────────────
  { id: 'IP1', titulo: 'Diagnóstico do distrito com dados públicos', trilha: 'intelectual', ramo: 'formulacao', v_base: 50,
    verificacao: 'comissão', mult: 1, nivel: 2,
    cidadania: 'Propor bem começa por medir bem; um diagnóstico com fontes abertas qualifica o debate público.',
    instrumento: 'Dados abertos da prefeitura, IBGE e Observatórios municipais',
    passos: ['Reunir indicadores de saúde, educação, saneamento e renda', 'Comparar com a média da cidade', 'Apontar 3 prioridades com fonte'] },
  { id: 'IP2', titulo: 'Contribuição em consulta pública da prefeitura', trilha: 'intelectual', ramo: 'formulacao', v_base: 30,
    verificacao: 'protocolo', mult: 1.5, nivel: 2,
    cidadania: 'Consultas públicas são a porta aberta para o morador escrever junto a política antes dela sair do papel.',
    instrumento: 'Plataforma de consultas públicas da prefeitura',
    passos: ['Escolher uma consulta aberta que afete o distrito', 'Escrever a contribuição em grupo', 'Enviar e guardar o comprovante'] },
  { id: 'IP3', titulo: 'Proposta levada ao Conselho Participativo da subprefeitura', trilha: 'intelectual', ramo: 'formulacao', v_base: 40,
    verificacao: 'ata', mult: 1.5, nivel: 2,
    cidadania: 'O Conselho Participativo é o espaço eleito por moradores para opinar sobre a subprefeitura; levar propostas é ocupá-lo.',
    instrumento: 'Conselho Participativo Municipal (reunião aberta)',
    passos: ['Formular a proposta em uma página', 'Pedir inclusão na pauta', 'Apresentar e registrar o encaminhamento em ata'] },
  { id: 'IP4', titulo: 'Proposta para o plano de drenagem do bairro', trilha: 'intelectual', ramo: 'formulacao', v_base: 60,
    verificacao: 'comissão', mult: 1, nivel: 3, foco: true, risco: true,
    cidadania: 'Moradores atingidos pela enchente também são especialistas; transformar a experiência em proposta técnica é direito à cidade.',
    instrumento: 'Plano Diretor Estratégico e planos regionais das subprefeituras',
    passos: ['Juntar o mapa de risco e os alertas do distrito', 'Pesquisar soluções (piscinões, áreas permeáveis, limpeza de córregos)', 'Escrever proposta com custos estimados e fontes'] },
  { id: 'IP5', titulo: 'Minuta de projeto de lei de iniciativa popular', trilha: 'intelectual', ramo: 'formulacao', v_base: 100,
    verificacao: 'comissão', mult: 1, nivel: 4,
    cidadania: 'A Constituição permite que o povo apresente leis diretamente; escrever uma é exercer soberania popular.',
    instrumento: 'Iniciativa popular (Constituição, art. 29, XIII; Lei Orgânica do Município)',
    passos: ['Definir o problema e a solução em lei', 'Redigir a minuta com apoio jurídico', 'Submeter à comissão antes da coleta de assinaturas'] },

  // ── Intelectual · Comunicação ───────────────────────────────────────────
  { id: 'IC1', titulo: 'Guia ilustrado: como pedir informação pela LAI', trilha: 'intelectual', ramo: 'comunicacao', v_base: 30,
    verificacao: '3 avaliadores sorteados', mult: 1, nivel: 1,
    cidadania: 'Direito que ninguém conhece não é usado; traduzir o caminho multiplica cidadãos fiscalizando.',
    instrumento: 'Lei 12.527/2011',
    passos: ['Fazer um passo a passo com imagens', 'Testar com 2 moradores que nunca usaram', 'Corrigir e publicar'] },
  { id: 'IC2', titulo: 'Cartaz "onde buscar seus direitos no distrito"', trilha: 'intelectual', ramo: 'comunicacao', v_base: 20,
    verificacao: 'revisão por par', mult: 1, nivel: 1,
    cidadania: 'Saber onde ficam a UBS, o CRAS, o Conselho Tutelar e a Defensoria é a porta de entrada dos direitos.',
    instrumento: 'Equipamentos públicos do distrito',
    passos: ['Conferir endereços, horários e telefones', 'Diagramar um cartaz simples', 'Afixar no comércio com autorização'] },
  { id: 'IC3', titulo: 'Checagem de boato sobre serviço público do bairro', trilha: 'intelectual', ramo: 'comunicacao', v_base: 15,
    verificacao: 'revisão por par', mult: 1, nivel: 1,
    cidadania: 'Informação falsa sobre vacina, benefício ou escola tira direitos; checar é proteger a comunidade.',
    instrumento: 'Fontes oficiais e respostas de órgãos públicos',
    passos: ['Registrar o boato e onde circula', 'Confirmar com fonte oficial', 'Publicar a checagem no mesmo canal em que o boato circulou'] },
  { id: 'IC4', titulo: 'Documento oficial traduzido para linguagem simples', trilha: 'intelectual', ramo: 'comunicacao', v_base: 25,
    verificacao: 'revisão por par', mult: 1, nivel: 1,
    cidadania: 'Edital, plano ou lei escritos de forma difícil excluem; traduzir é democratizar o acesso.',
    instrumento: 'Diário Oficial da Cidade',
    passos: ['Escolher um documento que afete o bairro', 'Reescrever em linguagem simples sem perder o sentido', 'Indicar a fonte original'] },
  { id: 'IC5', titulo: 'Vídeo curto com moradores sobre um problema do bairro', trilha: 'intelectual', ramo: 'comunicacao', v_base: 35,
    verificacao: '3 avaliadores sorteados', mult: 1, nivel: 2,
    cidadania: 'Dar voz a quem vive o problema, com consentimento, coloca o bairro na agenda pública.',
    instrumento: 'Termo de uso de imagem e redes do núcleo',
    passos: ['Colher autorização de imagem por escrito', 'Gravar até 90 segundos com dados conferidos', 'Indicar o canal para cobrar a solução'] },

  // ── Intelectual · Debate e Formação ─────────────────────────────────────
  { id: 'ID1', titulo: 'Oficina "seus direitos como usuário do SUS"', trilha: 'intelectual', ramo: 'debate_formacao', v_base: 40,
    verificacao: 'avaliação dos participantes', mult: 1, nivel: 2,
    cidadania: 'Saúde é direito de todos e dever do Estado; conhecer a carta de direitos ajuda a cobrar atendimento.',
    instrumento: 'Carta dos Direitos dos Usuários da Saúde e Ouvidoria do SUS',
    passos: ['Preparar a oficina (1h30)', 'Convidar pelo conselho gestor da UBS e pela vizinhança', 'Aplicar avaliação no fim'] },
  { id: 'ID2', titulo: 'Roda com jovens: como funcionam o voto e os mandatos', trilha: 'intelectual', ramo: 'debate_formacao', v_base: 35,
    verificacao: 'avaliação dos participantes', mult: 1, nivel: 2,
    cidadania: 'Entender o papel de vereador, prefeito e deputado ajuda o jovem a votar e a cobrar com consciência.',
    instrumento: 'Escolas, centros culturais e grêmios estudantis',
    passos: ['Combinar com a escola ou o centro cultural', 'Conduzir sem pedir voto nem fazer propaganda', 'Recolher perguntas para uma próxima roda'] },
  { id: 'ID3', titulo: 'Formação de conselheiros: como funciona um conselho gestor', trilha: 'intelectual', ramo: 'debate_formacao', v_base: 40,
    verificacao: 'avaliação dos participantes', mult: 1, nivel: 3,
    cidadania: 'Conselhos de saúde, escola e assistência só funcionam com moradores preparados para ocupar as vagas.',
    instrumento: 'Conselhos gestores de UBS, conselhos de escola e conselhos de assistência social',
    passos: ['Explicar composição, eleição e poderes do conselho', 'Simular uma reunião com pauta real', 'Indicar as próximas eleições de conselho'] },
  { id: 'ID4', titulo: 'Debate aberto entre moradores sobre uma prioridade do distrito', trilha: 'intelectual', ramo: 'debate_formacao', v_base: 40,
    verificacao: 'avaliação dos participantes', mult: 1, nivel: 2,
    cidadania: 'Decidir junto o que é prioridade treina a deliberação democrática no bairro.',
    instrumento: 'Assembleia aberta com mediação',
    passos: ['Apresentar 2 ou 3 opções com dados', 'Dar tempo igual para cada posição', 'Votar e levar o resultado ao canal público certo'] },

  // ── Militante · Rua ─────────────────────────────────────────────────────
  { id: 'MR1', titulo: 'Plantão de cidadania na feira', trilha: 'militante', ramo: 'rua', v_base: 20,
    verificacao: 'check-in no local + coordenador', mult: 1, nivel: 1,
    cidadania: 'Levar informação sobre SP156, LAI, CRAS e Defensoria até onde o povo está aproxima os direitos de quem precisa.',
    instrumento: 'SP156, Defensoria Pública, CRAS',
    passos: ['Montar banca com material do cartaz de direitos', 'Ajudar a abrir solicitações no 156 na hora', 'Registrar quantos atendimentos e quais temas'] },
  { id: 'MR2', titulo: 'Mutirão de limpeza do córrego com cobrança do problema estrutural', trilha: 'militante', ramo: 'rua', v_base: 30,
    verificacao: 'foto antes/depois + confirmação', mult: 1, nivel: 1, foco: true, risco: true,
    cidadania: 'O mutirão ajuda hoje, mas não substitui o poder público: cada mutirão termina com protocolo cobrando a solução definitiva.',
    instrumento: 'Subprefeitura e SP156',
    passos: ['Combinar com moradores, com luvas e sacos', 'Fotografar antes e depois', 'Protocolar a cobrança de limpeza regular e obra de drenagem'] },
  { id: 'MR3', titulo: 'Porta a porta de escuta: os problemas do quarteirão', trilha: 'militante', ramo: 'rua', v_base: 25,
    verificacao: 'coordenador + amostragem', mult: 1, nivel: 1,
    cidadania: 'Perguntar antes de propor: a pauta do núcleo nasce do que o morador diz, não do que o núcleo acha.',
    instrumento: 'Questionário curto com registro agregado (sem dados pessoais)',
    passos: ['Visitar 20 casas em dupla', 'Perguntar os 3 maiores problemas e se a pessoa quer acompanhar', 'Registrar só números agregados'] },
  { id: 'MR4', titulo: 'Mutirão de documentação: CadÚnico, RG, título e CPF', trilha: 'militante', ramo: 'rua', v_base: 30,
    verificacao: 'coordenador', mult: 1, nivel: 2,
    cidadania: 'Sem documento não há benefício, matrícula nem voto; orientar é abrir a porta de todos os outros direitos.',
    instrumento: 'CRAS, Poupatempo e cartório eleitoral',
    passos: ['Levantar documentos exigidos e locais de atendimento', 'Orientar e agendar atendimentos com as famílias', 'Nunca ficar com documentos de ninguém'] },

  // ── Militante · Organização ─────────────────────────────────────────────
  { id: 'MO1', titulo: 'Assembleia de moradores com pauta e encaminhamentos', trilha: 'militante', ramo: 'organizacao', v_base: 40,
    verificacao: 'ata + presenças', mult: 1, nivel: 2,
    cidadania: 'Organizar o bairro para decidir em conjunto é a base de toda participação.',
    instrumento: 'Ata pública com responsáveis e prazos',
    passos: ['Divulgar pauta e local com uma semana', 'Garantir fala para quem não costuma falar', 'Publicar a ata com quem faz o quê e até quando'] },
  { id: 'MO2', titulo: 'Comissão de moradores para acompanhar uma obra pública', trilha: 'militante', ramo: 'organizacao', v_base: 35,
    verificacao: 'ata + presenças', mult: 1, nivel: 2,
    cidadania: 'Obra acompanhada por quem vai usá-la tende a sair melhor e no prazo.',
    instrumento: 'Placa de obra, Portal da Transparência e subprefeitura',
    passos: ['Formar a comissão com 3 a 5 moradores', 'Pedir reunião com a fiscalização da obra', 'Visitar mensalmente e registrar o andamento'] },
  { id: 'MO3', titulo: 'Reunião acessível: Libras, espaço infantil e horário noturno', trilha: 'militante', ramo: 'organizacao', v_base: 30,
    verificacao: 'coordenador', mult: 1, nivel: 2,
    cidadania: 'Participação só é democrática quando mães, pessoas surdas e trabalhadores conseguem estar presentes.',
    instrumento: 'Apoio de intérprete e rede de cuidado do núcleo',
    passos: ['Perguntar ao bairro o que impede a participação', 'Garantir o apoio necessário', 'Registrar quantas pessoas novas vieram'] },
  { id: 'MO4', titulo: 'Agenda pública dos conselhos do distrito', trilha: 'militante', ramo: 'organizacao', v_base: 15,
    verificacao: 'revisão por par', mult: 1, nivel: 1,
    cidadania: 'Reuniões de conselhos são abertas, mas pouco divulgadas; reunir datas e locais convida o bairro a participar.',
    instrumento: 'Conselho Participativo, conselhos gestores de UBS e conselhos de escola',
    passos: ['Levantar datas, horários e locais', 'Publicar a agenda do mês', 'Indicar quem do núcleo vai acompanhar cada uma'] },

  // ── Militante · Mobilização ─────────────────────────────────────────────
  { id: 'MM1', titulo: 'Mobilização para a audiência pública do orçamento', trilha: 'militante', ramo: 'mobilizacao', v_base: 50,
    verificacao: 'registro da presença', mult: 1, nivel: 1,
    cidadania: 'Encher a audiência mostra que o bairro acompanha o dinheiro público.',
    instrumento: 'Audiência pública do orçamento na Câmara Municipal',
    passos: ['Convidar moradores com a demanda do distrito', 'Organizar transporte e horário', 'Preparar 2 ou 3 falas curtas e combinadas'] },
  { id: 'MM2', titulo: 'Moradores inscritos para eleições de conselhos', trilha: 'militante', ramo: 'mobilizacao', v_base: 40,
    verificacao: 'protocolo', mult: 1.5, nivel: 2,
    cidadania: 'Vagas de conselho ocupadas por moradores do bairro levam a voz da comunidade para dentro da gestão pública.',
    instrumento: 'Editais de eleição de conselhos gestores, participativos e tutelares',
    passos: ['Acompanhar editais abertos', 'Apresentar a função a moradores interessados, filiados ou não', 'Apoiar a inscrição dentro do prazo'] },
  { id: 'MM3', titulo: 'Coleta de assinaturas para projeto de iniciativa popular', trilha: 'militante', ramo: 'mobilizacao', v_base: 40,
    verificacao: 'protocolo', mult: 1.5, nivel: 2,
    cidadania: 'Cada assinatura é um eleitor propondo lei; a coleta precisa explicar o projeto e respeitar os dados de quem assina.',
    instrumento: 'Iniciativa popular e Lei Geral de Proteção de Dados',
    passos: ['Explicar o projeto antes de pedir a assinatura', 'Usar o formulário oficial e guardar com segurança', 'Entregar à comissão para conferência'] },
  { id: 'MM4', titulo: 'Ida coletiva à reunião do conselho gestor da UBS', trilha: 'militante', ramo: 'mobilizacao', v_base: 30,
    verificacao: 'registro da presença', mult: 1, nivel: 1,
    cidadania: 'O conselho gestor decide sobre a unidade de saúde do bairro; presença de usuários muda a pauta.',
    instrumento: 'Conselho gestor da UBS (reunião aberta)',
    passos: ['Confirmar data com a unidade', 'Levar a demanda escutada no porta a porta', 'Registrar o encaminhamento e repassar ao bairro'] },
];

const IDEIA_POR_TITULO = new Map(IDEIAS_CIDADANIA.map((i) => [i.titulo, i]));
/** Ideia de origem de uma missão (pelo título), para mostrar o porquê cívico no cartão. */
export const ideiaDaMissao = (m: Missao) => IDEIA_POR_TITULO.get(m.titulo);

const PRAZOS = ['2026-10-14', '2026-10-18', '2026-10-24', '2026-10-31', '2026-11-07', '2026-11-14', '2026-11-21', '2026-11-28'];
const POR_IDEIA = 3;

/** Inteiro determinístico a partir de um texto (FNV-1a), para espalhar as missões sempre do mesmo jeito. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Ações do catálogo das trilhas, no formato de `trilhas.*.acoes`. */
export function acoesCidadania(trilha: TrilhaId): AcaoTrilha[] {
  return IDEIAS_CIDADANIA.filter((i) => i.trilha === trilha).map((i) => [i.titulo, i.ramo, i.v_base, i.verificacao, i.mult]);
}

/** Missões fictícias a partir do catálogo: 3 por ideia, em núcleos distintos (ideias de drenagem vão aos distritos de maior risco). */
export function gerarMissoesCidadania(dados: Pick<Dados, 'nucleos' | 'distritoPorId' | 'campanhas'>): Missao[] {
  const nucleos = dados.nucleos.filter((n) => dados.distritoPorId[n.distrito]);
  const porRisco = [...nucleos].sort((a, b) => dados.distritoPorId[b.distrito].ind.risco - dados.distritoPorId[a.distrito].ind.risco || a.id.localeCompare(b.id));
  const altoRisco = porRisco.slice(0, Math.max(POR_IDEIA, Math.ceil(porRisco.length / 4)));
  const out: Missao[] = [];
  for (const ideia of IDEIAS_CIDADANIA) {
    const base = ideia.risco ? altoRisco : nucleos;
    const usados = new Set<string>();
    for (let k = 0; k < POR_IDEIA && usados.size < base.length; k++) {
      let j = hash(`${ideia.id}:${k}`) % base.length;
      while (usados.has(base[j].distrito) && usados.size < new Set(base.map((n) => n.distrito)).size) j = (j + 1) % base.length;
      const n = base[j];
      usados.add(n.distrito);
      const d = dados.distritoPorId[n.distrito];
      const h = hash(`${ideia.id}:${k}:${n.id}`);
      const vagas = [4, 6, 8, 10, 12, 15][h % 6];
      const camp = ideia.foco ? dados.campanhas.find((c) => c.foco_temporada && c.territorio.includes(n.distrito)) : undefined;
      out.push({
        id: `MIS-CID-${ideia.id}-${k + 1}`, titulo: ideia.titulo, trilha: ideia.trilha, ramo: ideia.ramo, distrito: n.distrito, nucleo: n.id,
        lng: +(n.lng + (((h >>> 4) % 200) - 100) * 0.00004).toFixed(5), lat: +(n.lat + (((h >>> 12) % 200) - 100) * 0.00004).toFixed(5),
        status: h % 5 === 0 ? 'agendada' : h % 5 === 1 ? 'em_curso' : 'aberta', prazo: PRAZOS[(h >>> 8) % PRAZOS.length],
        vagas, inscritos: (h >>> 16) % vagas, v_base: ideia.v_base, verificacao_tipica: ideia.verificacao, m_verificacao_esperado: ideia.mult,
        foco_temporada: !!ideia.foco, territorio_prioritario: d.ind.lac >= 0.7 && d.ind.pres < 1.2, nivel_minimo: ideia.nivel,
        campanha: camp?.id ?? null, origem: 'missão de cidadania',
      });
    }
  }
  return out;
}
