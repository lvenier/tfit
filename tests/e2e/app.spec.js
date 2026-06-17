const { expect, test } = require('@playwright/test');

async function gotoApp(page) {
  await page.goto('/');
}

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
  await gotoApp(page);

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

async function flushPendingMenuTransition(page) {
  await page.evaluate(() => {
    window.TfitAppInputActions?.applyPendingMenuButtonTransition();
  });
}

test('loads the game shell and creates a p5 canvas', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await waitForGameCanvas(page);

  expect(consoleErrors).toEqual([]);
});

test('opens settings calibration flow without console errors', async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await waitForGameCanvas(page);

  await pressAppKey(page, 'c');
  await flushPendingMenuTransition(page);
  await page.waitForFunction(() => typeof gameState !== 'undefined' && gameState.menu === 1, null, { timeout: 10_000 });

  const alreadyCalibrating = await page.evaluate(() => gameState.gameCalibration);
  if (!alreadyCalibrating) {
    await pressAppKey(page, 'c');
    await flushPendingMenuTransition(page);
    await page.waitForFunction(() => typeof gameState !== 'undefined' && gameState.gameCalibration === true, null, { timeout: 10_000 });
  }

  await pressAppKey(page, 's');
  await flushPendingMenuTransition(page);
  await page.waitForFunction(() => typeof gameState !== 'undefined' && gameState.gameOver === true, null, { timeout: 5_000 });

  expect(consoleErrors).toEqual([]);
});

test('shows a readable portrait orientation overlay on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page);

  const overlayText = await page.evaluate(() => getComputedStyle(document.body, '::before').content);
  expect(overlayText).toContain('Rotate your device to landscape');
});

test('reloads the app shell from the service worker while offline', async ({ page }) => {
  await waitForGameCanvas(page);
  const swSupported = await page.evaluate(() => 'serviceWorker' in navigator && !!navigator.serviceWorker);
  if (!swSupported) {
    expect(await page.locator('canvas').isVisible()).toBeTruthy();
    return;
  }

  const swReady = await page.evaluate(async () => {
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('sw-timeout')), 5000))
      ]);
      return true;
    } catch (error) {
      return error.message === 'sw-timeout' ? false : true;
    }
  });

  if (!swReady) {
    return;
  }

  try {
    await page.context().setOffline(true);
    await page.reload();

    await expect(page).toHaveTitle('Box4Fit');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });
  } finally {
    await page.context().setOffline(false);
  }
});
