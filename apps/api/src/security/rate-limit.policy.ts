export type RateClass=
 'public_read'|'search'|'redirect'|'auth'|'admin_read'|'admin_write'|'upload';

export const RATE_POLICY:Record<RateClass,{windowMs:number;limit:number}>={
 public_read:{windowMs:60_000,limit:240},
 search:{windowMs:60_000,limit:60},
 redirect:{windowMs:60_000,limit:120},
 auth:{windowMs:15*60_000,limit:20},
 admin_read:{windowMs:60_000,limit:180},
 admin_write:{windowMs:60_000,limit:60},
 upload:{windowMs:60_000,limit:20},
};

export function rateKey(input:{
 ipHash:string;actorId?:string;routeClass:RateClass;
}){
 return `${input.routeClass}:${input.actorId??input.ipHash}`;
}
