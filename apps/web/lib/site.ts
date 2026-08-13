export const SITE={
 name:'Portal Tattoo',
 description:'Conhecimento, tecnologia, máquinas, marcas e cultura da tatuagem.',
 url:(process.env.NEXT_PUBLIC_SITE_URL??'https://portal.example').replace(/\/$/,''),
 locale:'pt_BR',
};
export function absolute(path:string){
 return path.startsWith('http')?path:`${SITE.url}${path.startsWith('/')?'':'/'}${path}`;
}
