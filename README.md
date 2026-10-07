# Cidade Missão 3.0 · protótipo usável (São Paulo)

Protótipo navegável do mapa estratégico do **Cidade Missão 3.0** (entrega "protótipo navegável do mapa" da Fase 0 do documento), na direção visual **A · Gabinete Paulistano** (até a revisão 2 era a B · Central de Operações).

> **Todos os números, pessoas, núcleos, missões, alertas, campanhas, pontos de interesse e decisões são fictícios.** Só nomes e limites de distritos e subprefeituras são reais (GeoSampa). O selo "dados fictícios" fica visível em todas as telas.

- Fontes da verdade: `referencias/documento/Cidade_Missao_3.0.pdf` (o quê e quem) → `referencias/pacotes/pacote-a-gabinete-paulistano.md` e `referencias/codigo-dos-exemplos/` (aparência) → `PROMPT.md` (conflitos e escopo).
- Plano, rastreabilidade, riscos e decisões: [`PLANO.md`](PLANO.md). Andamento: [`PROGRESSO.md`](PROGRESSO.md).

---

## 1. Como rodar

Requisito: Node 20 ou mais novo (testado com Node 22).

```bash
npm install
npm run dev          # http://localhost:5173
```

Sem chave do Google, o app usa o **renderizador próprio** (aviso "mapa de demonstração (sem chave do Google)").

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | verificação de tipos + build de produção em `dist/` (com arquivos `.gz`) |
| `npm run preview` | serve o build (porta 4173), entregando os `.gz` |
| `npm run typecheck` | só a verificação de tipos |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | fluxos, interface, desempenho e capturas (Playwright, renderizador próprio) |
| `npm run capturas` | só as capturas das telas de referência, em `capturas/` |
| `npm run dados` | copia `dados/` para `public/dados/` sem espaços e gera o fundo esquemático |

Na primeira vez, o Playwright precisa do Chromium: `npx playwright install chromium`.

### Chave do Google Maps

1. Copie `.env.example` para `.env.local` (fica fora do git) e preencha `VITE_GOOGLE_MAPS_API_KEY` com uma chave que tenha a **Maps JavaScript API** liberada.
2. Reinicie `npm run dev`.

Com chave, o fundo é o Google Maps **raster, sem mapId**, com o estilo JSON do pacote A (e o complemento "perto" a partir do zoom 14). A coropleta usa o Data layer; rótulos, marcadores, rotas e destaques ficam numa `OverlayView` própria. Não há Advanced Markers. Se a chave for recusada ou o carregamento passar de 8 s, o app volta ao renderizador próprio. Para forçar o renderizador próprio mesmo com chave: `?motor=proprio`.

Com o Google ativo, o mapa fica recuado dos painéis fixos para que o **logotipo e a atribuição do Google** nunca fiquem cobertos.

> O motor do Google não foi testado com uma chave real neste ambiente (não havia chave). Tudo o mais foi testado com o renderizador próprio.

---

## 2. Camadas e personas

Abra o seletor de desenvolvedor (simula o login) de três jeitos: **`Ctrl+Shift+L`**, o botão "Camada …" na barra superior, ou Configurações (engrenagem no trilho).

| Camada | Persona padrão | Atalhos no seletor |
|---|---|---|
| Visitante | Visitante A (anônimo) | Visitantes A, B e C (para confirmar alertas) |
| Militante | Marina Alves Costa (Fiscalista 4, Intelectual 2, Militante 3) | "Nível 1 (bloqueios)" = Luana (MIL-0026); "Validador" = Ana Nascimento Oliveira (Fiscalista 5, outro núcleo); lista com os 48 militantes |
| Autoridade | Vereadora Helena Prado (fictícia), zonas Sul 1 e Sul 2 | — |
| Direção | Roberto Lima (fictício) | seletor de município desativado ("visão multi-município: futuro") |

Trocar de camada leva à tela inicial do documento (7.4). Tudo o que você faz fica salvo no navegador; **Configurações → Restaurar dados de demonstração** apaga.

