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

async function pressAppKey(page, key) {
  await page.evaluate(pressedKey => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      code: `Key${pressedKey.toUpperCase()}`,
      key: pressedKey
    }));
  }, key);
}

test('loads the game shell and creates a p5 canvas', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await waitForGameCanvas(page);

  expect(consoleErrors).toEqual([]);
});

test('opens settings calibration flow without console errors', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors = collectConsoleErrors(page);

  await waitForGameCanvas(page);

  await pressAppKey(page, 'c');
  await page.waitForFunction(() => gameState.menu === 1, null, { timeout: 10_000 });

  const alreadyCalibrating = await page.evaluate(() => gameState.gameCalibration);
  if (!alreadyCalibrating) {
    await pressAppKey(page, 'c');
    await page.waitForFunction(() => gameState.gameCalibration === true, null, { timeout: 10_000 });
  }

  await pressAppKey(page, 's');
  await page.waitForFunction(() => !gameState.gameCalibration && gameState.menu === 1, null, { timeout: 10_000 });

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
