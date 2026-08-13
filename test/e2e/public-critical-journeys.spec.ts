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

test('global search suggests and opens the canonical product route',async({page})=>{
 const cspErrors:string[]=[];
 page.on('console',message=>{
  if(message.type()==='error'&&message.text().includes('Content Security Policy'))
   cspErrors.push(message.text());
 });
 await page.goto('/');
 await page.getByLabel('Buscar no Portal Tattoo').fill('Fixture');
 const suggestion=page.getByRole('option',{name:/fixture pen pro/i});
 await expect(suggestion).toBeVisible();
 await suggestion.click();
 await expect(page).toHaveURL(/\/maquinas\/fixture-pen-pro/);
 expect(cspErrors).toEqual([]);
});

test('search results and manufacturer discovery are navigable',async({page})=>{
 await page.goto('/buscar?q=Fixture');
 await expect(page.getByRole('heading',{name:/busca no portal tattoo/i})).toBeVisible();
 await expect(page.getByRole('link',{name:'Fixture Rotary One'})).toBeVisible();
 await page.goto('/marcas');
 await page.getByRole('link',{name:'Fixture Tattoo Labs'}).first().click();
 await expect(page).toHaveURL(/\/marcas\/fixture-tattoo-labs/);
 await expect(page.locator('article')).toHaveCount(2);
});

for(const journey of [
 {path:'/noticias',title:'Novidades em máquinas de tatuagem'},
 {path:'/blog',title:'Guia técnico de stroke'},
 {path:'/eventos',title:'Convenção Tattoo Fixture'},
])test(`public editorial journey ${journey.path}`,async({page})=>{
 await page.goto(journey.path);
 await page.getByRole('link',{name:journey.title}).first().click();
 await expect(page.getByRole('heading',{name:journey.title})).toBeVisible();
 await expect(page.getByText(/conteúdo é sintético/i)).toBeVisible();
});

test('fresh offer feed keeps outbound links behind the redirect boundary',async({page})=>{
 await page.goto('/ofertas');
 await expect(page.getByRole('heading',{name:/ofertas recentes/i})).toBeVisible();
 const offer=page.locator('article').first();
 await expect(offer.getByText(/fixture supply/i)).toBeVisible();
 await expect(offer.getByText(/r\$\s*1[.,]299,90/i)).toBeVisible();
 await expect(offer.getByRole('link',{name:/ir para a loja/i}))
  .toHaveAttribute('href',/\/go\/listing\//);
});

test('robots and sitemap are public',async({request})=>{
 expect((await request.get('/robots.txt')).ok()).toBeTruthy();
 expect((await request.get('/sitemap.xml')).ok()).toBeTruthy();
});

test('Web and API expose defensive headers',async({request})=>{
 const web=await request.get('/');
 expect(web.headers()['x-content-type-options']).toBe('nosniff');
 expect(web.headers()['x-frame-options']).toBe('DENY');
 expect(web.headers()['content-security-policy']).toContain("object-src 'none'");
 const api=await request.get(`${apiBase}/health/live`);
 expect(api.headers()['x-content-type-options']).toBe('nosniff');
 expect(api.headers()['x-frame-options']).toBe('DENY');
 expect(api.headers()['x-powered-by']).toBeUndefined();
 expect(api.headers()['ratelimit-limit']).toBe('240');
 expect(api.headers()['ratelimit-remaining']).toBeTruthy();
 const ready=await request.get(`${apiBase}/health/ready`);
 expect(ready.status()).toBe(200);
 await expect(ready.json()).resolves.toMatchObject({
  status:'UP',checks:[{name:'database',status:'UP'}],
 });
});