### Estados fixos por URL

`camada`, `persona`, `modo` (adm, dem, ren, sau, edu, san, ris, zel, pre, ope, lac, ele), `distrito` (sigla, ex.: CRE), `b` (segundo distrito, modo dividido), `zoom`, `aba` (geral, dados, problemas, partido, historico), `painel` (territorio, ledger, missoes, ficha, nucleo, alertas, decisoes, delegacoes, relatorios, config), `folha` (recolhida, meia, cheia), `mes` (0–11), `comparar` (0–11), `tema` (claro), `economia=1`, `tip`/`tip2` (tooltip fixado), `janela` (decisao, municipio), `motor=proprio`.

| Tela de referência | URL (tamanho) |
|---|---|
| 1 · Presença, Militante, Capão Redondo, aba Partido | `/?camada=militante&persona=MIL-0001&modo=pre&distrito=CRE&zoom=13&aba=partido` (1920 × 1080) |
| 2 · Lacunas, Autoridade, Ledger, tooltip aninhado, alertas | `/?camada=autoridade&modo=lac&painel=ledger&zoom=11&tip=CDU&tip2=lacunas` (1920 × 1080) |
| 3 · Zeladoria simplificada, Visitante, Brasilândia na meia tela | `/?camada=visitante&modo=zel&distrito=BRL&folha=meia&zoom=14` (390 × 844) |
| 4 · Ficha do militante | `/?camada=militante&persona=MIL-0001&painel=ficha` (390 × 844) |

As capturas geradas por `npm run capturas` ficam em [`capturas/`](capturas/).

A apresentação do app e da ideia (15 slides, 16:9, com notas do apresentador) está em [`apresentacao/Cidade_Missao_3.0_apresentacao.pptx`](apresentacao/Cidade_Missao_3.0_apresentacao.pptx).

---

## 3. Roteiro de teste manual dos seis fluxos

Os mesmos passos estão automatizados em `tests/e2e/fluxos.spec.ts`.

**Fluxo 1 · Visitante registra e confirma um alerta**
1. Abra `/?camada=visitante&distrito=BRL&zoom=13`.
2. Clique em **Registrar alerta** (ações no centro inferior, ou aba Problemas). Escolha **Iluminação** → **Tocar no mapa** → clique dentro de Brasilândia → descreva (opcional) → **Enviar**. O alerta aparece como *novo*, pulsando (sem pulsação com `prefers-reduced-motion`).
3. `Ctrl+Shift+L` → **Visitante B** → clique no alerta pulsante → **Confirmar que vi** (2 de 3). Repita com **Visitante C** (3 de 3): vira *confirmado* e passa a contar em Zeladoria (aba Problemas: alertas confirmados +1).
4. Na janela do alerta aparece **Conhecer o partido**: o botão só libera com a caixa de consentimento marcada; dá para **revogar**. Nada do visitante é coletado nem cruzado com o partido (troque para Militante: o alerta não diz quem registrou).

**Fluxo 2 · Visitante explora um distrito** (melhor em 390 × 844)
1. Abra `/?camada=visitante`. Na busca, digite "Brasil" → **Brasilândia** → a folha abre na meia tela.
2. **Ver abas do distrito** → aba **Dados**: percentil de cada indicador no município, médias municipal/estadual/nacional, selo **desatualizado** (IPVS 2010; Censo 2022 também, por ter mais de 3 anos).
3. Toque em **Vulnerabilidade** (sublinhado tracejado) → no tooltip, **IPVS** abre o 2º nível → **desatualizado** abre o 3º. Cada nível termina com fonte · ano · nível geográfico. `Esc` fecha o mais alto.

