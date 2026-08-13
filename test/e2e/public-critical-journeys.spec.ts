import {test,expect} from '@playwright/test';

const apiBase=process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3001';

test('home -> catalog -> product -> offer boundary',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await page.getByRole('link',{name:/explorar máquinas/i}).click();
 await expect(page).toHaveURL(/\/maquinas/);
 const card=page.locator('article').first();
 await expect(card).toBeVisible();
 await card.getByRole('link',{name:/ver detalhes/i}).click();
 await expect(page.getByText('DADOS SINTÉTICOS',{exact:true})).toBeVisible();
 await expect(page.getByText(/não representam um produto real/i)).toBeVisible();
 const offer=page.locator('#ofertas a').first();
 if(await offer.count()){
  const href=await offer.getAttribute('href');
  expect(href).toMatch(/\/go\/listing\//);
 }
});

test('catalog filters by the API contract',async({page})=>{
 await page.goto('/maquinas');
 await page.getByLabel('Marca').selectOption('fixture-tattoo-labs');
 await page.getByRole('button',{name:/aplicar filtros/i}).click();
 await expect(page).toHaveURL(/manufacturer=fixture-tattoo-labs/);
 await expect(page.locator('article')).toHaveCount(2);
});

test('two products can be compared side by side',async({page,request})=>{
 const response=await request.get(`${apiBase}/public/products?limit=2`);
 expect(response.ok()).toBeTruthy();
 const {items}=await response.json();
 expect(items).toHaveLength(2);
 await page.goto(`/comparar?ids=${items.map((x:{id:string})=>x.id).join(',')}`);
 const comparison=page.getByRole('region',{name:/comparação de máquinas/i});
 await expect(comparison).toBeVisible();
 await expect(comparison.getByRole('columnheader',{name:/fixture rotary one/i}))
  .toBeVisible();
 await expect(comparison.getByRole('columnheader',{name:/fixture pen pro/i}))
  .toBeVisible();
});

test('robots and sitemap are public',async({request})=>{
 expect((await request.get('/robots.txt')).ok()).toBeTruthy();
 expect((await request.get('/sitemap.xml')).ok()).toBeTruthy();
});
