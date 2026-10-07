import { expect, type Page } from '@playwright/test';

/** Abre o app no renderizador próprio, com estado fixo por query string. */
export async function abrir(page: Page, query = '') {
  await page.goto(`/?motor=proprio${query ? '&' + query : ''}`);
  await expect(page.locator('.fb-map')).toBeVisible();
  await expect(page.locator('.fb-d').first()).toHaveAttribute('fill', /#/);
  await page.waitForTimeout(600);
}

/** Troca de persona pelo seletor de desenvolvedor (simula o login). */
export async function trocarPersona(page: Page, camada: string, botaoPersona?: string) {
  await page.keyboard.press('Control+Shift+L');
  await expect(page.getByTestId('dev-modal')).toBeVisible();
  await page.getByTestId(`camada-${camada}`).click();
  if (botaoPersona) await page.getByTestId(botaoPersona).click();
  else await page.keyboard.press('Escape');
  await expect(page.getByTestId('dev-modal')).toHaveCount(0);
}

/** Posição de tela (página) de um ponto lon/lat no mapa. */
export async function pontoNaTela(page: Page, lng: number, lat: number) {
  return page.evaluate(([x, y]) => {
    const c = (window as any).__cm;
    const [px, py] = c.motorAtual.m.project([x, y]);
    const r = document.querySelector('.map-host')!.getBoundingClientRect();
    return { x: r.left + px, y: r.top + py };
  }, [lng, lat]);
}

export async function estado<T>(page: Page, f: string): Promise<T> {
  return page.evaluate((src) => new Function('s', `return (${src})(s)`)((window as any).__cm.store.getState()), f) as Promise<T>;
}

/** Abre um painel do trilho diretamente (sem alternar). */
export async function painel(page: Page, id: string) {
  await page.evaluate((p) => (window as any).__cm.store.getState().set({ painel: p, fichaId: null, modal: null }), id);
}