**Fluxo 3 · Militante cumpre uma missão e recebe pontos**
1. Abra `/?camada=militante&persona=MIL-0001&painel=missoes`. Filtre por trilha, ramo, distrito ou campanha.
2. Na missão "Parecer usado pela bancada ou pela direção" (Capão Redondo): **Aceitar** → **Check-in** → **Registrar entrega** → *Protocolo* → número → **Enviar para validação**. A entrega fica *pendente de validação* (aba Minhas). A própria pessoa não pode validar.
3. `Ctrl+Shift+L` → Militante → **Validador** → painel Missões (tecla `4`) → aba **Validar** → **Validar** → *Confirmada por fonte externa* → a conta aparece (80 × 1,5 × 1 = 120 PT), com o teto semanal → **Validar**.
4. Volte a Marina → **Ficha** (tecla `5`): Intelectual com Carreira 360 → "pronto para a passagem" → **Concluir módulo** com escolha de ramo → Intelectual 3.
5. Uma segunda entrega intelectual na mesma semana credita só até 150 PT (o excedente aparece como "acima do teto").
6. Níveis 4 a 6: com uma militante perto do limiar (ex.: Camila, MIL-0019, Fiscalista 5 com 3.928), a ficha mostra **Pedir prova de passagem** → banca sorteada (nível 5+ de outro núcleo) → **Banca aprova (simulado)**.

**Fluxo 4 · Militante sem nível vê o bloqueio**
1. `Ctrl+Shift+L` → Militante → **Nível 1 (bloqueios)**.
2. No seletor de modos, **Lacunas** e **Eleitoral** aparecem com cadeado; o tooltip diz o que libera ("Requer Fiscalista 4+ ou Militante 4+ com Prontidão ativa"). Em **Operações**, o tooltip avisa que as rotas exigem Militante 4.

**Fluxo 5 · Autoridade age a partir do mapa**
1. `Ctrl+Shift+L` → **Autoridade**. A faixa de coordenação mostra os alertas (os da zona primeiro).
2. **Unificar missões** (Grajaú): as duas missões viram uma. Clique no ícone de **Distrito sem núcleo · Brasilândia** → **Abrir missão de acolhimento**. O relógio no cartão **dispensa por 7 dias**.
3. Tecla `L` (Ledger) → indicador **Lacunas** → zona **Sul 1** → **Exportar CSV** (só colunas permitidas; com Eleitoral, as colunas de militância saem).
4. Em Pesos aparece "somente a direção municipal".

**Fluxo 6 · Direção toma uma decisão e ajusta o índice**
1. `Ctrl+Shift+L` → **Direção** → ação **Janela de decisão** → "Temporal previsto: ativar plano de mutirão?" → **A** → **Registrar decisão**: 3 missões sugeridas são criadas e a decisão vai para o histórico com quem decidiu e quando (painel Decisões, tecla `8`).
2. Ação **Pesos de Lacunas** → mude os pesos → **Aplicar e registrar**: o mapa em modo Lacunas recolore e o registro mostra quem mudou e quando.

Todos os fluxos sobrevivem a recarregar a página.

### Atalhos
`1`–`0` painéis do trilho · `M` seletor de modos · `L` Ledger · `[` `]` mês · `N` minimapa · `Esc` fecha o nível mais alto · setas movem o mapa quando focado · `+`/`−` zoom · letras dos modos: `A D R S E G I Z P O C T` · `Alt` fixa o tooltip · `Ctrl+Shift+L` camada e persona.

---

### Tamanhos de tela
O layout é calculado em `src/app/layout.ts` a partir da largura e da altura da janela:
- **Computador (≥ 1200 px)**: gaveta (360–448 px) e coluna direita (288–336 px) reservam espaço; minimapa só com altura ≥ 800 px.
- **Intermediário (768–1199 px)**: a gaveta sobrepõe o mapa com véu.
- **Celular (< 768 px, ou janela baixa, como celular deitado)**: mapa em tela cheia, folha inferior (ou painel lateral, deitado) e navegação inferior.

Dentro de cada layout, a barra superior agrupa o que não cabe num botão "+N" e a área do mapa se ajusta por container queries.

## 4. Estrutura

