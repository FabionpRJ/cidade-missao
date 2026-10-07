import { expect, test } from '@playwright/test';

// Celular: primeira interação em menos de 3 s em 4G simulada (PROMPT 8).
// Rede "4G" do Lighthouse (1,6 Mbit/s, 150 ms de latência) e CPU 4× mais lenta. Tempos medidos dentro da página,
// a partir do início da navegação: mapa desenhado e resposta a um toque (folha do distrito aberta).
// O `vite preview` entrega arquivos pré-comprimidos (gzip), como um servidor de produção faria.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('celular: primeira interação < 3 s em 4G simulada', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/?motor=proprio&camada=visitante&modo=zel', { waitUntil: 'commit' });
  await expect(page.locator('.fb-d').first()).toHaveAttribute('fill', /#/, { timeout: 15_000 });
  const pronto = await page.evaluate(() => performance.getEntriesByName('cm:mapa-desenhado')[0]?.startTime ?? performance.now());
  await page.evaluate(() => {
    const w = window as unknown as { __toque?: number };
    document.querySelector('.fb-map')!.addEventListener('pointerdown', () => { w.__toque ??= performance.now(); }, { capture: true });
  });
  await page.locator('.fb-map').tap({ position: { x: 195, y: 330 } });
  await expect(page.getByTestId('folha')).toBeVisible();
  const resposta = await page.evaluate(() => new Promise<number>((r) => requestAnimationFrame(() => r(performance.now() - ((window as unknown as { __toque: number }).__toque)))));
  console.log(`mapa pronto (interativo) em ${Math.round(pronto)} ms desde a navegação; resposta ao toque em ${Math.round(resposta)} ms`);
  expect(pronto).toBeLessThan(3000);
  expect(resposta).toBeLessThan(1000);
});
