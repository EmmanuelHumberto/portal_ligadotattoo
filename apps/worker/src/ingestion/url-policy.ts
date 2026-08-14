import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

export type ResolvedAddress={address:string;family:4|6};
export type ResolveHost=(hostname:string)=>Promise<ResolvedAddress[]>;

export type SafeTarget={url:URL;addresses:ResolvedAddress[]};

export async function assertSafeTarget(
  rawUrl:string,
  allowedHosts:string[],
  resolveHost:ResolveHost=systemResolve,
):Promise<SafeTarget> {
  let url:URL;
  try {url=new URL(rawUrl);} catch {throw new Error('Invalid target URL');}
  if(url.protocol!=='https:')throw new Error('Only HTTPS targets allowed');
  if(url.username||url.password)throw new Error('URL credentials forbidden');
  if(url.port&&url.port!=='443')throw new Error('Only HTTPS port 443 is allowed');
  url.hash='';

  const hosts=new Set(allowedHosts.map(normalizeHost));
  if(hosts.size && !hosts.has(normalizeHost(url.hostname)))
    throw new Error('Target host is not registered');

  const addresses=await resolveHost(url.hostname);
  if(!addresses.length)throw new Error('Host did not resolve');
  for(const entry of addresses){
    if(isIP(entry.address)!==entry.family)
      throw new Error('Resolver returned an invalid address family');
    if(!isPublicIp(entry.address))
      throw new Error('Target resolves to a non-public address');
  }
  return {url,addresses};
}

export function isPublicIp(raw:string):boolean {
  const mapped=/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(raw);
  const ip=mapped?.[1]??raw;
  const family=isIP(ip);
  if(family===4){
    const parts=ip.split('.').map(Number);
    if(parts.length!==4||parts.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
    const [a,b,c]=parts as [number,number,number,number];
    return !(
      a===0||a===10||a===127||
      (a===100&&b>=64&&b<=127)||
      (a===169&&b===254)||
      (a===172&&b>=16&&b<=31)||
      (a===192&&b===0&&c===0)||
      (a===192&&b===0&&c===2)||
      (a===192&&b===88&&c===99)||
      (a===192&&b===168)||
      (a===198&&b>=18&&b<=19)||
      (a===198&&b===51&&c===100)||
      (a===203&&b===0&&c===113)||
      a>=224
    );
  }
  if(family!==6)return false;
  const ipv6=raw.toLowerCase().split('%')[0]??raw.toLowerCase();
  if(ipv6.startsWith('::'))return false;
  const first=parseInt(ipv6.split(':')[0]||'0',16);
  if((first&0xfe00)===0xfc00)return false;
  if((first&0xffc0)===0xfe80)return false;
  if((first&0xffc0)===0xfec0)return false;
  if((first&0xff00)===0xff00)return false;
  if(ipv6.startsWith('64:ff9b:')||ipv6.startsWith('2002:'))return false;
  if(ipv6.startsWith('2001:')){
    const second=parseInt(ipv6.split(':')[1]||'0',16);
    if(second<=0x01ff||second===0x0db8)return false;
  }
  return true;
}

async function systemResolve(hostname:string):Promise<ResolvedAddress[]> {
  const entries=await lookup(hostname,{all:true,verbatim:true});
  return entries.map(entry=>({
    address:entry.address,family:entry.family as 4|6,
  }));
}

function normalizeHost(host:string) {
  return host.trim().toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');
}
