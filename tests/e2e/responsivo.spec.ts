import { expect, test, type Page } from '@playwright/test';

// Responsividade: em cada tamanho, nenhum painel fixo pode cobrir outro (tooltips, alertas, notificações e
// a gaveta sobreposta do intermediário são exceções previstas), nada sai da tela e não há rolagem horizontal.
const TAMANHOS: [number, number][] = [
  [2560, 1440], [1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [768, 1024], [820, 600],
  [412, 915], [360, 640], [844, 390],
];
const ESTADOS = [
  'camada=autoridade&modo=lac&distrito=GRA&zoom=12',
  'camada=militante&persona=MIL-0001&painel=ficha&modo=pre&distrito=CRE&zoom=13',
  'camada=autoridade&modo=lac&distrito=GRA&b=CDU&zoom=12',
  'camada=visitante&modo=zel&distrito=BRL&zoom=13',
];

async function problemas(page: Page) {
  return page.evaluate(() => {
    const mid = !!document.querySelector('.app.mid .veu');
    const sel = ['.cm-rail', ...(mid ? [] : ['.cm-drawer']), '.cm-legend', '.cm-outliner', '.cm-modes', '.cm-mini', '.cm-timeline', '.coord-strip',
      '.res-row', '.top-mid', '.top-right', '.brand', '.m-top', '.m-legend', '.m-fab', '.m-sheet', '.m-nav', '.m-modes'];
    const R: [string, DOMRect][] = [
      ...sel.map((s) => [s, document.querySelector<HTMLElement>(s)] as const).filter(([, e]) => e && e.offsetParent !== null).map(([s, e]) => [s, e!.getBoundingClientRect()] as [string, DOMRect]),
      ...[...document.querySelectorAll('.cm-actions .act')].map((e, i) => ['.act' + i, e.getBoundingClientRect()] as [string, DOMRect]),
    ];
    const out: string[] = [];
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const [a, ra] = R[i], [b, rb] = R[j];
      if (a.startsWith('.act') && b.startsWith('.act')) continue;
      const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (x > 2 && y > 2) out.push(`${a} × ${b}`);
    }
    for (const [s, r] of R) if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push(`${s} fora da tela`);
    if (document.documentElement.scrollWidth > innerWidth) out.push('rolagem horizontal');
    if (!document.querySelector('.fict')) out.push('sem selo dados fictícios');
    return out;
  });
}

for (const q of ESTADOS) {
  test(`sem sobreposições em ${TAMANHOS.length} tamanhos · ${q.split('&')[0]} ${q.includes('b=') ? '(dividido)' : ''}${q.includes('ficha') ? '(ficha)' : ''}`, async ({ page }) => {
    const erros: string[] = [];
    for (const [w, h] of TAMANHOS) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/?motor=proprio&${q}`);
      await expect(page.locator('.fb-d').first()).toHaveAttribute('fill', /#/);
      await page.waitForTimeout(400);
      for (const p of await problemas(page)) erros.push(`${w}×${h}: ${p}`);
    }
    expect(erros).toEqual([]);
  });
}

test('redimensionar a janela troca o layout sem recarregar', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?motor=proprio&camada=militante&persona=MIL-0001&distrito=CRE&zoom=12');
  await expect(page.locator('.app.desk:not(.mid)')).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 760 });
  await expect(page.locator('.app.mid')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.app.mob')).toBeVisible();
  await expect(page.getByTestId('folha')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.app.mob.paisagem')).toBeVisible();
  await expect(page.locator('.m-sheet.lado')).toBeVisible();
  expect(await problemas(page)).toEqual([]);
});
