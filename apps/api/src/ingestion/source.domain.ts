export type SourceKind =
  | 'MANUFACTURER'|'RETAILER'|'NEWS'|'EVENT'|'TECHNICAL'|'OTHER';

export type RobotsPolicy = 'RESPECT'|'MANUAL_ALLOW'|'DISABLED';

export class Source {
  private constructor(
    readonly id:string,
    readonly name:string,
    readonly kind:SourceKind,
    readonly baseUrl:string,
    readonly allowedHosts:string[],
    readonly robotsPolicy:RobotsPolicy,
    readonly crawlDelayMs:number,
    readonly status:'ACTIVE'|'PAUSED'|'DISABLED',
    readonly version:number,
  ) {}

  static create(input:any) {
    const url=new URL(input.baseUrl);
    if (url.protocol !== 'https:') throw new Error('HTTPS source required');
    const hosts=[...new Set([url.hostname,...(input.allowedHosts ?? [])])]
      .map(x=>String(x).toLowerCase());
    if (!input.name?.trim()) throw new Error('Source name required');
    return new Source(
      input.id,input.name.trim(),input.kind,input.baseUrl,hosts,
      input.robotsPolicy ?? 'RESPECT',
      Math.max(Number(input.crawlDelayMs ?? 1000),250),
      'ACTIVE',1,
    );
  }
}
