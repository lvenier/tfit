const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: 'http://127.0.0.1:8000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
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
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream'
          ]
        }
      }
    }
  ]
});
