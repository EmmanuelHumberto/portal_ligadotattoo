export * from './runtime';
export type PublicProduct={
 id:string;slug:string;name:string;
 brand?:{id:string;name:string};
 summary?:string;
 media?:Array<{id:string;url:string;alt?:string}>;
};
export type HealthStatus={status:'UP'|'DOWN';service:string};
