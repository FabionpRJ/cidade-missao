import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abrir, estado, painel, pontoNaTela, trocarPersona } from './ajuda';

test.describe('Fluxo 1 · visitante registra e confirma um alerta', () => {
  test('registra, outras duas personas confirmam, vira confirmado e aparece o convite com consentimento', async ({ page }) => {
    await abrir(page, 'camada=visitante&distrito=BRL&zoom=13');
    await page.getByRole('button', { name: 'Registrar alerta' }).first().click();
    await page.getByTestId('cat-iluminacao').click();
    await page.getByTestId('tocar-mapa').click();
    await expect(page.locator('.pick-banner')).toBeVisible();
    const brl = await estado<{ lng: number; lat: number }>(page, 's => s.dados.distritoPorId.BRL.rotulo');
    const p = await pontoNaTela(page, brl.lng - 0.006, brl.lat + 0.003);
    await page.mouse.click(p.x, p.y);
    await expect(page.getByTestId('registrar-alerta-modal')).toBeVisible();
    await page.getByTestId('descricao').fill('Poste apagado na esquina');
    await page.getByTestId('enviar-alerta').click();
    await expect(page.getByTestId('convite')).toBeVisible();
    await page.keyboard.press('Escape');
    // aparece como novo, com pulsação discreta
    await expect(page.locator('.mk-alert.is-fresh .pulse').first()).toBeAttached();
    const id = await estado<string>(page, 's => s.alertasCriados[0].id');
    expect(await estado<string>(page, 's => s.alertasCriados[0].autor')).toBe('VIS-A');

    for (const [persona, total] of [['persona-VIS-B', 2], ['persona-VIS-C', 3]] as const) {
      await trocarPersona(page, 'visitante', persona);
      await page.evaluate((i) => (window as any).__cm.store.getState().set({ modal: { tipo: 'alerta', id: i } }), id);
      await page.getByTestId('confirmar-alerta').click();
      await expect(page.getByTestId('alerta-modal')).toContainText(`${total}`);
      if (total < 3) await page.keyboard.press('Escape');
    }
    await expect(page.getByTestId('alerta-modal')).toContainText('Alerta · confirmado');
    // passa a contar em Zeladoria (alertas confirmados de BRL sobem 1)
    const base = await estado<number>(page, 's => s.dados.distritoPorId.BRL.ind.alertas_90d');
    await page.keyboard.press('Escape');
    await page.getByTestId('aba-problemas').click();
    await expect(page.locator('.kpi').first()).toContainText((base + 1).toLocaleString('pt-BR'));
    // convite: só com consentimento explícito e revogável
    await page.evaluate((i) => (window as any).__cm.store.getState().set({ modal: { tipo: 'alerta', id: i } }), id);
    await expect(page.getByTestId('pedir-contato')).toBeDisabled();
    await page.getByTestId('consentimento').check();
    await page.getByTestId('pedir-contato').click();
    await expect(page.getByTestId('revogar')).toBeVisible();
    // sobrevive a recarregar
    await page.reload();
    await expect(page.locator('.fb-map')).toBeVisible();
    expect(await estado<number>(page, 's => (s.confirmacoes[s.alertasCriados[0].id] ?? []).length')).toBe(2);
    // o partido não vê quem registrou
    await trocarPersona(page, 'militante');
    await page.evaluate((i) => (window as any).__cm.store.getState().set({ modal: { tipo: 'alerta', id: i } }), id);
    await expect(page.getByTestId('alerta-modal')).toContainText('quem registrou não é identificado');
    await expect(page.getByTestId('alerta-modal')).not.toContainText('Visitante');
  });
});

