const { expect, test } = require('@playwright/test');

function collectConsoleErrors(page) {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', error => consoleErrors.push(error.message));
  return consoleErrors;
}

async function waitForGameCanvas(page) {
  await page.goto('/');

  await expect(page).toHaveTitle('Box4Fit');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#p5_loading')).toBeHidden({ timeout: 20_000 });
}

test('loads the game shell and creates a p5 canvas', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await waitForGameCanvas(page);

  expect(consoleErrors).toEqual([]);
});

test('opens settings calibration flow without console errors', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await waitForGameCanvas(page);

  await page.keyboard.press('c');
  await expect.poll(() => page.evaluate(() => gameState.menu)).toBe(1);
  await expect.poll(() => page.evaluate(() => gameState.gameCalibration)).toBe(false);

  await page.keyboard.press('c');
  await expect.poll(() => page.evaluate(() => gameState.gameCalibration)).toBe(true);

  await page.keyboard.press('s');
  await expect.poll(() => page.evaluate(() => gameState.gameCalibration)).toBe(false);
  await expect.poll(() => page.evaluate(() => gameState.menu)).toBe(1);

  expect(consoleErrors).toEqual([]);
});

test('shows a readable portrait orientation overlay on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const overlayText = await page.evaluate(() => getComputedStyle(document.body, '::before').content);
  expect(overlayText).toContain('Rotate your device to landscape');
});

test('reloads the app shell from the service worker while offline', async ({ page }) => {
  await waitForGameCanvas(page);

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  try {
    await page.context().setOffline(true);
    await page.reload();

    await expect(page).toHaveTitle('Box4Fit');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  } finally {
    await page.context().setOffline(false);
  }
});
