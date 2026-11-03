import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 3,
  timeout: 30000,
  expect: {timeout: 7000},
  use: {baseURL: 'http://localhost:4178', trace: 'retain-on-failure'},
  projects: [
    {name: 'ipad-chromium', use: {browserName: 'chromium', viewport: {width: 1194, height: 834}, hasTouch: true, isMobile: true}},
    {name: 'ipad-webkit', use: {browserName: 'webkit', viewport: {width: 820, height: 1180}, hasTouch: true, isMobile: true}}
  ],
  webServer: [
    {command: 'node scripts/serve.mjs', url: 'http://localhost:4178', reuseExistingServer: !process.env.CI},
    {command: 'PORT=4179 BASE_PATH=reading-garden node scripts/serve.mjs', url: 'http://localhost:4179/reading-garden/', reuseExistingServer: !process.env.CI}
  ]
});
