const { expect, test } = require('@playwright/test');

test('loads the game shell and creates a p5 canvas', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', error => consoleErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle('Box4Fit');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#p5_loading')).toBeHidden({ timeout: 20_000 });
  expect(consoleErrors).toEqual([]);
});

test('shows a readable portrait orientation overlay on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const overlayText = await page.evaluate(() => getComputedStyle(document.body, '::before').content);
  expect(overlayText).toContain('Rotate your device to landscape');
});
