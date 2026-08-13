import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const blockedV4 = [
  /^10\./,/^127\./,/^169\.254\./,/^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,/^0\./,
];

export async function assertSafeTarget(
  rawUrl:string,allowedHosts:string[],
):Promise<URL> {
  const url=new URL(rawUrl);
  if (url.protocol !== 'https:') throw new Error('Only HTTPS targets allowed');
  if (url.username || url.password) throw new Error('URL credentials forbidden');
  if (!allowedHosts.map(x=>x.toLowerCase()).includes(url.hostname.toLowerCase()))
    throw new Error('Target host is not registered');

  const resolved=await lookup(url.hostname,{all:true,verbatim:true});
  if (!resolved.length) throw new Error('Host did not resolve');

  for (const entry of resolved) {
    if (isPrivate(entry.address))
      throw new Error('Target resolves to a non-public address');
  }
  return url;
}

function isPrivate(ip:string) {
  if (isIP(ip)===4) return blockedV4.some(r=>r.test(ip));
  const x=ip.toLowerCase();
  return x==='::1' || x==='::' || x.startsWith('fc') ||
         x.startsWith('fd') || x.startsWith('fe80:');
}
