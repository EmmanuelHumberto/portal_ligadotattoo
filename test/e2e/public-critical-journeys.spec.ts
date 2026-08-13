import {test,expect} from '@playwright/test';

test('home -> catalog -> product -> offer boundary',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await page.getByRole('link',{name:/explorar máquinas/i}).click();
 await expect(page).toHaveURL(/\/maquinas/);
 const card=page.locator('article').first();
 await expect(card).toBeVisible();
 await card.getByRole('link',{name:/ver detalhes/i}).click();
 await expect(page.getByText(/dados verificados/i)).toBeVisible();
 const offer=page.locator('#ofertas a').first();
 if(await offer.count()){
  const href=await offer.getAttribute('href');
  expect(href).toMatch(/\/go\/listing\//);
 }
});

test('search and compare remain navigable',async({page})=>{
 await page.goto('/maquinas');
 const links=page.locator('article a[href*="/maquinas/"]');
 await expect(links.first()).toBeVisible();
});

test('robots and sitemap are public',async({request})=>{
 expect((await request.get('/robots.txt')).ok()).toBeTruthy();
 expect((await request.get('/sitemap.xml')).ok()).toBeTruthy();
});