test.describe('Fluxo 2 · visitante explora um distrito', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('busca → folha → aba Dados (percentis, médias, desatualizado) → tooltip aninhado → fonte', async ({ page }) => {
    await abrir(page, 'camada=visitante&zoom=11');
    await page.getByTestId('busca').fill('Brasil');
    await page.getByRole('button', { name: /Brasilândia/ }).click();
    await expect(page.getByTestId('folha')).toHaveAttribute('data-folha', 'meia');
    await page.getByRole('button', { name: /Ver abas do distrito/ }).click();
    await expect(page.getByTestId('folha')).toHaveAttribute('data-folha', 'cheia');
    await page.getByTestId('aba-dados').click();
    const folha = page.getByTestId('folha');
    await expect(folha).toContainText('desatualizado');
    await expect(folha).toContainText('percentil');
    await expect(folha).toContainText('município');
    await expect(folha).toContainText('estado');
    await expect(folha).toContainText('Fundação Seade, IPVS · 2010');
    await expect(page.getByTestId('aba-partido')).toHaveAttribute('aria-disabled', 'true');
    // tooltip aninhado: Vulnerabilidade → IPVS
    await folha.getByRole('button', { name: 'Vulnerabilidade', exact: true }).first().click();
    const n1 = page.locator('.cm-tip.lvl1');
    await expect(n1).toContainText('IPVS');
    await n1.getByRole('button', { name: 'IPVS' }).click();
    const n2 = page.locator('.cm-tip.lvl2');
    await expect(n2).toContainText('Fundação Seade · 2010 · setor censitário');
    await n2.getByRole('button', { name: /desatualizado/ }).click();
    await expect(page.locator('.cm-tip.lvl3')).toContainText('mais de 3 anos');
    await page.keyboard.press('Escape');
    await expect(page.locator('.cm-tip.lvl3')).toHaveCount(0);
    await expect(page.locator('.cm-tip.lvl2')).toHaveCount(1);
  });
});

test.describe('Fluxo 3 · militante cumpre uma missão e recebe pontos', () => {
  test('aceitar → check-in → entrega → validador de outro núcleo → PT, teto semanal, Carreira, passagem', async ({ page }) => {
    await abrir(page, 'camada=militante&persona=MIL-0001&painel=missoes');
    const card = page.getByTestId('missao-MIS-CRE-3');
    await card.getByTestId('aceitar').click();
    await card.getByTestId('checkin').click();
    await card.getByTestId('registrar-entrega').click();
    await page.getByTestId('ev-protocolo').click();
    await page.getByTestId('detalhe').fill('SP-2026-0012345');
    await page.getByTestId('enviar-entrega').click();
    await page.getByTestId('missoes-aba-minhas').click();
    await expect(page.locator('.cm-drawer')).toContainText('pendente de validação');
    // a própria pessoa não valida
    await page.getByTestId('missoes-aba-validar').click();
    const minha = page.locator('[data-testid^="entrega-ENT-APP"]');
    await expect(minha).toContainText('Ninguém valida a própria entrega');

    // validador: Fiscalista 5 de outro núcleo
    await trocarPersona(page, 'militante', 'persona-validador');
    await painel(page, 'missoes');
    await page.getByTestId('missoes-aba-validar').click();
    await page.locator('[data-testid^="entrega-ENT-APP"]').getByTestId('validar').click();
    await page.getByTestId('verif-confirmada_por_fonte_externa').click();
    await expect(page.getByTestId('validar-modal')).toContainText('80 × 1,5 × 1 = 120 PT');
    await page.getByTestId('confirmar-validacao').click();
    await expect(page.locator('.toast').filter({ hasText: '+120 PT · Intelectual' })).toBeVisible();

    // volta a Marina: Carreira 240 → 360, pronta para a passagem ao nível 3 (módulo + ramo)
    await trocarPersona(page, 'militante', 'persona-marina');
    await painel(page, 'ficha');
    const pas = page.getByTestId('passagem-intelectual');
    await expect(pas).toContainText('pronto para a passagem');
    await expect(page.getByTestId('trilha-intelectual')).toContainText('360');
    await pas.getByTestId('concluir-modulo').click();
    await expect(page.getByTestId('trilha-intelectual')).toContainText('Intelectual 3');

    // teto semanal: segunda entrega na mesma semana e trilha só credita até 150
    await painel(page, 'missoes');
    await page.getByTestId('filtro-distrito').selectOption('CRE');
    const c2 = page.getByTestId('missao-MIS-CRE-5');
    await c2.getByTestId('aceitar').click();
    await c2.getByTestId('registrar-entrega').click();
    await page.getByTestId('ev-ata').click();
    await page.getByTestId('detalhe').fill('Oficina com 18 presentes');
    await page.getByTestId('enviar-entrega').click();
    await page.evaluate(() => (window as any).__cm.store.getState().set({ personaId: 'MIL-0013' }));
    await page.getByTestId('missoes-aba-validar').click();
    await page.locator('[data-testid^="entrega-ENT-APP"]').first().getByTestId('validar').click();
    await page.getByTestId('verif-validada_por_par_ou_coordenador').click();
    await expect(page.getByTestId('validar-modal')).toContainText('30 PT serão creditados (10 acima do teto)');
    await page.getByTestId('confirmar-validacao').click();
    expect(await estado<number>(page, "s => s.lancamentos.filter(l => l.militante === 'MIL-0001' && l.trilha === 'intelectual').reduce((a, l) => a + l.creditado, 0)")).toBe(150);

    // sobrevive a recarregar
    await page.reload();
    await expect(page.locator('.fb-map')).toBeVisible();
    await page.evaluate(() => (window as any).__cm.store.getState().set({ personaId: 'MIL-0001', painel: 'ficha', fichaId: null }));
    await expect(page.getByTestId('trilha-intelectual')).toContainText('Intelectual 3');
    await expect(page.getByTestId('trilha-intelectual')).toContainText('390');
  });

  test('níveis 4 a 6: pedido de prova de passagem e banca', async ({ page }) => {
    await abrir(page, 'camada=militante&persona=MIL-0019&painel=ficha');
    // Camila: Fiscalista 5 com Carreira 3.928; uma entrega validada de 80 PT leva a 4.008 (nível 6 exige 4.000)
    await page.evaluate(() => {
      const s = (window as any).__cm.store.getState();
      s.acao((a: any) => ({ lancamentos: [...a.lancamentos, { id: 'PT-T', militante: 'MIL-0019', trilha: 'fiscalista', data: '2026-10-07', creditado: 80, descricao: 'teste' }] }));
    });
    const pas = page.getByTestId('passagem-fiscalista');
    await expect(pas).toContainText('pronto para a passagem');
    await pas.getByTestId('pedir-prova').click();
    await expect(pas).toContainText('Banca');
    await expect(pas).toContainText('prova com a banca');
    await pas.getByTestId('banca-aprova').click();
    await expect(page.getByTestId('trilha-fiscalista')).toContainText('Fiscalista 6');
  });
});

