import {describe,expect,it} from 'vitest';
import {
  assertSafeTarget,isPublicIp,type ResolveHost,
} from '../../apps/worker/src/ingestion/url-policy';

describe('ingestion SSRF policy',()=>{
  it.each([
    '127.0.0.1','10.0.0.1','172.16.0.1','192.168.0.1','169.254.169.254',
    '100.64.0.1','198.18.0.1','224.0.0.1','255.255.255.255','::1','fe80::1',
    'fc00::1','fec0::1','ff02::1','::ffff:127.0.0.1','::ffff:7f00:1',
    '64:ff9b::7f00:1','2001:db8::1','2002:7f00:1::',
  ])('rejects non-public address %s',(address)=>{
    expect(isPublicIp(address)).toBe(false);
  });

  it.each(['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])
  ('allows public address %s',(address)=>{
    expect(isPublicIp(address)).toBe(true);
  });

  it('requires HTTPS, port 443, no credentials and an exact registered host',async()=>{
    const publicDns:ResolveHost=async()=>[{address:'8.8.8.8',family:4}];
    await expect(assertSafeTarget(
      'https://allowed.example/path',['allowed.example'],publicDns,
    )).resolves.toMatchObject({url:new URL('https://allowed.example/path')});
    await expect(assertSafeTarget(
      'http://allowed.example',['allowed.example'],publicDns,
    )).rejects.toThrow(/HTTPS/);
    await expect(assertSafeTarget(
      'https://allowed.example:8443',['allowed.example'],publicDns,
    )).rejects.toThrow(/port 443/);
    await expect(assertSafeTarget(
      'https://user:pass@allowed.example',['allowed.example'],publicDns,
    )).rejects.toThrow(/credentials/);
    await expect(assertSafeTarget(
      'https://sub.allowed.example',['allowed.example'],publicDns,
    )).rejects.toThrow(/not registered/);
  });

  it('rejects a hostname when any DNS answer is private',async()=>{
    const rebound:ResolveHost=async()=>[
      {address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4},
    ];
    await expect(assertSafeTarget(
      'https://allowed.example',['allowed.example'],rebound,
    )).rejects.toThrow(/non-public/);
  });

  it('rejects inconsistent DNS address metadata',async()=>{
    const invalid:ResolveHost=async()=>[{address:'8.8.8.8',family:6}];
    await expect(assertSafeTarget(
      'https://allowed.example',['allowed.example'],invalid,
    )).rejects.toThrow(/invalid address family/);
  });
});
