import { expect, test } from '@playwright/test';

// Capturas das quatro telas de referência com o renderizador próprio (estado fixo por query string).
// Saída: capturas/tela-N-*.png. Rode com: npm run capturas
const TELAS = [
  { nome: 'tela-1-presenca-militante-capao-redondo', w: 1920, h: 1080, q: 'camada=militante&persona=MIL-0001&modo=pre&distrito=CRE&zoom=13&aba=partido' },
  { nome: 'tela-2-lacunas-autoridade-ledger', w: 1920, h: 1080, q: 'camada=autoridade&modo=lac&painel=ledger&zoom=11&tip=CDU&tip2=lacunas' },
  { nome: 'tela-3-celular-zeladoria-visitante-brasilandia', w: 390, h: 844, q: 'camada=visitante&modo=zel&distrito=BRL&folha=meia&zoom=14' },
  { nome: 'tela-4-celular-ficha-do-militante', w: 390, h: 844, q: 'camada=militante&persona=MIL-0001&painel=ficha' },
  { nome: 'extra-tema-claro-papel-e-tinta', w: 1920, h: 1080, q: 'camada=militante&persona=MIL-0001&modo=zel&distrito=BRL&zoom=12.5&tema=claro' },
  { nome: 'extra-intermediaria-1000px', w: 1000, h: 760, q: 'camada=autoridade&modo=lac&distrito=GRA&zoom=12' },
  { nome: 'extra-notebook-1366x768', w: 1366, h: 768, q: 'camada=autoridade&modo=lac&distrito=GRA&zoom=12' },
  { nome: 'extra-tablet-768x1024', w: 768, h: 1024, q: 'camada=visitante&modo=zel&distrito=BRL&zoom=13' },
  { nome: 'extra-celular-deitado-844x390', w: 844, h: 390, q: 'camada=visitante&modo=zel&distrito=BRL&zoom=13' },
  { nome: 'extra-celular-pequeno-360x640', w: 360, h: 640, q: 'camada=militante&persona=MIL-0001&modo=pre&distrito=CRE&zoom=13' },
];

for (const t of TELAS) {
  test(`captura ${t.nome}`, async ({ page }) => {
    await page.setViewportSize({ width: t.w, height: t.h });
    await page.goto(`/?motor=proprio&${t.q}`);
    await expect(page.locator('.fb-d').first()).toHaveAttribute('fill', /#/);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    await page.mouse.move(t.w - 2, t.h / 2);
    await page.screenshot({ path: `capturas/${t.nome}.png` });
  });
}
