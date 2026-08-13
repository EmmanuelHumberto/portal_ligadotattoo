import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const script=readFileSync('scripts/rc-verify.sh','utf8');
const playwright=readFileSync('playwright.config.ts','utf8');
const packageJson=JSON.parse(readFileSync('package.json','utf8'));

describe('release verification contract',()=>{
 it('uses only current repository verification commands',()=>{
  expect(packageJson.scripts['verify:release']).toBe('sh scripts/rc-verify.sh');
  expect(script).toContain('npm run verify:full');
  expect(script).toContain('npm run test:e2e');
  expect(script).not.toContain('test:contracts');
  expect(script).not.toContain('--runInBand');
 });

 it('targets the external candidate and records a terminal result',()=>{
  expect(script).toContain('PLAYWRIGHT_MANAGE_SERVERS=false');
  expect(script).toContain('verification-summary.txt');
  expect(script).toContain('trap finish EXIT');
  expect(playwright).toContain("PLAYWRIGHT_MANAGE_SERVERS!=='false'");
  expect(playwright).toContain('webServer:manageServers?[');
 });

 it('keeps load verification mandatory by default',()=>{
  expect(script).toContain('${RC_REQUIRE_K6:-true}');
  expect(script).toContain('performance gate NOT EXECUTED');
 });
});