test.describe('Fluxo 4 · militante sem nível vê o bloqueio', () => {
  test('Lacunas e rotas de Operações bloqueadas com o requisito no tooltip', async ({ page }) => {
    await abrir(page, 'camada=militante&persona=MIL-0026');
    const lac = page.getByTestId('modo-lac');
    await expect(lac).toHaveClass(/is-lock/);
    await lac.hover();
    await expect(page.locator('.cm-tip')).toContainText('Requer Fiscalista 4+ ou Militante 4+');
    await page.keyboard.press('Escape');
    await page.mouse.move(5, 500);
    await page.getByTestId('modo-ope').hover();
    await expect(page.locator('.cm-tip')).toContainText('Rotas núcleo → missão bloqueadas');
    await expect(page.locator('.cm-tip')).toContainText('Militante 4');
    await page.getByTestId('modo-lac').click();
    await expect(page.locator('.toast').filter({ hasText: 'Modo bloqueado' })).toBeVisible();
    expect(await estado<string>(page, 's => s.modo')).not.toBe('lac');
    await expect(page.getByTestId('modo-ele')).toHaveClass(/is-lock/);
    // Marina (Fiscalista 4 com Prontidão ativa) libera Lacunas
    await page.evaluate(() => (window as any).__cm.store.getState().set({ personaId: 'MIL-0001' }));
    await expect(page.getByTestId('modo-lac')).not.toHaveClass(/is-lock/);
  });
});