```
src/
  app/         App, DesktopShell (≥1024 e 768–1024), MobileShell (<768), atalhos, estado por URL
  map/         MapEngine (interface), FallbackMapEngine, GoogleMapEngine, OverlayLayer, labels, markers,
               choropleth, scene (cores e marcadores por modo), projection, Minimap, MapView
  components/  TopBar, CoordinationAlerts, IconRail, TerritoryPanel (5 abas), Outliner, ModeSelector, Timeline,
               NestedTooltip, Toasts, Modals (decisão, alerta, entrega, validação, ficha do município…),
               MissionCard, MissionList (+ fila de validação), MilitantSheet, NucleusSheet, SeasonCard,
               Ledger, BottomSheet, TrackTab ("Acompanhar"), Panels
  domain/      points (PT, multiplicadores, teto), levels (Carreira, Prontidão, níveis, títulos, híbridos),
               permissions, lacunas (percentis e pesos), coordination
  state/       store (Zustand + localStorage), derived, actions (fluxos), personas, persistence, mapBus
  data/        loaders, indicators (12 modos), types
  content/     glossario (33 termos), textos (ficha do município, notícias, delegações — fictícios)
  styles/      tokens.css, theme-light.css, base.css, components.css
public/dados/  os três arquivos de dados + fundo_esquematico.json
scripts/       derivar-fundo.mjs, preparar-dados.mjs, precomprimir.ts
tests/         unit/ (Vitest) e e2e/ (Playwright)
```

### Acrescentar um terceiro motor (MapLibre GL + OSM)
O passo a passo está no topo de `src/map/MapEngine.ts`: implementar `MapEngine`, usar uma fonte GeoJSON com camada `fill` colorida por `feature-state` a partir de `scene.cores`, reaproveitar `renderOverlay` num SVG sobre o canvas (com `map.project`), traduzir os eventos e registrar em `src/map/criarMotor.ts`.

---

## 5. Verificação

- `npm run typecheck` e `npm run build`: sem erros nem avisos.
- `npm test`: 34 testes unitários (PT com cada multiplicador e com o teto semanal; nível a partir da Carreira; "em reserva" pela Prontidão de 120 dias; títulos por ramo no nível 6 e híbridos; percentis e Lacunas batendo com `lac` dos 96 distritos com tolerância de 0,01; permissões por camada e nível; classes de cor por domínio e L* crescente).
- `npm run test:e2e`: seis fluxos (7 testes), interface (atalhos, outliner, tema, economia de dados, linha do tempo), responsividade (4 estados × 11 tamanhos, de 2560×1440 a 360×640 e celular deitado, mais redimensionamento ao vivo), desempenho e capturas.
- Desempenho medido: pan e zoom a 60 quadros/s no computador (longe, médio e perto); no celular, com rede 4G simulada (1,6 Mbit/s, 150 ms) e CPU 4× mais lenta, o mapa fica interativo em ~2,3–2,9 s (servindo os arquivos comprimidos, como `npm run preview` faz).
- Contraste (direção A): todos os pares de texto do tema escuro ≥ 4,7:1; no tema claro "papel e tinta", texto ≥ 4,5:1 sobre painéis e ícones ≥ 3:1 sobre madeira.

---

## 6. Limitações

- **Google Maps não testado com chave real.** O caminho sem chave é o testado.
- Fundo do renderizador próprio é **esquemático** (rios, represas, parques e vias traçados à mão nas referências; malha viária procedural). Não é cartografia oficial.
- A unidade do mapa é o **distrito** (96), não o bairro: "unidade: distrito; bairros oficiais a verificar".
- Demografia não alterna para idade média, % de jovens e % de idosos (não há esses campos nos dados).
- Composição por trilha de cada distrito é uma **estimativa fictícia** (os dados só trazem o total de militantes).
- Indicadores da ficha do município (PIB per capita, orçamento por função, IDEB, mortalidade infantil, empregos) não estão nos dados: foram criados como **valores fictícios** marcados, com a fonte de onde viria o dado real.
- Duas missões em Grajaú foram acrescentadas como "complemento do protótipo" para o alerta de sobreposição, que não tinha missões correspondentes nos dados.
- Tempo mínimo no nível anterior (doc. 2.3), amostragem de 10% pelas bancas e mentoria automatizada não são simulados.
- O relógio do protótipo é fixo em 07/10/2026 (`temporada.hoje`); os registros usam a hora real. Parte dos 837 alertas dos dados tem data depois de "hoje" (até 28/10/2026): eles aparecem no mapa, mas ficam fora das listas de "alertas recentes".
- Persistência só no navegador (sem backend); visitantes e militantes simulados são da mesma sessão do navegador.
- Fora do escopo (próximos passos): visão multi-município, WhatsApp/Telegram, cadastro de filiados, backend/PostGIS/tiles vetoriais, pipeline real de dados públicos, notícias reais (há 3 fictícias), temporadas com consulta real, app nativo.

