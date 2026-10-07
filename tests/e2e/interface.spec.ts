import { expect, test } from '@playwright/test';
import { abrir, estado } from './ajuda';

test('atalhos: 1–0, M, L, [ ], N, Esc, letras dos modos e setas no mapa', async ({ page }) => {
  await abrir(page, 'camada=autoridade&zoom=11');
  await page.keyboard.press('7');
  expect(await estado<string>(page, 's => s.painel')).toBe('ledger');
  await page.keyboard.press('Escape');
  expect(await estado<string | null>(page, 's => s.painel')).toBeNull();
  await page.keyboard.press('l');
  expect(await estado<string>(page, 's => s.painel')).toBe('ledger');
  await page.keyboard.press('m');
  await expect(page.getByTestId('modos')).toHaveCount(0);
  await page.keyboard.press('m');
  await expect(page.getByTestId('modos')).toBeVisible();
  await page.keyboard.press('n');
  await expect(page.getByTestId('minimapa')).toHaveCount(0);
  await page.keyboard.press('n');
  await page.keyboard.press('[');
  expect(await estado<number>(page, 's => s.mes')).toBe(10);
  await page.keyboard.press(']');
  expect(await estado<number>(page, 's => s.mes')).toBe(11);
  await page.keyboard.press('z');
  expect(await estado<string>(page, 's => s.modo')).toBe('zel');
  await page.keyboard.press('t');
  expect(await estado<string>(page, 's => s.modo')).toBe('ele');
  // setas movem o mapa quando ele está focado
  await page.locator('.fb-map').focus();
  const antes = await page.evaluate(() => (window as any).__cm.motorAtual.m.getView().center[0]);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  const depois = await page.evaluate(() => (window as any).__cm.motorAtual.m.getView().center[0]);
  expect(depois).toBeGreaterThan(antes);
});

test('outliner: reordenar seções pelo teclado e persistir', async ({ page }) => {
  await abrir(page, 'camada=militante&persona=MIL-0001');
  const titulos = () => page.locator('[data-testid="outliner"] .ol-h .t').allTextContents();
  const antes = await titulos();
  expect(antes[0]).toBe('Meu núcleo');
  await page.getByRole('button', { name: 'Reordenar Meu núcleo (setas para mover)' }).focus();
  await page.keyboard.press('ArrowDown');
  expect((await titulos())[1]).toBe('Meu núcleo');
  await page.reload();
  await expect(page.locator('.fb-map')).toBeVisible();
  expect((await titulos())[1]).toBe('Meu núcleo');
});

test('tema claro e modo economia de dados persistem; painel com abas por setas', async ({ page }) => {
  await abrir(page, 'camada=visitante&distrito=SAM&zoom=12.5');
  await page.keyboard.press('Control+Shift+L');
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).__cm.store.getState().set({ painel: 'config' }));
  await page.getByTestId('tema-claro').click();
  await page.getByTestId('economia').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.fb-map')).toHaveClass(/eco/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.fb-map')).toHaveClass(/eco/);
  // abas: seta para a direita pula a aba bloqueada (Partido) para o visitante
  await page.evaluate(() => (window as any).__cm.store.getState().set({ painel: 'territorio', aba: 'problemas' }));
  await page.getByTestId('aba-problemas').focus();
  await page.keyboard.press('ArrowRight');
  expect(await estado<string>(page, 's => s.aba')).toBe('historico');
});

test('linha do tempo: reproduzir percorre os meses e comparar gera rampa divergente', async ({ page }) => {
  await abrir(page, 'camada=militante&persona=MIL-0001&modo=pre&zoom=11');
  await page.getByRole('button', { name: 'Reproduzir 12 meses' }).first().click();
  await expect.poll(() => estado<number>(page, 's => s.mes'), { timeout: 15_000 }).toBeGreaterThan(2);
  await page.getByRole('button', { name: 'Pausar' }).first().click();
  await page.getByLabel('Comparar com o mês').selectOption({ label: 'jan/26' });
  await expect(page.getByTestId('legenda')).toContainText('diferença');
  await expect(page.getByTestId('legenda')).toContainText('aumentou');
  // modo sem série mensal avisa
  await page.keyboard.press('d');
  await expect(page.getByTestId('timeline')).toContainText('série mensal indisponível');
});