test.describe('Fluxo 5 · autoridade age a partir do mapa', () => {
  test('resolve alertas de coordenação, usa o Ledger por zona, exporta CSV e não ajusta pesos', async ({ page }) => {
    await abrir(page, 'camada=autoridade');
    const card = page.getByTestId('coord-card');
    await expect(card).toContainText('Grajaú');
    await card.getByTestId('coord-acao').click();
    await expect(page.locator('.toast').filter({ hasText: 'resolvido' })).toBeVisible();
    expect(await estado<string>(page, "s => s.missoesAlteradas['MIS-GRA-L2']?.status")).toBe('unificada');
    // distrito sem núcleo → missão de acolhimento
    await page.getByRole('button', { name: /Distrito sem núcleo: Brasilândia/ }).click();
    await card.getByTestId('coord-acao').click();
    expect(await estado<number>(page, "s => s.missoesCriadas.filter(m => m.distrito === 'BRL' && m.territorio_prioritario).length")).toBe(1);
    // dispensar adia 7 dias
    await page.getByRole('button', { name: /Missão sem voluntários: Parecer/ }).click();
    await card.getByTestId('coord-dispensar').click();
    expect(Object.values(await estado<Record<string, { dispensadoAte?: string }>>(page, 's => s.coord')).some((x) => x.dispensadoAte === '2026-10-14')).toBe(true);
    // Ledger por Lacunas filtrado pela zona de atuação
    await page.keyboard.press('l');
    await page.getByTestId('ledger-indicador').selectOption('lac');
    await page.getByTestId('ledger-zona').selectOption('ZA-SUL-1');
    await expect(page.locator('[data-testid="ledger-tabela"] tbody tr')).toHaveCount(5);
    await expect(page.locator('.cm-drawer')).toContainText('somente a direção municipal');
    const [down] = await Promise.all([page.waitForEvent('download'), page.getByTestId('exportar-csv').click()]);
    const csv = readFileSync(await down.path(), 'utf8');
    expect(csv).toContain('DADOS FICTÍCIOS');
    expect(csv).toContain(';lac;p_problemas');
    expect(csv.split('\n').filter((l) => /^\d+;/.test(l))).toHaveLength(5);
    // eleitoral agregado não se combina com dados de militância no CSV
    await page.getByTestId('ledger-indicador').selectOption('comp');
    const [d2] = await Promise.all([page.waitForEvent('download'), page.getByTestId('exportar-csv').click()]);
    const csv2 = readFileSync(await d2.path(), 'utf8');
    expect(csv2).toContain(';comp');
    expect(csv2).not.toMatch(/;(pres|militantes|nucleos|prontidao_media)(;|\n)/);
    // pesos: somente a direção
    await page.evaluate(() => (window as any).__cm.store.getState().set({ modal: { tipo: 'pesos' } }));
    await expect(page.getByTestId('pesos-somente-direcao')).toBeVisible();
    await expect(page.getByTestId('aplicar-pesos')).toBeDisabled();
  });
});

test.describe('Fluxo 6 · direção toma uma decisão e ajusta o índice', () => {
  test('janela de decisão cria missões e registra; pesos recalculam o mapa com registro', async ({ page }) => {
    await abrir(page, 'camada=direcao');
    await page.getByRole('button', { name: 'Janela de decisão' }).click();
    const jan = page.getByTestId('janela-decisao');
    await expect(jan).toContainText('Temporal previsto: ativar plano de mutirão?');
    await expect(jan.getByTestId('opcao-C')).toBeDisabled();
    await jan.getByTestId('opcao-A').click();
    await jan.getByTestId('confirmar-decisao').click();
    await expect(page.locator('.toast').filter({ hasText: 'Decisão registrada' })).toBeVisible();
    expect(await estado<number>(page, "s => s.missoesCriadas.filter(m => m.origem === 'decisão DEC-1').length")).toBe(3);
    await expect(page.locator('.cm-drawer')).toContainText('Roberto Lima (fictício)');
    // pesos
    await page.evaluate(() => (window as any).__cm.store.getState().set({ modo: 'lac' }));
    const cores = () => page.evaluate(() => [...document.querySelectorAll('.fb-d')].map((p) => p.getAttribute('fill')).join(','));
    const antes = await cores();
    await page.getByRole('button', { name: 'Pesos de Lacunas' }).click();
    await page.getByTestId('peso-problemas').fill('1');
    await page.getByTestId('peso-vulnerabilidade').fill('0');
    await page.getByTestId('peso-presenca').fill('0');
    await page.getByTestId('aplicar-pesos').click();
    await expect(page.locator('.toast').filter({ hasText: 'Índice de Lacunas recalculado' })).toBeVisible();
    await expect.poll(cores).not.toBe(antes);
    await painel(page, 'decisoes');
    await expect(page.getByTestId('pesos-lacunas')).toContainText('Roberto Lima (fictício)');
    await expect(page.getByTestId('pesos-lacunas')).toContainText('1,00');
    // sobrevive a recarregar
    await page.reload();
    await expect(page.locator('.fb-map')).toBeVisible();
    expect(await estado<number>(page, 's => s.pesos.problemas')).toBe(1);
    expect(await estado<number>(page, 's => s.decisoes.length')).toBe(1);
  });
});