---

## 7. Hipóteses (H), pontos ⚖ e [verificar] assumidos

### Hipóteses do documento (H), usadas como regra no protótipo
- Multiplicadores de verificação 0,5 / 1,0 / 1,5 e de foco 1,0 / 1,25 / 1,5; teto de **150 PT por trilha por semana**.
- Carreira mínima por nível 0 / 100 / 350 / 900 / 2.000 / 4.000 e Prontidão mínima — / 20 / 50 / 100 / 150 / 200; janela de Prontidão de 120 dias.
- Valores base (V_base) das ações das três trilhas; mandatos dos cargos.
- Requisitos dos níveis de núcleo (Semente 5, Raiz 10 + 1 campanha, Tronco 20 + coordenadores nas 3 trilhas, Copa 40 + 2 temporadas).
- Pesos do índice de Lacunas 0,4 / 0,3 / 0,3, ajustáveis pela direção municipal.

### Hipóteses do próprio protótipo (detalhes em `PLANO.md`, seção 4)
- **M_foco único**: vale o maior que se aplica (não se multiplicam).
- **Prontidão em 4 pontos**: ⌈Prontidão ÷ (2 × mínimo do nível) × 4⌉.
- **Validador**: outro núcleo, Fiscalista 3+ ou nível 3+ na trilha, com Prontidão ativa.
- **Poderes exigem Prontidão** (Lacunas, rotas de Operações e validação ficam bloqueados em reserva).
- **Percentil** = nº de distritos com valor menor ÷ 95 (reproduz `lac_componentes`).
- **Zeladoria fora do mês atual** usa a série mensal com a própria unidade.
- **Selo "desatualizado"** aplicado à risca (mais de 3 anos), o que inclui o Censo 2022.
- Barra superior do Militante mostra a subprefeitura do seu núcleo; Autoridade vê alertas de coordenação de todo o município (os da zona primeiro).

### Pontos ⚖ (validação jurídica) que o protótipo sinaliza
- Modo **Eleitoral agregado**: só Autoridade e Direção, dados públicos do TSE por local de votação, nunca por pessoa, não combinável com militantes ou visitantes, uso de planejamento (no Ledger e no CSV as colunas de militância saem).
- **Convite a visitantes**: só com consentimento explícito, específico e revogável; dados de visitantes nunca cruzados com listas do partido.
- **Porta a porta**: só registro agregado; contato individual só com consentimento.
- **Dados de militantes** são sensíveis (opinião política): fichas só para militantes do município, sem contato nem localização exata.
- Separação entre mandato e administração; período eleitoral (regras antes de agosto de 2028).

### [verificar]
- Limite oficial de bairros em São Paulo (o protótipo usa distritos).
- Ano e licença dos limites do GeoSampa (via github.com/codigourbano/distritos-sp).
- Disponibilidade por distrito, nível geográfico e periodicidade de cada fonte (IBGE, CNES/SMS, INEP/SME, Seade/IPVS, Defesa Civil/SGB, TSE).
- Edição mais recente do IPVS; favelas e comunidades (IBGE 2022); áreas de risco.
- Regra atual do Google sobre `styles` × mapId e termos do Google Maps Platform (logotipo, atribuição, minimapa sem conteúdo do Google).
- Referências a jogos (Victoria 3, CK3, EU4, HoI4) escritas de memória no documento.
