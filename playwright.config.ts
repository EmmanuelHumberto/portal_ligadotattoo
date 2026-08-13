import {defineConfig,devices} from '@playwright/test';

const webBaseUrl=process.env.PLAYWRIGHT_WEB_BASE_URL ?? 'http://localhost:3000';
const apiBaseUrl=process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3001';
const manageServers=process.env.PLAYWRIGHT_MANAGE_SERVERS!=='false';

export default defineConfig({
  testDir:'./test/e2e',
  fullyParallel:true,
  forbidOnly:Boolean(process.env.CI),
  retries:process.env.CI ? 2 : 0,
  workers:process.env.CI ? 2 : undefined,
  reporter:process.env.CI ? [['github'],['html',{open:'never'}]] : 'list',
  use:{
    baseURL:webBaseUrl,
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
  },
  projects:[{
    name:'chromium',
    use:{...devices['Desktop Chrome']},
  }],
  webServer:manageServers?[
    {
      command:'npm run build -w @portal/api && npm run start -w @portal/api',
      url:`${apiBaseUrl}/health/live`,
      reuseExistingServer:!process.env.CI,
      timeout:120_000,
    },
    {
      command:`API_INTERNAL_URL=${apiBaseUrl} npm run build -w @portal/web && API_INTERNAL_URL=${apiBaseUrl} npm run start -w @portal/web`,
      url:webBaseUrl,
      reuseExistingServer:!process.env.CI,
      timeout:120_000,
    },
  ]:undefined,
});
