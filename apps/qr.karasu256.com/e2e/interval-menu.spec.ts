import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'メニュー' }).click();
  await page.getByText(/^更新間隔\(\d+秒\)$/).click();
  await page.locator('[data-slot="dropdown-menu-sub-content"]').waitFor({ state: 'visible' });
});

test('caps the popup height at 70% of the viewport', async ({ page }) => {
  const subContent = page.locator('[data-slot="dropdown-menu-sub-content"]');
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  await expect.poll(() => subContent.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

  const clientHeight = await subContent.evaluate((el) => el.clientHeight);
  expect(clientHeight).toBeLessThanOrEqual(Math.ceil(viewport!.height * 0.7) + 1);
});

test('keeps loading more presets as the popup is scrolled', async ({ page }) => {
  const subContent = page.locator('[data-slot="dropdown-menu-sub-content"]');
  const itemCount = () => subContent.locator('[data-slot="dropdown-menu-item"]').count();

  await expect.poll(() => subContent.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

  let previousCount = await itemCount();
  for (let i = 0; i < 5; i++) {
    await subContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect.poll(() => itemCount()).toBeGreaterThan(previousCount);
    previousCount = await itemCount();
  }
});

test('selecting a preset closes the menu', async ({ page }) => {
  await page.getByText('20秒', { exact: true }).click();
  await expect(page.locator('[data-slot="dropdown-menu-sub-content"]')).toBeHidden();
});
