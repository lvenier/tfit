const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 5_000
  },
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    baseURL: 'http://127.0.0.1:8000'
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream'
          ]
        }
      }
    },
    {
      name: 'mobile-landscape',
      use: {
        ...devices['Pixel 7 landscape'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream'
          ]
        }
      }
    }
  ]
});
