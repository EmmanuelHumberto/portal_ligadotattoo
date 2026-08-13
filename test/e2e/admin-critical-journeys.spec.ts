import {test,expect} from '@playwright/test';

const apiBase=process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3001';
const adminState=process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE;

test.describe('privileged admin',()=>{
 test.skip(!adminState,'Set PLAYWRIGHT_ADMIN_STORAGE_STATE to a real OIDC session');
 test.use({storageState:adminState ?? {cookies:[],origins:[]}});

 test('operations dashboard and audit explorer',async({page})=>{
  await page.goto('/admin');
  await expect(page.getByRole('heading',{name:/visão geral/i})).toBeVisible();
  const audit=await page.request.get(`${apiBase}/admin/audit`);
  expect(audit.ok()).toBeTruthy();
  const ops=await page.request.get(`${apiBase}/admin/operations/readiness`);
  expect(ops.ok()).toBeTruthy();
 });

 test('media and AI surfaces require privileged session',async({page})=>{
  expect((await page.request.get(`${apiBase}/admin/media`)).ok()).toBeTruthy();
  expect((await page.request.get(`${apiBase}/admin/ai/executions`)).ok()).toBeTruthy();
 });
});

test('anonymous admin access is rejected',async({request})=>{
 const r=await request.get(`${apiBase}/admin/audit`);
 expect([401,403]).toContain(r.status());
 expect(r.headers()['ratelimit-limit']).toBe('180');
 expect(r.headers()['x-content-type-options']).toBe('nosniff');
});
