import {test,expect} from '@playwright/test';

test.describe('privileged admin',()=>{
 test.use({storageState:'test/.auth/admin.json'});

 test('operations dashboard and audit explorer',async({page})=>{
  await page.goto('/admin');
  await expect(page.getByRole('heading',{name:/visão geral/i})).toBeVisible();
  const audit=await page.request.get('/admin/audit');
  expect(audit.ok()).toBeTruthy();
  const ops=await page.request.get('/admin/operations/readiness');
  expect(ops.ok()).toBeTruthy();
 });

 test('media and AI surfaces require privileged session',async({page})=>{
  expect((await page.request.get('/admin/media')).ok()).toBeTruthy();
  expect((await page.request.get('/admin/ai/executions')).ok()).toBeTruthy();
 });
});

test('anonymous admin access is rejected',async({request})=>{
 const r=await request.get('/admin/audit');
 expect([401,403]).toContain(r.status());
});
